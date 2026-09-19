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

app.use(express.json({ limit: "5mb" }));

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

    // If API key is not configured or in development placeholder, provide simulated intelligent response
    if (!ai) {
      const lower = message.toLowerCase();
      let fallbackText = "¡Hola! Soy Jaime, tu asistente virtual de NexStudio. ";
      if (lower.includes("nexclean") || lower.includes("limpieza")) {
        fallbackText += "**NexClean** es nuestro software oficial para Windows (.exe) que elimina archivos basura, optimiza la memoria y deja tu ordenador rápido y limpio. Puedes descargarlo directamente en la pestaña **Proyectos** del Catálogo con 3 segundos de espera segura.";
      } else if (lower.includes("nexboost") || lower.includes("boost") || lower.includes("ram")) {
        fallbackText += "**NexBoost** es nuestro software ejecutable (.exe) diseñado para optimizar y liberar memoria RAM en tiempo real, acelerando la respuesta del sistema y de tus juegos. Lo tienes disponible en la sección **Proyectos** del Catálogo.";
      } else if (lower.includes("humano") || lower.includes("admin") || lower.includes("ticket") || lower.includes("ban") || lower.includes("cuenta")) {
        fallbackText += "Para consultas que requieran atención directa de un administrador de NexStudio (como apelaciones de cuenta o revisiones técnicas), puedes cambiar a la pestaña **Tickets de Soporte** en este mismo panel y abrir una solicitud personalizada.";
      } else {
        fallbackText += "Estoy aquí para resolver cualquier duda sobre la plataforma NexStudio, nuestros proyectos ejecutables como **NexClean** y **NexBoost**, o ayudarte a contactar con nuestro equipo de soporte humano. ¿En qué más puedo ayudarte hoy?";
      }

      return res.json({
        reply: fallbackText,
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

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: formattedContents,
      config: {
        systemInstruction: JAIME_SYSTEM_INSTRUCTION,
        temperature: 0.7,
      }
    });

    const reply = response.text || "¡Hola! Soy Jaime. ¿En qué puedo ayudarte hoy en NexStudio?";

    return res.json({
      reply,
      source: "gemini",
      success: true
    });
  } catch (error: any) {
    console.error("Error en el asistente Jaime:", error);
    return res.status(500).json({
      reply: "Disculpa, ha ocurrido un detalle temporal al procesar tu solicitud. Por favor inténtalo de nuevo en unos momentos o abre un ticket de soporte humano si necesitas ayuda urgente.",
      error: error?.message || "Error interno del servidor",
      success: false
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
