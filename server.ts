import express, { Request, Response } from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.set("trust proxy", true);

app.use(express.json({ limit: "5mb" }));

// -------------------------------------------------------------
// NexStudio Perimeter Shield: Tor Exit Node Detection & Protection
// -------------------------------------------------------------
let torExitNodes = new Set<string>();
let lastTorSync: string | null = null;
let isSyncingTor = false;

// Sample seed of active Tor exit nodes for immediate protection before sync
const TOR_SEED_NODES = [
  "185.220.101.5", "185.220.101.6", "185.220.101.7", "185.220.101.8",
  "185.220.101.9", "185.220.101.10", "185.220.101.11", "185.220.101.12",
  "185.220.101.13", "185.220.101.14", "185.220.101.15", "185.220.101.16",
  "185.220.101.17", "185.220.101.18", "185.220.101.19", "185.220.101.20",
  "185.220.101.21", "185.220.101.22", "185.220.101.23", "185.220.101.24",
  "185.220.101.25", "185.220.101.26", "185.220.101.27", "185.220.101.28",
  "185.220.102.4", "185.220.102.5", "185.220.102.6", "185.220.102.7",
  "185.220.102.8", "185.220.103.4", "185.220.103.5", "185.220.103.6",
  "192.42.116.16", "192.42.116.17", "192.42.116.18", "192.42.116.19",
  "192.42.116.20", "192.42.116.21", "192.42.116.22", "192.42.116.23",
  "199.249.230.70", "199.249.230.71", "199.249.230.72", "199.249.230.73",
  "199.249.230.74", "199.249.230.75", "199.249.230.76", "199.249.230.77",
  "51.15.43.205", "51.15.54.212", "51.15.67.114", "51.15.89.24"
];

// Initialize with seed list
for (const ip of TOR_SEED_NODES) {
  torExitNodes.add(ip);
}
lastTorSync = new Date().toISOString();

// Sync Tor exit nodes in the background from official Tor list
async function syncTorExitNodes(): Promise<{ success: boolean; count: number }> {
  if (isSyncingTor) return { success: true, count: torExitNodes.size };
  isSyncingTor = true;
  try {
    const urls = [
      "https://check.torproject.org/torbulkexitlist",
      "https://raw.githubusercontent.com/SecOps-Institute/Tor-IP-Addresses/master/tor-exit-nodes.lst"
    ];

    let fetchedList: string[] = [];
    for (const url of urls) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 6000);
        const res = await fetch(url, { signal: controller.signal });
        clearTimeout(timeoutId);
        if (res.ok) {
          const text = await res.text();
          const lines = text
            .split("\n")
            .map(l => l.trim())
            .filter(l => l && !l.startsWith("#") && /^[0-9a-fA-F:.]+$/.test(l));
          if (lines.length > 50) {
            fetchedList = lines;
            break;
          }
        }
      } catch (err: any) {
        // Continue to fallback if fetch fails or times out
      }
    }

    if (fetchedList.length > 0) {
      const newSet = new Set<string>();
      // Keep seed nodes for resilience
      for (const ip of TOR_SEED_NODES) {
        newSet.add(ip);
      }
      for (const ip of fetchedList) {
        newSet.add(ip);
      }
      torExitNodes = newSet;
      lastTorSync = new Date().toISOString();
      console.log(`[TorShield] Sincronizados exitosamente ${torExitNodes.size} nodos de salida Tor.`);
    }
    return { success: true, count: torExitNodes.size };
  } catch (err: any) {
    console.warn("[TorShield] Advertencia al sincronizar lista Tor:", err?.message || err);
    return { success: false, count: torExitNodes.size };
  } finally {
    isSyncingTor = false;
  }
}

// Initial async sync and scheduled 60-minute background refresh
syncTorExitNodes();
setInterval(syncTorExitNodes, 60 * 60 * 1000);

// Helper to extract sanitized client IP address
function getClientIp(req: Request): string {
  const cfConnectingIp = req.headers["cf-connecting-ip"];
  if (typeof cfConnectingIp === "string" && cfConnectingIp.trim()) {
    return cfConnectingIp.trim().replace(/^::ffff:/, "");
  }
  const trueClientIp = req.headers["true-client-ip"];
  if (typeof trueClientIp === "string" && trueClientIp.trim()) {
    return trueClientIp.trim().replace(/^::ffff:/, "");
  }
  const xForwardedFor = req.headers["x-forwarded-for"];
  let rawIp = "";
  if (typeof xForwardedFor === "string") {
    rawIp = xForwardedFor.split(",")[0].trim();
  } else if (Array.isArray(xForwardedFor) && xForwardedFor.length > 0) {
    rawIp = xForwardedFor[0].trim();
  } else if (typeof req.headers["x-real-ip"] === "string") {
    rawIp = (req.headers["x-real-ip"] as string).trim();
  } else {
    rawIp = req.ip || req.socket.remoteAddress || "127.0.0.1";
  }

  // Strip IPv6 prefix if mapped IPv4 (::ffff:1.2.3.4 -> 1.2.3.4)
  if (rawIp.startsWith("::ffff:")) {
    rawIp = rawIp.replace("::ffff:", "");
  }
  return rawIp;
}

