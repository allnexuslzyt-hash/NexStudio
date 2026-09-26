import express, { Request, Response } from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import dns from "dns";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.set("trust proxy", true);

app.use(express.json({ limit: "5mb" }));

// -------------------------------------------------------------
// NexStudio High-Performance Perimeter Shield: Multi-Source Tor Detection
// -------------------------------------------------------------
let torExitNodes = new Set<string>();
let lastTorSync: string | null = null;
let isSyncingTor = false;

// Comprehensive initial seed of active Tor exit nodes and known relays
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
  "51.15.43.205", "51.15.54.212", "51.15.67.114", "51.15.89.24",
  "104.244.72.115", "104.244.72.116", "104.244.72.117", "104.244.72.118",
  "176.10.99.200", "176.10.99.201", "176.10.99.202", "176.10.99.203",
  "198.98.51.189", "198.98.56.149", "198.98.57.199", "198.98.58.243",
  "162.247.74.200", "162.247.74.201", "162.247.74.202", "162.247.74.203",
  "204.8.96.141", "204.137.14.106", "178.218.144.18", "185.220.101.33"
];

for (const ip of TOR_SEED_NODES) {
  torExitNodes.add(ip);
}
lastTorSync = new Date().toISOString();

// Fast Reverse DNS Cache to prevent redundant lookups
const reverseDnsCache = new Map<string, { isTorHost: boolean; hostnames: string[]; expires: number }>();

async function checkReverseDnsForTor(ip: string): Promise<{ isTorHost: boolean; hostnames: string[] }> {
  const now = Date.now();
  const cached = reverseDnsCache.get(ip);
  if (cached && cached.expires > now) {
    return { isTorHost: cached.isTorHost, hostnames: cached.hostnames };
  }

  // Skip local IPs
  if (isLocalOrPrivateIp(ip)) {
    return { isTorHost: false, hostnames: [] };
  }

  try {
    const hostnames = await Promise.race([
      dns.promises.reverse(ip),
      new Promise<string[]>((_, reject) => setTimeout(() => reject(new Error("Timeout")), 1200))
    ]);

    const isTorHost = hostnames.some(h => 
      /tor(-|_|\.)?exit|torexit|tor(-|_|\.)?relay|tor(-|_|\.)?node|torservers|onionoo|exit(-|_|\.)?node|\.onion\./i.test(h)
    );

    reverseDnsCache.set(ip, { isTorHost, hostnames, expires: now + 3600 * 1000 });
    return { isTorHost, hostnames };
  } catch {
    reverseDnsCache.set(ip, { isTorHost: false, hostnames: [], expires: now + 600 * 1000 });
    return { isTorHost: false, hostnames: [] };
  }
}

// Multi-Source Tor Exit Node Synchronizer:
// 1. Official Tor Project Onionoo API (relays with Exit flag)
// 2. SecOps Institute Global Tor Exit list
// 3. TorProject Bulk Exit list
async function syncTorExitNodes(): Promise<{ success: boolean; count: number; sources: string[] }> {
  if (isSyncingTor) return { success: true, count: torExitNodes.size, sources: ["En curso"] };
  isSyncingTor = true;
  const successfulSources: string[] = [];

  try {
    const newIps = new Set<string>();

    // Always preserve seed nodes
    for (const ip of TOR_SEED_NODES) {
      newIps.add(ip);
    }

    // Source 1: Official Tor Project Onionoo API
    try {
      const onionooCtrl = new AbortController();
      const onionooTimer = setTimeout(() => onionooCtrl.abort(), 6000);
      const res = await fetch("https://onionoo.torproject.org/summary?type=relay&running=true&flag=Exit", {
        headers: { "User-Agent": "NexStudio-Shield/3.0" },
        signal: onionooCtrl.signal
      });
      clearTimeout(onionooTimer);

      if (res.ok) {
        const data = await res.json();
        let addedCount = 0;
        if (data?.relays && Array.isArray(data.relays)) {
          for (const relay of data.relays) {
            if (Array.isArray(relay.a)) {
              for (const addr of relay.a) {
                const clean = addr.replace(/[\[\]]/g, "").trim();
                if (clean) {
                  newIps.add(clean);
                  addedCount++;
                }
              }
            }
          }
        }
        if (addedCount > 100) {
          successfulSources.push(`Tor Project Onionoo (${addedCount} IPs)`);
        }
      }
    } catch (e: any) {
      console.warn("[TorShield] Onionoo sync fallback:", e?.message);
    }

    // Source 2: SecOps Institute Tor List
    try {
      const secOpsCtrl = new AbortController();
      const secOpsTimer = setTimeout(() => secOpsCtrl.abort(), 5000);
      const res = await fetch("https://raw.githubusercontent.com/SecOps-Institute/Tor-IP-Addresses/master/tor-exit-nodes.lst", {
        signal: secOpsCtrl.signal
      });
      clearTimeout(secOpsTimer);

      if (res.ok) {
        const text = await res.text();
        const lines = text.split("\n").map(l => l.trim()).filter(l => l && !l.startsWith("#"));
        for (const line of lines) {
          newIps.add(line);
        }
        successfulSources.push(`SecOps Institute (${lines.length} IPs)`);
      }
    } catch (e: any) {
      console.warn("[TorShield] SecOps sync fallback:", e?.message);
    }

    // Source 3: Tor Project Bulk Exit List
    try {
      const bulkCtrl = new AbortController();
      const bulkTimer = setTimeout(() => bulkCtrl.abort(), 5000);
      const res = await fetch("https://check.torproject.org/torbulkexitlist", {
        signal: bulkCtrl.signal
      });
      clearTimeout(bulkTimer);

      if (res.ok) {
        const text = await res.text();
        const lines = text.split("\n").map(l => l.trim()).filter(l => l && !l.startsWith("#") && /^[0-9a-fA-F:.]+$/.test(l));
        for (const line of lines) {
          newIps.add(line);
        }
        successfulSources.push(`Check.TorProject (${lines.length} IPs)`);
      }
    } catch (e: any) {
      console.warn("[TorShield] Check.torproject fallback:", e?.message);
    }

    if (newIps.size > TOR_SEED_NODES.length) {
      torExitNodes = newIps;
      lastTorSync = new Date().toISOString();
      console.log(`[TorShield] Sincronización exitosa: ${torExitNodes.size} nodos de salida Tor activos indexados.`);
    }

    return { success: true, count: torExitNodes.size, sources: successfulSources };
  } catch (err: any) {
    console.warn("[TorShield] Error durante sincronización:", err?.message || err);
    return { success: false, count: torExitNodes.size, sources: successfulSources };
  } finally {
    isSyncingTor = false;
  }
}

