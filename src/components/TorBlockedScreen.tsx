import React, { useEffect } from 'react';

interface TorBlockedScreenProps {
  clientIp?: string;
  onRetry?: () => Promise<void> | void;
  isSimulated?: boolean;
  onExitSimulation?: () => void;
}

export const TorBlockedScreen: React.FC<TorBlockedScreenProps> = ({
  isSimulated = false,
  onExitSimulation
}) => {
  const hostname = typeof window !== 'undefined' ? window.location.hostname || 'localhost' : 'localhost';

  useEffect(() => {
    // Mimic native browser error behavior: tab title matches the unreachable domain
    const originalTitle = document.title;
    document.title = `${hostname} no está disponible`;
    return () => {
      document.title = originalTitle;
    };
  }, [hostname]);

  const handleReload = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen w-full bg-[#f7f8f9] dark:bg-[#202124] text-[#202124] dark:text-[#e8eaed] font-sans flex flex-col justify-between select-none">
      {/* Simulation Banner for Admin Testing */}
      {isSimulated && (
        <div className="relative z-30 bg-amber-500 text-slate-950 px-4 py-2 flex flex-wrap items-center justify-between gap-3 shadow-md font-bold text-xs">
          <div className="flex items-center gap-2">
            <span className="bg-slate-950 text-amber-300 px-2 py-0.5 rounded text-[10px] uppercase font-black">
              Modo Prueba
            </span>
            <span>
              Simulación de bloqueo Tor activa: Así ve un usuario Tor la web (no carga).
            </span>
          </div>
          {onExitSimulation && (
            <button
              type="button"
              onClick={onExitSimulation}
              className="px-3 py-1 rounded bg-slate-950 hover:bg-slate-900 text-white font-extrabold text-xs transition-colors cursor-pointer"
            >
              Salir de la simulación
            </button>
          )}
        </div>
      )}

      {/* Main Native Browser Error Canvas */}
      <div className="flex-1 flex flex-col items-start justify-center max-w-xl mx-auto px-6 py-12 w-full">
        {/* Browser Broken Page Icon */}
        <div className="mb-6 text-[#5f6368] dark:text-[#9aa0a6]">
          <svg className="w-16 h-16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <line x1="9" y1="9" x2="15" y2="15" />
            <line x1="15" y1="9" x2="9" y2="15" />
          </svg>
        </div>

        {/* Browser Error Headline */}
        <h1 className="text-xl sm:text-2xl font-normal text-[#202124] dark:text-[#e8eaed] mb-4 tracking-tight">
          No se puede acceder a este sitio web
        </h1>

        {/* Detailed Explanation */}
        <p className="text-sm text-[#5f6368] dark:text-[#9aa0a6] leading-relaxed mb-4">
          La página web en <strong className="text-[#202124] dark:text-[#e8eaed] font-medium break-all">{hostname}</strong> ha cerrado la conexión de forma inesperada o no responde.
        </p>

        {/* Troubleshooting Suggestions */}
        <div className="text-sm text-[#5f6368] dark:text-[#9aa0a6] space-y-2 mb-8">
          <p>Prueba a:</p>
          <ul className="list-disc list-inside space-y-1 pl-2 text-xs sm:text-sm">
            <li>Comprobar la conexión de red</li>
            <li>Comprobar el proxy y el cortafuegos</li>
            <li>Reiniciar la conexión</li>
          </ul>
        </div>

        {/* Action Button & Error Code */}
        <div className="w-full flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-[#dadce0] dark:border-[#3c4043]">
          <button
            type="button"
            onClick={handleReload}
            className="px-5 py-2.5 bg-[#1a73e8] hover:bg-[#1557b0] text-white text-sm font-medium rounded transition-colors shadow-2xs cursor-pointer self-start sm:self-auto"
          >
            Volver a cargar
          </button>

          <span className="font-mono text-xs text-[#5f6368] dark:text-[#9aa0a6]">
            ERR_CONNECTION_CLOSED
          </span>
        </div>
      </div>

      <div className="p-4" />
    </div>
  );
};
