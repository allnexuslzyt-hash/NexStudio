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

    // Pass all legitimate traffic to static assets
    return env.ASSETS.fetch(request);
  },
};
