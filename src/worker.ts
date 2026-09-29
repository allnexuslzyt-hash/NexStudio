/**
 * Cloudflare Worker for NexStudio
 * Runs directly on Cloudflare Edge (nexstudio.allnexuslzyt.workers.dev)
 * 
 * Provides:
 * 1. 100% Free Perimeter Tor Blocker: Cloudflare natively classifies Tor traffic with country "T1".
 *    If country === 'T1' or 'XX', the Worker terminates the request immediately with 403 (0 bytes).
 * 2. Handles /api/security/* endpoints.
 * 3. Serves static assets for legitimate users via env.ASSETS.
 */

export interface Env {
  ASSETS: {
    fetch: (request: Request) => Promise<Response>;
  };
  GROQ_API_KEYS?: string;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const cf = (request as any).cf;
    const country = cf?.country;
    const clientIp = request.headers.get("cf-connecting-ip") || request.headers.get("x-real-ip") || "";

    // -------------------------------------------------------------
    // Barrier 1: Native Cloudflare Tor Country Identification (Free)
    // Cloudflare tags all Tor traffic with ISO country code 'T1'
    // -------------------------------------------------------------
    const isTorCountry = country === "T1" || country === "XX";

    if (isTorCountry) {
      // 100% Do not load: return 403 with 0 bytes and close connection
      return new Response(null, {
        status: 403,
        statusText: "Forbidden",
        headers: {
          "Content-Type": "text/plain",
          "Content-Length": "0",
          "Connection": "close",
          "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
          "Pragma": "no-cache",
          "X-Tor-Blocked": "true",
          "X-Tor-Reason": "Cloudflare Edge Perimeter (T1 - Red Tor)",
        },
      });
    }

    // -------------------------------------------------------------
    // Security Endpoints for Client App
    // -------------------------------------------------------------
    if (url.pathname === "/api/security/ip-check") {
      return new Response(
        JSON.stringify({
          success: true,
          isTor: false,
          clientIp,
          country,
          reasons: [],
        }),
        {
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": "no-store",
          },
        }
      );
    }

    if (url.pathname === "/api/security/test-ip") {
      return new Response(
        JSON.stringify({
          success: true,
          ip: clientIp,
          isTor: isTorCountry,
          country,
          reasons: isTorCountry ? ["Detectado por Cloudflare Edge (T1)"] : [],
        }),
        {
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": "no-store",
          },
        }
      );
    }

    // -------------------------------------------------------------
    // Jaime Virtual Assistant Chat API via Groq
    // -------------------------------------------------------------
    if (url.pathname === "/api/support/jaime" && request.method === "POST") {
      try {
        const body: any = await request.json().catch(() => ({}));
        const message = body?.message || "";
        const history = body?.history || [];

        if (!message || typeof message !== "string") {
          return new Response(JSON.stringify({ error: "El mensaje es obligatorio." }), {
            status: 400,
            headers: { "Content-Type": "application/json" }
          });
        }

        const rawKeys = env.GROQ_API_KEYS || "";
        const groqKeys = rawKeys
          .split(/(?=gsk_)/)
          .map((k) => k.replace(/[,;\s"'`]/g, "").trim())
          .filter((k) => k.startsWith("gsk_") && k.length > 20);

        const systemPrompt = `Eres Jaime, el asistente virtual oficial, dinámico e inteligente de la plataforma NexStudio (creada por Nexus / NexStudio Team).
Tu objetivo es responder de manera personalizada, amable, fluida y precisa a cualquier duda, consulta o guía que el usuario tenga sobre TODA la web de NexStudio y su ecosistema:
1. Lienzo Creativo (Canvas): Dibujo, capas, formas, textos personalizados, zoom, exportación PNG/SVG.
2. Catálogo de Proyectos Oficiales: NexClean (limpieza profunda de Windows .exe con 3s de espera segura), NexBoost (optimización de memoria RAM en tiempo real .exe), Asistente Web en HTML.
3. Comunidad y Creaciones: Publicar creaciones del lienzo, dar likes, comentar, compartir plantillas.
4. Soporte y Tickets: Chatear contigo (Jaime) para asistencia con IA, o abrir Tickets de Soporte para atención directa de administradores.
5. Noticias y versión 1.0.
6. Herramientas y Convertidor de Archivos: Soporta más de 500 formatos con límite de 1.5 GB y memoria efímera que recupera el espacio de inmediato tras descargar.

NORMAS:
- Habla en español, cercano y profesional.
- Responde DIRECTAMENTE a lo que el usuario pregunte sin repetir saludos robóticos.
- Usa negritas y formato markdown claro.`;

        const groqMessages = [
          { role: "system", content: systemPrompt }
        ];

        if (Array.isArray(history)) {
          for (const item of history.slice(-8)) {
            if (item && item.text) {
              groqMessages.push({
                role: item.role === "model" ? "assistant" : item.role,
                content: String(item.text)
              });
            }
          }
        }
        groqMessages.push({ role: "user", content: message.trim() });

        let reply = "";
        let usedModel = "openai/gpt-oss-120b";
        const modelsToTry = ["openai/gpt-oss-120b", "qwen/qwen3.8-27b"];

        for (const model of modelsToTry) {
          if (reply) break;
          for (const key of groqKeys) {
            try {
              const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
                method: "POST",
                headers: {
                  "Authorization": `Bearer ${key}`,
                  "Content-Type": "application/json"
                },
                body: JSON.stringify({
                  model,
                  messages: groqMessages,
                  temperature: 0.7,
                  max_tokens: 800
                })
              });

              if (groqRes.ok) {
                const groqData: any = await groqRes.json();
                reply = groqData.choices?.[0]?.message?.content?.trim() || "";
                if (reply) {
                  usedModel = model;
                  break;
                }
              }
            } catch {}
          }
        }

        if (!reply) {
          reply = "¡Hola! Soy Jaime. NexStudio se encuentra activo. Si buscas optimizar tu PC o liberar memoria, recuerda que tienes disponibles **NexClean** y **NexBoost** en la pestaña **Proyectos** del Catálogo con descarga directa.";
        }

        return new Response(JSON.stringify({
          reply,
          source: `groq (${usedModel})`,
          success: true
        }), {
          headers: { "Content-Type": "application/json" }
        });
      } catch (err: any) {
        return new Response(JSON.stringify({
          reply: "¡Hola! Soy Jaime. ¿En qué puedo ayudarte hoy sobre NexStudio?",
          source: "fallback",
          success: true
        }), {
          headers: { "Content-Type": "application/json" }
        });
      }
    }

    // Pass all legitimate traffic to static assets
    return env.ASSETS.fetch(request);
  },
};
