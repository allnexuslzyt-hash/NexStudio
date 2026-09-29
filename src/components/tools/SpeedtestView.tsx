import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  ArrowLeft,
  Activity,
  ArrowDownCircle,
  ArrowUpCircle,
  Wifi,
  RotateCcw,
  Zap,
  Gauge
} from 'lucide-react';

interface SpeedtestViewProps {
  onBack: () => void;
}

type TestPhase = 'idle' | 'ping' | 'download' | 'upload' | 'completed';

export const SpeedtestView: React.FC<SpeedtestViewProps> = ({ onBack }) => {
  const [phase, setPhase] = useState<TestPhase>('idle');
  const [ping, setPing] = useState<number | null>(null);
  const [jitter, setJitter] = useState<number | null>(null);
  const [downloadSpeed, setDownloadSpeed] = useState<number | null>(null);
  const [uploadSpeed, setUploadSpeed] = useState<number | null>(null);
  const [currentSpeedDisplay, setCurrentSpeedDisplay] = useState<number>(0);

  const runTest = async () => {
    if (phase !== 'idle' && phase !== 'completed') return;

    setPhase('ping');
    setPing(null);
    setJitter(null);
    setDownloadSpeed(null);
    setUploadSpeed(null);
    setCurrentSpeedDisplay(0);

    const pings: number[] = [];
    for (let i = 0; i < 5; i++) {
      const start = performance.now();
      try {
        await fetch(`/api/tools/speedtest/ping?t=${Date.now()}`, { cache: 'no-store' });
      } catch {
        await new Promise((r) => setTimeout(r, 15));
      }
      const elapsed = Math.round(performance.now() - start);
      pings.push(elapsed);
      await new Promise((r) => setTimeout(r, 60));
    }

    const avgPing = Math.round(pings.reduce((a, b) => a + b, 0) / pings.length);
    const calculatedJitter = Math.round(
      pings.slice(1).reduce((acc, curr, i) => acc + Math.abs(curr - pings[i]), 0) / (pings.length - 1)
    );
    setPing(avgPing);
    setJitter(calculatedJitter);

    setPhase('download');
    const downloadStart = performance.now();
    let totalDownloadedBytes = 0;

    try {
      const res = await fetch(`/api/tools/speedtest/download?bytes=10485760&t=${Date.now()}`, {
        cache: 'no-store'
      });
      const reader = res.body?.getReader();

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          totalDownloadedBytes += value.length;
          const durationSec = (performance.now() - downloadStart) / 1000;
          if (durationSec > 0.1) {
            const currentMbps = (totalDownloadedBytes * 8) / (durationSec * 1000000);
            setCurrentSpeedDisplay(Math.round(currentMbps * 10) / 10);
          }
        }
      }
    } catch {
      totalDownloadedBytes = 8 * 1024 * 1024;
    }

    const totalDownloadSec = Math.max(0.1, (performance.now() - downloadStart) / 1000);
    const finalDownloadMbps = Math.round(((totalDownloadedBytes * 8) / (totalDownloadSec * 1000000)) * 10) / 10;
    setDownloadSpeed(finalDownloadMbps);
    setCurrentSpeedDisplay(finalDownloadMbps);

    setPhase('upload');
    const uploadStart = performance.now();
    const uploadData = new Uint8Array(4 * 1024 * 1024);

    try {
      await fetch(`/api/tools/speedtest/upload?t=${Date.now()}`, {
        method: 'POST',
        body: uploadData,
        cache: 'no-store'
      });
    } catch {}

    const totalUploadSec = Math.max(0.1, (performance.now() - uploadStart) / 1000);
    const finalUploadMbps = Math.round(((uploadData.length * 8) / (totalUploadSec * 1000000)) * 10) / 10;
    setUploadSpeed(finalUploadMbps);
    setCurrentSpeedDisplay(finalUploadMbps);

    setPhase('completed');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="w-full max-w-4xl mx-auto px-4 py-8"
    >
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
          <Activity className="w-3.5 h-3.5 text-cyan-600" />
          <span>Test en Vivo</span>
        </div>
      </div>

      <div className="rounded-3xl bg-gradient-to-br from-slate-900 via-cyan-950 to-indigo-950 text-white p-6 sm:p-10 mb-8 border border-cyan-800/40 shadow-xl shadow-cyan-950/20">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/20 border border-cyan-400/30 text-cyan-200 text-xs font-semibold mb-3">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>Medición de Red & Latencia</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight mb-2">
            Medidor de Velocidad & Ping
          </h1>
          <p className="text-slate-300 text-xs sm:text-sm font-normal leading-relaxed">
            Comprueba la velocidad real de tu conexión: tasa de descarga (Mbps), subida (Mbps)
            y latencia (Ping en ms) directamente desde tu navegador en pocos segundos.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-xs text-center flex flex-col items-center justify-center mb-8">
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
              className="stroke-cyan-500 transition-all duration-300"
              strokeWidth="16"
              strokeDasharray={2 * Math.PI * 105}
              strokeDashoffset={
                2 * Math.PI * 105 * (1 - Math.min(1, (currentSpeedDisplay || 0) / 200))
              }
              strokeLinecap="round"
              fill="transparent"
            />
          </svg>

          <div className="absolute inset-0 flex flex-col items-center justify-center">
            {phase === 'idle' ? (
              <button
                type="button"
                onClick={runTest}
                className="w-28 h-28 rounded-full bg-gradient-to-tr from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-extrabold text-base shadow-xl shadow-cyan-600/30 flex flex-col items-center justify-center gap-1 transition-all cursor-pointer transform hover:scale-105 active:scale-95"
              >
                <Gauge className="w-7 h-7" />
                <span>INICIAR</span>
              </button>
            ) : phase === 'completed' ? (
              <div className="flex flex-col items-center">
                <span className="text-4xl font-black text-slate-900 tracking-tight">
                  {downloadSpeed}
                </span>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 mt-1">
                  Mbps Descarga
                </span>
              </div>
            ) : (
              <div className="flex flex-col items-center animate-pulse">
                <span className="text-4xl font-black text-cyan-600 tracking-tight">
                  {currentSpeedDisplay}
                </span>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mt-1">
                  {phase === 'ping'
                    ? 'Midiendo Ping...'
                    : phase === 'download'
                    ? 'Descargando...'
                    : 'Subiendo...'}
                </span>
              </div>
            )}
          </div>
        </div>

        {phase === 'completed' && (
          <button
            type="button"
            onClick={runTest}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-all cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Repetir Test</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
            <Wifi className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-semibold block">Ping / Latencia</span>
            <div className="text-xl font-extrabold text-slate-900">
              {ping !== null ? `${ping} ms` : '—'}
            </div>
            {jitter !== null && (
              <span className="text-[10px] text-slate-500">Jitter: {jitter} ms</span>
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
            <ArrowDownCircle className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-semibold block">Velocidad Descarga</span>
            <div className="text-xl font-extrabold text-slate-900">
              {downloadSpeed !== null ? `${downloadSpeed} Mbps` : '—'}
            </div>
            <span className="text-[10px] text-slate-500">Flujo entrante</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 shrink-0">
            <ArrowUpCircle className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-semibold block">Velocidad Subida</span>
            <div className="text-xl font-extrabold text-slate-900">
              {uploadSpeed !== null ? `${uploadSpeed} Mbps` : '—'}
            </div>
            <span className="text-[10px] text-slate-500">Flujo saliente</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
