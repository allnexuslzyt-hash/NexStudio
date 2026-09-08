import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface SignInPromptBannerProps {
  // Intervalo en milisegundos para mostrar el aviso periódicamente (por defecto 2 minutos = 120,000 ms)
  intervalMs?: number;
}

export const SignInPromptBanner: React.FC<SignInPromptBannerProps> = ({ 
  intervalMs = 120000 
}) => {
  const { user, signInWithGoogle } = useAuth();
  const [isVisible, setIsVisible] = useState<boolean>(false);

  useEffect(() => {
    // Si el usuario ya está autenticado, no mostrar nunca
    if (user) {
      setIsVisible(false);
      return;
    }

    // Primer aviso a los 45 segundos, luego cada intervalMs (ej. 2 minutos)
    const initialTimer = setTimeout(() => {
      if (!user) {
        setIsVisible(true);
      }
    }, 45000);

    const recurringInterval = setInterval(() => {
      if (!user) {
        setIsVisible(true);
      }
    }, intervalMs);

    return () => {
      clearTimeout(initialTimer);
      clearInterval(recurringInterval);
    };
  }, [user, intervalMs]);

  if (user) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          id="signin-prompt-banner"
          initial={{ y: -70, opacity: 0, scale: 0.96 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: -70, opacity: 0, scale: 0.96 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="fixed top-20 left-1/2 -translate-x-1/2 z-45 max-w-md w-[92%] sm:w-auto px-4 py-2.5 bg-white/95 backdrop-blur-xl border border-indigo-200/90 shadow-xl shadow-indigo-600/10 rounded-2xl flex items-center justify-between gap-3 text-slate-900"
        >
          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white shadow-xs shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="flex flex-col">
              <span className="text-xs sm:text-sm font-bold text-slate-900 leading-tight">
                ¿Quieres iniciar sesión?
              </span>
              <span className="text-[11px] text-slate-500 leading-tight hidden sm:inline">
                Guarda tus proyectos y creaciones personalizadas
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              id="prompt-signin-btn"
              onClick={async () => {
                setIsVisible(false);
                await signInWithGoogle();
              }}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs transition-transform active:scale-95 cursor-pointer min-h-[38px]"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.98 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                />
              </svg>
              <span>Acceder</span>
            </button>

            <button
              type="button"
              id="prompt-dismiss-btn"
              onClick={() => setIsVisible(false)}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer min-h-[38px] min-w-[38px] flex items-center justify-center"
              aria-label="Cerrar aviso"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
