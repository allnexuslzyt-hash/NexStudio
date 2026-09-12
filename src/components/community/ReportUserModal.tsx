import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  AlertTriangle, 
  Flag, 
  ShieldAlert, 
  Send, 
  CheckCircle2, 
  LogIn, 
  UserX,
  FileWarning,
  MessageSquare,
  Sparkles,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useSupport } from '../../context/SupportContext';
import { TicketPriority } from '../../types';

interface ReportUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  reportedUser: {
    id: string;
    name: string;
    username?: string;
    photoURL?: string;
    role?: string;
  } | null;
}

const REPORT_CATEGORIES = [
  {
    id: 'spam',
    label: 'Spam o Publicidad no deseada',
    desc: 'Publicación masiva, enlaces engañosos, bots o promociones no autorizadas.',
    defaultPriority: 'media' as TicketPriority,
  },
  {
    id: 'offensive',
    label: 'Contenido Inapropiado u Ofensivo',
    desc: 'Lenguaje de odio, contenido explícito, discriminación o insultos reiterados.',
    defaultPriority: 'alta' as TicketPriority,
  },
  {
    id: 'harassment',
    label: 'Acoso o Amenazas',
    desc: 'Intimidación, hostigamiento hacia otros miembros o amenazas a la seguridad.',
    defaultPriority: 'urgente' as TicketPriority,
  },
  {
    id: 'impersonation',
    label: 'Suplantación de Identidad',
    desc: 'Hacerse pasar por administradores, otra persona u organización conocida.',
    defaultPriority: 'alta' as TicketPriority,
  },
  {
    id: 'malware',
    label: 'Distribución de Archivos Peligrosos',
    desc: 'Archivos ejecutables maliciosos, troyanos, virus o intentos de phishing.',
    defaultPriority: 'urgente' as TicketPriority,
  },
  {
    id: 'other',
    label: 'Otro Motivo Personalizado',
    desc: 'Cualquier otra infracción a las normas de convivencia de la comunidad.',
    defaultPriority: 'media' as TicketPriority,
  },
];

