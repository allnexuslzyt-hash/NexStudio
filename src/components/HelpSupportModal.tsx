import React, { useState } from 'react';
import { X, Send, Mail, CheckCircle2, MessageSquare, ExternalLink } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface HelpSupportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HelpSupportModal: React.FC<HelpSupportModalProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [senderName, setSenderName] = useState(user?.displayName || '');
  const [senderEmail, setSenderEmail] = useState(user?.email || '');
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    // Create mailto link with prefilled details
    const mailtoSubject = encodeURIComponent(subject ? `[Soporte NexStudio] ${subject}` : '[Soporte NexStudio] Consulta de usuario');
    const mailtoBody = encodeURIComponent(
      `Nombre: ${senderName || 'Usuario'}\nEmail: ${senderEmail || 'No especificado'}\n\nMensaje:\n${message}\n\n-- Enviado desde Centro de Ayuda NexStudio`
    );

    window.open(`mailto:nexuslzcontact@gmail.com?subject=${mailtoSubject}&body=${mailtoBody}`, '_blank');
    setSubmitted(true);
  };

  const resetAndClose = () => {
    setSubmitted(false);
    setSubject('');
    setMessage('');
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={resetAndClose}
      aria-modal="true"
      role="dialog"
    >
      <div 
        id="help-support-modal-content"
        className="relative w-full max-w-lg bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-200/80">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Formulario de Soporte</h3>
              <p className="text-xs text-slate-500">nexuslzcontact@gmail.com</p>
            </div>
          </div>

          <button
            type="button"
            id="close-support-modal-btn"
            onClick={resetAndClose}
            aria-label="Cerrar formulario"
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer shrink-0 min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {submitted ? (
          <div className="p-7 text-center space-y-4">
            <div className="w-12 h-12 mx-auto rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h4 className="text-lg font-bold text-slate-900">¡Mensaje preparado!</h4>
              <p className="text-xs sm:text-sm text-slate-600 max-w-sm mx-auto">
                Hemos abierto tu gestor de correo predeterminado dirigido a <span className="font-semibold text-slate-800">nexuslzcontact@gmail.com</span>.
              </p>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 text-left space-y-1">
              <p className="font-semibold text-slate-800">También puedes escribir directamente a:</p>
              <p className="font-mono text-indigo-600 select-all">nexuslzcontact@gmail.com</p>
            </div>
            <button
              type="button"
              onClick={resetAndClose}
              className="w-full py-2.5 px-4 rounded-xl bg-slate-900 text-white font-semibold text-sm hover:bg-slate-800 transition-colors cursor-pointer min-h-[44px]"
            >
              Listo, cerrar
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tu nombre
                </label>
                <input
                  type="text"
                  value={senderName}
                  onChange={(e) => setSenderName(e.target.value)}
                  placeholder="Tu nombre o alias"
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tu correo electrónico
                </label>
                <input
                  type="email"
                  value={senderEmail}
                  onChange={(e) => setSenderEmail(e.target.value)}
                  placeholder="ejemplo@gmail.com"
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Asunto del problema o duda
              </label>
              <input
                type="text"
                required
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Ej. Problema con el inicio de sesión..."
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Descripción detallada
              </label>
              <textarea
                required
                rows={4}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Explica qué ha sucedido, qué pasos seguiste y cualquier detalle relevante..."
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors resize-none"
              />
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
              <a
                href="https://discord.gg/qMFcBrHber"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-medium text-indigo-600 hover:text-indigo-800 transition-colors"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>¿Prefieres Discord? Ir al servidor</span>
                <ExternalLink className="w-3 h-3" />
              </a>

              <button
                type="submit"
                id="submit-support-btn"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold shadow-md shadow-indigo-600/20 transition-all cursor-pointer min-h-[44px]"
              >
                <Send className="w-4 h-4" />
                <span>Enviar consulta</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
