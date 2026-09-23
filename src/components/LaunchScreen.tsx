import React, { useState, useEffect } from 'react';
import { useAdmin } from '../context/AdminContext';
import { useAuth, isSuperAdminEmail } from '../context/AuthContext';
import { 
  Rocket, 
  Sparkles, 
  Clock, 
  PauseCircle, 
  ExternalLink, 
  Youtube, 
  Twitch, 
  MessageSquare, 
  Lock, 
  LogIn, 
  Boxes,
  ArrowRight,
  PartyPopper
} from 'lucide-react';
import { motion } from 'motion/react';

interface LaunchScreenProps {
  onOpenAdminPanel?: () => void;
  onUnlocked?: () => void;
}

export const LaunchScreen: React.FC<LaunchScreenProps> = ({ onOpenAdminPanel, onUnlocked }) => {
  const { siteSettings, isAdmin, isSuperAdmin } = useAdmin();
  const { user, signInWithGoogle, loading } = useAuth();
  const [showAdminLogin, setShowAdminLogin] = useState(false);

  const launchConfig = siteSettings.launchMode || {
    enabled: true,
    targetDate: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
    title: '¡El Gran Lanzamiento de NexStudio está cerca!',
    subtitle: 'Estamos preparando los últimos detalles de todos nuestros proyectos, herramientas y la comunidad. ¡Muy pronto abriremos las puertas para todos!',
    badgeText: 'Gran Estreno Oficial 1.0',
    isPaused: false,
    autoUnlockOnFinish: true,
    allowAdminBypass: true,
    lastUpdated: new Date().toISOString()
  };

  // Remaining time in seconds calculated against target timestamp
  const getTargetMs = () => {
    if (launchConfig.targetTimestampMs) {
      const parsed = Number(launchConfig.targetTimestampMs);
      if (!isNaN(parsed) && parsed > 0) return parsed;
    }
    if (launchConfig.targetDate) {
      const parsed = new Date(launchConfig.targetDate).getTime();
      if (!isNaN(parsed) && parsed > 0) return parsed;
    }
    return Date.now() + 86400000;
  };

  const [remainingSeconds, setRemainingSeconds] = useState<number>(() => {
    if (launchConfig.isPaused) {
      return launchConfig.pausedRemainingSeconds ?? 0;
    }
    const targetMs = getTargetMs();
    return Math.max(0, Math.floor((targetMs - Date.now()) / 1000));
  });

  useEffect(() => {
    if (launchConfig.isPaused) {
      setRemainingSeconds(launchConfig.pausedRemainingSeconds ?? 0);
      return;
    }

    const updateTimer = () => {
      const targetMs = getTargetMs();
      const diff = Math.max(0, Math.floor((targetMs - Date.now()) / 1000));
      setRemainingSeconds(diff);
    };

    updateTimer();
    // 250ms interval guarantees perfectly synchronized seconds across all devices without stutter
    const interval = setInterval(updateTimer, 250);

    // Re-synchronize immediately when browser tab or screen becomes visible again
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        updateTimer();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', updateTimer);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', updateTimer);
    };
  }, [launchConfig.targetDate, launchConfig.targetTimestampMs, launchConfig.isPaused, launchConfig.pausedRemainingSeconds]);

  const days = Math.floor(remainingSeconds / (24 * 3600));
  const hours = Math.floor((remainingSeconds % (24 * 3600)) / 3600);
  const minutes = Math.floor((remainingSeconds % 3600) / 60);
  const seconds = remainingSeconds % 60;

  const isFinished = remainingSeconds <= 0 && !launchConfig.isPaused;

  const socialLinks = [
    {
      name: 'YouTube NexStudio',
      url: 'https://www.youtube.com/@NexStudio-Nexuslz',
      icon: <Youtube className="w-4 h-4 text-rose-500" />,
      badge: 'Oficial'
    },
    {
      name: 'Discord',
      url: 'https://discord.gg/qMFcBrHber',
      icon: <MessageSquare className="w-4 h-4 text-indigo-400" />
    },
    {
      name: 'Twitch',
      url: 'https://twitch.tv/nexuslz01',
      icon: <Twitch className="w-4 h-4 text-purple-400" />
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-between p-4 sm:p-8 bg-slate-950 text-slate-100 overflow-y-auto selection:bg-indigo-600 selection:text-white">
      {/* Background Ambience Glow */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[700px] rounded-full bg-indigo-900/30 blur-[140px] animate-pulse" />
        <div className="absolute top-1/3 -left-40 w-[500px] h-[500px] rounded-full bg-violet-900/20 blur-[130px]" />
        <div className="absolute -bottom-40 right-1/4 w-[600px] h-[600px] rounded-full bg-amber-900/20 blur-[130px]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900/50 via-slate-950/80 to-slate-950" />
      </div>

      {/* Top Bar with Brand Badge */}
      <div className="relative z-10 w-full max-w-4xl flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-violet-600 to-amber-500 flex items-center justify-center shadow-lg shadow-indigo-600/30">
            <Boxes className="w-5 h-5 text-white" />
          </div>
          <span className="text-base font-extrabold text-white tracking-wide">
            NexStudio
          </span>
        </div>

        {/* Status Pill */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-semibold backdrop-blur-md">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
          </span>
          <span>{launchConfig.badgeText || 'Lanzamiento Oficial 1.0'}</span>
        </div>
      </div>

      {/* Center Main Stage */}
      <div className="relative z-10 w-full max-w-2xl mx-auto flex flex-col items-center text-center my-auto py-8">
        {/* Rocket Animated Icon */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.4 }}
          className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-gradient-to-tr from-indigo-600/30 via-violet-600/20 to-amber-500/20 border border-indigo-500/30 flex items-center justify-center mb-6 shadow-2xl shadow-indigo-950/60"
        >
          <Rocket className="w-10 h-10 sm:w-12 sm:h-12 text-indigo-400" />
        </motion.div>

        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-3xl sm:text-5xl font-black text-white tracking-tight mb-4 leading-tight bg-gradient-to-r from-white via-slate-100 to-indigo-200 bg-clip-text text-transparent"
        >
          {launchConfig.title || '¡El Gran Lanzamiento de NexStudio está cerca!'}
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="text-sm sm:text-base text-slate-300 font-normal leading-relaxed max-w-lg mb-8"
        >
          {launchConfig.subtitle || 'Estamos preparando todos los proyectos, herramientas y la comunidad. ¡Muy pronto abriremos las puertas para todos!'}
        </motion.p>

        {/* Countdown Display OR Finished Celebration */}
        {isFinished ? (
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full p-8 rounded-3xl bg-gradient-to-r from-indigo-950/60 via-purple-950/60 to-slate-900/60 border border-indigo-500/40 shadow-2xl backdrop-blur-xl mb-8 flex flex-col items-center"
          >
            <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 mb-3 shadow-lg">
              <PartyPopper className="w-8 h-8" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white mb-2">
              ¡Ha llegado el momento!
            </h2>
            <p className="text-sm text-slate-300 mb-6 max-w-md">
              La cuenta atrás ha finalizado y NexStudio ya se encuentra disponible oficialmente.
            </p>
            <button
              type="button"
              id="launch-enter-now-btn"
              onClick={() => onUnlocked?.()}
              className="px-8 py-3.5 rounded-xl font-bold text-sm bg-gradient-to-r from-indigo-500 via-violet-500 to-indigo-600 hover:from-indigo-600 hover:to-violet-600 text-white shadow-xl shadow-indigo-600/40 transition-all flex items-center gap-2 cursor-pointer"
            >
              <span>Entrar a NexStudio</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="w-full mb-8"
          >
            {/* Countdown Grid (Días, Horas, Minutos, Segundos) */}
            <div className="grid grid-cols-4 gap-2.5 sm:gap-4 max-w-lg mx-auto">
              {/* Días */}
              <div className="p-3 sm:p-5 rounded-2xl bg-slate-900/80 border border-slate-800/90 shadow-xl backdrop-blur-md flex flex-col items-center">
                <span className="text-2xl sm:text-4xl font-extrabold text-white font-mono tracking-tight">
                  {String(days).padStart(2, '0')}
                </span>
                <span className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">
                  Días
                </span>
              </div>

              {/* Horas */}
              <div className="p-3 sm:p-5 rounded-2xl bg-slate-900/80 border border-slate-800/90 shadow-xl backdrop-blur-md flex flex-col items-center">
                <span className="text-2xl sm:text-4xl font-extrabold text-white font-mono tracking-tight">
                  {String(hours).padStart(2, '0')}
                </span>
                <span className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">
                  Horas
                </span>
              </div>

              {/* Minutos */}
              <div className="p-3 sm:p-5 rounded-2xl bg-slate-900/80 border border-slate-800/90 shadow-xl backdrop-blur-md flex flex-col items-center">
                <span className="text-2xl sm:text-4xl font-extrabold text-indigo-300 font-mono tracking-tight">
                  {String(minutes).padStart(2, '0')}
                </span>
                <span className="text-[10px] sm:text-xs font-bold text-indigo-400/80 uppercase tracking-widest mt-1">
                  Minutos
                </span>
              </div>

              {/* Segundos */}
              <div className="p-3 sm:p-5 rounded-2xl bg-slate-900/80 border border-slate-800/90 shadow-xl backdrop-blur-md flex flex-col items-center">
                <span className="text-2xl sm:text-4xl font-extrabold text-amber-400 font-mono tracking-tight">
                  {String(seconds).padStart(2, '0')}
                </span>
                <span className="text-[10px] sm:text-xs font-bold text-amber-400/80 uppercase tracking-widest mt-1">
                  Segundos
                </span>
              </div>
            </div>

            {/* If Paused notice */}
            {launchConfig.isPaused && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold backdrop-blur-md"
              >
                <PauseCircle className="w-4 h-4 text-amber-400 animate-pulse" />
                <span>Cuenta atrás en pausa temporal por el administrador</span>
              </motion.div>
            )}
          </motion.div>
        )}

        {/* Social Links While Waiting */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="w-full max-w-md pt-4 border-t border-slate-800/70"
        >
          <p className="text-xs text-slate-400 mb-3 font-medium">
            Síguenos en nuestros canales oficiales para no perderte el estreno:
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2.5">
            {socialLinks.map((item) => (
              <a
                key={item.name}
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-xs font-semibold text-slate-200 transition-all cursor-pointer shadow-xs"
              >
                {item.icon}
                <span>{item.name}</span>
                {item.badge && (
                  <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300">
                    {item.badge}
                  </span>
                )}
                <ExternalLink className="w-3 h-3 text-slate-500" />
              </a>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Footer & Discreet Admin Bypass / Login */}
      <div className="relative z-10 w-full max-w-4xl pt-6 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
        <div>
          <span>NexStudio &copy; {new Date().getFullYear()} &bull; Todos los derechos reservados.</span>
        </div>

        {/* Admin Access Controls */}
        <div>
          {isAdmin ? (
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" /> Sesión Administrador Activa
              </span>
              <button
                type="button"
                id="launch-go-to-admin-btn"
                onClick={onOpenAdminPanel}
                className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition-all cursor-pointer shadow-xs flex items-center gap-1.5"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Panel de Control</span>
              </button>
            </div>
          ) : (
            <div>
              {!showAdminLogin ? (
                <button
                  type="button"
                  id="launch-admin-login-trigger"
                  onClick={() => setShowAdminLogin(true)}
                  className="text-slate-600 hover:text-slate-400 font-medium transition-colors cursor-pointer flex items-center gap-1"
                >
                  <Lock className="w-3 h-3" />
                  <span>Acceso Administrador</span>
                </button>
              ) : (
                <div className="flex items-center gap-2 animate-in fade-in duration-200">
                  <span className="text-slate-400">¿Eres el creador?</span>
                  <button
                    type="button"
                    id="launch-google-login-btn"
                    onClick={async () => {
                      try {
                        await signInWithGoogle();
                      } catch (e) {}
                    }}
                    disabled={loading}
                    className="px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <LogIn className="w-3.5 h-3.5" />
                    <span>Iniciar con Google</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAdminLogin(false)}
                    className="text-slate-500 hover:text-slate-300"
                  >
                    &times;
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