// Check if IP is local/private loopback
function isLocalOrPrivateIp(ip: string): boolean {
  if (ip === "127.0.0.1" || ip === "::1" || ip === "localhost") return true;
  if (ip.startsWith("10.") || ip.startsWith("192.168.")) return true;
  if (/^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(ip)) return true;
  return false;
}

// Security Check Endpoint for Client Web Application
app.get("/api/security/ip-check", (req: Request, res: Response) => {
  const clientIp = getClientIp(req);
  const isLocal = isLocalOrPrivateIp(clientIp);
  const isTor = !isLocal && torExitNodes.has(clientIp);

  res.json({
    success: true,
    clientIp,
    isTor,
    isLocal,
    nodesCount: torExitNodes.size,
    lastSync: lastTorSync
  });
});

// Admin endpoint to test any given IP against Tor Exit Nodes database
app.post("/api/security/test-ip", (req: Request, res: Response) => {
  const { ip } = req.body;
  if (!ip || typeof ip !== "string") {
    return res.status(400).json({ error: "Debe proporcionar una dirección IP válida." });
  }
  const cleanIp = ip.trim().replace(/^::ffff:/, "");
  const isLocal = isLocalOrPrivateIp(cleanIp);
  const isTor = !isLocal && torExitNodes.has(cleanIp);

  res.json({
    success: true,
    ip: cleanIp,
    isTor,
    isLocal,
    nodesCount: torExitNodes.size,
    lastSync: lastTorSync
  });
});

// Admin endpoint to trigger a fresh sync of Tor Exit Nodes
app.post("/api/security/sync-tor", async (_req: Request, res: Response) => {
  const result = await syncTorExitNodes();
  res.json({
    success: result.success,
    nodesCount: result.count,
    lastSync: lastTorSync
  });
});

// Lazy-initialized Gemini AI client
let aiClient: GoogleGenAI | null = null;
function getGenAI(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
    return null;
  }
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

const JAIME_SYSTEM_INSTRUCTION = `Eres Jaime, el asistente virtual oficial e inteligente de la plataforma NexStudio (creada por Nexus / NexStudio Team).
Tu objetivo es ayudar, guiar y resolver cualquier duda técnica o general a los usuarios sobre la plataforma y el ecosistema de NexStudio.

Datos y contexto clave que conoces a la perfección:
1. Identidad: Eres Jaime, asistente virtual oficial de soporte de NexStudio. Tu trato es respetuoso, amable, empático, dinámico y resolutivo. Hablas en español con un tono cercano y profesional.
2. Sobre NexStudio: Es la plataforma y espacio de trabajo digital definitivo para creadores, diseñadores y optimizadores. Cuenta con:
   - Lienzo (Canvas) interactivo y herramientas creativas.
   - Catálogo de Proyectos Oficiales con descarga directa:
     * NexClean: Software ejecutable (.exe) oficial para Windows que realiza una limpieza profunda de archivos basura/temporales y optimiza el rendimiento general del PC.
     * NexBoost: Software ejecutable (.exe) oficial para Windows especializado en optimización y liberación de memoria RAM en tiempo real, acelerando el sistema y los videojuegos.
     * Asistente Web En HTML: Estructura modular construida en código nativo (HTML/CSS/JS) para asistentes virtuales.
   - Secciones de Creaciones, Plantillas y Recursos para la comunidad.
   - Comunidad interactiva: Red social en vivo donde publicar, comentar, dar likes y compartir proyectos.
   - Centro de Soporte: Con dos opciones integradas: hablar contigo (Jaime) para asistencia inmediata con IA, o abrir un Ticket de Soporte si se necesita atención directa de un administrador humano (por ejemplo, para apelar un baneo o revisar problemas de cuenta).
   - Centro de Mando: Panel administrativo exclusivo para administradores de NexStudio.
3. Instrucciones de comportamiento:
   - Responde siempre de forma clara, amigable y estructurada (utiliza viñetas o negritas cuando sea conveniente para facilitar la lectura).
   - Si el usuario te pregunta por descargas de NexClean o NexBoost, explícale que están disponibles en la pestaña "Proyectos" del Catálogo en formato ejecutable (.exe) con descarga segura protegida por temporizador de 3 segundos.
   - Si el usuario reporta una situación que requiera intervención administrativa (como una apelación de baneo o soporte humano personalizado), anímale con simpatía a abrir un ticket en la pestaña "Tickets de Soporte" de este mismo centro de ayuda.`;

