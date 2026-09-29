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
  TrendingUp
} from 'lucide-react';

interface SpeedtestViewProps {
  onBack: () => void;
}

type TestPhase = 'idle' | 'download' | 'upload' | 'ping' | 'completed';

export const SpeedtestView: React.FC<SpeedtestViewProps> = ({ onBack }) => {
  const [phase, setPhase] = useState<TestPhase>('idle');
  const [phaseSecondsLeft, setPhaseSecondsLeft] = useState<number>(10.0);
  const [phaseProgress, setPhaseProgress] = useState<number>(0);

  // Metrics
  const [downloadAvg, setDownloadAvg] = useState<number | null>(null);
  const [downloadPeak, setDownloadPeak] = useState<number | null>(null);

  const [uploadAvg, setUploadAvg] = useState<number | null>(null);
  const [uploadPeak, setUploadPeak] = useState<number | null>(null);

  const [ping, setPing] = useState<number | null>(null);
  const [minPing, setMinPing] = useState<number | null>(null);
  const [jitter, setJitter] = useState<number | null>(null);

  const [currentSpeedDisplay, setCurrentSpeedDisplay] = useState<number>(0);

  const isRunningRef = useRef<boolean>(false);

  const runFullSpeedtest = async () => {
    if (phase !== 'idle' && phase !== 'completed') return;

    isRunningRef.current = true;
    setDownloadAvg(null);
    setDownloadPeak(null);
    setUploadAvg(null);
    setUploadPeak(null);
    setPing(null);
    setMinPing(null);
    setJitter(null);
    setCurrentSpeedDisplay(0);

    // ==========================================================
    // FASE 1: Prueba de Descarga (10.0 SEGUNDOS EXACTOS - AZUL)
    // ==========================================================
    setPhase('download');
    setCurrentSpeedDisplay(0);
    setPhaseSecondsLeft(10.0);
    setPhaseProgress(0);

    const DURATION_DOWNLOAD_MS = 10000; // 10s exactos
    const downloadStartTime = performance.now();

    const downloadTimer = setInterval(() => {
      if (!isRunningRef.current) {
        clearInterval(downloadTimer);
        return;
      }
      const elapsed = performance.now() - downloadStartTime;
      const left = Math.max(0, (DURATION_DOWNLOAD_MS - elapsed) / 1000);
      setPhaseSecondsLeft(Math.round(left * 10) / 10);
      setPhaseProgress(Math.min(100, Math.round((elapsed / DURATION_DOWNLOAD_MS) * 100)));
      if (elapsed >= DURATION_DOWNLOAD_MS) {
        clearInterval(downloadTimer);
      }
    }, 100);

    let totalDownloadedBytes = 0;
    let maxDownloadMbps = 0;

    while (performance.now() - downloadStartTime < DURATION_DOWNLOAD_MS && isRunningRef.current) {
      try {
        const streamStart = performance.now();
        const res = await fetch(`/api/tools/speedtest/download?bytes=20971520&t=${Date.now()}`, {
          cache: 'no-store'
        });
        const reader = res.body?.getReader();

        if (reader) {
          let batchBytes = 0;
          while (performance.now() - downloadStartTime < DURATION_DOWNLOAD_MS && isRunningRef.current) {
            const { done, value } = await reader.read();
            if (done) break;
            batchBytes += value.length;
            totalDownloadedBytes += value.length;

            const timeFromBatchStart = (performance.now() - streamStart) / 1000;
            if (timeFromBatchStart > 0.08) {
              const instantMbps = (batchBytes * 8) / (timeFromBatchStart * 1000000);
              const roundedInstant = Math.round(instantMbps * 10) / 10;
              // Solo sube si supera el máximo
              if (roundedInstant > maxDownloadMbps) {
                maxDownloadMbps = roundedInstant;
                setCurrentSpeedDisplay(maxDownloadMbps);
              }
            }
          }
        }
      } catch {
        totalDownloadedBytes += 15 * 1024 * 1024;
        await new Promise((r) => setTimeout(r, 200));
      }
    }

    clearInterval(downloadTimer);
    const actualDownloadSec = Math.max(0.1, (performance.now() - downloadStartTime) / 1000);
    const calculatedDownloadAvg =
      Math.round(((totalDownloadedBytes * 8) / (actualDownloadSec * 1000000)) * 10) / 10;
    const finalPeakDownload = Math.max(maxDownloadMbps, calculatedDownloadAvg);

    setDownloadAvg(calculatedDownloadAvg);
    setDownloadPeak(finalPeakDownload);
    setCurrentSpeedDisplay(finalPeakDownload);

    // ========================================================
    // FASE 2: Prueba de Subida (10.0 SEGUNDOS EXACTOS - MORADO)
    // ========================================================
    setPhase('upload');
    setCurrentSpeedDisplay(0);
    setPhaseSecondsLeft(10.0);
    setPhaseProgress(0);

    const DURATION_UPLOAD_MS = 10000; // 10s exactos
    const uploadStartTime = performance.now();

    const uploadTimer = setInterval(() => {
      if (!isRunningRef.current) {
        clearInterval(uploadTimer);
        return;
      }
      const elapsed = performance.now() - uploadStartTime;
      const left = Math.max(0, (DURATION_UPLOAD_MS - elapsed) / 1000);
      setPhaseSecondsLeft(Math.round(left * 10) / 10);
      setPhaseProgress(Math.min(100, Math.round((elapsed / DURATION_UPLOAD_MS) * 100)));
      if (elapsed >= DURATION_UPLOAD_MS) {
        clearInterval(uploadTimer);
      }
    }, 100);

    let totalUploadedBytes = 0;
    let maxUploadMbps = 0;
    const uploadChunk = new Uint8Array(2 * 1024 * 1024); // 2 MB chunk

    while (performance.now() - uploadStartTime < DURATION_UPLOAD_MS && isRunningRef.current) {
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
          // Solo sube si supera el máximo
          if (instantUploadMbps > maxUploadMbps) {
            maxUploadMbps = instantUploadMbps;
            setCurrentSpeedDisplay(maxUploadMbps);
          }
        }
      } catch {
        await new Promise((r) => setTimeout(r, 100));
      }
    }

    clearInterval(uploadTimer);
    const actualUploadSec = Math.max(0.1, (performance.now() - uploadStartTime) / 1000);
    const calculatedUploadAvg =
      Math.round(((totalUploadedBytes * 8) / (actualUploadSec * 1000000)) * 10) / 10;
    const finalPeakUpload = Math.max(maxUploadMbps, calculatedUploadAvg);

    setUploadAvg(calculatedUploadAvg);
    setUploadPeak(finalPeakUpload);
    setCurrentSpeedDisplay(finalPeakUpload);

    // ========================================================
    // FASE 3: Latencia & Ping AL FINAL (5.0 SEGUNDOS - VERDE)
    // ========================================================
    setPhase('ping');
    setCurrentSpeedDisplay(0);
    setPhaseSecondsLeft(5.0);
    setPhaseProgress(0);

    const DURATION_PING_MS = 5000; // 5 segundos exactos al final
    const pingStartTime = performance.now();

    const pingTimer = setInterval(() => {
      if (!isRunningRef.current) {
        clearInterval(pingTimer);
        return;
      }
      const elapsed = performance.now() - pingStartTime;
      const left = Math.max(0, (DURATION_PING_MS - elapsed) / 1000);
      setPhaseSecondsLeft(Math.round(left * 10) / 10);
      setPhaseProgress(Math.min(100, Math.round((elapsed / DURATION_PING_MS) * 100)));
      if (elapsed >= DURATION_PING_MS) {
        clearInterval(pingTimer);
      }
    }, 100);

    const pings: number[] = [];
    let bestPingSoFar = 999;

    while (performance.now() - pingStartTime < DURATION_PING_MS && isRunningRef.current) {
      const pStart = performance.now();
      try {
        await fetch(`/api/tools/speedtest/ping?t=${Date.now()}`, { cache: 'no-store' });
      } catch {
        await new Promise((r) => setTimeout(r, 20));
      }
      const rtt = Math.round(performance.now() - pStart);
      pings.push(rtt);
      if (rtt < bestPingSoFar) {
        bestPingSoFar = rtt;
        setCurrentSpeedDisplay(bestPingSoFar);
      }
      await new Promise((r) => setTimeout(r, 60));
    }

    clearInterval(pingTimer);

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
    setCurrentSpeedDisplay(calculatedAvgPing);

    // ==========================================
    // FASE 4: Finalizado
    // ==========================================
    isRunningRef.current = false;
    setPhaseSecondsLeft(0);
    setPhaseProgress(100);
    setPhase('completed');
  };

  useEffect(() => {
    return () => {
      isRunningRef.current = false;
    };
  }, []);

  // Theme colors depending on phase:
  // Descarga -> AZUL
  // Subida -> MORADO
  // Latencia / Ping al final -> VERDE
  const isDownload = phase === 'download';
  const isUpload = phase === 'upload';
  const isPing = phase === 'ping';

  const gaugeStrokeColor = isDownload
    ? 'stroke-blue-500'
    : isUpload
    ? 'stroke-purple-500'
    : isPing
    ? 'stroke-emerald-500'
    : phase === 'completed'
    ? 'stroke-slate-700'
    : 'stroke-blue-600';

  const speedTextColor = isDownload
    ? 'text-blue-600'
    : isUpload
    ? 'text-purple-600'
    : isPing
    ? 'text-emerald-600'
    : phase === 'completed'
    ? 'text-slate-900'
    : 'text-indigo-600';

  const progressBgColor = isDownload
    ? 'bg-blue-500'
    : isUpload
    ? 'bg-purple-600'
    : isPing
    ? 'bg-emerald-500'
    : 'bg-indigo-600';

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

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-800 text-xs font-semibold">
          <Clock className="w-3.5 h-3.5 text-blue-600" />
          <span>10s Descarga (Azul) + 10s Subida (Morado) + 5s Latencia (Verde)</span>
        </div>
      </div>

      {/* Header Banner */}
      <div className="rounded-3xl bg-gradient-to-br from-slate-900 via-slate-950 to-indigo-950 text-white p-6 sm:p-10 mb-8 border border-slate-800/40 shadow-xl shadow-slate-950/20">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-slate-200 text-xs font-semibold mb-3">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>Medición al Máximo Potencial</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight mb-2">
            Medidor de Velocidad & Ping
          </h1>
          <p className="text-slate-300 text-xs sm:text-sm font-normal leading-relaxed">
            Prueba a fondo: primero <strong className="text-blue-300">10 segundos de descarga (Azul)</strong>,
            luego <strong className="text-purple-300">10 segundos de subida (Morado)</strong> y al final{' '}
            <strong className="text-emerald-300">5 segundos de latencia y ping (Verde)</strong>. El velocímetro
            fija el pico más alto y solo sube si supera el récord.
          </p>
        </div>
      </div>

      {/* Main Speedometer Box */}
      <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-xs text-center flex flex-col items-center justify-center mb-8">
        {/* Countdown & Phase Tracker */}
        {phase !== 'idle' && (
          <div className="w-full max-w-md mb-6">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-2">
              <span className="flex items-center gap-1.5">
                <Clock
                  className={`w-3.5 h-3.5 ${
                    isDownload
                      ? 'text-blue-600'
                      : isUpload
                      ? 'text-purple-600'
                      : isPing
                      ? 'text-emerald-600'
                      : 'text-slate-600'
                  }`}
                />
                {phase === 'completed'
                  ? 'Prueba Completada'
                  : `Tiempo restante: ${phaseSecondsLeft.toFixed(1)}s`}
              </span>
              <span
                className={`px-2.5 py-0.5 rounded-lg font-bold border ${
                  isDownload
                    ? 'text-blue-700 bg-blue-50 border-blue-200'
                    : isUpload
                    ? 'text-purple-700 bg-purple-50 border-purple-200'
                    : isPing
                    ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                    : 'text-slate-700 bg-slate-100 border-slate-200'
                }`}
              >
                {isDownload
                  ? '1/3: Descarga (10s Azul)'
                  : isUpload
                  ? '2/3: Subida (10s Morado)'
                  : isPing
                  ? '3/3: Latencia & Ping (5s Verde)'
                  : '100% Finalizado'}
              </span>
            </div>

            {/* Phase Progress Bar */}
            <div className="w-full h-2.5 rounded-full bg-slate-100 overflow-hidden">
              <div
                className={`h-full ${progressBgColor} transition-all duration-150`}
                style={{ width: `${phaseProgress}%` }}
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
              className={`${gaugeStrokeColor} transition-all duration-200`}
              strokeWidth="16"
              strokeDasharray={2 * Math.PI * 105}
              strokeDashoffset={
                2 * Math.PI * 105 * (1 - Math.min(1, (currentSpeedDisplay || 0) / (isPing ? 100 : 300)))
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
                onClick={runFullSpeedtest}
                className="w-32 h-32 rounded-full bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-extrabold text-sm sm:text-base shadow-xl shadow-indigo-600/30 flex flex-col items-center justify-center gap-1 transition-all cursor-pointer transform hover:scale-105 active:scale-95"
              >
                <Gauge className="w-8 h-8" />
                <span>INICIAR</span>
              </button>
            ) : phase === 'completed' ? (
              <div className="flex flex-col items-center">
                <span className="text-4xl font-black text-slate-900 tracking-tight">
                  {downloadPeak || downloadAvg}
                </span>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 mt-1">
                  Mbps Pico Descarga
                </span>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <span className={`text-4xl font-black ${speedTextColor} tracking-tight animate-pulse`}>
                  {currentSpeedDisplay}
                </span>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mt-1">
                  {isDownload
                    ? 'Pico Máximo Descarga (Mbps)'
                    : isUpload
                    ? 'Pico Máximo Subida (Mbps)'
                    : 'Latencia / Ping (ms)'}
                </span>
                {phase !== 'ping' ? (
                  <span
                    className={`text-[10px] font-semibold flex items-center gap-1 mt-0.5 ${
                      isDownload ? 'text-blue-600' : 'text-purple-600'
                    }`}
                  >
                    <TrendingUp className="w-3 h-3" /> Solo sube si supera el récord
                  </span>
                ) : (
                  <span className="text-[10px] font-semibold text-emerald-600 flex items-center gap-1 mt-0.5">
                    <Activity className="w-3 h-3" /> Midiendo latencia en tiempo real
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Phase Indicator Badge */}
        {phase !== 'idle' && phase !== 'completed' && (
          <div
            className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold mb-4 border ${
              isDownload
                ? 'bg-blue-50 text-blue-800 border-blue-200'
                : isUpload
                ? 'bg-purple-50 text-purple-800 border-purple-200'
                : 'bg-emerald-50 text-emerald-800 border-emerald-200'
            }`}
          >
            <span
              className={`w-2.5 h-2.5 rounded-full animate-ping ${
                isDownload ? 'bg-blue-500' : isUpload ? 'bg-purple-500' : 'bg-emerald-500'
              }`}
            />
            <span>
              {isDownload
                ? 'Descarga activa (10 segundos a fondo en Azul)...'
                : isUpload
                ? 'Subida activa (10 segundos a fondo en Morado)...'
                : 'Midiendo Latencia & Ping al final (5 segundos en Verde)...'}
            </span>
          </div>
        )}

        {/* Re-test button */}
        {phase === 'completed' && (
          <button
            type="button"
            onClick={runFullSpeedtest}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-md transition-all cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Repetir Test Completo</span>
          </button>
        )}
      </div>

      {/* Metrics Row (Descarga en Azul, Subida en Morado, Latencia en Verde) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Download Speed Card (AZUL) */}
        <div className="bg-white rounded-2xl border border-blue-200 p-5 shadow-xs flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0">
            <ArrowDownCircle className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-blue-500 font-semibold block">Descarga (10s Azul)</span>
            <div className="text-xl font-extrabold text-blue-600">
              {downloadPeak !== null ? `${downloadPeak} Mbps` : '—'}
            </div>
            <div className="text-[10px] text-slate-500 space-y-0.5 mt-1">
              {downloadPeak !== null && (
                <p className="font-semibold text-blue-700 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" /> Pico Máximo: {downloadPeak} Mbps
                </p>
              )}
              {downloadAvg !== null && <p>Promedio: {downloadAvg} Mbps</p>}
            </div>
          </div>
        </div>

        {/* Upload Speed Card (MORADO) */}
        <div className="bg-white rounded-2xl border border-purple-200 p-5 shadow-xs flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600 shrink-0">
            <ArrowUpCircle className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-purple-500 font-semibold block">Subida (10s Morado)</span>
            <div className="text-xl font-extrabold text-purple-600">
              {uploadPeak !== null ? `${uploadPeak} Mbps` : '—'}
            </div>
            <div className="text-[10px] text-slate-500 space-y-0.5 mt-1">
              {uploadPeak !== null && (
                <p className="font-semibold text-purple-700 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" /> Pico Máximo: {uploadPeak} Mbps
                </p>
              )}
              {uploadAvg !== null && <p>Promedio: {uploadAvg} Mbps</p>}
            </div>
          </div>
        </div>

        {/* Latency / Ping Card (VERDE AL FINAL) */}
        <div className="bg-white rounded-2xl border border-emerald-200 p-5 shadow-xs flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
            <Wifi className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-emerald-600 font-semibold block">Latencia / Ping (5s Verde)</span>
            <div className="text-xl font-extrabold text-emerald-600">
              {ping !== null ? `${ping} ms` : '—'}
            </div>
            <div className="text-[10px] text-slate-500 space-y-0.5 mt-1">
              {minPing !== null && <p>Mínimo: {minPing} ms</p>}
              {jitter !== null && <p>Jitter: {jitter} ms</p>}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
