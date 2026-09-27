/**
 * NexStudio Multi-Barrier Strict Perimeter & Tor Detection Engine
 * Built from scratch for strict multi-vector enforcement.
 * 
 * Five Independent Barriers evaluated concurrently:
 * - BARRIER 1 (Engine Core): Firefox ResistFingerprinting (RFP) buildID lock ('20181001000000') & ESR User-Agent
 * - BARRIER 2 (Geometry & Letterboxing): Viewport quantization to 100px/200px steps & window dimension masking
 * - BARRIER 3 (Clock & Concurrency): Strict UTC timezone lock + 0 offset & hardcoded 2 CPU cores
 * - BARRIER 4 (Graphics & Context): Canvas 2D extraction protection & WebGL driver masking (llvmpipe/Software)
 * - BARRIER 5 (Timing & Perimeter APIs): Quantized performance.now() timer precision & stripped modern hardware APIs
 */

export interface TorBarrierBreakdown {
  barrier1_engineCore: boolean;
  barrier2_geometryLetterboxing: boolean;
  barrier3_clockAndConcurrency: boolean;
  barrier4_graphicsProtection: boolean;
  barrier5_timingAndStrippedApis: boolean;
}

export interface StrictTorAnalysis {
  isTorDetected: boolean;
  activeBarriersCount: number;
  confidence: 'MAXIMUM' | 'HIGH' | 'MEDIUM' | 'LOW' | 'NONE';
  score: number; // 0 - 100
  reasons: string[];
  barriers: TorBarrierBreakdown;
}

