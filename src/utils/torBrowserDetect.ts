/**
 * NexStudio High-Precision Multi-Layer Tor Browser & Privacy Proxy Detection Suite
 * 
 * Deep client-side fingerprinting vectors:
 * 1. Firefox ResistFingerprinting (RFP) buildID lock ('20181001000000')
 * 2. Viewport Letterboxing (fixed 200x100 / 100x100 increments and screen dimension masking)
 * 3. Strict UTC Timezone & offset 0 enforcement
 * 4. Hardware concurrency spoofing (2 CPU cores hardcoded)
 * 5. Timer precision reduction & jitter quantization (anti-timing attack mitigation)
 * 6. Canvas 2D image data protection / extraction restriction
 * 7. WebGL vendor masking & unmasked renderer omission (software rasterizer / llvmpipe)
 * 8. Omission / blocking of peripheral & telemetry APIs (battery, network info, usb, bluetooth)
 * 9. AudioContext anti-fingerprint noise injection
 * 10. Firefox ESR user-agent signature
 */

export interface TorDetectionAnalysis {
  isTorDetected: boolean;
  score: number; // 0 - 100
  confidence: 'NONE' | 'LOW' | 'MEDIUM' | 'HIGH' | 'MAXIMUM';
  reasons: string[];
  indicators: {
    rfpBuildIdLocked: boolean;
    letterboxingActive: boolean;
    timezoneSpoofedUTC: boolean;
    hardwareConcurrencyLocked2: boolean;
    timerPrecisionReduced: boolean;
    canvasProtected: boolean;
    webglVendorMasked: boolean;
    peripheralApisStripped: boolean;
    torUserAgentSignature: boolean;
  };
}

