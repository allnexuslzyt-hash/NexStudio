import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  ShieldAlert, 
  RotateCcw, 
  Globe, 
  AlertTriangle, 
  Info, 
  CheckCircle2, 
  Wifi, 
  Lock,
  ArrowRight,
  ShieldCheck,
  Loader2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface TorBlockedScreenProps {
  clientIp?: string;
  onRetry: () => Promise<void> | void;
  isSimulated?: boolean;
  onExitSimulation?: () => void;
}

export const TorBlockedScreen: React.FC<TorBlockedScreenProps> = ({
  clientIp = 'IP no disponible',
  onRetry,
  isSimulated = false,
  onExitSimulation
}) => {
  const { user, signInWithGoogle, isSuperAdmin } = useAuth();
  const [isChecking, setIsChecking] = useState(false);
  const [retryStatus, setRetryStatus] = useState<string | null>(null);

  const handleRetry = async () => {
    setIsChecking(true);
    setRetryStatus(null);
    try {
      await onRetry();
      setRetryStatus('Verificación completada. Si continúas viendo esta pantalla, verifica que no tengas Tor activo.');
    } catch {
      setRetryStatus('No se pudo verificar la conexión. Intenta de nuevo en unos segundos.');
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-rose-600 selection:text-white relative overflow-x-hidden font-sans">
      {/* Simulation Banner for Admin Testing */}
      {isSimulated && (
        <div className="relative z-30 bg-gradient-to-r from-amber-500 via-rose-500 to-amber-600 text-slate-950 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 shadow-xl font-bold text-xs">
          <div className="flex items-center gap-2">
            <span className="bg-black text-amber-400 px-2 py-0.5 rounded text-[10px] tracking-wider uppercase">
              MODO PRUEBA ACTIVO
            </span>
            <span>
              Estás viendo la simulación exacta del bloqueo Tor. Ningún usuario desde Tor puede pasar esta pantalla.
            </span>
          </div>
          {onExitSimulation && (
            <button
              type="button"
              onClick={onExitSimulation}
              className="px-3 py-1 rounded-lg bg-slate-950 hover:bg-slate-900 text-white font-extrabold text-xs transition-colors cursor-pointer shadow-md"
            >
              SALIR DE LA SIMULACIÓN Y VOLVER
            </button>
          )}
        </div>
      )}

      {/* Background Ambience Glow */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[500px] rounded-full bg-rose-950/25 blur-[140px]" />
        <div className="absolute -bottom-40 right-1/4 w-[600px] h-[400px] rounded-full bg-amber-950/20 blur-[140px]" />
        <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] opacity-25" />
      </div>

      {/* Top Header Bar */}
      <header className="relative z-20 w-full border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-gradient-to-tr from-rose-600 to-amber-600 shadow-md shadow-rose-900/40">
            <Lock className="w-4 h-4 text-white" />
          </div>
          <div>
            <span className="text-sm font-black tracking-tight text-white block">NexStudio</span>
            <span className="text-[10px] uppercase font-bold tracking-wider text-rose-400">Escudo de Seguridad Perimetral</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-semibold">
            <ShieldAlert className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Protección Anti-Evasión Activa</span>
            <span className="sm:hidden">Escudo Activo</span>
          </span>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="relative z-10 flex-1 w-full max-w-3xl mx-auto px-4 py-8 sm:py-14 flex flex-col items-center justify-center">
        {/* Animated Badge */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-bold tracking-wider uppercase mb-6 shadow-sm"
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500" />
          </span>
          <span>Acceso Restringido &bull; Detección de Nodo Tor</span>
        </motion.div>

        {/* Shield Icon & Headings */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.35 }}
          className="text-center max-w-xl space-y-3 mb-8"
        >
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-rose-950/40 border border-rose-500/30 flex items-center justify-center text-rose-500 mx-auto shadow-2xl shadow-rose-950/60 mb-2">
            <ShieldAlert className="w-9 h-9 sm:w-11 sm:h-11" />
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Acceso no permitido desde la Red Tor
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 leading-relaxed max-w-md mx-auto">
            NexStudio ha detectado que tu conexión proviene de un <strong>nodo de salida de Tor o proxy anónimo</strong>. Por políticas de seguridad y prevención contra la evasión de sanciones, este tipo de conexiones están bloqueadas.
          </p>
        </motion.div>

        {/* Technical Detection Card */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.4 }}
          className="w-full rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl p-5 sm:p-6 mb-6 space-y-4"
        >
          <div className="flex items-center justify-between pb-3 border-b border-slate-800 text-xs">
            <span className="font-bold text-slate-300 flex items-center gap-2">
              <Globe className="w-4 h-4 text-indigo-400" />
              <span>Detalles del Análisis de Conexión</span>
            </span>
            <span className="px-2 py-0.5 rounded-md bg-rose-500/20 text-rose-400 border border-rose-500/30 text-[10px] font-mono font-bold uppercase">
              Tor Exit Node
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
              <span className="text-[11px] font-semibold text-slate-400 block">IP Pública Identificada:</span>
              <span className="font-mono text-sm font-bold text-slate-100 select-all block">
                {clientIp}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
              <span className="text-[11px] font-semibold text-slate-400 block">Acción Aplicada:</span>
              <span className="text-xs font-bold text-rose-400 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Bloqueo perimetral automático</span>
              </span>
            </div>
          </div>

          {/* Steps to resolve */}
          <div className="p-4 rounded-xl bg-indigo-950/20 border border-indigo-500/20 text-indigo-200 text-xs space-y-2">
            <div className="font-bold text-indigo-300 flex items-center gap-1.5">
              <Info className="w-4 h-4 text-indigo-400 shrink-0" />
              <span>¿Cómo ingresar a NexStudio normalmente?</span>
            </div>
            <ol className="list-decimal list-inside space-y-1 text-slate-300 text-[11px] leading-relaxed pl-1">
              <li>Cierra o desactiva tu navegador <strong>Tor Browser</strong> o enrutador de cebolla.</li>
              <li>Abre la plataforma desde tu conexión de internet estándar (fibra, wifi o datos móviles) y navegador habitual (Chrome, Edge, Safari, Firefox).</li>
              <li>Haz clic en el botón de verificación para confirmar que tu nueva IP es normal.</li>
            </ol>
          </div>
        </motion.div>

        {/* Retry Button */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.4 }}
          className="w-full flex flex-col sm:flex-row items-center justify-center gap-3"
        >
          <button
            type="button"
            onClick={handleRetry}
            disabled={isChecking}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 disabled:opacity-50 text-white text-xs sm:text-sm font-bold shadow-lg shadow-indigo-950/50 transition-all cursor-pointer min-h-[44px]"
          >
            {isChecking ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Verificando conexión...</span>
              </>
            ) : (
              <>
                <RotateCcw className="w-4 h-4" />
                <span>Reintentar Verificación de Conexión</span>
              </>
            )}
          </button>

          {/* Admin bypass if logged in or has super admin privileges */}
          {user && (
            <div className="text-center sm:text-left">
              <span className="text-[11px] text-slate-400">
                Conectado como <strong className="text-slate-200">{user.email}</strong>
              </span>
            </div>
          )}
        </motion.div>

        {retryStatus && (
          <p className="text-xs text-amber-300 mt-4 text-center bg-amber-500/10 border border-amber-500/20 px-4 py-2 rounded-xl">
            {retryStatus}
          </p>
        )}
      </main>

      {/* Footer */}
      <footer className="relative z-10 w-full border-t border-slate-900 bg-slate-950/80 px-4 py-4 text-center text-xs text-slate-500">
        <p>NexStudio &bull; Sistema de Seguridad Perimetral y Protección contra Evasión</p>
      </footer>
    </div>
  );
};
