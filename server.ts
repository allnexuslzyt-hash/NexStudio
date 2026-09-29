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

function cleanIpString(raw: string): string {
  if (!raw) return "";
  let s = raw.trim().replace(/^::ffff:/, "");
  // Strip IPv4 port if present (e.g. 192.210.214.13:54321 -> 192.210.214.13)
  if (/^(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}):\d+$/.test(s)) {
    s = s.replace(/:\d+$/, "");
  }
  // Strip bracketed IPv6 port [::1]:8080
  if (/^\[([a-fA-F0-9:]+)\]:\d+$/.test(s)) {
    s = s.replace(/^\[/, "").replace(/\]:\d+$/, "");
  }
  return s;
}

// Helper to extract sanitized client IP address from all possible proxy layers
function getAllClientIps(req: Request): string[] {
  const ips: string[] = [];
  const add = (val: unknown) => {
    if (typeof val === "string" && val.trim()) {
      val.split(",").forEach((item) => {
        const clean = cleanIpString(item);
        if (clean) ips.push(clean);
      });
    } else if (Array.isArray(val)) {
      val.forEach((item) => add(item));
    }
  };

  add(req.headers["cf-connecting-ip"]);
  add(req.headers["true-client-ip"]);
  add(req.headers["x-real-ip"]);
  add(req.headers["x-forwarded-for"]);
  add(req.headers["x-client-ip"]);
  add(req.headers["fastly-client-ip"]);
  add(req.headers["forwarded"]);
  if (req.socket?.remoteAddress) {
    add(req.socket.remoteAddress);
  }
  if (req.ip) {
    add(req.ip);
  }
  return Array.from(new Set(ips));
}

function getClientIp(req: Request): string {
  const all = getAllClientIps(req);
  for (const ip of all) {
    if (!isLocalOrPrivateIp(ip)) {
      return ip;
    }
  }
  return all[0] || req.ip || "127.0.0.1";
}

// Check if IP is local/private loopback
function isLocalOrPrivateIp(ip: string): boolean {
  if (!ip) return true;
  if (ip === "127.0.0.1" || ip === "::1" || ip === "localhost") return true;
  if (ip.startsWith("10.") || ip.startsWith("192.168.")) return true;
  if (/^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(ip)) return true;
  if (ip.startsWith("169.254.")) return true;
  return false;
}

// -------------------------------------------------------------
// Live Tor DNSEL (DNS Exit List) Lookup
// Queries the official live authoritative DNS of Tor Project in real-time
// -------------------------------------------------------------
const torDnsCache = new Map<string, { isTor: boolean; source?: string; timestamp: number }>();
const DNS_CACHE_TTL_MS = 5 * 60 * 1000; // 5-minute cache to balance freshness and speed

async function checkTorViaDnsel(ip: string): Promise<{ isTor: boolean; source?: string }> {
  if (isLocalOrPrivateIp(ip)) return { isTor: false };

  const cached = torDnsCache.get(ip);
  if (cached && Date.now() - cached.timestamp < DNS_CACHE_TTL_MS) {
    return { isTor: cached.isTor, source: cached.source };
  }

  const parts = ip.split(".");
  if (parts.length !== 4) return { isTor: false }; // Only IPv4 supported by standard DNSEL
  const reversedIp = [...parts].reverse().join(".");

  return new Promise((resolve) => {
    let settled = false;
    const timer = setTimeout(() => {
      if (!settled) {
        settled = true;
        resolve({ isTor: false });
      }
    }, 1500);

    // Primary: Official Tor Project DNS Exit List (dnsel.torproject.org)
    dns.resolve4(`${reversedIp}.dnsel.torproject.org`, (err, addresses) => {
      if (!settled && !err && addresses && addresses.includes("127.0.0.2")) {
        settled = true;
        clearTimeout(timer);
        torDnsCache.set(ip, { isTor: true, source: "dnsel.torproject.org (Tor Project Oficial)", timestamp: Date.now() });
        return resolve({ isTor: true, source: "dnsel.torproject.org (Tor Project Oficial)" });
      }

      // Secondary: Independent DNSBL (torexit.dan.me.uk)
      dns.resolve4(`${reversedIp}.torexit.dan.me.uk`, (err2, addresses2) => {
        if (!settled) {
          settled = true;
          clearTimeout(timer);
          if (!err2 && addresses2 && addresses2.length > 0) {
            torDnsCache.set(ip, { isTor: true, source: "torexit.dan.me.uk", timestamp: Date.now() });
            return resolve({ isTor: true, source: "torexit.dan.me.uk" });
          }
          torDnsCache.set(ip, { isTor: false, timestamp: Date.now() });
          return resolve({ isTor: false });
        }
      });
    });
  });
}

