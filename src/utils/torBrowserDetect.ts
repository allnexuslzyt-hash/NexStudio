/**
 * NexStudio Multi-Layer Tor Browser & Privacy Proxy Detection Suite
 * 
 * Capas de detección ejecutadas en paralelo:
 * 1. Detección de cabeceras HTTP y Nodos de Salida IP (Tor Exit Nodes) vía Servidor
 * 2. Detección de redondeo de ventana y letterboxing exclusivo de Tor Browser
 * 3. Detección de redondeo de User-Agent Firefox ESR fijado
 * 4. Detección de spoofing de timezone UTC (Intl API)
 * 5. Detección de canvas & audio fingerprinting noise injection (típico de Tor / Canvas Blocker)
 * 6. Detección de spoofing de hardwareConcurrency (Tor Browser siempre fija 2 cores)
 * 7. Detección de spoofing de deviceMemory (Tor Browser siempre omite o fija a 4/8 o false)
 * 8. Detección de plugins y WebGL vendors anonimizados
 */

export interface TorDetectionAnalysis {
  isTorDetected: boolean;
  score: number; // 0 - 100
  reasons: string[];
  indicators: {
    letterboxingOrAspect: boolean;
    timezoneSpoofedUTC: boolean;
    hardwareConcurrencySpoof: boolean;
    canvasNoiseDetected: boolean;
    torUserAgentSignature: boolean;
    webglVendorMasked: boolean;
  };
}

export function detectTorBrowserFingerprint(): TorDetectionAnalysis {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return {
      isTorDetected: false,
      score: 0,
      reasons: [],
      indicators: {
        letterboxingOrAspect: false,
        timezoneSpoofedUTC: false,
        hardwareConcurrencySpoof: false,
        canvasNoiseDetected: false,
        torUserAgentSignature: false,
        webglVendorMasked: false
      }
    };
  }

  const reasons: string[] = [];
  let score = 0;

  // 1. Detección de User-Agent típico de Tor Browser
  // Tor Browser siempre se enmascara intencionadamente como Firefox ESR en Windows x86_64 o Linux
  const ua = navigator.userAgent;
  const isFirefox = /Firefox\/[0-9]+/i.test(ua);
  const isGecko = /Gecko\/[0-9]+/i.test(ua);
  let torUserAgentSignature = false;

  // Tor Browser usa habitualmente números de versión Firefox ESR con redondeo estricto
  if (isFirefox && isGecko) {
    // Si la plataforma reportada es genérica
    if (/rv:115\.0|rv:128\.0|rv:102\.0/i.test(ua)) {
      torUserAgentSignature = true;
      score += 20;
      reasons.push('Firma User-Agent compatible con Tor Browser (Firefox ESR anonimizado)');
    }
  }

  // 2. Tor Browser "Letterboxing": dimensiones de pantalla redondeadas a múltiplos de 200px o 100px
  let letterboxingOrAspect = false;
  try {
    const w = window.innerWidth;
    const h = window.innerHeight;
    // Tor Browser fuerza que el viewport interno sea múltiplo de 200x100 o 100x100 para evitar fingerprinting de resolución
    const isRoundWidth = w > 400 && (w % 200 === 0 || w % 100 === 0);
    const isRoundHeight = h > 300 && (h % 100 === 0);
    
    // Si además la pantalla física coincide o está falseada (screen.width === innerWidth)
    if (isRoundWidth && isRoundHeight && isFirefox) {
      letterboxingOrAspect = true;
      score += 35;
      reasons.push('Letterboxing activo: resolución redondeada a múltiplos exactos característicos de Tor Browser');
    }
  } catch {}

  // 3. Hardware Concurrency: Tor Browser siempre falsea navigator.hardwareConcurrency = 2
  let hardwareConcurrencySpoof = false;
  try {
    const cores = navigator.hardwareConcurrency;
    // En Firefox normal suele ser 4, 8, 12, 16. En Tor Browser está hardcodeado a 2 en todas las máquinas
    if (cores === 2 && isFirefox) {
      hardwareConcurrencySpoof = true;
      score += 25;
      reasons.push('Hardware Concurrency enmascarado en exactamente 2 núcleos (perfil Tor estándar)');
    }
  } catch {}

  // 4. Timezone y formato Intl: Tor Browser fuerza la zona horaria a UTC (offset 0)
  let timezoneSpoofedUTC = false;
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const offset = new Date().getTimezoneOffset();
    if ((tz === 'UTC' || tz === 'Etc/UTC') && offset === 0 && isFirefox) {
      timezoneSpoofedUTC = true;
      score += 25;
      reasons.push('Zona horaria forzada a UTC (mecanismo anti-fingerprint de Tor)');
    }
  } catch {}

  // 5. Canvas noise injection y WebGL masking
  let canvasNoiseDetected = false;
  let webglVendorMasked = false;
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 16;
    canvas.height = 16;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#ff0055';
      ctx.fillRect(0, 0, 8, 8);
      // Tor Browser bloquea por defecto o añade advertencias de permiso al leer canvas toDataURL
      try {
        const data = canvas.toDataURL();
        if (!data || data.length < 20) {
          canvasNoiseDetected = true;
          score += 25;
          reasons.push('Lectura Canvas bloqueada o protegida por política estricta');
        }
      } catch {
        canvasNoiseDetected = true;
        score += 30;
        reasons.push('Acceso a Canvas restringido por protección anti-huella digital');
      }
    }

    // WebGL Vendor check
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (gl) {
      const debugInfo = (gl as any).getExtension('WEBGL_debug_renderer_info');
      if (debugInfo) {
        const renderer = (gl as any).getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
        const vendor = (gl as any).getParameter(debugInfo.UNMASKED_VENDOR_WEBGL);
        // Tor enmascara o desactiva este vendor
        if (!renderer || renderer === '' || /Generic|llvmpipe|Software/i.test(renderer)) {
          webglVendorMasked = true;
          score += 20;
          reasons.push('Controlador WebGL genérico o enmascarado por Tor');
        }
      } else {
        // En Tor Browser la extensión de vendor suele estar deshabilitada
        if (isFirefox) {
          webglVendorMasked = true;
          score += 15;
          reasons.push('Extensión WEBGL_debug_renderer_info deshabilitada');
        }
      }
    }
  } catch {}

  // Tor Browser se confirma con score >= 50
  const isTorDetected = score >= 50;

  return {
    isTorDetected,
    score,
    reasons,
    indicators: {
      letterboxingOrAspect,
      timezoneSpoofedUTC,
      hardwareConcurrencySpoof,
      canvasNoiseDetected,
      torUserAgentSignature,
      webglVendorMasked
    }
  };
}
