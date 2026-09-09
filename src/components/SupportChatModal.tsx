import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  MessageSquare, 
  Send, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  Headphones, 
  Plus, 
  ChevronLeft, 
  ShieldCheck, 
  User, 
  Mail, 
  HelpCircle,
  AlertCircle,
  Lock,
  LogIn
} from 'lucide-react';
import { useSupport } from '../context/SupportContext';
import { useAuth } from '../context/AuthContext';
import { TicketPriority } from '../types';

export const SupportChatModal: React.FC = () => {
  const { 
    isSupportModalOpen, 
    closeSupportModal, 
    userTickets, 
    activeTicket, 
    activeTicketId, 
    setActiveTicketId, 
    createTicket, 
    addMessageToTicket,
    isLoading 
  } = useSupport();

  const { user, signInWithGoogle } = useAuth();

  // Form states
  const [subject, setSubject] = useState('');
  const [contactEmail, setContactEmail] = useState(user?.email || '');
  const [priority, setPriority] = useState<TicketPriority>('media');
  const [initialMessage, setInitialMessage] = useState('');
  const [replyText, setReplyText] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  if (!isSupportModalOpen) return null;

  const handleCreateTicketSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!user) {
      setFormError('Debes estar registrado e iniciar sesión para abrir un ticket de soporte.');
      return;
    }

    if (!subject.trim()) {
      setFormError('Por favor introduce el motivo de tu consulta.');
      return;
    }

    const emailToUse = user.email || contactEmail.trim();
    if (!emailToUse || !emailToUse.includes('@')) {
      setFormError('Introduce un correo electrónico de contacto válido.');
      return;
    }

    if (!initialMessage.trim()) {
      setFormError('Escribe un mensaje explicando detalladamente tu problema o consulta.');
      return;
    }

    try {
      await createTicket({
        subject: subject.trim(),
        contactEmail: emailToUse,
        priority,
        initialMessage: initialMessage.trim()
      });
      // Reset form
      setSubject('');
      setInitialMessage('');
    } catch (err: any) {
      setFormError(err.message || 'Error al abrir el ticket de soporte.');
    }
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTicket || !replyText.trim()) return;

    const textToSend = replyText;
    setReplyText('');
    try {
      await addMessageToTicket(activeTicket.id, textToSend);
    } catch (err) {
      console.error('Error enviando respuesta:', err);
      setReplyText(textToSend);
    }
  };

  const priorityColors: Record<TicketPriority, { bg: string; text: string; border: string }> = {
    baja: { bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-300' },
    media: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
    alta: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
    urgente: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-xs">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 15 }}
        className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col h-[640px] max-h-[92vh]"
      >
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-slate-200 bg-slate-50/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {activeTicket && (
              <button
                type="button"
                onClick={() => setActiveTicketId(null)}
                className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer"
                title="Volver a la lista de tickets"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            )}
            <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
              <Headphones className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <span>Centro de Soporte en Vivo</span>
                {activeTicket && (
                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                    activeTicket.status === 'abierto' ? 'bg-amber-100 text-amber-800' :
                    activeTicket.status === 'en_proceso' ? 'bg-emerald-100 text-emerald-800' :
                    'bg-slate-100 text-slate-600'
                  }`}>
                    {activeTicket.status === 'abierto' ? 'Esperando Agente' :
                     activeTicket.status === 'en_proceso' ? 'En Atención' : 'Cerrado'}
                  </span>
                )}
              </h3>
              <p className="text-[11px] text-slate-500">
                {activeTicket ? activeTicket.subject : 'Abre un ticket con nuestro equipo para recibir asistencia técnica directa'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={closeSupportModal}
            className="p-1.5 rounded-xl hover:bg-slate-200 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {activeTicket ? (
            /* Active Ticket Chat View */
            <div className="flex-1 flex flex-col overflow-hidden bg-slate-50/50">
              {/* Ticket Info Bar */}
              <div className="px-5 py-3 bg-white border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-3">
                  <span className="text-slate-500">Prioridad:</span>
                  <span className={`px-2 py-0.5 rounded-md font-semibold text-[10px] uppercase border ${priorityColors[activeTicket.priority].bg} ${priorityColors[activeTicket.priority].text} ${priorityColors[activeTicket.priority].border}`}>
                    {activeTicket.priority}
                  </span>
                </div>
                <div className="text-slate-600 flex items-center gap-1.5 text-[11px]">
                  {activeTicket.claimedByName ? (
                    <>
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Atendido por: <strong className="text-slate-900">{activeTicket.claimedByName}</strong></span>
                    </>
                  ) : (
                    <>
                      <Clock className="w-3.5 h-3.5 text-amber-500" />
                      <span className="text-amber-600 font-medium">Esperando que un administrador reclame tu ticket...</span>
                    </>
                  )}
                </div>
              </div>

              {/* Chat Messages List */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
                {activeTicket.messages?.map((msg) => {
                  const isCurrentSender = msg.senderEmail === (user?.email || activeTicket.contactEmail) && !msg.isAdmin;
                  return (
                    <div
                      key={msg.id}
                      className={`flex gap-3 max-w-[85%] ${isCurrentSender ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
                    >
                      <img
                        src={msg.senderAvatar || `https://api.dicebear.com/7.x/identicon/svg?seed=${msg.senderName}`}
                        alt={msg.senderName}
                        referrerPolicy="no-referrer"
                        className="w-8 h-8 rounded-full object-cover border border-slate-200 shadow-xs shrink-0 mt-0.5"
                      />
                      <div className={`space-y-1 ${isCurrentSender ? 'items-end text-right' : 'items-start text-left'}`}>
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                          <span className="font-semibold text-slate-700">{msg.senderName}</span>
                          {msg.isAdmin && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-indigo-600 text-white">
                              Soporte Oficial
                            </span>
                          )}
                          <span className="text-[10px] text-slate-400">
                            {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <div
                          className={`p-3.5 rounded-2xl text-xs leading-relaxed ${
                            isCurrentSender
                              ? 'bg-indigo-600 text-white rounded-tr-xs shadow-xs'
                              : msg.isAdmin
                              ? 'bg-white border border-indigo-200 text-slate-800 rounded-tl-xs shadow-xs'
                              : 'bg-white border border-slate-200 text-slate-800 rounded-tl-xs shadow-xs'
                          }`}
                        >
                          {msg.text}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Ticket Input Footer */}
              {activeTicket.status === 'cerrado' ? (
                <div className="p-4 bg-slate-100 border-t border-slate-200 text-center text-xs text-slate-600 flex items-center justify-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Este ticket ha sido cerrado por el equipo de soporte.</span>
                  <button
                    type="button"
                    onClick={() => setActiveTicketId(null)}
                    className="ml-2 font-bold text-indigo-600 hover:underline cursor-pointer"
                  >
                    Abrir otro ticket
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSendReply} className="p-3 bg-white border-t border-slate-200 flex items-center gap-2">
                  <input
                    type="text"
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Escribe tu mensaje al equipo de soporte..."
                    className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-indigo-600 bg-slate-50 focus:bg-white"
                  />
                  <button
                    type="submit"
                    disabled={!replyText.trim()}
                    className="p-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-200 text-white transition-colors cursor-pointer"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              )}
            </div>
          ) : (
            /* Ticket Form / List View */
            <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
              {/* Left Column: Form to open new ticket or Login Prompt */}
              <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4 border-r border-slate-200">
                {!user ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4">
                    <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-xs">
                      <Lock className="w-7 h-7" />
                    </div>
                    <div className="space-y-1.5 max-w-sm">
                      <h4 className="text-base font-bold text-slate-900">
                        Acceso Exclusivo para Usuarios Registrados
                      </h4>
                      <p className="text-xs text-slate-500 leading-relaxed">
                        Para abrir un ticket de soporte técnico, recibir seguimiento personalizado y chatear con nuestro equipo administrativo, debes iniciar sesión en NexStudio.
                      </p>
                    </div>
                    <button
                      type="button"
                      id="btn-support-login-gate"
                      onClick={() => signInWithGoogle()}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
                    >
                      <LogIn className="w-4 h-4" />
                      <span>Iniciar Sesión para Abrir Ticket</span>
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-2 text-slate-800 font-bold text-sm">
                      <Plus className="w-4 h-4 text-indigo-600" />
                      <span>Abrir Nuevo Ticket de Soporte</span>
                    </div>

                    {formError && (
                      <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                        <span>{formError}</span>
                      </div>
                    )}

                    <form onSubmit={handleCreateTicketSubmit} className="space-y-4">
                      {/* Motivo / Asunto */}
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Motivo o Asunto de la Consulta *
                        </label>
                        <input
                          type="text"
                          value={subject}
                          onChange={(e) => setSubject(e.target.value)}
                          placeholder="Ej. Error al exportar proyecto, duda sobre dominios..."
                          className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-indigo-600"
                        />
                      </div>

                      {/* Correo de Contacto */}
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Correo Electrónico de Contacto (Cuenta Registrada)
                        </label>
                        <input
                          type="email"
                          value={user.email || contactEmail}
                          readOnly
                          className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-600 text-xs cursor-not-allowed"
                        />
                      </div>

                      {/* Prioridad */}
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                          Seleccionar Prioridad *
                        </label>
                        <div className="grid grid-cols-4 gap-2">
                          {(['baja', 'media', 'alta', 'urgente'] as TicketPriority[]).map((p) => {
                            const isSelected = priority === p;
                            return (
                              <button
                                key={p}
                                type="button"
                                onClick={() => setPriority(p)}
                                className={`py-2 px-2 rounded-xl text-xs font-semibold uppercase tracking-wider border transition-all cursor-pointer ${
                                  isSelected
                                    ? 'bg-indigo-600 border-indigo-600 text-white shadow-xs'
                                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                                }`}
                              >
                                {p}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Mensaje Detallado */}
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Mensaje Detallado *
                        </label>
                        <textarea
                          rows={4}
                          value={initialMessage}
                          onChange={(e) => setInitialMessage(e.target.value)}
                          placeholder="Describe qué ocurre, los pasos para reproducirlo o tu pregunta..."
                          className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-indigo-600 resize-none"
                        />
                      </div>

                      {/* Submit Button */}
                      <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <MessageSquare className="w-4 h-4" />
                        <span>Abrir Ticket y Comenzar Chat</span>
                      </button>
                    </form>
                  </>
                )}
              </div>

              {/* Right Column: User's Existing Tickets */}
              <div className="w-full md:w-72 bg-slate-50/60 p-5 overflow-y-auto space-y-3">
                <div className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center justify-between">
                  <span>Mis Tickets Recientes</span>
                  <span className="px-1.5 py-0.5 rounded-full bg-slate-200 text-slate-700 text-[10px]">
                    {userTickets.length}
                  </span>
                </div>

                {userTickets.length === 0 ? (
                  <div className="py-8 text-center text-slate-400 text-xs">
                    <HelpCircle className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    <p>No tienes tickets abiertos en este momento.</p>
                  </div>
                ) : (
                  userTickets.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setActiveTicketId(t.id)}
                      className="w-full text-left p-3 rounded-2xl bg-white border border-slate-200 hover:border-indigo-300 hover:shadow-xs transition-all space-y-1.5 cursor-pointer"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold uppercase ${
                          t.status === 'abierto' ? 'bg-amber-100 text-amber-800' :
                          t.status === 'en_proceso' ? 'bg-emerald-100 text-emerald-800' :
                          'bg-slate-100 text-slate-600'
                        }`}>
                          {t.status === 'abierto' ? 'Abierto' : t.status === 'en_proceso' ? 'En Atención' : 'Cerrado'}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {new Date(t.updatedAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                      <h4 className="text-xs font-bold text-slate-900 truncate">
                        {t.subject}
                      </h4>
                      <p className="text-[11px] text-slate-500 line-clamp-1">
                        {t.messages?.[t.messages.length - 1]?.text || 'Sin mensajes'}
                      </p>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};