export function detectTorBrowserFingerprint(): StrictTorAnalysis {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return {
      isTorDetected: false,
      activeBarriersCount: 0,
      confidence: 'NONE',
      score: 0,
      reasons: [],
      barriers: {
        barrier1_engineCore: false,
        barrier2_geometryLetterboxing: false,
        barrier3_clockAndConcurrency: false,
        barrier4_graphicsProtection: false,
        barrier5_timingAndStrippedApis: false
      }
    };
  }

  const reasons: string[] = [];
  let score = 0;

  const ua = navigator.userAgent || '';
  const isFirefox = /Firefox\/[0-9]+/i.test(ua);
  const isGecko = /Gecko\/[0-9]+/i.test(ua);

  // -------------------------------------------------------------------------
  // BARRIER 1: Engine Core (Firefox RFP buildID lock & ESR identification)
  // -------------------------------------------------------------------------
  let barrier1_engineCore = false;
  try {
    const buildId = (navigator as any).buildID;
    const isLockedBuildId = typeof buildId === 'string' && buildId === '20181001000000';
    const isEsrUa = isFirefox && isGecko && /rv:115\.0|rv:128\.0|rv:102\.0|rv:140\.0/i.test(ua);

    if (isLockedBuildId && isFirefox) {
      barrier1_engineCore = true;
      score += 45;
      reasons.push('Barrera 1 Activa: Firma RFP del motor Tor identificada (buildID=20181001000000)');
    } else if (isEsrUa) {
      score += 15;
      reasons.push('Firma User-Agent ESR típica de Tor Browser');
    }
  } catch {}

  // -------------------------------------------------------------------------
  // BARRIER 2: Geometry & Letterboxing
  // Tor Browser enforces strict window stepping (multiples of 100/200px)
  // -------------------------------------------------------------------------
  let barrier2_geometryLetterboxing = false;
  try {
    const w = window.innerWidth;
    const h = window.innerHeight;
    const isWidthQuantized = w > 300 && (w % 200 === 0 || w % 100 === 0);
    const isHeightQuantized = h > 300 && (h % 100 === 0);

    const isOuterMasked = window.outerWidth === window.innerWidth && window.outerHeight === window.innerHeight;
    const isScreenMasked = (screen.width === window.innerWidth || screen.availWidth === window.innerWidth) && isWidthQuantized;

    if (isFirefox && isWidthQuantized && (isHeightQuantized || isOuterMasked || isScreenMasked)) {
      barrier2_geometryLetterboxing = true;
      score += 35;
      reasons.push('Barrera 2 Activa: Letterboxing obligatorio y resolución escalonada de Tor');
    }
  } catch {}

  // -------------------------------------------------------------------------
  // BARRIER 3: Clock & Concurrency Spoofing
  // Tor Browser forces UTC timezone + offset 0, and hardcodes 2 CPU cores
  // -------------------------------------------------------------------------
  let barrier3_clockAndConcurrency = false;
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const offset = new Date().getTimezoneOffset();
    const isUtcForced = (tz === 'UTC' || tz === 'Etc/UTC') && offset === 0;

    const cores = navigator.hardwareConcurrency;
    const isTwoCores = cores === 2;

    if (isFirefox && isUtcForced && isTwoCores) {
      barrier3_clockAndConcurrency = true;
      score += 30;
      reasons.push('Barrera 3 Activa: Enmascaramiento de reloj (UTC/offset 0) y hardwareConcurrency fijado a 2 cores');
    } else if (isFirefox && isUtcForced) {
      score += 20;
      reasons.push('Reloj forzado a zona horaria UTC estricta');
    }
  } catch {}

  // -------------------------------------------------------------------------
  // BARRIER 4: Graphics & Canvas/WebGL Protection
  // Tor Browser blocks or poisons canvas toDataURL and masks WebGL renderer
  // -------------------------------------------------------------------------
  let barrier4_graphicsProtection = false;
  try {
    let canvasBlocked = false;
    let webglMasked = false;

    // Canvas read test
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
        if (!data || data.length < 30 || data === 'data:,' || data.includes('AAAAAA')) {
          canvasBlocked = true;
        }
      } catch {
        canvasBlocked = true;
      }
    }

    // WebGL vendor test
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (gl) {
      const debugInfo = (gl as any).getExtension('WEBGL_debug_renderer_info');
      if (debugInfo) {
        const renderer = (gl as any).getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
        const vendor = (gl as any).getParameter(debugInfo.UNMASKED_VENDOR_WEBGL);
        if (!renderer || renderer === '' || /Generic|llvmpipe|Software/i.test(renderer) || !vendor) {
          webglMasked = true;
        }
      } else if (isFirefox) {
        webglMasked = true;
      }
    }

    if (isFirefox && (canvasBlocked || webglMasked)) {
      barrier4_graphicsProtection = true;
      score += 25;
      reasons.push('Barrera 4 Activa: Protección estricta de Canvas/WebGL (bloqueo de lectura o driver llvmpipe)');
    }
  } catch {}

  // -------------------------------------------------------------------------
  // BARRIER 5: Timing & Perimeter APIs Stripped
  // Tor Browser quantizes performance.now() and removes battery/network/usb APIs
  // -------------------------------------------------------------------------
  let barrier5_timingAndStrippedApis = false;
  try {
    const nav = navigator as any;
    const isBatteryMissing = typeof nav.getBattery === 'undefined';
    const isConnectionMissing = typeof nav.connection === 'undefined';
    const isUsbMissing = typeof nav.usb === 'undefined';
    const arePluginsEmpty = Array.isArray(nav.plugins) || (nav.plugins && nav.plugins.length === 0);

    let isTimerQuantized = false;
    if (typeof performance !== 'undefined' && typeof performance.now === 'function' && isFirefox) {
      const samples: number[] = [];
      for (let i = 0; i < 6; i++) {
        samples.push(performance.now());
      }
      let allQuantized = true;
      for (let i = 1; i < samples.length; i++) {
        const diff = samples[i] - samples[i - 1];
        if (diff > 0 && Math.floor(diff * 1000) % 5 !== 0 && diff < 1) {
          allQuantized = false;
          break;
        }
      }
      if (allQuantized && samples[0] % 1 === 0) {
        isTimerQuantized = true;
      }
    }

    if (isFirefox && (isBatteryMissing && isConnectionMissing && isUsbMissing && arePluginsEmpty) && isTimerQuantized) {
      barrier5_timingAndStrippedApis = true;
      score += 20;
      reasons.push('Barrera 5 Activa: Temporizador performance.now() quantizado y APIs de hardware omitidas');
    }
  } catch {}

  // -------------------------------------------------------------------------
  // Strict Multi-Barrier Decision Matrix:
  // Requires RFP Engine Core match OR at least 2 independent barriers triggered!
  // -------------------------------------------------------------------------
  const barriers: TorBarrierBreakdown = {
    barrier1_engineCore,
    barrier2_geometryLetterboxing,
    barrier3_clockAndConcurrency,
    barrier4_graphicsProtection,
    barrier5_timingAndStrippedApis
  };

  const activeBarriersCount = Object.values(barriers).filter(Boolean).length;

  const isTorDetected = 
    barrier1_engineCore ||
    activeBarriersCount >= 2 ||
    score >= 45;

  let confidence: 'MAXIMUM' | 'HIGH' | 'MEDIUM' | 'LOW' | 'NONE' = 'NONE';
  if (barrier1_engineCore || activeBarriersCount >= 3 || score >= 75) {
    confidence = 'MAXIMUM';
  } else if (activeBarriersCount >= 2 || score >= 50) {
    confidence = 'HIGH';
  } else if (score >= 30) {
    confidence = 'MEDIUM';
  } else if (score > 0) {
    confidence = 'LOW';
  }

  return {
    isTorDetected,
    activeBarriersCount,
    confidence,
    score: Math.min(100, score),
    reasons,
    barriers
  };
}
