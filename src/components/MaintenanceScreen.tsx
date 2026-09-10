import React, { useState } from 'react';
import { useAdmin } from '../context/AdminContext';
import { useAuth } from '../context/AuthContext';
import { 
  ShieldAlert, 
  Power, 
  Lock, 
  ArrowRight, 
  LogIn, 
  AlertTriangle, 
  RefreshCw,
  Clock,
  Radio,
  Sliders
} from 'lucide-react';
import { motion } from 'motion/react';

interface MaintenanceScreenProps {
  onOpenAdminPanel?: () => void;
}

export const MaintenanceScreen: React.FC<MaintenanceScreenProps> = ({ onOpenAdminPanel }) => {
  const { siteSettings, toggleMaintenanceMode, isAdmin, isSuperAdmin } = useAdmin();
  const { user, signInWithGoogle, loading } = useAuth();
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [isOpening, setIsOpening] = useState(false);

  const handleReopenSite = async () => {
    setIsOpening(true);
    await toggleMaintenanceMode(false);
    setIsOpening(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center p-4 sm:p-8 bg-slate-950 text-slate-100 overflow-y-auto selection:bg-rose-500 selection:text-white">
      {/* Background Ambience */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[700px] rounded-full bg-rose-950/30 blur-[130px]" />
        <div className="absolute -bottom-40 right-1/4 w-[500px] h-[500px] rounded-full bg-amber-950/20 blur-[120px]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900/40 via-slate-950/80 to-slate-950" />
      </div>

      <div className="relative z-10 w-full max-w-xl mx-auto flex flex-col items-center text-center my-auto">
        {/* Status Pill */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold mb-6 tracking-wide shadow-xs"
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
          </span>
          <span>ESTADO: CERRADO AL PÚBLICO</span>
        </motion.div>

        {/* Big Alert Icon */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-gradient-to-tr from-rose-600/20 via-rose-500/10 to-amber-500/10 border border-rose-500/20 flex items-center justify-center mb-6 shadow-xl shadow-rose-950/50"
        >
          <ShieldAlert className="w-10 h-10 sm:w-12 sm:h-12 text-rose-500" />
        </motion.div>

        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-3"
        >
          Página Web Cerrada
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-base sm:text-lg text-slate-300 font-normal leading-relaxed max-w-md mb-6"
        >
          {siteSettings.maintenanceMessage}
        </motion.p>

        {/* Details Card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="w-full bg-slate-900/70 border border-slate-800/80 rounded-2xl p-5 mb-8 text-left backdrop-blur-md"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="flex items-center gap-3">
              <Clock className="w-4 h-4 text-amber-400 shrink-0" />
              <div>
                <span className="text-slate-400 block font-medium">Tiempo estimado:</span>
                <span className="text-slate-200 font-semibold">{siteSettings.maintenanceEstimatedReturn || siteSettings.estimatedTime || 'Pocos minutos'}</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Radio className="w-4 h-4 text-rose-400 shrink-0" />
              <div>
                <span className="text-slate-400 block font-medium">Motivo de cierre:</span>
                <span className="text-slate-200 font-semibold">{siteSettings.maintenanceReason || 'Actualización del sistema'}</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Admin Controls / Emergency Access Area */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="w-full pt-4 border-t border-slate-800/80 flex flex-col items-center"
        >
          {isAdmin ? (
            /* Logged in as Admin */
            <div className="w-full p-4 rounded-2xl bg-slate-900/90 border border-indigo-500/30 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-left">
                <div className="flex items-center gap-2 text-xs font-semibold text-indigo-400 mb-0.5">
                  <Lock className="w-3.5 h-3.5" />
                  <span>Acceso de Administrador Activo</span>
                </div>
                <p className="text-xs text-slate-300">
                  Conectado como <strong className="text-white">{user?.email || 'Administrador'}</strong>
                </p>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={handleReopenSite}
                  disabled={isOpening}
                  className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md shadow-emerald-950/40 transition-all cursor-pointer"
                >
                  <Power className="w-3.5 h-3.5" />
                  <span>{isOpening ? 'Abriendo...' : 'ABRIR WEB AHORA'}</span>
                </button>

                {onOpenAdminPanel && (
                  <button
                    type="button"
                    onClick={onOpenAdminPanel}
                    className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-all cursor-pointer"
                  >
                    <Sliders className="w-3.5 h-3.5" />
                    <span>Centro de Mando</span>
                  </button>
                )}
              </div>
            </div>
          ) : (
            /* Not logged in as Admin - Emergency login prompt */
            <div className="w-full flex flex-col items-center">
              {!showAdminLogin ? (
                <button
                  type="button"
                  onClick={() => setShowAdminLogin(true)}
                  className="text-xs text-slate-400 hover:text-slate-200 inline-flex items-center gap-1.5 transition-colors cursor-pointer py-2"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>¿Eres administrador? Acceso de emergencia</span>
                </button>
              ) : (
                <div className="w-full p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col items-center gap-3">
                  <p className="text-xs text-slate-400">
                    Solo administradores autorizados pueden omitir el bloqueo y reactivar el sitio.
                  </p>
                  <div className="w-full flex justify-center">
                    <button
                      type="button"
                      onClick={() => signInWithGoogle()}
                      disabled={loading}
                      className="w-full inline-flex items-center justify-center gap-2.5 px-6 py-3 rounded-xl bg-white hover:bg-slate-100 text-slate-900 text-xs font-bold transition-all shadow-md cursor-pointer"
                    >
                      <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                        <path
                          fill="#4285F4"
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        />
                        <path
                          fill="#34A853"
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                        <path
                          fill="#FBBC05"
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                        />
                        <path
                          fill="#EA4335"
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                        />
                      </svg>
                      <span>Identificarse con Google</span>
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowAdminLogin(false)}
                    className="text-[11px] text-slate-500 hover:text-slate-300"
                  >
                    Cancelar
                  </button>
                </div>
              )}
            </div>
          )}
        </motion.div>
      </div>

      {/* Footer Info */}
      <div className="relative z-10 text-[11px] text-slate-500 mt-8">
        NexStudio Core Infrastructure &bull; Todos los derechos reservados
      </div>
    </div>
  );
};