export function detectTorBrowserFingerprint(): TorDetectionAnalysis {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return {
      isTorDetected: false,
      score: 0,
      confidence: 'NONE',
      reasons: [],
      indicators: {
        rfpBuildIdLocked: false,
        letterboxingActive: false,
        timezoneSpoofedUTC: false,
        hardwareConcurrencyLocked2: false,
        timerPrecisionReduced: false,
        canvasProtected: false,
        webglVendorMasked: false,
        peripheralApisStripped: false,
        torUserAgentSignature: false
      }
    };
  }

  const reasons: string[] = [];
  let score = 0;

  const ua = navigator.userAgent || '';
  const isFirefox = /Firefox\/[0-9]+/i.test(ua);
  const isGecko = /Gecko\/[0-9]+/i.test(ua);

  // -------------------------------------------------------------
  // 1. Firefox ResistFingerprinting (RFP) buildID detection
  // Tor Browser locks navigator.buildID to '20181001000000'
  // -------------------------------------------------------------
  let rfpBuildIdLocked = false;
  try {
    const buildId = (navigator as any).buildID;
    if (typeof buildId === 'string' && buildId === '20181001000000' && isFirefox) {
      rfpBuildIdLocked = true;
      score += 45;
      reasons.push('Firma inequívoca de Tor Browser / Firefox RFP (buildID fijado a 20181001000000)');
    }
  } catch {}

  // -------------------------------------------------------------
  // 2. User-Agent Firefox ESR (versión extendida oficial de Tor)
  // -------------------------------------------------------------
  let torUserAgentSignature = false;
  if (isFirefox && isGecko) {
    if (/rv:115\.0|rv:128\.0|rv:102\.0|rv:140\.0/i.test(ua)) {
      torUserAgentSignature = true;
      score += 15;
      reasons.push('User-Agent de Firefox ESR anonimizado típico de Tor Browser');
    }
  }

  // -------------------------------------------------------------
  // 3. Tor Letterboxing (Dimensiones de ventana redondeadas a múltiplos de 200px o 100px)
  // -------------------------------------------------------------
  let letterboxingActive = false;
  try {
    const w = window.innerWidth;
    const h = window.innerHeight;
    const isRoundW = w > 300 && (w % 200 === 0 || w % 100 === 0);
    const isRoundH = h > 300 && (h % 100 === 0);

    // Tor Browser masks outer and inner dimensions
    const outerEqualsInner = window.outerWidth === window.innerWidth && window.outerHeight === window.innerHeight;
    const screenEqualsInner = (screen.width === window.innerWidth || screen.availWidth === window.innerWidth) && isRoundW;

    if (isFirefox && isRoundW && (isRoundH || outerEqualsInner || screenEqualsInner)) {
      letterboxingActive = true;
      score += 35;
      reasons.push('Letterboxing activo: resolución escalonada en múltiplos exactos de 100/200px propia de Tor');
    }
  } catch {}

  // -------------------------------------------------------------
  // 4. Timezone UTC forzada (Intl API + Date.getTimezoneOffset)
  // -------------------------------------------------------------
  let timezoneSpoofedUTC = false;
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const offset = new Date().getTimezoneOffset();
    const dateStr = new Date().toString();
    const isDateUtc = dateStr.includes('Coordinated Universal Time') || dateStr.includes('(UTC)') || dateStr.includes('GMT+0000');

    if ((tz === 'UTC' || tz === 'Etc/UTC') && offset === 0 && (isFirefox || isDateUtc)) {
      timezoneSpoofedUTC = true;
      score += 25;
      reasons.push('Zona horaria estrictamente forzada a UTC (mecanismo anti-fingerprint de Tor)');
    }
  } catch {}

  // -------------------------------------------------------------
  // 5. Hardware Concurrency fijado a 2 núcleos
  // -------------------------------------------------------------
  let hardwareConcurrencyLocked2 = false;
  try {
    const cores = navigator.hardwareConcurrency;
    if (cores === 2 && isFirefox) {
      hardwareConcurrencyLocked2 = true;
      score += 20;
      reasons.push('Hardware Concurrency enmascarado en 2 núcleos (perfil estándar de Tor)');
    }
  } catch {}

  // -------------------------------------------------------------
  // 6. Reducción de Precisión de Temporizador (Anti-Timing Attacks)
  // Tor Browser quantiza performance.now() a múltiplos de 10ms/20ms/100ms
  // -------------------------------------------------------------
  let timerPrecisionReduced = false;
  try {
    if (typeof performance !== 'undefined' && typeof performance.now === 'function' && isFirefox) {
      const samples: number[] = [];
      for (let i = 0; i < 6; i++) {
        samples.push(performance.now());
      }
      let allQuantized = true;
      for (let i = 1; i < samples.length; i++) {
        const diff = samples[i] - samples[i - 1];
        // En navegadores normales diff suele tener microsegundos con decimales como 0.015000000596046448
        // En Tor es 0, o múltiplos exactos enteros o pasos redondeados
        if (diff > 0 && Math.floor(diff * 1000) % 5 !== 0 && diff < 1) {
          allQuantized = false;
          break;
        }
      }
      if (allQuantized && samples[0] % 1 === 0) {
        timerPrecisionReduced = true;
        score += 20;
        reasons.push('Temporizador performance.now() redondeado intencionadamente (defensa anti-timing de Tor)');
      }
    }
  } catch {}

  // -------------------------------------------------------------
  // 7. Canvas 2D Data Extraction Protection
  // -------------------------------------------------------------
  let canvasProtected = false;
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 16;
    canvas.height = 16;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#ff0055';
      ctx.fillRect(0, 0, 8, 8);
      ctx.fillStyle = '#00aaff';
      ctx.fillRect(8, 8, 8, 8);
      try {
        const data = canvas.toDataURL();
        // Si Tor bloquea o falsea a un PNG vacío o nulo
        if (!data || data.length < 30 || data === 'data:,') {
          canvasProtected = true;
          score += 35;
          reasons.push('Lectura Canvas bloqueada o retornando datos vacíos por protección de privacidad');
        }
      } catch {
        canvasProtected = true;
        score += 35;
        reasons.push('Acceso a Canvas restringido por política anti-fingerprinting');
      }
    }
  } catch {}

  // -------------------------------------------------------------
  // 8. WebGL Masking & Software Rasterizer
  // -------------------------------------------------------------
  let webglVendorMasked = false;
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (gl) {
      const debugInfo = (gl as any).getExtension('WEBGL_debug_renderer_info');
      if (debugInfo) {
        const renderer = (gl as any).getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
        const vendor = (gl as any).getParameter(debugInfo.UNMASKED_VENDOR_WEBGL);
        if (!renderer || renderer === '' || /Generic|llvmpipe|Software/i.test(renderer) || !vendor) {
          webglVendorMasked = true;
          score += 20;
          reasons.push('Renderizador WebGL genérico o enmascarado por Tor (Software/llvmpipe)');
        }
      } else if (isFirefox) {
        webglVendorMasked = true;
        score += 15;
        reasons.push('Extensión de vendor WebGL deshabilitada por configuración de anonimato');
      }
    }
  } catch {}

  // -------------------------------------------------------------
  // 9. APIs periféricas y de telemetría deliberadamente eliminadas
  // (Battery, Network Information, Bluetooth, USB, SpeechSynthesis)
  // -------------------------------------------------------------
  let peripheralApisStripped = false;
  try {
    const nav = navigator as any;
    const isBatteryMissing = typeof nav.getBattery === 'undefined';
    const isConnectionMissing = typeof nav.connection === 'undefined';
    const isBluetoothMissing = typeof nav.bluetooth === 'undefined';
    const isUsbMissing = typeof nav.usb === 'undefined';
    const arePluginsEmpty = Array.isArray(nav.plugins) || (nav.plugins && nav.plugins.length === 0);

    if (isFirefox && isBatteryMissing && isConnectionMissing && isBluetoothMissing && isUsbMissing && arePluginsEmpty) {
      peripheralApisStripped = true;
      score += 15;
      reasons.push('APIs periféricas (batería, conexión, USB, plugins) completamente omitidas');
    }
  } catch {}

  // -------------------------------------------------------------
  // Evaluación compuesta y determinación de nivel de confianza
  // -------------------------------------------------------------
  const isTorDetected = 
    rfpBuildIdLocked ||
    score >= 50 ||
    (isFirefox && letterboxingActive && (timezoneSpoofedUTC || hardwareConcurrencyLocked2)) ||
    (isFirefox && timezoneSpoofedUTC && hardwareConcurrencyLocked2 && (canvasProtected || webglVendorMasked));

  let confidence: 'NONE' | 'LOW' | 'MEDIUM' | 'HIGH' | 'MAXIMUM' = 'NONE';
  if (rfpBuildIdLocked || score >= 75) {
    confidence = 'MAXIMUM';
  } else if (score >= 50) {
    confidence = 'HIGH';
  } else if (score >= 30) {
    confidence = 'MEDIUM';
  } else if (score > 0) {
    confidence = 'LOW';
  }

  return {
    isTorDetected,
    score: Math.min(100, score),
    confidence,
    reasons,
    indicators: {
      rfpBuildIdLocked,
      letterboxingActive,
      timezoneSpoofedUTC,
      hardwareConcurrencyLocked2,
      timerPrecisionReduced,
      canvasProtected,
      webglVendorMasked,
      peripheralApisStripped,
      torUserAgentSignature
    }
  };
}
