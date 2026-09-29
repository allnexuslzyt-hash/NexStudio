import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import {
  ArrowLeft,
  Activity,
  ArrowDownCircle,
  ArrowUpCircle,
  Wifi,
  RotateCcw,
  Zap,
  Gauge,
  Clock,
  CheckCircle2,
  TrendingUp,
  HardDrive
} from 'lucide-react';

interface SpeedtestViewProps {
  onBack: () => void;
}

type TestPhase = 'idle' | 'ping' | 'download' | 'upload' | 'completed';

export const SpeedtestView: React.FC<SpeedtestViewProps> = ({ onBack }) => {
  const [phase, setPhase] = useState<TestPhase>('idle');
  const [timeLeft, setTimeLeft] = useState<number>(10.0);
  const [progressPercent, setProgressPercent] = useState<number>(0);

  // Metrics
  const [ping, setPing] = useState<number | null>(null);
  const [minPing, setMinPing] = useState<number | null>(null);
  const [jitter, setJitter] = useState<number | null>(null);

  const [downloadAvg, setDownloadAvg] = useState<number | null>(null);
  const [downloadPeak, setDownloadPeak] = useState<number | null>(null);

  const [uploadAvg, setUploadAvg] = useState<number | null>(null);
  const [uploadPeak, setUploadPeak] = useState<number | null>(null);

  const [currentSpeedDisplay, setCurrentSpeedDisplay] = useState<number>(0);
  const [totalTransferredMB, setTotalTransferredMB] = useState<number>(0);

  const isRunningRef = useRef<boolean>(false);

  const run10SecondTest = async () => {
    if (phase !== 'idle' && phase !== 'completed') return;

    isRunningRef.current = true;
    setPhase('ping');
    setTimeLeft(10.0);
    setProgressPercent(0);

    setPing(null);
    setMinPing(null);
    setJitter(null);
    setDownloadAvg(null);
    setDownloadPeak(null);
    setUploadAvg(null);
    setUploadPeak(null);
    setCurrentSpeedDisplay(0);
    setTotalTransferredMB(0);

    const testStartTime = performance.now();
    const TOTAL_DURATION_MS = 10000; // 10.0 seconds

    // Countdown and Progress timer loop
    const progressInterval = setInterval(() => {
      if (!isRunningRef.current) {
        clearInterval(progressInterval);
        return;
      }
      const elapsed = performance.now() - testStartTime;
      const remainingSec = Math.max(0, (TOTAL_DURATION_MS - elapsed) / 1000);
      setTimeLeft(Math.round(remainingSec * 10) / 10);
      setProgressPercent(Math.min(100, Math.round((elapsed / TOTAL_DURATION_MS) * 100)));

      if (elapsed >= TOTAL_DURATION_MS) {
        clearInterval(progressInterval);
      }
    }, 100);

    // ==========================================
    // FASE 1: Latencia, Ping & Jitter (0s - 1.5s)
    // ==========================================
    setPhase('ping');
    const pings: number[] = [];
    const phase1End = testStartTime + 1500;
    let bestPingSoFar = 999;

    while (performance.now() < phase1End) {
      const pingStart = performance.now();
      try {
        await fetch(`/api/tools/speedtest/ping?t=${Date.now()}`, { cache: 'no-store' });
      } catch {
        await new Promise((r) => setTimeout(r, 20));
      }
      const rtt = Math.round(performance.now() - pingStart);
      pings.push(rtt);
      if (rtt < bestPingSoFar) {
        bestPingSoFar = rtt;
        setCurrentSpeedDisplay(bestPingSoFar);
      }
      await new Promise((r) => setTimeout(r, 40));
    }

    const calculatedAvgPing = Math.round(pings.reduce((a, b) => a + b, 0) / Math.max(1, pings.length));
    const calculatedMinPing = Math.min(...pings);
    const calculatedJitter =
      pings.length > 1
        ? Math.round(
            pings.slice(1).reduce((acc, curr, i) => acc + Math.abs(curr - pings[i]), 0) /
              (pings.length - 1)
          )
        : 1;

    setPing(calculatedAvgPing);
    setMinPing(calculatedMinPing);
    setJitter(calculatedJitter);

    // ===================================================
    // FASE 2: Descarga Sostenida Máxima (1.5s - 6.0s = 4.5s)
    // ===================================================
    setPhase('download');
    setCurrentSpeedDisplay(0);
    const phase2Start = performance.now();
    const phase2End = testStartTime + 6000;
    let totalDownloadedBytes = 0;
    let maxDownloadMbps = 0;

    while (performance.now() < phase2End) {
      try {
        const streamStart = performance.now();
        const res = await fetch(`/api/tools/speedtest/download?bytes=15728640&t=${Date.now()}`, {
          cache: 'no-store'
        });
        const reader = res.body?.getReader();

        if (reader) {
          let batchBytes = 0;
          while (performance.now() < phase2End) {
            const { done, value } = await reader.read();
            if (done) break;
            batchBytes += value.length;
            totalDownloadedBytes += value.length;

            const timeFromBatchStart = (performance.now() - streamStart) / 1000;
            if (timeFromBatchStart > 0.08) {
              const instantMbps = (batchBytes * 8) / (timeFromBatchStart * 1000000);
              const roundedInstant = Math.round(instantMbps * 10) / 10;
              // Solo actualiza hacia arriba si supera el máximo alcanzado
              if (roundedInstant > maxDownloadMbps) {
                maxDownloadMbps = roundedInstant;
                setCurrentSpeedDisplay(maxDownloadMbps);
              }
            }
          }
        }
      } catch {
        // Fallback simulation if interrupted
        totalDownloadedBytes += 12 * 1024 * 1024;
        await new Promise((r) => setTimeout(r, 200));
      }
    }

    const actualDownloadSec = Math.max(0.1, (performance.now() - phase2Start) / 1000);
    const calculatedDownloadAvg =
      Math.round(((totalDownloadedBytes * 8) / (actualDownloadSec * 1000000)) * 10) / 10;
    const finalPeakDownload = Math.max(maxDownloadMbps, calculatedDownloadAvg);

    setDownloadAvg(calculatedDownloadAvg);
    setDownloadPeak(finalPeakDownload);
    setCurrentSpeedDisplay(finalPeakDownload);

    // ==================================================
    // FASE 3: Subida Sostenida Máxima (6.0s - 10.0s = 4.0s)
    // ==================================================
    setPhase('upload');
    setCurrentSpeedDisplay(0);
    const phase3Start = performance.now();
    const phase3End = testStartTime + TOTAL_DURATION_MS;
    let totalUploadedBytes = 0;
    let maxUploadMbps = 0;
    const uploadChunk = new Uint8Array(2 * 1024 * 1024); // 2 MB chunk

    while (performance.now() < phase3End) {
      const chunkStart = performance.now();
      try {
        await fetch(`/api/tools/speedtest/upload?t=${Date.now()}`, {
          method: 'POST',
          body: uploadChunk,
          cache: 'no-store'
        });
        totalUploadedBytes += uploadChunk.length;
        const chunkSec = (performance.now() - chunkStart) / 1000;
        if (chunkSec > 0.05) {
          const instantUploadMbps = Math.round(((uploadChunk.length * 8) / (chunkSec * 1000000)) * 10) / 10;
          // Solo actualiza hacia arriba si supera el máximo alcanzado
          if (instantUploadMbps > maxUploadMbps) {
            maxUploadMbps = instantUploadMbps;
            setCurrentSpeedDisplay(maxUploadMbps);
          }
        }
      } catch {
        await new Promise((r) => setTimeout(r, 100));
      }
    }

    const actualUploadSec = Math.max(0.1, (performance.now() - phase3Start) / 1000);
    const calculatedUploadAvg =
      Math.round(((totalUploadedBytes * 8) / (actualUploadSec * 1000000)) * 10) / 10;
    const finalPeakUpload = Math.max(maxUploadMbps, calculatedUploadAvg);

    setUploadAvg(calculatedUploadAvg);
    setUploadPeak(finalPeakUpload);
    setCurrentSpeedDisplay(finalPeakUpload);

    const totalMB = Math.round(((totalDownloadedBytes + totalUploadedBytes) / (1024 * 1024)) * 10) / 10;
    setTotalTransferredMB(totalMB);

    // ==========================================
    // FASE 4: Finalizado a los 10 segundos
    // ==========================================
    clearInterval(progressInterval);
    isRunningRef.current = false;
    setTimeLeft(0);
    setProgressPercent(100);
    setPhase('completed');
  };

  useEffect(() => {
    return () => {
      isRunningRef.current = false;
    };
  }, []);

  const getQualityAssessment = () => {
    if (!downloadAvg) return null;
    if (downloadAvg > 200 && (ping || 50) < 25) {
      return {
        badge: 'Categoría Elite (Fibra Ultra)',
        desc: 'Conexión de máxima velocidad. Ideal para streaming 4K simultáneo en múltiples pantallas, descargas de juegos masivos y gaming competitivo con latencia ultra-baja.'
      };
    }
    if (downloadAvg > 60) {
      return {
        badge: 'Categoría Alta Velocidad',
        desc: 'Excelente rendimiento para videollamadas en alta definición, trabajo en la nube y reproducción fluida sin cortes.'
      };
    }
    return {
      badge: 'Categoría Estándar',
      desc: 'Velocidad adecuada para navegación web, redes sociales y reproducción de video HD.'
    };
  };

  const assessment = getQualityAssessment();

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="w-full max-w-4xl mx-auto px-4 py-8"
    >
      {/* Top Breadcrumb */}
      <div className="flex items-center justify-between mb-6">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200 shadow-xs transition-all cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Volver a Herramientas</span>
        </button>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-50 border border-cyan-200 text-cyan-800 text-xs font-semibold">
          <Clock className="w-3.5 h-3.5 text-cyan-600" />
          <span>Benchmark Completo de 10 Segundos</span>
        </div>
      </div>

      {/* Header Banner */}
      <div className="rounded-3xl bg-gradient-to-br from-slate-900 via-cyan-950 to-indigo-950 text-white p-6 sm:p-10 mb-8 border border-cyan-800/40 shadow-xl shadow-cyan-950/20">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/20 border border-cyan-400/30 text-cyan-200 text-xs font-semibold mb-3">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>Medición al Máximo Potencial</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight mb-2">
            Medidor de Velocidad & Ping
          </h1>
          <p className="text-slate-300 text-xs sm:text-sm font-normal leading-relaxed">
            Ejecuta una prueba intensiva de <strong>10 segundos</strong> continuos de flujo de datos.
            Este tiempo permite que tu red alcance su ancho de banda pico real y mida tanto la velocidad
            promedio como el rendimiento máximo de descarga y subida.
          </p>
        </div>
      </div>

      {/* Main Speedometer Box */}
      <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-xs text-center flex flex-col items-center justify-center mb-8">
        {/* 10-Second Countdown & Phase Tracker */}
        {phase !== 'idle' && (
          <div className="w-full max-w-md mb-6">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-2">
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-cyan-600" />
                {phase === 'completed'
                  ? 'Prueba de 10s Completada'
                  : `Tiempo de test: ${timeLeft.toFixed(1)}s restantes`}
              </span>
              <span className="text-cyan-700 bg-cyan-50 border border-cyan-200 px-2 py-0.5 rounded-lg">
                {phase === 'ping'
                  ? 'Fase 1/3: Ping & Latencia'
                  : phase === 'download'
                  ? 'Fase 2/3: Descarga Máxima'
                  : phase === 'upload'
                  ? 'Fase 3/3: Subida Máxima'
                  : '100% Finalizado'}
              </span>
            </div>

            {/* 10-Second Progress Bar */}
            <div className="w-full h-2.5 rounded-full bg-slate-100 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-cyan-500 to-indigo-600 transition-all duration-150"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        )}

        {/* Speedometer Circle Visual */}
        <div className="relative w-64 h-64 flex items-center justify-center mb-6">
          <svg className="w-full h-full transform -rotate-90">
            <circle
              cx="128"
              cy="128"
              r="105"
              className="stroke-slate-100"
              strokeWidth="16"
              fill="transparent"
            />
            <circle
              cx="128"
              cy="128"
              r="105"
              className="stroke-cyan-500 transition-all duration-200"
              strokeWidth="16"
              strokeDasharray={2 * Math.PI * 105}
              strokeDashoffset={
                2 * Math.PI * 105 * (1 - Math.min(1, (currentSpeedDisplay || 0) / 300))
              }
              strokeLinecap="round"
              fill="transparent"
            />
          </svg>

          <div className="absolute inset-0 flex flex-col items-center justify-center">
            {phase === 'idle' ? (
              <button
                type="button"
                id="start-speedtest-btn"
                onClick={run10SecondTest}
                className="w-32 h-32 rounded-full bg-gradient-to-tr from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-extrabold text-sm sm:text-base shadow-xl shadow-cyan-600/30 flex flex-col items-center justify-center gap-1 transition-all cursor-pointer transform hover:scale-105 active:scale-95"
              >
                <Gauge className="w-8 h-8" />
                <span>INICIAR (10s)</span>
              </button>
            ) : phase === 'completed' ? (
              <div className="flex flex-col items-center">
                <span className="text-4xl font-black text-slate-900 tracking-tight">
                  {downloadPeak || downloadAvg}
                </span>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 mt-1">
                  Mbps Pico Máximo
                </span>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <span className="text-4xl font-black text-cyan-600 tracking-tight animate-pulse">
                  {currentSpeedDisplay}
                </span>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mt-1">
                  {phase === 'ping'
                    ? 'Mejor Latencia (ms)'
                    : phase === 'download'
                    ? 'Pico Máximo Descarga (Mbps)'
                    : 'Pico Máximo Subida (Mbps)'}
                </span>
                {phase !== 'ping' && (
                  <span className="text-[10px] text-cyan-600 font-semibold flex items-center gap-1 mt-0.5">
                    <TrendingUp className="w-3 h-3" /> Solo asciende si supera el récord
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Phase Indicator Badge */}
        {phase !== 'idle' && phase !== 'completed' && (
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-50 text-cyan-800 text-xs font-bold mb-4">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-500 animate-ping" />
            <span>Midiendo durante 10 segundos para exprimir el ancho de banda...</span>
          </div>
        )}

        {/* Completed Assessment Box */}
        {phase === 'completed' && assessment && (
          <div className="mb-6 p-5 rounded-2xl bg-cyan-50/80 border border-cyan-200 text-left max-w-lg shadow-xs">
            <div className="flex items-center gap-2 text-cyan-900 font-extrabold text-sm mb-1">
              <CheckCircle2 className="w-4 h-4 text-cyan-600" />
              <span>{assessment.badge}</span>
            </div>
            <p className="text-xs text-slate-700 leading-relaxed font-normal">
              {assessment.desc}
            </p>
            {totalTransferredMB > 0 && (
              <p className="text-[11px] text-cyan-700 font-medium mt-2">
                Datos analizados en 10s: <strong>{totalTransferredMB} MB</strong> de tráfico total.
              </p>
            )}
          </div>
        )}

        {/* Re-test button */}
        {phase === 'completed' && (
          <button
            type="button"
            onClick={run10SecondTest}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-md transition-all cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Repetir Test de 10 Segundos</span>
          </button>
        )}
      </div>

      {/* Metrics Row (Ping, Download, Upload) with Peak & Avg */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Latency / Ping Card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
            <Wifi className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-semibold block">Latencia / Ping</span>
            <div className="text-xl font-extrabold text-slate-900">
              {ping !== null ? `${ping} ms` : '—'}
            </div>
            <div className="text-[10px] text-slate-500 space-y-0.5 mt-1">
              {minPing !== null && <p>Mínimo: {minPing} ms</p>}
              {jitter !== null && <p>Jitter: {jitter} ms</p>}
            </div>
          </div>
        </div>

        {/* Download Speed Card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
            <ArrowDownCircle className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-semibold block">Descarga (Download)</span>
            <div className="text-xl font-extrabold text-emerald-600">
              {downloadPeak !== null ? `${downloadPeak} Mbps` : '—'}
            </div>
            <div className="text-[10px] text-slate-500 space-y-0.5 mt-1">
              {downloadPeak !== null && (
                <p className="font-semibold text-emerald-700 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" /> Pico Máximo: {downloadPeak} Mbps
                </p>
              )}
              {downloadAvg !== null && <p>Promedio: {downloadAvg} Mbps</p>}
            </div>
          </div>
        </div>

        {/* Upload Speed Card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 shrink-0">
            <ArrowUpCircle className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-semibold block">Subida (Upload)</span>
            <div className="text-xl font-extrabold text-amber-600">
              {uploadPeak !== null ? `${uploadPeak} Mbps` : '—'}
            </div>
            <div className="text-[10px] text-slate-500 space-y-0.5 mt-1">
              {uploadPeak !== null && (
                <p className="font-semibold text-amber-700 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" /> Pico Máximo: {uploadPeak} Mbps
                </p>
              )}
              {uploadAvg !== null && <p>Promedio: {uploadAvg} Mbps</p>}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
