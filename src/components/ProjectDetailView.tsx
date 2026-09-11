import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowLeft, 
  Download, 
  ShieldCheck, 
  Lock,
  Zap,
  Palette,
  FileCode,
  CheckCircle2,
  AlertCircle,
  X
} from 'lucide-react';
import { DownloadModal } from './DownloadModal';
import { useAuth } from '../context/AuthContext';
import { AdminProject } from '../types';

interface ProjectDetailViewProps {
  onBack: () => void;
  project?: AdminProject;
}

export const ProjectDetailView: React.FC<ProjectDetailViewProps> = ({ onBack, project }) => {
  const { user, signInWithGoogle } = useAuth();
  const [isDownloadOpen, setIsDownloadOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isSigningIn, setIsSigningIn] = useState(false);

  const downloadUrl = project?.downloadUrl || 'https://drive.google.com/file/d/1l67EWOKt-Sc4ldmOLYhMI4lz1Ra0KPoa/view?usp=sharing';
  const projectTitle = project?.title || 'Asistente Web En HTML';
  const waitTime = project?.waitTimeSeconds ?? 3;
  const requireAuth = project?.requireAuth ?? true;
  const projectDesc = project?.description || 'Estructura completa de asistente inteligente construida en código nativo. Lista para descargar, integrar y personalizar sin dependencias externas.';

  // Manejo del click de descarga: Valida si o si el registro previo si requireAuth está activo
  const handleDownloadClick = () => {
    if (requireAuth && !user) {
      setIsAuthModalOpen(true);
      return;
    }
    setIsDownloadOpen(true);
  };

  const handleSignInAndDownload = async () => {
    try {
      setIsSigningIn(true);
      await signInWithGoogle();
      setIsAuthModalOpen(false);
      setIsDownloadOpen(true);
    } catch (error) {
      console.error('Error al iniciar sesión:', error);
    } finally {
      setIsSigningIn(false);
    }
  };

  const specCards = [
    {
      title: 'Tecnología',
      value: 'HTML · CSS · JS',
      icon: <FileCode className="w-5 h-5 text-indigo-600" />,
      desc: 'Sin frameworks pesados, 100% nativo para cualquier navegador.',
    },
    {
      title: 'Rendimiento',
      value: 'Ultra Rápido',
      icon: <Zap className="w-5 h-5 text-amber-500" />,
      desc: 'Carga inmediata con consumo mínimo de recursos de CPU y memoria.',
    },
    {
      title: 'Personalización',
      value: 'Estilo Modular',
      icon: <Palette className="w-5 h-5 text-violet-600" />,
      desc: 'Estructura visual limpia y fácilmente editable según tus necesidades.',
    },
    {
      title: 'Disponibilidad',
      value: 'Google Drive',
      icon: <ShieldCheck className="w-5 h-5 text-emerald-600" />,
      desc: 'Descarga directa y segura verificada sin publicidad molesta.',
    },
  ];

  return (
    <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-14 animate-in fade-in duration-300 relative">
      {/* Floating Animated Background Orbs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden -z-10">
        <motion.div
          animate={{
            y: [0, -20, 0],
            x: [0, 12, 0],
            scale: [1, 1.05, 1],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="absolute -top-10 -right-10 w-96 h-96 rounded-full bg-gradient-to-br from-indigo-100/60 via-purple-50/40 to-transparent blur-3xl"
        />
        <motion.div
          animate={{
            y: [0, 18, 0],
            x: [0, -15, 0],
            scale: [1, 1.04, 1],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="absolute -bottom-20 -left-10 w-[420px] h-[420px] rounded-full bg-gradient-to-tr from-emerald-100/50 via-teal-50/30 to-transparent blur-3xl"
        />
      </div>

      {/* Top Bar Navigation */}
      <div className="flex items-center justify-between gap-4 mb-8">
        <motion.button
          type="button"
          id="btn-back-to-projects-list"
          onClick={onBack}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white/80 hover:bg-slate-50 border border-slate-200/90 rounded-xl transition-all shadow-xs cursor-pointer min-h-[44px]"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Volver a Proyectos</span>
        </motion.button>

        {!requireAuth ? (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-teal-50 border border-teal-200/90 text-[11px] font-semibold text-teal-800">
            <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" />
            <span>Descarga Libre (Acceso Público)</span>
          </div>
        ) : user ? (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200/90 text-[11px] font-semibold text-emerald-800">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Cuenta Verificada</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 border border-slate-200 text-[11px] font-semibold text-slate-600">
            <Lock className="w-3.5 h-3.5 text-slate-500" />
            <span>Requiere Registro</span>
          </div>
        )}
      </div>

      {/* Hero Header */}
      <motion.div 
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="relative rounded-3xl bg-white/90 backdrop-blur-xl border border-slate-200/90 p-8 sm:p-12 mb-10 overflow-hidden shadow-xl shadow-slate-200/40 text-left"
      >
        <div className="relative z-10 max-w-3xl">
          {/* Title Typography standard with site */}
          <motion.h1
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.4 }}
            className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight mb-4"
          >
            {projectTitle}
          </motion.h1>

          {/* Subtitle standard with site */}
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.16, duration: 0.4 }}
            className="text-base sm:text-lg text-slate-600 font-normal leading-relaxed max-w-2xl mb-8"
          >
            {projectDesc}
          </motion.p>

          {/* Download Action Button */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.22, duration: 0.4 }}
            className="flex items-center"
          >
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl blur-sm opacity-50 group-hover:opacity-100 transition duration-300 pointer-events-none" />
              <motion.button
                type="button"
                id="btn-download-project-1"
                onClick={handleDownloadClick}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="relative w-full sm:w-auto px-8 py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-bold text-sm sm:text-base shadow-xl shadow-emerald-600/30 transition-all flex items-center justify-center gap-3 cursor-pointer min-h-[52px]"
              >
                {!requireAuth || user ? (
                  <Download className="w-5 h-5" />
                ) : (
                  <Lock className="w-5 h-5 text-emerald-100" />
                )}
                <span>Descargar {projectTitle}</span>
              </motion.button>
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* Grid with Animated Spec Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 mb-10 text-left">
        {specCards.map((spec, idx) => (
          <motion.div
            key={spec.title}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.25 + idx * 0.07, ease: [0.16, 1, 0.3, 1] }}
            whileHover={{ y: -4, transition: { duration: 0.2 } }}
            className="group p-6 rounded-2xl bg-white border border-slate-200/90 shadow-xs hover:shadow-lg hover:border-indigo-200 transition-all cursor-default"
          >
            <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              {spec.icon}
            </div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
              {spec.title}
            </span>
            <h3 className="text-lg font-bold text-slate-900 mb-1 tracking-tight">
              {spec.value}
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              {spec.desc}
            </p>
          </motion.div>
        ))}
      </div>

      {/* Download Countdown Modal */}
      <DownloadModal
        isOpen={isDownloadOpen}
        onClose={() => setIsDownloadOpen(false)}
        projectTitle={projectTitle}
        downloadUrl={downloadUrl}
        waitTimeSeconds={waitTime}
      />

      {/* Registration Required Modal */}
      <AnimatePresence>
        {isAuthModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 15 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="relative w-full max-w-md bg-white rounded-3xl border border-slate-200 shadow-2xl p-6 sm:p-8 text-left overflow-hidden"
            >
              {/* Top Accent Gradient Line */}
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-500 via-indigo-600 to-amber-500" />

              {/* Close Button */}
              <button
                type="button"
                onClick={() => setIsAuthModalOpen(false)}
                className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Lock Icon */}
              <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200/80 flex items-center justify-center text-amber-600 mb-4 shadow-xs">
                <Lock className="w-6 h-6" />
              </div>

              <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight mb-2">
                Registro requerido para descargar
              </h3>

              <p className="text-sm text-slate-600 leading-relaxed mb-6">
                Para acceder y descargar el proyecto <strong className="text-slate-900">{projectTitle}</strong> es obligatorio contar con una cuenta registrada en NexStudio.
              </p>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 mb-6 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
                <p className="text-xs text-slate-600 leading-relaxed">
                  Inicia sesión de forma instantánea con tu cuenta de Google para desbloquear la descarga.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-3">
                <button
                  type="button"
                  id="modal-btn-signin-google"
                  onClick={handleSignInAndDownload}
                  disabled={isSigningIn}
                  className="w-full px-5 py-3.5 rounded-2xl bg-slate-900 hover:bg-slate-800 active:bg-slate-950 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-3 cursor-pointer disabled:opacity-50 min-h-[48px]"
                >
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
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
                      d="M5.28 14.28a7.197 7.197 0 0 1 0-4.56V6.57H1.25a11.966 11.966 0 0 0 0 10.86l4.03-3.15z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.57l4.03 3.15c.95-2.83 3.6-4.97 6.72-4.97z"
                    />
                  </svg>
                  <span>{isSigningIn ? 'Conectando...' : 'Iniciar Sesión con Google'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsAuthModalOpen(false)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer min-h-[42px]"
                >
                  Cancelar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
