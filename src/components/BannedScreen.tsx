import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShieldAlert, 
  Clock, 
  AlertTriangle, 
  LogOut, 
  Send, 
  CheckCircle2, 
  MessageSquare, 
  FileText,
  UserX,
  Scale,
  Calendar,
  Info,
  Loader2,
  Lock
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSupport } from '../context/SupportContext';

export const BannedScreen: React.FC = () => {
  const { user, profile, signOut } = useAuth();
  const { 
    submitBanAppeal, 
    hasSubmittedBanAppeal, 
    userBanAppealTicket, 
    addMessageToTicket,
    isLoading 
  } = useSupport();

  const [appealExplanation, setAppealExplanation] = useState('');
  const [replyMessage, setReplyMessage] = useState('');
  const [isSubmittingAppeal, setIsSubmittingAppeal] = useState(false);
  const [appealError, setAppealError] = useState<string | null>(null);
  const [appealSuccessMsg, setAppealSuccessMsg] = useState<string | null>(null);

  const banReason = profile?.banReason || 'Incumplimiento de las Normas de la Comunidad y Términos de Servicio de NexStudio.';
  const banDuration = profile?.banDuration || (profile?.status === 'baneado' ? 'Permanente' : 'Suspensión Temporal');
  const isPermanent = profile?.status === 'baneado' || banDuration.toLowerCase().includes('permanente');

  const formatDateTime = (isoString?: string) => {
    if (!isoString) return 'Registrado en el sistema';
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return isoString;
    }
  };

  const calculateRemainingTime = () => {
    if (isPermanent) return 'Indefinido';
    if (!profile?.banExpiresAt) return banDuration;
    try {
      const diffMs = new Date(profile.banExpiresAt).getTime() - Date.now();
      if (diffMs <= 0) return 'Expirando en breves momentos...';
      const hours = Math.floor(diffMs / (1000 * 60 * 60));
      const days = Math.floor(hours / 24);
      if (days > 0) {
        return `Aproximadamente ${days} día(s) y ${hours % 24} hora(s)`;
      }
      const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      return `${hours} hora(s) y ${minutes} minuto(s)`;
    } catch {
      return banDuration;
    }
  };

  const handleSendAppeal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!appealExplanation.trim() || appealExplanation.trim().length < 15) {
      setAppealError('Por favor, ingresa una explicación con al menos 15 caracteres.');
      return;
    }

    try {
      setIsSubmittingAppeal(true);
      setAppealError(null);
      await submitBanAppeal(appealExplanation.trim());
      setAppealSuccessMsg('Tu reclamación oficial ha sido registrada exitosamente y enviada al equipo de administración.');
      setAppealExplanation('');
    } catch (err: any) {
      setAppealError(err.message || 'Error al enviar la reclamación.');
    } finally {
      setIsSubmittingAppeal(false);
    }
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyMessage.trim() || !userBanAppealTicket) return;

    try {
      await addMessageToTicket(userBanAppealTicket.id, replyMessage.trim());
      setReplyMessage('');
    } catch (err) {
      console.error('Error enviando mensaje:', err);
    }
  };

  return (
    <div className="min-h-screen w-full bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-rose-600 selection:text-white relative overflow-x-hidden">
      {/* Background Ambience */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[500px] rounded-full bg-rose-950/20 blur-[140px]" />
        <div className="absolute -bottom-40 right-1/4 w-[600px] h-[400px] rounded-full bg-amber-950/15 blur-[140px]" />
        <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] opacity-20" />
      </div>

      {/* Top Header Bar */}
      <header className="relative z-20 w-full border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-gradient-to-tr from-rose-600 to-amber-600 shadow-md shadow-rose-900/40">
            <Lock className="w-4 h-4 text-white" />
          </div>
          <div>
            <span className="text-sm font-black tracking-tight text-white block">NexStudio</span>
            <span className="text-[10px] uppercase font-bold tracking-wider text-rose-400">Control de Seguridad</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex flex-col text-right">
            <span className="text-xs font-semibold text-slate-200 truncate max-w-[200px]">
              {profile?.displayName || user?.displayName || 'Usuario Sancionado'}
            </span>
            <span className="text-[11px] text-slate-400 truncate max-w-[200px]">
              {user?.email}
            </span>
          </div>

          <button
            type="button"
            id="ban-logout-btn"
            onClick={() => signOut()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-medium text-slate-300 hover:text-white transition-all cursor-pointer min-h-[38px]"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Cerrar sesión</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="relative z-10 flex-1 w-full max-w-4xl mx-auto px-4 py-8 sm:py-12 flex flex-col items-center">
        {/* Status Badge */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-bold tracking-wider uppercase mb-6 shadow-sm"
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500" />
          </span>
          <span>{isPermanent ? 'Acceso Denegado: Baneo Permanente' : 'Acceso Denegado: Suspensión Temporal'}</span>
        </motion.div>

        {/* Icon & Title */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.4 }}
          className="text-center max-w-2xl space-y-3 mb-8"
        >
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-rose-950/40 border border-rose-500/30 flex items-center justify-center text-rose-500 mx-auto shadow-xl shadow-rose-950/50">
            <ShieldAlert className="w-9 h-9 sm:w-11 sm:h-11" />
          </div>

          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight">
            Tu acceso a NexStudio ha sido restringido
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 leading-relaxed max-w-lg mx-auto">
            Se ha detectado una infracción en tu cuenta. Mientras la sanción esté activa, no podrás acceder a las herramientas, proyectos ni espacios de trabajo.
          </p>
        </motion.div>

        {/* Sanction Details Grid */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.4 }}
          className="w-full grid grid-cols-1 md:grid-cols-2 gap-4 mb-8"
        >
          {/* Motivo del baneo */}
          <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800/90 shadow-xl space-y-2.5 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-rose-400 mb-1">
                <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
                <span>Motivo de la Sanción</span>
              </div>
              <p className="text-sm font-semibold text-slate-100 leading-snug">
                {banReason}
              </p>
            </div>
            <div className="pt-3 border-t border-slate-800/80 text-[11px] text-slate-400 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-500" />
              <span>Aplicado el: <strong>{formatDateTime(profile?.bannedAt)}</strong></span>
            </div>
          </div>

          {/* Tiempo / Duración */}
          <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800/90 shadow-xl space-y-2.5 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-400 mb-1">
                <Clock className="w-4 h-4 text-amber-500 shrink-0" />
                <span>Tiempo y Duración</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-base font-extrabold ${isPermanent ? 'text-rose-400' : 'text-amber-300'}`}>
                  {banDuration}
                </span>
                <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide ${
                  isPermanent 
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' 
                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                }`}>
                  {isPermanent ? 'Sin vencimiento' : 'Temporal'}
                </span>
              </div>
              {!isPermanent && profile?.banExpiresAt && (
                <p className="text-xs text-slate-300 mt-1.5">
                  Fecha de reapertura: <strong className="text-slate-100">{formatDateTime(profile.banExpiresAt)}</strong>
                </p>
              )}
            </div>
            <div className="pt-3 border-t border-slate-800/80 text-[11px] text-slate-400 flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-slate-500" />
              <span>Tiempo restante: <strong className="text-slate-200">{calculateRemainingTime()}</strong></span>
            </div>
          </div>
        </motion.div>

        {/* Section: Right to a Single Ban Appeal Ticket */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          className="w-full rounded-2xl bg-slate-900/80 border border-slate-800 shadow-2xl p-6 sm:p-7 space-y-6"
        >
          {/* Header of Appeal Section */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-950/60 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
                <Scale className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <span>Derecho a Reclamación de Sanción</span>
                  <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[10px] font-bold uppercase">
                    1 Ticket Único
                  </span>
                </h2>
                <p className="text-xs text-slate-400">
                  Todo usuario sancionado tiene derecho a abrir un único ticket oficial de reclamación ante la administración.
                </p>
              </div>
            </div>

            {hasSubmittedBanAppeal && (
              <span className="px-3 py-1 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold flex items-center gap-1.5 self-start sm:self-center">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Ticket en curso</span>
              </span>
            )}
          </div>

          {/* If NOT submitted yet: Show Appeal Form */}
          {!hasSubmittedBanAppeal ? (
            <form onSubmit={handleSendAppeal} className="space-y-4">
              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs leading-relaxed flex items-start gap-3">
                <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="font-semibold block mb-0.5">Norma de Apelación Única:</strong>
                  Solo puedes enviar <strong>un único ticket de reclamación</strong> para esta sanción. Asegúrate de incluir todos los argumentos, justificaciones y aclaraciones pertinentes de manera respetuosa y detallada.
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Motivo o justificación de tu reclamación:
                </label>
                <textarea
                  id="ban-appeal-textarea"
                  rows={4}
                  value={appealExplanation}
                  onChange={(e) => setAppealExplanation(e.target.value)}
                  placeholder="Explica detalladamente por qué consideras que la sanción debe ser reconsiderada, cualquier malentendido ocurrido o tu compromiso con las normas..."
                  className="w-full p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 leading-relaxed"
                />
                <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1">
                  <span>Mínimo 15 caracteres para enviar.</span>
                  <span>{appealExplanation.trim().length} / 1500 caracteres</span>
                </div>
              </div>

              {appealError && (
                <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs">
                  {appealError}
                </div>
              )}

              <button
                type="submit"
                id="ban-appeal-submit-btn"
                disabled={isSubmittingAppeal || appealExplanation.trim().length < 15}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-500 text-white text-xs sm:text-sm font-bold shadow-lg shadow-indigo-950/40 transition-all cursor-pointer min-h-[44px]"
              >
                {isSubmittingAppeal ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Enviando reclamación...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Enviar Reclamación Oficial (Único Intento)</span>
                  </>
                )}
              </button>
            </form>
          ) : (
            /* If ALREADY submitted: Show Ticket Status & Interactive Chat Thread */
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white">
                      Expediente #{userBanAppealTicket?.id || profile?.appealTicketId || 'Apelación'}
                    </span>
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                      userBanAppealTicket?.status === 'cerrado'
                        ? 'bg-slate-800 text-slate-300 border border-slate-700'
                        : userBanAppealTicket?.status === 'en_proceso'
                        ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
                        : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    }`}>
                      {userBanAppealTicket?.status === 'cerrado'
                        ? 'Resolución Emitida'
                        : userBanAppealTicket?.status === 'en_proceso'
                        ? 'En Revisión Activa'
                        : 'En Espera de Revisión'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Has utilizado tu derecho a un único ticket de reclamación. No es posible crear tickets adicionales.
                  </p>
                </div>

                <div className="text-xs text-slate-400 sm:text-right shrink-0">
                  <span>Enviado: {formatDateTime(userBanAppealTicket?.createdAt)}</span>
                </div>
              </div>

              {appealSuccessMsg && (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs">
                  {appealSuccessMsg}
                </div>
              )}

              {/* Chat Thread Messages */}
              <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                {userBanAppealTicket?.messages?.map((msg) => {
                  const isStaff = msg.isAdmin || msg.senderRole === 'staff';
                  return (
                    <div
                      key={msg.id}
                      className={`p-3.5 rounded-2xl text-xs space-y-1 ${
                        isStaff
                          ? 'bg-indigo-950/40 border border-indigo-500/30 text-indigo-100 ml-4'
                          : 'bg-slate-950 border border-slate-800 text-slate-200 mr-4'
                      }`}
                    >
                      <div className="flex items-center justify-between text-[10px] font-semibold text-slate-400">
                        <span className={isStaff ? 'text-indigo-300 font-bold' : 'text-slate-300'}>
                          {isStaff ? '🛡️ Equipo de Administración / Soporte' : 'Tú (Reclamante)'}
                        </span>
                        <span>{formatDateTime(msg.timestamp)}</span>
                      </div>
                      <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                    </div>
                  );
                })}
              </div>

              {/* Reply Box if Ticket is not closed */}
              {userBanAppealTicket?.status !== 'cerrado' ? (
                <form onSubmit={handleSendReply} className="pt-2 flex gap-2">
                  <input
                    type="text"
                    value={replyMessage}
                    onChange={(e) => setReplyMessage(e.target.value)}
                    placeholder="Escribe una respuesta o aclaración adicional en este expediente..."
                    className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                  <button
                    type="submit"
                    disabled={!replyMessage.trim()}
                    className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-white text-xs font-semibold cursor-pointer shrink-0 transition-colors"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </form>
              ) : (
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-center text-xs text-slate-400">
                  Este expediente de reclamación ha sido concluido por la administración.
                </div>
              )}
            </div>
          )}
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 w-full border-t border-slate-900 bg-slate-950/80 px-4 py-4 text-center text-xs text-slate-500">
        <p>NexStudio &bull; Sistema de Seguridad y Cumplimiento Normativo</p>
      </footer>
    </div>
  );
};
