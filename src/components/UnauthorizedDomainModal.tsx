import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  ShieldAlert, 
  Copy, 
  Check, 
  ExternalLink, 
  UserCheck, 
  X, 
  KeyRound, 
  Sparkles,
  Info,
  ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface UnauthorizedDomainModalProps {
  domain: string;
  isOpen: boolean;
  onClose: () => void;
}

export const UnauthorizedDomainModal: React.FC<UnauthorizedDomainModalProps> = ({
  domain,
  isOpen,
  onClose,
}) => {
  const { signInWithDevAccount, clearAuthError } = useAuth();
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const currentDomain = domain || (typeof window !== 'undefined' ? window.location.hostname : '');

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(currentDomain);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (e) {
      console.warn('Clipboard copy failed:', e);
    }
  };

  const handleDevLogin = (email: string, role: any) => {
    signInWithDevAccount(email, role);
    clearAuthError();
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-8"
        >
          {/* Header */}
          <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950 text-white p-6 sm:p-7 relative">
            <button
              type="button"
              onClick={onClose}
              className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              title="Cerrar"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/20 border border-rose-400/30 text-rose-300 text-xs font-bold mb-3 tracking-wide">
              <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
              <span>ERROR: auth/unauthorized-domain</span>
            </div>

            <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
              Dominio No Autorizado en Firebase
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 mt-1.5 leading-relaxed">
              Google impide el inicio de sesión porque el dominio de esta vista previa aún no está registrado en la lista de dominios autorizados de tu proyecto de Firebase.
            </p>
          </div>

          {/* Body */}
          <div className="p-6 sm:p-7 space-y-6 max-h-[75vh] overflow-y-auto">
            {/* Step 1: Copy Domain */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-900 flex items-center justify-between">
                <span>1. Tu Dominio Actual (Cópialo):</span>
                {copied && (
                  <span className="text-emerald-600 flex items-center gap-1 text-[11px] font-semibold">
                    <Check className="w-3 h-3" /> ¡Copiado al portapapeles!
                  </span>
                )}
              </label>
              <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 border border-slate-200">
                <code className="text-xs font-mono text-slate-800 flex-1 truncate px-2 select-all">
                  {currentDomain}
                </code>
                <button
                  type="button"
                  onClick={handleCopy}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer shrink-0"
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copiado' : 'Copiar'}</span>
                </button>
              </div>
            </div>

            {/* Step 2: How to fix in Firebase Console */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <Info className="w-4 h-4 text-indigo-600" />
                  <span>2. Pasos para autorizarlo en Firebase:</span>
                </span>
                <a
                  href="https://console.firebase.google.com/project/gen-lang-client-0428150814/authentication/settings"
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 inline-flex items-center gap-1"
                >
                  <span>Abrir Consola</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              <ol className="text-xs text-slate-600 space-y-1.5 list-decimal list-inside pl-1 leading-relaxed">
                <li>
                  Ve a <strong>Consola de Firebase &gt; Authentication &gt; pestaña Settings (Configuración)</strong>.
                </li>
                <li>
                  Baja a la sección <strong>Dominios autorizados (Authorized domains)</strong>.
                </li>
                <li>
                  Haz clic en <strong>Agregar dominio (Add domain)</strong> y pega <code className="bg-slate-200 px-1 py-0.5 rounded text-[11px] font-mono text-slate-800">{currentDomain}</code>.
                </li>
                <li>
                  Guarda los cambios y el botón oficial de Google funcionará de inmediato.
                </li>
              </ol>
            </div>

            {/* Fast Alternative: Instant Developer Login */}
            <div className="p-5 rounded-2xl bg-indigo-50/70 border border-indigo-200 space-y-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                <h3 className="text-xs font-bold text-indigo-950 uppercase tracking-wide">
                  Solución Inmediata &bull; Acceso Directo de Desarrollo
                </h3>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Para que no te quedes bloqueado mientras autorizas el dominio, puedes iniciar sesión instantáneamente con tu cuenta de administrador:
              </p>

              <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => handleDevLogin('allnexuslzyt@gmail.com', 'SuperAdmin')}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
                >
                  <KeyRound className="w-4 h-4" />
                  <span>Acceder como allnexuslzyt@gmail.com (SuperAdmin)</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleDevLogin('usuario.demo@nexstudio.app', 'Creador Digital')}
                  className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-white hover:bg-slate-100 text-slate-800 text-xs font-semibold border border-slate-300 transition-all cursor-pointer"
                >
                  <UserCheck className="w-4 h-4 text-slate-600" />
                  <span>Usuario Demo</span>
                </button>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
            >
              Entendido / Cerrar
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
