import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowLeft,
  Headphones, 
  Bot, 
  Plus, 
  Send, 
  Clock, 
  CheckCircle2, 
  ShieldCheck, 
  Mail, 
  AlertCircle,
  LogIn,
  RotateCcw,
  MessageSquare,
  Search,
  X,
  Layers,
  Check,
  User,
  ExternalLink
} from 'lucide-react';
import { useSupport } from '../context/SupportContext';
import { useAuth } from '../context/AuthContext';
import { TicketPriority, SupportTicket } from '../types';
import { JaimeChatSection } from './JaimeChatSection';

interface SupportPageViewProps {
  onBack: () => void;
}

// Quick suggestions for ticket subjects
const QUICK_TOPICS = [
  'Problema con ejecutable NexClean (.exe)',
  'Duda sobre NexBoost y memoria RAM',
  'Error o incidencia con mi cuenta',
  'Sugerencia o reporte técnico'
];

export const SupportPageView: React.FC<SupportPageViewProps> = ({ onBack }) => {
  const { 
    userTickets, 
    activeTicket, 
    activeTicketId, 
    setActiveTicketId, 
    createTicket, 
    addMessageToTicket,
    closeTicket,
    reopenTicket,
    isLoading 
  } = useSupport();

  const { user, signInWithGoogle } = useAuth();

  // Primary navigation tab: 'tickets' (Human Support) vs 'jaime' (AI Assistant)
  const [activeTab, setActiveTab] = useState<'tickets' | 'jaime'>('tickets');

  // Form states for creating a new ticket
  const [isCreatingNewTicket, setIsCreatingNewTicket] = useState<boolean>(false);
  const [subject, setSubject] = useState('');
  const [contactEmail, setContactEmail] = useState(user?.email || '');
  const [priority, setPriority] = useState<TicketPriority>('media');
  const [initialMessage, setInitialMessage] = useState('');
  const [replyText, setReplyText] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Search and filter in tickets list
  const [statusFilter, setStatusFilter] = useState<'all' | 'abierto' | 'cerrado'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Ref to chat messages container for smooth scrolling to latest message
  const chatMessagesEndRef = useRef<HTMLDivElement>(null);

  // Sync contact email with logged-in user
  useEffect(() => {
    if (user?.email && !contactEmail) {
      setContactEmail(user.email);
    }
  }, [user, contactEmail]);

  // If an active ticket is set, show tickets tab and hide creation form
  useEffect(() => {
    if (activeTicketId) {
      setActiveTab('tickets');
      setIsCreatingNewTicket(false);
    }
  }, [activeTicketId]);

  // Smooth scroll to bottom on new messages
  useEffect(() => {
    if (activeTicket?.messages) {
      chatMessagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [activeTicket?.messages?.length]);

  // Priority metadata with badges and descriptions
  const priorityConfig: Record<TicketPriority, { 
    label: string; 
    badge: string; 
    dot: string;
    desc: string;
  }> = {
    baja: { 
      label: 'Baja', 
      badge: 'bg-slate-100 text-slate-700 border-slate-200', 
      dot: 'bg-slate-400',
      desc: 'Consultas generales sin urgencia'
    },
    media: { 
      label: 'Media', 
      badge: 'bg-blue-50 text-blue-700 border-blue-200', 
      dot: 'bg-blue-500',
      desc: 'Preguntas técnicas estándar'
    },
    alta: { 
      label: 'Alta', 
      badge: 'bg-amber-50 text-amber-800 border-amber-200', 
      dot: 'bg-amber-500',
      desc: 'Fallos que impiden usar funciones'
    },
    urgente: { 
      label: 'Urgente', 
      badge: 'bg-rose-50 text-rose-700 border-rose-200', 
      dot: 'bg-rose-500',
      desc: 'Bloqueos críticos o errores graves'
    }
  };

  // Metrics
  const totalTickets = userTickets.length;
  const openTickets = userTickets.filter(t => t.status === 'abierto' || t.status === 'en_proceso').length;
  const closedTickets = userTickets.filter(t => t.status === 'resuelto' || t.status === 'cerrado').length;

  // Filtered & sorted tickets (Most recent first)
  const filteredTickets = userTickets
    .filter((ticket) => {
      const matchesStatus = 
        statusFilter === 'all' 
          ? true 
          : statusFilter === 'abierto' 
            ? ticket.status === 'abierto' || ticket.status === 'en_proceso'
            : ticket.status === 'resuelto' || ticket.status === 'cerrado';

      const matchesSearch = 
        !searchQuery.trim() ||
        ticket.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ticket.id.toLowerCase().includes(searchQuery.toLowerCase());

      return matchesStatus && matchesSearch;
    })
    .sort((a, b) => {
      const timeA = new Date(a.updatedAt || a.createdAt).getTime();
      const timeB = new Date(b.updatedAt || b.createdAt).getTime();
      return timeB - timeA;
    });

  // Submit new ticket
  const handleCreateTicketSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!user) {
      setFormError('Debes iniciar sesión con Google para abrir un ticket.');
      return;
    }

    if (!subject.trim()) {
      setFormError('Por favor especifica el asunto de tu problema.');
      return;
    }

    const emailToUse = user.email || contactEmail.trim();
    if (!emailToUse || !emailToUse.includes('@')) {
      setFormError('Introduce un correo electrónico de contacto válido.');
      return;
    }

    if (!initialMessage.trim()) {
      setFormError('Por favor describe tu caso con el mayor detalle posible.');
      return;
    }

    setIsSubmitting(true);
    try {
      const newTicket = await createTicket({
        subject: subject.trim(),
        priority,
        contactEmail: emailToUse,
        initialMessage: initialMessage.trim()
      });

      setSubject('');
      setInitialMessage('');
      setIsCreatingNewTicket(false);
      setActiveTicketId(newTicket.id);
    } catch (err: any) {
      console.error('Error creando ticket:', err);
      setFormError(err.message || 'Error al crear el ticket. Inténtalo de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Send reply in ticket
  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTicket || !replyText.trim() || isLoading) return;

    const text = replyText.trim();
    setReplyText('');
    try {
      await addMessageToTicket(activeTicket.id, text);
    } catch (err) {
      console.error('Error enviando respuesta:', err);
      setReplyText(text);
    }
  };

  return (
    <div className="w-full bg-slate-50 text-slate-900 flex flex-col min-h-[calc(100vh-64px)] pb-16">
      
      {/* ========================================================================= */}
      {/* 1. BARRA SUPERIOR DE NAVEGACIÓN Y PESTAÑAS */}
      {/* ========================================================================= */}
      <div className="w-full bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          
          {/* Botón Volver y Título */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              id="support-back-button"
              onClick={onBack}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 hover:border-slate-300 hover:bg-slate-100 text-slate-700 text-xs sm:text-sm font-semibold transition-all cursor-pointer shadow-2xs"
            >
              <ArrowLeft className="w-4 h-4 text-slate-600" />
              <span>Volver</span>
            </button>
            <div className="h-4 w-px bg-slate-200 hidden sm:block" />
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-slate-900">Centro de Soporte Técnico</span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                En Línea
              </span>
            </div>
          </div>

          {/* Selector de Pestañas: Tickets vs Jaime IA */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl border border-slate-200/80 self-start sm:self-auto">
            <button
              type="button"
              id="tab-btn-tickets"
              onClick={() => setActiveTab('tickets')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'tickets'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Headphones className="w-3.5 h-3.5 text-indigo-600" />
              <span>Tickets Técnicos</span>
              {totalTickets > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                  {totalTickets}
                </span>
              )}
            </button>

            <button
              type="button"
              id="tab-btn-jaime"
              onClick={() => setActiveTab('jaime')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'jaime'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Bot className="w-3.5 h-3.5 text-slate-600" />
              <span>Jaime IA</span>
              <span className="px-1.5 py-0.2 rounded text-[9px] font-extrabold bg-indigo-50 text-indigo-700 border border-indigo-200/60">
                24/7
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. CONTENIDO PRINCIPAL */}
      {/* ========================================================================= */}
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 flex-1 flex flex-col">
        
        {activeTab === 'jaime' ? (
          /* ===================================================================== */
          /* PESTAÑA: JAIME IA ASISTENTE VIRTUAL */
          /* ===================================================================== */
          <div className="w-full max-w-4xl mx-auto flex-1 flex flex-col bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <JaimeChatSection onSwitchToTickets={() => setActiveTab('tickets')} />
          </div>
        ) : (
          /* ===================================================================== */
          /* PESTAÑA: TICKETS TÉCNICOS */
          /* ===================================================================== */
          <div className="flex-1 flex flex-col gap-6">
            
            {/* Barra de Estadísticas y Acción */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
              
              {/* Tarjetas de métricas que actúan como filtros */}
              <div className="grid grid-cols-3 gap-3 flex-1">
                {/* Total */}
                <button
                  type="button"
                  onClick={() => setStatusFilter('all')}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between gap-2 ${
                    statusFilter === 'all'
                      ? 'bg-white border-indigo-400 ring-2 ring-indigo-500/10 shadow-xs'
                      : 'bg-white border-slate-200 hover:border-slate-300 shadow-2xs'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                      <Headphones className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Total</p>
                      <p className="text-base font-extrabold text-slate-900 leading-none mt-0.5">{totalTickets}</p>
                    </div>
                  </div>
                </button>

                {/* Abiertos */}
                <button
                  type="button"
                  onClick={() => setStatusFilter('abierto')}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between gap-2 ${
                    statusFilter === 'abierto'
                      ? 'bg-white border-amber-400 ring-2 ring-amber-500/10 shadow-xs'
                      : 'bg-white border-slate-200 hover:border-slate-300 shadow-2xs'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                      <Clock className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Abiertos</p>
                      <p className="text-base font-extrabold text-slate-900 leading-none mt-0.5">{openTickets}</p>
                    </div>
                  </div>
                </button>

                {/* Resueltos */}
                <button
                  type="button"
                  onClick={() => setStatusFilter('cerrado')}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between gap-2 ${
                    statusFilter === 'cerrado'
                      ? 'bg-white border-emerald-400 ring-2 ring-emerald-500/10 shadow-xs'
                      : 'bg-white border-slate-200 hover:border-slate-300 shadow-2xs'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Cerrados</p>
                      <p className="text-base font-extrabold text-slate-900 leading-none mt-0.5">{closedTickets}</p>
                    </div>
                  </div>
                </button>
              </div>

              {/* Botón Abrir Nuevo Ticket */}
              <button
                type="button"
                id="btn-create-new-ticket"
                onClick={() => {
                  setIsCreatingNewTicket(true);
                  setActiveTicketId(null);
                }}
                className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs sm:text-sm shadow-xs transition-all cursor-pointer shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>Abrir Nuevo Ticket</span>
              </button>
            </div>

            {/* Aviso si el usuario no ha iniciado sesión */}
            {!user && (
              <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
                <div className="flex items-center gap-2.5">
                  <LogIn className="w-5 h-5 text-amber-600 shrink-0" />
                  <div>
                    <p className="text-xs font-bold">Inicia sesión para gestionar tus tickets</p>
                    <p className="text-[11px] text-amber-700">Podrás consultar el estado de tus consultas y recibir respuestas de los técnicos.</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => signInWithGoogle()}
                  className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-colors cursor-pointer shrink-0"
                >
                  Iniciar Sesión con Google
                </button>
              </div>
            )}

            {/* =============================================================== */}
            {/* DISTRIBUCIÓN PRINCIPAL EN 2 COLUMNAS */}
            {/* =============================================================== */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              
              {/* ------------------------------------------------------------- */}
              {/* COLUMNA IZQUIERDA: BANDEJA DE TICKETS (lg:col-span-5) */}
              {/* ------------------------------------------------------------- */}
              <div className={`lg:col-span-5 flex flex-col gap-3 ${
                // In mobile, if viewing active ticket or creating, hide list
                (activeTicket || isCreatingNewTicket) ? 'hidden lg:flex' : 'flex'
              }`}>
                
                {/* Caja de Búsqueda y Filtros */}
                <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Bandeja de Tickets</span>
                    </h3>
                    <span className="text-[11px] font-bold text-slate-400">
                      {filteredTickets.length} {filteredTickets.length === 1 ? 'ticket' : 'tickets'}
                    </span>
                  </div>

                  {/* Buscador */}
                  <div className="relative flex items-center">
                    <Search className="absolute left-3 w-4 h-4 text-slate-400 pointer-events-none" />
                    <input
                      type="text"
                      id="search-ticket-input"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Buscar por asunto o ID..."
                      className="w-full pl-9 pr-8 py-2 bg-slate-50 focus:bg-white border border-slate-200 focus:border-indigo-600 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none transition-all"
                    />
                    {searchQuery && (
                      <button
                        type="button"
                        onClick={() => setSearchQuery('')}
                        className="absolute right-2.5 p-1 rounded-md text-slate-400 hover:text-slate-700 transition-colors"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Segmented Filter */}
                  <div className="grid grid-cols-3 gap-1 p-1 bg-slate-100 rounded-xl text-center">
                    <button
                      type="button"
                      onClick={() => setStatusFilter('all')}
                      className={`py-1 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
                        statusFilter === 'all'
                          ? 'bg-white text-indigo-700 shadow-2xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Todos ({totalTickets})
                    </button>
                    <button
                      type="button"
                      onClick={() => setStatusFilter('abierto')}
                      className={`py-1 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
                        statusFilter === 'abierto'
                          ? 'bg-white text-amber-700 shadow-2xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Abiertos ({openTickets})
                    </button>
                    <button
                      type="button"
                      onClick={() => setStatusFilter('cerrado')}
                      className={`py-1 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
                        statusFilter === 'cerrado'
                          ? 'bg-white text-emerald-700 shadow-2xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Cerrados ({closedTickets})
                    </button>
                  </div>
                </div>

                {/* Lista de Tickets */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden flex flex-col">
                  {filteredTickets.length === 0 ? (
                    <div className="p-8 text-center flex flex-col items-center justify-center">
                      <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-3">
                        <MessageSquare className="w-6 h-6" />
                      </div>
                      <h4 className="text-xs font-bold text-slate-800">
                        {totalTickets === 0 ? 'No tienes tickets registrados' : 'No se encontraron resultados'}
                      </h4>
                      <p className="text-[11px] text-slate-500 max-w-[220px] mt-1 mb-4 leading-relaxed">
                        {totalTickets === 0
                          ? 'Abre tu primera consulta técnica para recibir asistencia directa.'
                          : 'Prueba a cambiar los filtros de búsqueda.'}
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setIsCreatingNewTicket(true);
                          setActiveTicketId(null);
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Abrir Ticket</span>
                      </button>
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-100 max-h-[540px] overflow-y-auto">
                      {filteredTickets.map((t) => {
                        const isSelected = activeTicketId === t.id && !isCreatingNewTicket;
                        const pConfig = priorityConfig[t.priority] || priorityConfig.media;
                        const isOpen = t.status === 'abierto' || t.status === 'en_proceso';
                        const lastMsg = t.messages && t.messages.length > 0 ? t.messages[t.messages.length - 1] : null;

                        return (
                          <button
                            key={t.id}
                            type="button"
                            onClick={() => {
                              setActiveTicketId(t.id);
                              setIsCreatingNewTicket(false);
                            }}
                            className={`w-full text-left p-4 transition-all flex flex-col gap-2 cursor-pointer border-l-4 ${
                              isSelected
                                ? 'bg-indigo-50/80 border-indigo-600'
                                : 'bg-white hover:bg-slate-50 border-transparent'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-[10px] font-mono font-bold text-slate-400">
                                #{t.id.slice(-8)}
                              </span>
                              <div className="flex items-center gap-1.5">
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${pConfig.badge}`}>
                                  {pConfig.label}
                                </span>
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 ${
                                  isOpen 
                                    ? 'bg-amber-50 text-amber-700 border border-amber-200' 
                                    : 'bg-slate-100 text-slate-600 border border-slate-200'
                                }`}>
                                  <span className={`w-1.5 h-1.5 rounded-full ${isOpen ? 'bg-amber-500 animate-pulse' : 'bg-slate-400'}`} />
                                  <span>{isOpen ? 'Abierto' : 'Cerrado'}</span>
                                </span>
                              </div>
                            </div>

                            <h4 className="text-xs sm:text-sm font-bold text-slate-900 line-clamp-1">
                              {t.subject}
                            </h4>

                            <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                              {lastMsg ? lastMsg.text : 'Sin mensajes aún...'}
                            </p>

                            <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-[10px] text-slate-400">
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                <span>{new Date(t.updatedAt || t.createdAt).toLocaleDateString([], { day: '2-digit', month: 'short' })}</span>
                              </span>
                              <span className="font-semibold text-slate-500">
                                {t.messages?.length || 0} mensajes
                              </span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Banner de Ayuda Rápida */}
                <div className="p-3.5 rounded-2xl bg-indigo-50/60 border border-indigo-100 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0">
                      <Bot className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900">¿Consulta inmediata?</p>
                      <p className="text-[10px] text-slate-500">Jaime IA responde dudas al instante.</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab('jaime')}
                    className="px-2.5 py-1.5 rounded-lg bg-white text-indigo-700 text-xs font-bold border border-indigo-200 shadow-2xs hover:bg-indigo-50 transition-colors cursor-pointer shrink-0"
                  >
                    Usar IA
                  </button>
                </div>
              </div>

              {/* ------------------------------------------------------------- */}
              {/* COLUMNA DERECHA: ESPACIO DE TRABAJO (lg:col-span-7) */}
              {/* ------------------------------------------------------------- */}
              <div className={`lg:col-span-7 bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col ${
                (!activeTicket && !isCreatingNewTicket) ? 'hidden lg:flex' : 'flex'
              }`}>
                
                {isCreatingNewTicket || (!activeTicket && totalTickets === 0) ? (
                  /* =========================================================== */
                  /* ESTADO 1: FORMULARIO DE NUEVO TICKET */
                  /* =========================================================== */
                  <div className="p-6 sm:p-8 space-y-6">
                    <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                      <div>
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-bold mb-1">
                          <Headphones className="w-3.5 h-3.5" />
                          <span>Nuevo Ticket</span>
                        </div>
                        <h3 className="text-lg sm:text-xl font-extrabold text-slate-900">
                          Abre un Ticket con un Técnico
                        </h3>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Un miembro oficial de soporte revisará tu caso y te responderá directamente.
                        </p>
                      </div>

                      {totalTickets > 0 && (
                        <button
                          type="button"
                          onClick={() => {
                            setIsCreatingNewTicket(false);
                            if (filteredTickets.length > 0 && !activeTicketId) {
                              setActiveTicketId(filteredTickets[0].id);
                            }
                          }}
                          className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                          title="Volver a los tickets"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      )}
                    </div>

                    {formError && (
                      <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2.5">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span>{formError}</span>
                      </div>
                    )}

                    <form onSubmit={handleCreateTicketSubmit} className="space-y-5">
                      {/* Asunto */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-800 flex items-center justify-between">
                          <span>Asunto o Motivo del Problema</span>
                          <span className="text-[10px] text-slate-400 font-semibold">Obligatorio</span>
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="Ej: Error al abrir NexClean, fallo con mi sesión..."
                          value={subject}
                          onChange={(e) => setSubject(e.target.value)}
                          className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 focus:bg-white border border-slate-200 focus:border-indigo-600 text-xs sm:text-sm text-slate-900 focus:outline-none transition-all"
                        />
                        {/* Sugerencias Rápidas */}
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {QUICK_TOPICS.map((topic) => (
                            <button
                              key={topic}
                              type="button"
                              onClick={() => setSubject(topic)}
                              className="px-2.5 py-1 rounded-lg text-[11px] bg-slate-100 hover:bg-indigo-50 text-slate-600 hover:text-indigo-700 border border-slate-200 transition-all cursor-pointer"
                            >
                              + {topic}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Prioridad */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-800">
                          Nivel de Prioridad
                        </label>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          {(['baja', 'media', 'alta', 'urgente'] as TicketPriority[]).map((p) => {
                            const pConf = priorityConfig[p];
                            const isSelected = priority === p;
                            return (
                              <button
                                key={p}
                                type="button"
                                onClick={() => setPriority(p)}
                                className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between min-h-[64px] ${
                                  isSelected
                                    ? `${pConf.badge} ring-2 ring-indigo-500/20 border-indigo-400 shadow-2xs`
                                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-white'
                                }`}
                              >
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-bold capitalize">{pConf.label}</span>
                                  <span className={`w-2 h-2 rounded-full ${pConf.dot}`} />
                                </div>
                                <p className="text-[10px] text-slate-500 leading-tight mt-1">
                                  {pConf.desc}
                                </p>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Correo de Contacto */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-800">
                          Correo Electrónico para Notificaciones
                        </label>
                        <input
                          type="email"
                          required
                          value={contactEmail}
                          onChange={(e) => setContactEmail(e.target.value)}
                          placeholder="tu-correo@ejemplo.com"
                          className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 focus:bg-white border border-slate-200 focus:border-indigo-600 text-xs sm:text-sm text-slate-900 focus:outline-none transition-all"
                        />
                      </div>

                      {/* Mensaje Detallado */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-800">
                          Descripción Detallada
                        </label>
                        <textarea
                          required
                          rows={4}
                          placeholder="Indica con detalle qué sucedió, pasos para reproducir el error o cualquier información relevante..."
                          value={initialMessage}
                          onChange={(e) => setInitialMessage(e.target.value)}
                          className="w-full p-3.5 rounded-xl bg-slate-50 focus:bg-white border border-slate-200 focus:border-indigo-600 text-xs sm:text-sm text-slate-900 focus:outline-none transition-all resize-none"
                        />
                      </div>

                      {/* Botones de Envío */}
                      <div className="flex items-center justify-end gap-3 pt-2">
                        {totalTickets > 0 && (
                          <button
                            type="button"
                            onClick={() => setIsCreatingNewTicket(false)}
                            className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                          >
                            Cancelar
                          </button>
                        )}
                        <button
                          type="submit"
                          disabled={isSubmitting || !user}
                          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-bold shadow-xs transition-all cursor-pointer disabled:opacity-50"
                        >
                          {isSubmitting ? (
                            <>
                              <RotateCcw className="w-4 h-4 animate-spin" />
                              <span>Enviando...</span>
                            </>
                          ) : (
                            <>
                              <Send className="w-4 h-4" />
                              <span>Enviar Ticket</span>
                            </>
                          )}
                        </button>
                      </div>
                    </form>
                  </div>
                ) : activeTicket ? (
                  /* =========================================================== */
                  /* ESTADO 2: CONVERSACIÓN DEL TICKET SELECCIONADO */
                  /* =========================================================== */
                  <div className="flex-1 flex flex-col">
                    {/* Encabezado del Ticket */}
                    <div className="p-4 sm:p-5 border-b border-slate-200 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        {/* Botón Volver a la Lista en móviles */}
                        <button
                          type="button"
                          onClick={() => setActiveTicketId(null)}
                          className="lg:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors"
                          title="Volver a la lista"
                        >
                          <ArrowLeft className="w-4 h-4" />
                        </button>

                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-[11px] font-mono font-bold text-slate-400">
                              #{activeTicket.id.slice(-8)}
                            </span>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${priorityConfig[activeTicket.priority]?.badge || ''}`}>
                              {priorityConfig[activeTicket.priority]?.label || 'Media'}
                            </span>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              activeTicket.status === 'abierto' || activeTicket.status === 'en_proceso'
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            }`}>
                              {activeTicket.status === 'abierto' ? 'Abierto' : activeTicket.status === 'en_proceso' ? 'En Gestión' : 'Resuelto'}
                            </span>
                          </div>
                          <h3 className="text-sm sm:text-base font-extrabold text-slate-900 leading-snug">
                            {activeTicket.subject}
                          </h3>
                        </div>
                      </div>

                      {/* Acción de Cerrar o Reabrir */}
                      <div className="self-end sm:self-auto">
                        {activeTicket.status === 'abierto' || activeTicket.status === 'en_proceso' ? (
                          <button
                            type="button"
                            onClick={() => closeTicket(activeTicket.id)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
                          >
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Marcar como Resuelto</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => reopenTicket(activeTicket.id)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold transition-colors cursor-pointer border border-indigo-200"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>Reabrir Caso</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Historial de Mensajes */}
                    <div className="p-4 sm:p-6 space-y-4 bg-slate-50/50 flex-1 min-h-[340px] max-h-[480px] overflow-y-auto">
                      {activeTicket.messages?.map((msg) => {
                        const isStaff = msg.isAdmin;
                        const isMe = msg.senderId === user?.uid || (!isStaff && !msg.isAdmin);

                        return (
                          <div 
                            key={msg.id}
                            className={`flex flex-col ${isMe && !isStaff ? 'items-end' : 'items-start'}`}
                          >
                            <div className="flex items-center gap-2 mb-1 px-1">
                              <span className="text-[11px] font-bold text-slate-600 flex items-center gap-1">
                                {isStaff ? (
                                  <>
                                    <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
                                    <span className="text-indigo-700">Soporte Oficial NexStudio</span>
                                  </>
                                ) : (
                                  <span>{msg.senderName || 'Tú'}</span>
                                )}
                              </span>
                              <span className="text-[10px] text-slate-400">
                                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>

                            <div className={`p-4 rounded-2xl max-w-[85%] sm:max-w-[75%] text-xs sm:text-sm leading-relaxed ${
                              isStaff
                                ? 'bg-white border border-indigo-200/80 text-slate-800 shadow-2xs rounded-tl-sm'
                                : 'bg-indigo-600 text-white shadow-2xs rounded-tr-sm'
                            }`}>
                              <p className="whitespace-pre-wrap">{msg.text}</p>
                            </div>
                          </div>
                        );
                      })}
                      <div ref={chatMessagesEndRef} />
                    </div>

                    {/* Caja de Respuesta */}
                    <div className="p-4 border-t border-slate-200 bg-white">
                      {activeTicket.status === 'cerrado' || activeTicket.status === 'resuelto' ? (
                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center flex items-center justify-between gap-3">
                          <p className="text-xs text-slate-500">
                            Este ticket está finalizado. Si necesitas más ayuda, puedes reabrirlo.
                          </p>
                          <button
                            type="button"
                            onClick={() => reopenTicket(activeTicket.id)}
                            className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 transition-colors"
                          >
                            Reabrir
                          </button>
                        </div>
                      ) : (
                        <form onSubmit={handleSendReply} className="flex gap-2">
                          <textarea
                            rows={2}
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSendReply(e);
                              }
                            }}
                            placeholder="Escribe tu mensaje a soporte (Enter para enviar)..."
                            className="flex-1 p-3 rounded-xl bg-slate-50 focus:bg-white border border-slate-200 focus:border-indigo-600 text-xs sm:text-sm text-slate-900 focus:outline-none transition-all resize-none"
                          />
                          <button
                            type="submit"
                            disabled={!replyText.trim() || isLoading}
                            className="px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center transition-colors disabled:opacity-40 cursor-pointer"
                            title="Enviar respuesta"
                          >
                            <Send className="w-4 h-4" />
                          </button>
                        </form>
                      )}
                    </div>
                  </div>
                ) : (
                  /* =========================================================== */
                  /* ESTADO 3: BIENVENIDA / NINGÚN TICKET SELECCIONADO */
                  /* =========================================================== */
                  <div className="p-12 text-center flex flex-col items-center justify-center my-auto">
                    <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4">
                      <Headphones className="w-8 h-8" />
                    </div>
                    <h3 className="text-base font-extrabold text-slate-900">
                      Selecciona un ticket de tu bandeja
                    </h3>
                    <p className="text-xs text-slate-500 max-w-sm mt-1.5 mb-6 leading-relaxed">
                      Elige una consulta de la columna izquierda para ver la conversación y el estado, o abre un nuevo caso técnico.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setIsCreatingNewTicket(true);
                        setActiveTicketId(null);
                      }}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs sm:text-sm shadow-xs transition-colors cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Crear Nuevo Ticket</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