export const ReportUserModal: React.FC<ReportUserModalProps> = ({
  isOpen,
  onClose,
  reportedUser,
}) => {
  const { user, signInWithGoogle } = useAuth();
  const { createTicket, openSupportModal } = useSupport();

  const [selectedCategory, setSelectedCategory] = useState<string>('spam');
  const [priority, setPriority] = useState<TicketPriority>('media');
  const [customDescription, setCustomDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [createdTicketId, setCreatedTicketId] = useState<string | null>(null);

  if (!isOpen || !reportedUser) return null;

  const isSelf = user?.uid === reportedUser.id;

  const handleSelectCategory = (categoryId: string) => {
    setSelectedCategory(categoryId);
    const cat = REPORT_CATEGORIES.find((c) => c.id === categoryId);
    if (cat) {
      setPriority(cat.defaultPriority);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!user) {
      setErrorMessage('Debes iniciar sesión con Google para reportar a un usuario.');
      return;
    }

    if (isSelf) {
      setErrorMessage('No puedes reportar tu propia cuenta.');
      return;
    }

    if (!customDescription.trim() || customDescription.trim().length < 10) {
      setErrorMessage('Por favor proporciona una descripción detallada de al menos 10 caracteres.');
      return;
    }

    setIsSubmitting(true);

    try {
      const chosenCat = REPORT_CATEGORIES.find((c) => c.id === selectedCategory);
      const catLabel = chosenCat ? chosenCat.label : 'Infracción';
      const subject = `[REPORTE USUARIO] @${reportedUser.username || reportedUser.name} - ${catLabel}`;

      const reportBody = [
        `🚨 **NUEVO REPORTE DE USUARIO EN COMUNIDAD NEXSTUDIO**`,
        `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
        `👤 **Usuario Reportado:** ${reportedUser.name} (@${reportedUser.username || 'sin_usuario'})`,
        `🆔 **ID del Usuario:** ${reportedUser.id}`,
        `🏷️ **Categoría / Motivo:** ${catLabel}`,
        `⚡ **Nivel de Prioridad:** ${priority.toUpperCase()}`,
        `📅 **Fecha del Reporte:** ${new Date().toLocaleString('es-ES')}`,
        `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
        `📝 **Detalles y Explicación del Denunciante:**`,
        `${customDescription.trim()}`,
        `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
        `⚠️ *Este ticket ha sido generado automáticamente para el equipo de moderación. Revisar historial y perfil del usuario reportado.*`
      ].join('\n\n');

      const newTicket = await createTicket({
        subject,
        contactEmail: user.email || 'noreply@nexstudio.app',
        priority,
        initialMessage: reportBody,
      });

      setCreatedTicketId(newTicket.id);
    } catch (err: any) {
      console.error('Error al generar ticket de reporte:', err);
      setErrorMessage(err.message || 'Error al procesar el reporte y crear el ticket.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetAndClose = () => {
    setSelectedCategory('spam');
    setPriority('media');
    setCustomDescription('');
    setErrorMessage(null);
    setCreatedTicketId(null);
    onClose();
  };

  const handleOpenTicketChat = () => {
    if (createdTicketId) {
      handleResetAndClose();
      openSupportModal(createdTicketId);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={handleResetAndClose}
      aria-modal="true"
      role="dialog"
    >
      <div 
        id="report-user-modal-container"
        className="relative w-full max-w-xl bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 max-h-[92vh] flex flex-col text-left"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Encabezado */}
        <div className="flex items-center justify-between p-5 sm:p-6 border-b border-slate-100 bg-rose-50/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-rose-100 text-rose-600 border border-rose-200 shrink-0">
              <Flag className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-slate-900">
                Reportar Usuario a Moderación
              </h3>
              <p className="text-xs text-slate-500">
                Se creará un ticket oficial de soporte para revisión inmediata.
              </p>
            </div>
          </div>

          <button
            type="button"
            id="btn-close-report-modal"
            onClick={handleResetAndClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tarjeta del Usuario Reportado */}
        <div className="px-5 sm:px-6 py-3 bg-slate-50/80 border-b border-slate-100 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <img
              src={reportedUser.photoURL || `https://api.dicebear.com/7.x/identicon/svg?seed=${reportedUser.id}`}
              alt={reportedUser.name}
              className="w-10 h-10 rounded-xl object-cover border border-slate-200 bg-white shrink-0"
              referrerPolicy="no-referrer"
            />
            <div className="min-w-0">
              <p className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                {reportedUser.name}
              </p>
              <p className="text-[11px] text-slate-500 truncate">
                @{reportedUser.username || 'usuario'} · ID: {reportedUser.id.substring(0, 10)}...
              </p>
            </div>
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md bg-rose-100/70 text-rose-700 border border-rose-200 shrink-0">
            Reportando
          </span>
        </div>

        {/* CUERPO DEL MODAL */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
          {createdTicketId ? (
            /* Estado de Éxito al Generar el Ticket */
            <div className="py-6 text-center space-y-4">
              <div className="w-16 h-16 mx-auto rounded-3xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200 shadow-sm">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div className="space-y-1.5">
                <h4 className="text-xl font-extrabold text-slate-900">
                  ¡Ticket de Reporte Creado!
                </h4>
                <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto">
                  Hemos registrado tu reporte bajo el ticket oficial con identificador:
                </p>
                <div className="inline-block font-mono text-sm font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 px-3.5 py-1.5 rounded-xl">
                  {createdTicketId}
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-600 text-left space-y-2 max-w-md mx-auto">
                <p className="font-semibold text-slate-800 flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4 text-indigo-600" />
                  Próximos pasos de moderación:
                </p>
                <p>
                  Nuestro equipo revisará las publicaciones y actividad de <strong>{reportedUser.name}</strong>. Podrás responder o consultar actualizaciones directamente desde el chat de soporte.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  id="btn-view-created-ticket"
                  onClick={handleOpenTicketChat}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs sm:text-sm shadow-md shadow-indigo-600/20 transition-all cursor-pointer flex items-center justify-center gap-2 min-h-[44px]"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Ver Ticket en Soporte</span>
                </button>
                <button
                  type="button"
                  id="btn-close-success-report"
                  onClick={handleResetAndClose}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs sm:text-sm transition-colors cursor-pointer min-h-[44px]"
                >
                  Cerrar
                </button>
              </div>
            </div>
          ) : !user ? (
            /* Requiere inicio de sesión */
            <div className="py-8 text-center space-y-4">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-200">
                <LogIn className="w-7 h-7" />
              </div>
              <div className="space-y-1 max-w-sm mx-auto">
                <h4 className="text-base font-bold text-slate-900">
                  Inicia sesión para enviar reportes
                </h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Para mantener la integridad de la comunidad y asociar el ticket a tu seguimiento, es necesario iniciar sesión.
                </p>
              </div>
              <button
                type="button"
                id="btn-login-to-report"
                onClick={signInWithGoogle}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs sm:text-sm shadow-md shadow-indigo-600/20 transition-all cursor-pointer inline-flex items-center gap-2 min-h-[44px]"
              >
                <LogIn className="w-4 h-4" />
                <span>Continuar con Google</span>
              </button>
            </div>
          ) : isSelf ? (
            /* No puede reportarse a sí mismo */
            <div className="py-8 text-center space-y-3">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-200">
                <UserX className="w-6 h-6" />
              </div>
              <h4 className="text-base font-bold text-slate-900">
                Esta es tu propia cuenta
              </h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                No puedes reportar tu propio perfil de creador.
              </p>
            </div>
          ) : (
            /* Formulario Completo de Reporte */
            <form onSubmit={handleSubmit} className="space-y-5">
              {errorMessage && (
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* 1. Selección de Categoría */}
              <div>
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                  1. Selecciona el motivo principal:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {REPORT_CATEGORIES.map((cat) => {
                    const isSelected = selectedCategory === cat.id;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => handleSelectCategory(cat.id)}
                        className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                          isSelected
                            ? 'bg-rose-50/70 border-rose-500 ring-2 ring-rose-500/20 shadow-xs'
                            : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/60'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <span className={`text-xs font-bold ${isSelected ? 'text-rose-900' : 'text-slate-800'}`}>
                            {cat.label}
                          </span>
                          <span className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center shrink-0 mt-0.5 ${
                            isSelected ? 'border-rose-600 bg-rose-600' : 'border-slate-300'
                          }`}>
                            {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 leading-tight">
                          {cat.desc}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2. Prioridad de Urgencia */}
              <div>
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                  2. Nivel de Urgencia:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {(['baja', 'media', 'alta', 'urgente'] as TicketPriority[]).map((p) => {
                    const isSelected = priority === p;
                    const styles = {
                      baja: 'text-emerald-700 bg-emerald-50 border-emerald-200',
                      media: 'text-sky-700 bg-sky-50 border-sky-200',
                      alta: 'text-amber-700 bg-amber-50 border-amber-200',
                      urgente: 'text-rose-700 bg-rose-50 border-rose-200',
                    }[p];
                    return (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setPriority(p)}
                        className={`py-2 px-3 rounded-xl border text-center text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                          isSelected
                            ? `${styles} ring-2 ring-offset-1 ring-slate-400 font-extrabold shadow-xs`
                            : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                        }`}
                      >
                        {p}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 3. Personalización / Descripción detallada */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    3. Detalla o personaliza el reporte:
                  </label>
                  <span className="text-[11px] text-slate-400">
                    {customDescription.length}/500
                  </span>
                </div>
                <textarea
                  id="report-user-custom-description"
                  value={customDescription}
                  onChange={(e) => setCustomDescription(e.target.value)}
                  maxLength={500}
                  rows={4}
                  placeholder="Explica qué ocurrió, incluye enlaces a publicaciones específicas o detalles que faciliten la revisión del equipo de moderación..."
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm text-slate-800 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500/20 resize-none transition-all placeholder:text-slate-400"
                />
              </div>

              {/* Footer con Botón de Creación del Ticket */}
              <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={handleResetAndClose}
                  disabled={isSubmitting}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold text-xs transition-colors cursor-pointer min-h-[42px]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  id="btn-submit-report-ticket"
                  disabled={isSubmitting || customDescription.trim().length < 10}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs sm:text-sm shadow-md shadow-rose-600/20 transition-all cursor-pointer flex items-center justify-center gap-2 min-h-[42px] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  <span>Crear Ticket de Reporte</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
