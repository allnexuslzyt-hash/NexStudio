import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  ShieldAlert, 
  Copy, 
  Check, 
  ExternalLink, 
  X, 
  Info,
  Sparkles,
  AlertTriangle,
  RotateCw,
  UserCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import firebaseConfig from '../../firebase-applet-config.json';

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
  const { signInWithGoogle, signInWithDevAccount } = useAuth();
  const [copiedDomain, setCopiedDomain] = useState<string | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);

  if (!isOpen) return null;

  const currentHostname = domain || (typeof window !== 'undefined' ? window.location.hostname : '');
  const activeProjectId = firebaseConfig.projectId || 'gen-lang-client-0124412010';
  const consoleAuthSettingsUrl = `https://console.firebase.google.com/project/${activeProjectId}/authentication/settings`;

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedDomain(text);
      setTimeout(() => setCopiedDomain(null), 2500);
    } catch (e) {
      console.warn('Clipboard copy failed:', e);
    }
  };

  const handleRetry = async () => {
    setIsRetrying(true);
    try {
      await signInWithGoogle();
      onClose();
    } catch (e) {
      console.error('Error during retry:', e);
    } finally {
      setIsRetrying(false);
    }
  };

  const handleInstantCreatorLogin = () => {
    signInWithDevAccount('allnexuslzyt@gmail.com');
    onClose();
  };

  // Dominios clave para registrar
  const domainsToAdd = [
    currentHostname,
    'nexstudio.allnexuslzyt.workers.dev',
    'allnexuslzyt.workers.dev',
  ].filter((d, i, arr) => d && arr.indexOf(d) === i);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-sm overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 12 }}
          className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-6 text-left"
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
              Google impide la autenticación porque el dominio no está registrado en los <strong>Dominios Autorizados</strong> del proyecto de Firebase activo.
            </p>
          </div>

          {/* Body */}
          <div className="p-6 sm:p-7 space-y-5 max-h-[72vh] overflow-y-auto">
            {/* Alerta de Proyecto Activo */}
            <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-xs text-amber-900 leading-relaxed">
                <span className="font-bold">Verifica tu Proyecto Activo de Firebase:</span>
                <p className="mt-0.5">
                  Esta aplicación está conectada al proyecto <code className="bg-amber-100/80 px-1.5 py-0.5 rounded font-mono font-bold text-amber-950">{activeProjectId}</code>. Debes autorizar el dominio dentro de este proyecto específico.
                </p>
              </div>
            </div>

            {/* Paso 1: Dominios a Copiar */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-800 flex items-center justify-between">
                <span>1. Copia tu dominio actual:</span>
                {copiedDomain && (
                  <span className="text-emerald-600 flex items-center gap-1 text-[11px] font-semibold">
                    <Check className="w-3 h-3" /> ¡Copiado al portapapeles!
                  </span>
                )}
              </label>

              <div className="space-y-2">
                {domainsToAdd.map((dom) => (
                  <div 
                    key={dom}
                    className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200 hover:border-slate-300 transition-colors"
                  >
                    <code className="text-xs font-mono text-slate-800 truncate select-all px-1">
                      {dom}
                    </code>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(dom)}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer shrink-0"
                    >
                      {copiedDomain === dom ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedDomain === dom ? 'Copiado' : 'Copiar'}</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Paso 2: Enlace directo a la consola correcta */}
            <div className="p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <Info className="w-4 h-4 text-indigo-600" />
                  <span>2. Pasos en la Consola de Firebase:</span>
                </span>
                <a
                  href={consoleAuthSettingsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-bold text-indigo-600 hover:text-indigo-700 inline-flex items-center gap-1 hover:underline"
                >
                  <span>Ir a Consola del Proyecto ({activeProjectId})</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>

              <ol className="text-xs text-slate-600 space-y-2 list-decimal list-inside pl-1 leading-relaxed">
                <li>
                  Haz clic en el botón superior <strong>"Ir a Consola del Proyecto"</strong>.
                </li>
                <li>
                  Ve a la pestaña <strong>Settings (Configuración)</strong> &gt; sección <strong>Dominios autorizados (Authorized domains)</strong>.
                </li>
                <li>
                  Haz clic en <strong>Agregar dominio (Add domain)</strong> y pega <code className="bg-slate-200/80 px-1 py-0.5 rounded font-mono text-slate-900 text-[11px]">{currentHostname}</code>.
                </li>
                <li>
                  Guarda los cambios. <em>(Los cambios de Google tardan de 15 a 60 segundos en propagarse a nivel mundial)</em>.
                </li>
              </ol>
            </div>

            {/* Opciones de Acceso */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <p className="text-xs font-bold text-slate-900">
                ¿Qué deseas hacer ahora?
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={handleRetry}
                  disabled={isRetrying}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
                >
                  <RotateCw className={`w-3.5 h-3.5 ${isRetrying ? 'animate-spin' : ''}`} />
                  <span>{isRetrying ? 'Reintentando...' : 'Reintentar con Google'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleInstantCreatorLogin}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
                  title="Acceso instantáneo con el perfil de creador AllNexus"
                >
                  <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Acceso Creador (Inmediato)</span>
                </button>
              </div>
              <p className="text-[11px] text-slate-400 text-center">
                El botón "Acceso Creador" te permite continuar trabajando y publicando inmediatamente con la cuenta <span className="font-semibold text-slate-600">allnexuslzyt@gmail.com</span> mientras se autoriza el dominio.
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
            >
              Cerrar
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
