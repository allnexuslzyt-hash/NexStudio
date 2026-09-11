import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Download, Clock, CheckCircle2, X, ExternalLink, ShieldCheck, FileCode2 } from 'lucide-react';

interface DownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectTitle: string;
  downloadUrl: string;
  waitTimeSeconds?: number;
}

export const DownloadModal: React.FC<DownloadModalProps> = ({
  isOpen,
  onClose,
  projectTitle,
  downloadUrl,
  waitTimeSeconds = 3,
}) => {
  const [secondsLeft, setSecondsLeft] = useState<number>(waitTimeSeconds);
  const [hasStarted, setHasStarted] = useState<boolean>(false);
  const [hasTriggeredDownload, setHasTriggeredDownload] = useState<boolean>(false);

  // Reset and start countdown when modal opens
  useEffect(() => {
    if (!isOpen) {
      setSecondsLeft(waitTimeSeconds);
      setHasStarted(false);
      setHasTriggeredDownload(false);
      return;
    }

    setSecondsLeft(waitTimeSeconds);
    setHasStarted(true);
    setHasTriggeredDownload(false);

    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen, waitTimeSeconds]);

  // When countdown hits 0, automatically trigger the download
  useEffect(() => {
    if (isOpen && hasStarted && secondsLeft === 0 && !hasTriggeredDownload) {
      setHasTriggeredDownload(true);
      window.open(downloadUrl, '_blank', 'noopener,noreferrer');
    }
  }, [isOpen, hasStarted, secondsLeft, hasTriggeredDownload, downloadUrl]);

  const handleManualDownload = () => {
    if (secondsLeft > 0) return;
    window.open(downloadUrl, '_blank', 'noopener,noreferrer');
  };

  const progressPercentage = Math.round(((waitTimeSeconds - secondsLeft) / waitTimeSeconds) * 100);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div 
        id="download-modal-backdrop"
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <motion.div
          id="download-modal-card"
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 sm:p-7 overflow-hidden text-center"
        >
          {/* Close button */}
          <button
            type="button"
            id="btn-close-download-modal"
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label="Cerrar modal de descarga"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Icon Header */}
          <div className="flex justify-center mb-4">
            <div className="relative">
              <div className="w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 shadow-xs">
                {secondsLeft === 0 ? (
                  <CheckCircle2 className="w-8 h-8 text-emerald-600" />
                ) : (
                  <FileCode2 className="w-8 h-8 text-emerald-600" />
                )}
              </div>
              {secondsLeft > 0 && (
                <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-bold shadow-xs">
                  {secondsLeft}
                </div>
              )}
            </div>
          </div>

          {/* Project Title */}
          <h3 className="text-xl font-extrabold text-slate-900 mb-1.5">
            {projectTitle}
          </h3>

          <p className="text-xs text-slate-500 mb-6 flex items-center justify-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Alojado de forma segura en Google Drive</span>
          </p>

          {/* Countdown / Status Box */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 mb-6">
            {secondsLeft > 0 ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-slate-600 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-emerald-600 animate-spin" style={{ animationDuration: '3s' }} />
                    <span>Preparando descarga...</span>
                  </span>
                  <span className="text-emerald-700 font-bold px-2 py-0.5 rounded-md bg-emerald-100/70 text-[11px]">
                    Espera {secondsLeft} seg
                  </span>
                </div>

                {/* Progress bar */}
                <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
                  <div
                    className="h-full bg-emerald-600 transition-all duration-1000 ease-linear rounded-full"
                    style={{ width: `${progressPercentage}%` }}
                  />
                </div>

                <p className="text-[11px] text-slate-500 leading-tight">
                  Debes esperar <strong>{secondsLeft} segundos</strong> para poder descargarlo. Tu enlace se abrirá automáticamente.
                </p>
              </div>
            ) : (
              <div className="space-y-1 text-center py-1">
                <p className="text-xs font-bold text-emerald-700 flex items-center justify-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>¡Enlace desbloqueado y listo!</span>
                </p>
                <p className="text-[11px] text-slate-500">
                  La pestaña de Google Drive se ha abierto. Si no se abrió automáticamente, pulsa el botón verde de abajo.
                </p>
              </div>
            )}
          </div>

          {/* Primary Green Download Button */}
          <button
            type="button"
            id="btn-confirm-download-action"
            disabled={secondsLeft > 0}
            onClick={handleManualDownload}
            className={`w-full py-3.5 px-6 rounded-xl font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 ${
              secondsLeft > 0
                ? 'bg-emerald-600/50 text-white/90 cursor-not-allowed opacity-80'
                : 'bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white shadow-emerald-600/25 hover:shadow-lg hover:shadow-emerald-600/30 cursor-pointer'
            }`}
          >
            {secondsLeft > 0 ? (
              <>
                <Clock className="w-4 h-4" />
                <span>Espera {secondsLeft} seg para descargar</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>{hasTriggeredDownload ? 'Descargar de nuevo' : 'Descargar'}</span>
                <ExternalLink className="w-3.5 h-3.5 opacity-80" />
              </>
            )}
          </button>

          {/* Dismiss secondary button */}
          <button
            type="button"
            id="btn-cancel-download-modal"
            onClick={onClose}
            className="w-full mt-2.5 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
          >
            Cerrar ventana
          </button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