// Initial async sync and scheduled 15-minute background refresh
syncTorExitNodes();
setInterval(syncTorExitNodes, 15 * 60 * 1000);

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

// Security Check Endpoint for Client Web Application with Multi-Vector Analysis
app.all("/api/security/ip-check", async (req: Request, res: Response) => {
  const clientIp = getClientIp(req);
  const isLocal = isLocalOrPrivateIp(clientIp);
  const isTorIp = !isLocal && torExitNodes.has(clientIp);

  // Fast reverse DNS check
  const reverseDns = await checkReverseDnsForTor(clientIp);

  // Check headers for anonymity indicators
  const ua = req.headers["user-agent"] || "";
  const acceptLang = req.headers["accept-language"] || "";
  const secChUa = req.headers["sec-ch-ua"] || "";
  const xTorHeader = Boolean(req.headers["x-tor-exit"] || req.headers["x-tor-relay"]);

  // Cloudflare/Proxy tor header flags if routed through CDN (T1 is official Tor country code in Cloudflare)
  const isCfTor = req.headers["cf-ipcountry"] === "T1" || req.headers["cf-ipcountry"] === "XX";

  // Check if client payload reported browser fingerprint score
  const clientReport = req.method === "POST" ? req.body : {};
  const clientFingerprint = clientReport?.browserFingerprint || {};
  const clientFingerprintTor = Boolean(clientFingerprint?.isTorDetected);
  const clientFingerprintScore = Number(clientFingerprint?.score || 0);

  const hasTorUserAgent = /Firefox\/1[0-9]{2}\.0/i.test(ua) && !secChUa;
  const isLanguageMasked = acceptLang.toLowerCase() === "en-us,en;q=0.5";

  // Multi-Vector Composite Decision:
  // 1. IP in verified Tor Exit Node database
  // 2. Reverse DNS hostname points to a Tor exit/relay
  // 3. Cloudflare Country Code T1
  // 4. Explicit Tor header
  // 5. High-confidence Client-Side Browser Fingerprint (RFP, Letterboxing, Timezone, 2 Cores)
  // 6. Medium fingerprint score with anonymized headers
  const reasons: string[] = [];
  if (isTorIp) reasons.push("IP identificada en la base de datos de nodos de salida Tor oficiales");
  if (reverseDns.isTorHost) reasons.push(`Reverse DNS de IP coincide con nodo Tor (${reverseDns.hostnames.join(", ")})`);
  if (isCfTor) reasons.push("Cabecera Cloudflare T1 (Red Tor detectada por CDN perimetral)");
  if (xTorHeader) reasons.push("Cabecera HTTP Tor activa");
  if (clientFingerprintTor) reasons.push("Huella digital de navegador Tor Browser confirmada por cliente");
  if (clientFingerprintScore >= 45 && hasTorUserAgent) reasons.push("Firma combinada de navegador anonimizado con score alto");

  const isTor = isTorIp || reverseDns.isTorHost || isCfTor || xTorHeader || clientFingerprintTor || (clientFingerprintScore >= 45 && (hasTorUserAgent || isLanguageMasked));

  res.json({
    success: true,
    clientIp,
    isTor,
    isTorIp,
    isTorDns: reverseDns.isTorHost,
    isCfTor,
    isLocal,
    reasons,
    nodesCount: torExitNodes.size,
    lastSync: lastTorSync,
    analyzedHeaders: {
      hasTorUserAgent,
      isLanguageMasked
    }
  });
});

// Admin endpoint to test any given IP against Tor Exit Nodes database + reverse DNS
app.post("/api/security/test-ip", async (req: Request, res: Response) => {
  const { ip } = req.body;
  if (!ip || typeof ip !== "string") {
    return res.status(400).json({ error: "Debe proporcionar una dirección IP válida." });
  }
  const cleanIp = ip.trim().replace(/^::ffff:/, "");
  const isLocal = isLocalOrPrivateIp(cleanIp);
  const isTorIp = !isLocal && torExitNodes.has(cleanIp);
  const reverseDns = await checkReverseDnsForTor(cleanIp);

  const isTor = isTorIp || reverseDns.isTorHost;
  const reasons: string[] = [];
  if (isTorIp) reasons.push("Coincide con nodo de salida en la lista activa");
  if (reverseDns.isTorHost) reasons.push(`Reverse DNS apunta a infraestructura Tor (${reverseDns.hostnames.join(", ")})`);

  res.json({
    success: true,
    ip: cleanIp,
    isTor,
    isTorIp,
    isTorDns: reverseDns.isTorHost,
    hostnames: reverseDns.hostnames,
    isLocal,
    reasons,
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
    sources: result.sources,
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