// -------------------------------------------------------------
// Perimeter Connection Drop: Multi-Barrier Zero-Tolerance Strict Tor Block
// The server terminates the TCP socket without sending data (ERR_CONNECTION_CLOSED).
// -------------------------------------------------------------
app.use(async (req: Request, res: Response, next) => {
  // Allow administrative IP testing and Tor sync API endpoints
  if (
    req.path.startsWith("/api/security/test-ip") ||
    req.path.startsWith("/api/security/sync-tor") ||
    req.path.startsWith("/api/security/export-tor-rules")
  ) {
    return next();
  }

  // Barrier 1: Cloudflare Tor Flag (T1 / XX) & Explicit Tor headers
  const isCfTor = req.headers["cf-ipcountry"] === "T1" || req.headers["cf-ipcountry"] === "XX";
  const xTorHeader = Boolean(req.headers["x-tor-exit"] || req.headers["x-tor-relay"] || req.headers["x-tor-origin"]);

  if (isCfTor || xTorHeader) {
    try {
      res.status(403).set({
        "Content-Type": "text/plain",
        "Content-Length": "0",
        "Connection": "close",
        "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0"
      }).end();
      res.socket?.destroy();
      req.destroy();
    } catch {}
    return;
  }

  const allClientIps = getAllClientIps(req);
  const clientIp = getClientIp(req);

  if (isLocalOrPrivateIp(clientIp)) {
    return next();
  }

  // Barrier 2: IP in Official Tor Exit Nodes Database (any IP in the forwarded chain)
  const isTorIp = allClientIps.some((ip) => !isLocalOrPrivateIp(ip) && torExitNodes.has(ip));

  // Barrier 3: Live Tor Project DNSEL in Real Time
  let isTorDnsel = false;
  let dnselSource = "";
  try {
    const dnselResult = await checkTorViaDnsel(clientIp);
    if (dnselResult.isTor) {
      isTorDnsel = true;
      dnselSource = dnselResult.source || "Tor DNSEL";
    }
  } catch {}

  // Barrier 4: Reverse DNS verification of relay infrastructure
  let isReverseDnsTor = false;
  try {
    const rdns = await checkReverseDnsForTor(clientIp);
    isReverseDnsTor = rdns.isTorHost;
  } catch {}

  // Barrier 5: Header fingerprint (Firefox ESR + locked en-US language + zero client hints)
  const ua = req.headers["user-agent"] || "";
  const acceptLang = req.headers["accept-language"] || "";
  const secChUa = req.headers["sec-ch-ua"] || "";
  const isTorHeaderFingerprint = 
    /Firefox\/(?:115|128|140)\.0/i.test(ua) && 
    acceptLang.toLowerCase() === "en-us,en;q=0.5" && 
    !secChUa;

  if (isTorIp || isTorDnsel || isCfTor || xTorHeader || isReverseDnsTor || isTorHeaderFingerprint) {
    // 100% Do not load: Send immediate 403 with zero bytes and close TCP socket
    try {
      res.status(403).set({
        "Content-Type": "text/plain",
        "Content-Length": "0",
        "Connection": "close",
        "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
        "Pragma": "no-cache",
        "X-Tor-Blocked": "true",
        "X-Tor-Reason": isTorDnsel ? dnselSource : isTorIp ? "Tor Exit DB" : "Perimeter Security"
      }).end();
      res.socket?.destroy();
      req.destroy();
    } catch {}
    return;
  }

  next();
});

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

  // Check Tor via Live DNSBL
  const dnsel = await checkTorViaDnsel(clientIp);

  // Multi-Vector Composite Decision:
  // 1. Live Tor Project DNSEL (Real-time authoritative DNS from Tor Project)
  // 2. IP in verified Tor Exit Node database (RAM)
  // 3. Reverse DNS hostname points to a Tor exit/relay
  // 4. Cloudflare Country Code T1
  // 5. Explicit Tor header
  // 6. High-confidence Client-Side Browser Fingerprint (RFP, Letterboxing, Timezone, 2 Cores)
  // 7. Medium fingerprint score with anonymized headers
  const reasons: string[] = [];
  if (dnsel.isTor) reasons.push(`Verificación en TIEMPO REAL confirmada por ${dnsel.source || 'Tor DNSEL Oficial'}`);
  if (isTorIp) reasons.push("IP identificada en la base de datos de nodos de salida Tor oficiales");
  if (reverseDns.isTorHost) reasons.push(`Reverse DNS de IP coincide con nodo Tor (${reverseDns.hostnames.join(", ")})`);
  if (isCfTor) reasons.push("Cabecera Cloudflare T1 (Red Tor detectada por CDN perimetral)");
  if (xTorHeader) reasons.push("Cabecera HTTP Tor activa");
  if (clientFingerprintTor) reasons.push("Huella digital de navegador Tor Browser confirmada por cliente");
  if (clientFingerprintScore >= 45 && hasTorUserAgent) reasons.push("Firma combinada de navegador anonimizado con score alto");

  const isTor = dnsel.isTor || isTorIp || reverseDns.isTorHost || isCfTor || xTorHeader || clientFingerprintTor || (clientFingerprintScore >= 45 && (hasTorUserAgent || isLanguageMasked));

  res.json({
    success: true,
    clientIp,
    isTor,
    isTorDnsel: dnsel.isTor,
    dnselSource: dnsel.source,
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

// Admin endpoint to test any given IP against Tor Exit Nodes database + reverse DNS + Live DNSEL
app.post("/api/security/test-ip", async (req: Request, res: Response) => {
  const { ip } = req.body;
  if (!ip || typeof ip !== "string") {
    return res.status(400).json({ error: "Debe proporcionar una dirección IP válida." });
  }
  const cleanIp = ip.trim().replace(/^::ffff:/, "");
  const isLocal = isLocalOrPrivateIp(cleanIp);
  const isTorIp = !isLocal && torExitNodes.has(cleanIp);
  const dnsel = await checkTorViaDnsel(cleanIp);
  const reverseDns = await checkReverseDnsForTor(cleanIp);

  const isTor = dnsel.isTor || isTorIp || reverseDns.isTorHost;
  const reasons: string[] = [];
  if (dnsel.isTor) reasons.push(`Verificación en TIEMPO REAL confirmada por ${dnsel.source || 'Tor DNSEL Oficial'}`);
  if (isTorIp) reasons.push("Coincide con nodo de salida en la lista activa de RAM");
  if (reverseDns.isTorHost) reasons.push(`Reverse DNS apunta a infraestructura Tor (${reverseDns.hostnames.join(", ")})`);

  res.json({
    success: true,
    ip: cleanIp,
    isTor,
    isTorDnsel: dnsel.isTor,
    dnselSource: dnsel.source,
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

// Admin endpoint to export blocking rules for Cloudflare, Nginx, and Apache
app.get("/api/security/export-tor-rules", (req: Request, res: Response) => {
  const format = req.query.format as string || "all";
  const ips = Array.from(torExitNodes);

  const cloudflareRule = `(ip.geoip.country eq "T1")`;
  const nginxRules = ips.map(ip => `deny ${ip};`).join("\n");
  const apacheRules = `<RequireAll>\n  Require all granted\n` + ips.map(ip => `  Require not ip ${ip}`).join("\n") + `\n</RequireAll>`;

  if (format === "nginx") {
    res.setHeader("Content-Disposition", 'attachment; filename="tor-nginx-deny.conf"');
    res.setHeader("Content-Type", "text/plain");
    return res.send(nginxRules);
  }
  if (format === "apache") {
    res.setHeader("Content-Disposition", 'attachment; filename="tor-htaccess-deny.conf"');
    res.setHeader("Content-Type", "text/plain");
    return res.send(apacheRules);
  }
  if (format === "ips") {
    res.setHeader("Content-Disposition", 'attachment; filename="tor-exit-nodes.txt"');
    res.setHeader("Content-Type", "text/plain");
    return res.send(ips.join("\n"));
  }

  res.json({
    success: true,
    nodesCount: ips.length,
    lastSync: lastTorSync,
    freeBlockingMethod: "Intercepción directa en memoria RAM de Node.js (Coste $0)",
    sampleNginx: ips.slice(0, 8).map(ip => `deny ${ip};`).join("\n") + "\n# ... (" + ips.length + " IPs activas)",
    sampleApache: `<RequireAll>\n  Require all granted\n` + ips.slice(0, 8).map(ip => `  Require not ip ${ip}`).join("\n") + `\n  # ... (${ips.length} IPs activas)\n</RequireAll>`
  });
});

// File Converter Status & Zero-Waste Policy Endpoint
app.get("/api/tools/converter-info", (_req: Request, res: Response) => {
  res.json({
    status: "active",
    maxBatchSizeBytes: 1.5 * 1024 * 1024 * 1024,
    maxBatchSizeFormatted: "1.5 GB",
    storagePolicy: "ephemeral-in-memory (Zero-Waste, immediate auto-purge upon download or reset)",
    formatsSupportedCount: "500+",
    supportedCategories: [
      "Imágenes",
      "Documentos & Texto",
      "Audio",
      "Video",
      "Archivos Comprimidos",
      "Datos & Código",
      "Fuentes"
    ]
  });
});

// -------------------------------------------------------------
// Speedtest Endpoints for Precision Network Measurement
// -------------------------------------------------------------
app.get("/api/tools/speedtest/ping", (_req: Request, res: Response) => {
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.json({ timestamp: Date.now() });
});

app.get("/api/tools/speedtest/download", (req: Request, res: Response) => {
  const bytes = Math.min(25 * 1024 * 1024, Math.max(1024 * 1024, parseInt(String(req.query.bytes || "5242880"), 10)));
  res.setHeader("Content-Type", "application/octet-stream");
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.setHeader("Content-Length", bytes.toString());

  const chunkSize = 64 * 1024;
  const chunk = Buffer.alloc(chunkSize, 0x41);
  let bytesWritten = 0;

  function write() {
    let ok = true;
    while (bytesWritten < bytes && ok) {
      const remaining = bytes - bytesWritten;
      const toWrite = remaining > chunkSize ? chunk : chunk.subarray(0, remaining);
      bytesWritten += toWrite.length;
      ok = res.write(toWrite);
    }
    if (bytesWritten >= bytes) {
      res.end();
    } else {
      res.once("drain", write);
    }
  }
  write();
});

app.post("/api/tools/speedtest/upload", (req: Request, res: Response) => {
  let receivedBytes = 0;
  req.on("data", (chunk: Buffer) => {
    receivedBytes += chunk.length;
  });
  req.on("end", () => {
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
    res.json({ receivedBytes, timestamp: Date.now() });
  });
});

// -------------------------------------------------------------
// Groq AI Integration with Multi-Key Rotation and Fallback
// -------------------------------------------------------------
function getGroqPool(): string[] {
  const raw = process.env.GROQ_API_KEYS || "";
  const fromEnv = raw
    .split(/(?=gsk_)/)
    .map(k => k.replace(/[,;\s"'`]/g, "").trim())
    .filter(k => k.startsWith("gsk_") && k.length > 20);

  return fromEnv;
}

let groqKeyIndex = 0;

async function queryGroqChat(messages: Array<{ role: string; content: string }>): Promise<{ reply: string; model: string; keyUsed: string } | null> {
  const pool = getGroqPool();
  if (pool.length === 0) {
    return null;
  }
  const modelsToTry = ["openai/gpt-oss-120b", "qwen/qwen3.8-27b"];

  for (let attempt = 0; attempt < pool.length * modelsToTry.length; attempt++) {
    const key = pool[(groqKeyIndex + attempt) % pool.length];
    const model = modelsToTry[Math.floor(attempt / pool.length) % modelsToTry.length];

    try {
      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${key}`,
          "Content-Type": "application/json",
          "User-Agent": "NexStudio-Jaime/1.0"
        },
        body: JSON.stringify({
          model,
          messages,
          temperature: 0.7,
          max_tokens: 800
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.warn(`Groq key rotation: Key ${key.slice(0, 10)}... status ${response.status} (${model}):`, errorText.slice(0, 100));
        continue;
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content?.trim();
      if (content) {
        groqKeyIndex = (groqKeyIndex + attempt + 1) % pool.length;
        return {
          reply: content,
          model,
          keyUsed: key.slice(0, 10) + "..."
        };
      }
    } catch (err: any) {
      console.warn(`Groq request error with key ${key.slice(0, 10)}...:`, err?.message || err);
    }
  }
  return null;
}

// Lazy-initialized Gemini AI client (Fallback)
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

const JAIME_SYSTEM_INSTRUCTION = `Eres Jaime, el asistente virtual oficial, dinámico e inteligente de la plataforma NexStudio (creada por Nexus / NexStudio Team).
Tu objetivo es responder de manera personalizada, amable, fluida y precisa a cualquier duda, consulta o guía que el usuario tenga sobre TODA la web de NexStudio y su ecosistema.

CONOCIMIENTO INTEGRAL DE LA WEB NEXSTUDIO:
1. Lienzo Creativo (Canvas / Editor):
   - Herramienta de diseño interactiva donde los creadores pueden dibujar, arrastrar elementos, usar formas geométricas, añadir textos con tipografías personalizadas y organizar capas.
   - Cuenta con controles de zoom, paneo, deshacer/rehacer, paletas de colores y exportación de diseños en formatos PNG, SVG o JSON.
2. Catálogo de Proyectos Oficiales:
   - Proyectos oficiales listos para descarga segura (con temporizador de 3 segundos):
     * NexClean: Software ejecutable (.exe) oficial para Windows que realiza una limpieza a fondo de temporales, cachés, logs y basura digital, liberando espacio y acelerando el PC.
     * NexBoost: Software ejecutable (.exe) oficial para Windows enfocado en optimizar y liberar memoria RAM en tiempo real para eliminar lag en videojuegos y programas pesados.
     * Asistente Web en HTML: Estructura modular construida con HTML5, CSS y JavaScript para asistentes virtuales.
3. Comunidad y Red Social (Creaciones):
   - Muro interactivo donde los usuarios pueden publicar sus creaciones hechas en el lienzo o en proyectos externos.
   - Sistema de interacción social: dar me gusta, comentar, compartir, ver perfiles de otros creadores y clonar plantillas públicas.
4. Centro de Soporte y Tickets:
   - Sección dual: chatear contigo (Jaime) para soporte y preguntas en tiempo real, o abrir un Ticket de Soporte si se necesita atención directa de un administrador humano (por ejemplo, para apelar suspensiones, reportar bugs graves o consultas de cuenta).
5. Centro de Mando (Admin Command Center):
   - Panel exclusivo para administradores donde se gestionan usuarios, permisos, proyectos, tickets de soporte y métricas del sistema.
6. Noticias y Actualizaciones:
   - Novedades de la versión 1.0, mejoras de rendimiento, parches y anuncios oficiales.
7. Sección de Herramientas y Convertidor Universal de Archivos:
   - Convertidor de Archivos: Herramienta oficial integrada que soporta más de 500 formatos (imágenes como PNG/JPG/WebP, documentos como PDF/DOCX/TXT/HTML, audio como MP3/WAV/OGG, video como MP4/GIF, datos como JSON/CSV/YAML y archivos ZIP).
   - Límite amplio de capacidad: Hasta 1.5 GB por lote de archivos.
   - Gestión inteligente del espacio y privacidad efímera: Los archivos se procesan mediante flujos de memoria temporal del navegador sin almacenarse permanentemente en ningún disco del servidor. En cuanto se descargan o se limpian, los archivos se eliminan y el espacio se recupera al 100% de forma inmediata.

NORMAS DE RESPUESTA:
- Habla en español, con un tono cercano, servicial, profesional y dinámico.
- NUNCA repitas una plantilla rígida ni el mismo saludo una y otra vez. Responde DIRECTAMENTE a lo que el usuario pregunte.
- Si te preguntan por el lienzo, explica cómo usarlo. Si te preguntan por NexClean o NexBoost, explica sus funciones y dónde descargarlos. Si te preguntan por soporte, indícales cómo abrir un ticket. Si te saludan o preguntan qué puedes hacer, dales la bienvenida con un resumen ameno.
- Usa negritas y formato Markdown limpio cuando sea útil para que sea fácil de leer.`;

// Health check endpoint
app.get("/api/health", (_req: Request, res: Response) => {
  res.json({ status: "ok", service: "NexStudio Server" });
});

// Jaime Virtual Assistant Chat API powered by Groq (Primary) + Gemini (Fallback)
app.post("/api/support/jaime", async (req: Request, res: Response) => {
  try {
    const { message, history } = req.body;

    if (!message || typeof message !== "string" || !message.trim()) {
      return res.status(400).json({ 
        error: "El mensaje es obligatorio." 
      });
    }

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

    // 1. Prepare conversation history in OpenAI format for Groq
    const groqMessages: Array<{ role: string; content: string }> = [
      { role: "system", content: JAIME_SYSTEM_INSTRUCTION }
    ];

    if (Array.isArray(history)) {
      for (const item of history.slice(-10)) {
        if (item && item.text && (item.role === "user" || item.role === "model" || item.role === "assistant")) {
          groqMessages.push({
            role: item.role === "model" ? "assistant" : item.role,
            content: String(item.text)
          });
        }
      }
    }

    groqMessages.push({
      role: "user",
      content: message.trim()
    });

    // 2. Primary: Execute via Groq with high-speed key rotation
    const groqResult = await queryGroqChat(groqMessages);
    if (groqResult && groqResult.reply) {
      return res.json({
        reply: groqResult.reply,
        source: `groq (${groqResult.model})`,
        model: groqResult.model,
        success: true
      });
    }

    // 3. Fallback: Gemini AI SDK
    const ai = getGenAI();
    if (ai) {
      try {
        const formattedContents: Array<{ role: "user" | "model"; parts: Array<{ text: string }> }> = [];
        if (Array.isArray(history)) {
          for (const item of history.slice(-10)) {
            if (item && item.text && (item.role === "user" || item.role === "model")) {
              formattedContents.push({
                role: item.role,
                parts: [{ text: String(item.text) }]
              });
            }
          }
        }
        formattedContents.push({
          role: "user",
          parts: [{ text: message.trim() }]
        });

        const response = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: formattedContents,
          config: {
            systemInstruction: JAIME_SYSTEM_INSTRUCTION,
            temperature: 0.7,
          }
        });

        const reply = response.text || "";
        if (reply) {
          return res.json({
            reply,
            source: "gemini",
            success: true
          });
        }
      } catch (geminiError: any) {
        console.warn("Fallback de Gemini falló:", geminiError?.message || geminiError);
      }
    }

    // 4. Final safety net: Smart rule-based fallback
    return res.json({
      reply: generateSmartFallback(message),
      source: "fallback",
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