// Health check endpoint
app.get("/api/health", (_req: Request, res: Response) => {
  res.json({ status: "ok", service: "NexStudio Server" });
});

// Jaime Virtual Assistant Chat API
app.post("/api/support/jaime", async (req: Request, res: Response) => {
  try {
    const { message, history } = req.body;

    if (!message || typeof message !== "string" || !message.trim()) {
      return res.status(400).json({ 
        error: "El mensaje es obligatorio." 
      });
    }

    const ai = getGenAI();

    // Helper function for intelligent simulated response
    const generateSmartFallback = (msg: string) => {
      const lower = msg.toLowerCase();
      let fallbackText = "¡Hola! Soy Jaime, tu asistente virtual de NexStudio. ";
      if (lower.includes("nexclean") || lower.includes("limpieza")) {
        fallbackText += "**NexClean** es nuestro software oficial para Windows (.exe) que elimina archivos basura, optimiza la memoria y deja tu ordenador rápido y limpio. Puedes descargarlo directamente en la pestaña **Proyectos** del Catálogo con 3 segundos de espera segura.";
      } else if (lower.includes("nexboost") || lower.includes("boost") || lower.includes("ram")) {
        fallbackText += "**NexBoost** es nuestro software ejecutable (.exe) diseñado para optimizar y liberar memoria RAM en tiempo real, acelerando la respuesta del sistema y de tus juegos. Lo tienes disponible en la sección **Proyectos** del Catálogo.";
      } else if (lower.includes("humano") || lower.includes("admin") || lower.includes("ticket") || lower.includes("ban") || lower.includes("cuenta")) {
        fallbackText += "Para consultas que requieran atención directa de un administrador de NexStudio (como apelaciones de cuenta o revisiones técnicas), puedes cambiar a la pestaña **Tickets de Soporte** en este mismo panel y abrir una solicitud personalizada.";
      } else if (lower.includes("noticias") || lower.includes("actualizacion") || lower.includes("version")) {
        fallbackText += "Puedes ver todas las novedades y características de la **Actualización 1.0** en la nueva pestaña **Noticias** ubicada en el menú superior.";
      } else {
        fallbackText += "Estoy aquí para resolver cualquier duda sobre la plataforma NexStudio, nuestros proyectos ejecutables como **NexClean** y **NexBoost**, o ayudarte a contactar con nuestro equipo de soporte humano. ¿En qué más puedo ayudarte hoy?";
      }
      return fallbackText;
    };

    // If API key is not configured or in development placeholder, provide simulated intelligent response
    if (!ai) {
      return res.json({
        reply: generateSmartFallback(message),
        source: "fallback",
        success: true
      });
    }

    // Build conversation contents for @google/genai generateContent
    const formattedContents: Array<{ role: "user" | "model"; parts: Array<{ text: string }> }> = [];

    if (Array.isArray(history)) {
      for (const item of history.slice(-10)) { // Keep last 10 messages for context
        if (item && item.text && (item.role === "user" || item.role === "model")) {
          formattedContents.push({
            role: item.role,
            parts: [{ text: String(item.text) }]
          });
        }
      }
    }

    // Add current user prompt
    formattedContents.push({
      role: "user",
      parts: [{ text: message.trim() }]
    });

    let reply = "";
    try {
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: formattedContents,
        config: {
          systemInstruction: JAIME_SYSTEM_INSTRUCTION,
          temperature: 0.7,
        }
      });
      reply = response.text || "";
    } catch (modelError: any) {
      console.warn("Aviso: Fallback activado para asistente Jaime tras respuesta del modelo:", modelError?.message || modelError);
      // Fallback a respuesta inteligente inmediata si Gemini experimenta alta demanda temporal (503)
      reply = generateSmartFallback(message);
    }

    if (!reply) {
      reply = generateSmartFallback(message);
    }

    return res.json({
      reply,
      source: "gemini",
      success: true
    });
  } catch (error: any) {
    console.error("Error en el asistente Jaime:", error);
    return res.json({
      reply: "¡Hola! Soy Jaime. NexStudio se encuentra activo. Si tu duda es sobre **NexClean** o **NexBoost**, puedes descargarlos gratis desde la pestaña **Proyectos** del Catálogo. También puedes abrir un ticket de soporte para que un administrador te atienda directamente.",
      source: "fallback",
      success: true
    });
  }
});

// Start server with Vite middleware in dev or static serving in prod
async function start() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`NexStudio server running on http://localhost:${PORT}`);
  });
}

start();
