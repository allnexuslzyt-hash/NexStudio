import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Send, 
  Bot, 
  Sparkles, 
  RotateCcw, 
  User, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle,
  HelpCircle,
  Zap,
  HardDrive,
  Headphones
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export interface JaimeMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: string;
  source?: string;
}

interface JaimeChatSectionProps {
  onSwitchToTickets: () => void;
}

const INITIAL_MESSAGE: JaimeMessage = {
  id: 'msg-welcome',
  role: 'model',
  text: '¡Hola! Soy **Jaime**, el asistente virtual oficial de **NexStudio**. 🤖✨\n\nEstoy aquí para resolver tus dudas al instante sobre la plataforma, cómo utilizar el lienzo, o cómo descargar y aprovechar nuestros softwares oficiales para Windows:\n• **NexClean (.exe)**: Limpieza de archivos temporales y optimización del PC.\n• **NexBoost (.exe)**: Optimización extrema y liberación de memoria RAM.\n\n¿En qué puedo ayudarte hoy?',
  timestamp: new Date().toISOString()
};

const SUGGESTED_QUESTIONS = [
  '¿Para qué sirve NexClean y cómo lo descargo?',
  '¿Cómo optimiza la RAM el ejecutable NexBoost?',
  '¿Cómo abrir un ticket con un administrador humano?',
  '¿Qué herramientas y funciones tiene NexStudio?'
];

export const JaimeChatSection: React.FC<JaimeChatSectionProps> = ({ onSwitchToTickets }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<JaimeMessage[]>(() => {
    try {
      const saved = sessionStorage.getItem('nexstudio_jaime_chat');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error('Error leyendo chat de Jaime:', e);
    }
    return [INITIAL_MESSAGE];
  });

  const [inputPrompt, setInputPrompt] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  // Save to sessionStorage
  useEffect(() => {
    try {
      sessionStorage.setItem('nexstudio_jaime_chat', JSON.stringify(messages));
    } catch (e) {
      console.warn('Error guardando chat de Jaime:', e);
    }
  }, [messages]);

  const handleSendMessage = async (textToSend: string) => {
    const trimmed = textToSend.trim();
    if (!trimmed || isTyping) return;

    setErrorMessage(null);
    const userMsg: JaimeMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      text: trimmed,
      timestamp: new Date().toISOString()
    };

    const newHistory = [...messages, userMsg];
    setMessages(newHistory);
    setInputPrompt('');
    setIsTyping(true);

    try {
      const response = await fetch('/api/support/jaime', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: trimmed,
          history: newHistory.slice(-10).map(m => ({
            role: m.role,
            text: m.text
          }))
        })
      });

      const data = await response.json();

      if (!response.ok && !data.reply) {
        throw new Error(data.error || 'Error al conectar con Jaime.');
      }

      const modelReply = data.reply || 'Aquí estoy para ayudarte con cualquier consulta de NexStudio.';
      const jaimeMsg: JaimeMessage = {
        id: `jaime-${Date.now()}`,
        role: 'model',
        text: modelReply,
        timestamp: new Date().toISOString(),
        source: data.source
      };

      setMessages(prev => [...prev, jaimeMsg]);
    } catch (err: any) {
      console.error('Error comunicándose con Jaime:', err);
      setErrorMessage('No se pudo obtener respuesta inmediata de Jaime. Puedes volver a intentarlo o abrir un ticket humano.');
      const fallbackMsg: JaimeMessage = {
        id: `jaime-error-${Date.now()}`,
        role: 'model',
        text: 'Disculpa, tuve un microcorte momentáneo. Si tu duda es sobre **NexClean** o **NexBoost**, puedes descargarlos gratis en la pestaña **Proyectos** del Catálogo. Y si requieres atención humana directa, pulsa abajo para abrir un ticket de soporte.',
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, fallbackMsg]);
    } finally {
      setIsTyping(false);
      inputRef.current?.focus();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSendMessage(inputPrompt);
  };

  const handleResetChat = () => {
    setMessages([INITIAL_MESSAGE]);
    sessionStorage.removeItem('nexstudio_jaime_chat');
    setErrorMessage(null);
  };

  // Helper to render basic markdown (bold, lists, code) safely
  const renderFormattedText = (text: string) => {
    const lines = text.split('\n');
    return (
      <div className="space-y-1.5">
        {lines.map((line, idx) => {
          if (!line.trim()) {
            return <div key={idx} className="h-1.5" />;
          }

          const isBullet = line.trim().startsWith('•') || line.trim().startsWith('* ') || line.trim().startsWith('- ');
          const cleanLine = isBullet ? line.replace(/^[•*-]\s*/, '') : line;

          // Parse bold parts: **bold**
          const parts = cleanLine.split(/(\*\*.*?\*\*)/g);

          const renderedLine = parts.map((part, pIdx) => {
            if (part.startsWith('**') && part.endsWith('**')) {
              return <strong key={pIdx} className="font-bold text-inherit">{part.slice(2, -2)}</strong>;
            }
            return part;
          });

          if (isBullet) {
            return (
              <div key={idx} className="flex items-start gap-2 pl-1">
                <span className="text-indigo-400 select-none shrink-0 mt-0.5">•</span>
                <span>{renderedLine}</span>
              </div>
            );
          }

          return <p key={idx} className="leading-relaxed">{renderedLine}</p>;
        })}
      </div>
    );
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-slate-50/60">
      {/* Sub-header info bar */}
      <div className="px-5 py-2.5 bg-white border-b border-slate-200 flex items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <div className="relative">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-600 to-violet-600 text-white flex items-center justify-center shadow-xs">
              <Bot className="w-4 h-4" />
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-slate-900">Jaime</span>
              <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                IA Oficial
              </span>
            </div>
            <p className="text-[10px] text-slate-500">Asistente virtual de NexStudio · Respuestas instantáneas</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onSwitchToTickets}
            className="px-2.5 py-1 text-indigo-700 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors text-[11px] font-semibold flex items-center gap-1.5 cursor-pointer border border-indigo-200"
          >
            <Headphones className="w-3.5 h-3.5 text-indigo-600" />
            <span>Volver a Tickets (Principal)</span>
          </button>
          <button
            type="button"
            onClick={handleResetChat}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors text-[11px] flex items-center gap-1 cursor-pointer"
            title="Reiniciar conversación con Jaime"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Limpiar chat</span>
          </button>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
        {messages.map((msg) => {
          const isUser = msg.role === 'user';
          return (
            <div
              key={msg.id}
              className={`flex gap-3 max-w-[88%] sm:max-w-[80%] ${isUser ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
            >
              {isUser ? (
                <img
                  src={user?.photoURL || `https://api.dicebear.com/7.x/identicon/svg?seed=${user?.displayName || 'Usuario'}`}
                  alt="Usuario"
                  referrerPolicy="no-referrer"
                  className="w-8 h-8 rounded-full object-cover border border-slate-200 shadow-xs shrink-0 mt-0.5"
                />
              ) : (
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-700 text-white flex items-center justify-center shadow-xs shrink-0 mt-0.5">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div className={`space-y-1 ${isUser ? 'items-end text-right' : 'items-start text-left'}`}>
                <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                  <span className="font-semibold text-slate-700">
                    {isUser ? (user?.displayName || 'Tú') : 'Jaime (Asistente Virtual)'}
                  </span>
                  {!isUser && (
                    <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-100 text-emerald-800">
                      En línea
                    </span>
                  )}
                  <span className="text-[10px] text-slate-400">
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                <div
                  className={`p-3.5 sm:p-4 rounded-2xl text-xs leading-relaxed ${
                    isUser
                      ? 'bg-indigo-600 text-white rounded-tr-xs shadow-xs'
                      : 'bg-white border border-slate-200/90 text-slate-800 rounded-tl-xs shadow-xs'
                  }`}
                >
                  {renderFormattedText(msg.text)}
                </div>
              </div>
            </div>
          );
        })}

        {/* Typing animation */}
        {isTyping && (
          <div className="flex gap-3 max-w-[80%] mr-auto items-center">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-700 text-white flex items-center justify-center shadow-xs shrink-0">
              <Bot className="w-4 h-4" />
            </div>
            <div className="p-3.5 rounded-2xl bg-white border border-slate-200 rounded-tl-xs text-xs text-slate-500 flex items-center gap-2 shadow-xs">
              <span className="font-medium text-slate-600">Jaime está respondiendo</span>
              <span className="flex gap-1 items-center">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-bounce" style={{ animationDelay: '300ms' }} />
              </span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested chips (show if history is short) */}
      {messages.length <= 3 && !isTyping && (
        <div className="px-4 py-2 border-t border-slate-100 bg-white/70 overflow-x-auto">
          <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mb-1.5">
            <Sparkles className="w-3 h-3 text-indigo-500" />
            <span>Preguntas frecuentes para Jaime:</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {SUGGESTED_QUESTIONS.map((q, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSendMessage(q)}
                className="px-2.5 py-1 rounded-lg text-[11px] bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-600 border border-slate-200 transition-colors text-left cursor-pointer"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Error notice if any */}
      {errorMessage && (
        <div className="px-4 py-2 bg-rose-50 border-t border-rose-200 text-rose-700 text-xs flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button
            type="button"
            onClick={onSwitchToTickets}
            className="text-[11px] font-bold text-rose-800 underline hover:no-underline"
          >
            Abrir Ticket Humano
          </button>
        </div>
      )}

      {/* Switch to tickets helper notice */}
      <div className="px-4 py-1.5 bg-slate-100/70 border-t border-slate-200/80 flex items-center justify-between text-[11px] text-slate-500">
        <span>¿Necesitas ayuda humana directa de un administrador?</span>
        <button
          type="button"
          onClick={onSwitchToTickets}
          className="inline-flex items-center gap-1 font-bold text-indigo-600 hover:text-indigo-700 hover:underline cursor-pointer"
        >
          <span>Abrir Ticket de Soporte</span>
          <ArrowRight className="w-3 h-3" />
        </button>
      </div>

      {/* Input box */}
      <form onSubmit={handleSubmit} className="p-3 bg-white border-t border-slate-200 flex items-center gap-2">
        <input
          ref={inputRef}
          type="text"
          value={inputPrompt}
          onChange={(e) => setInputPrompt(e.target.value)}
          placeholder="Escribe tu duda a Jaime (ej. ¿Cómo funciona NexBoost?)..."
          disabled={isTyping}
          className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-indigo-600 bg-slate-50 focus:bg-white disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={!inputPrompt.trim() || isTyping}
          className="p-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-200 text-white transition-colors cursor-pointer flex items-center justify-center shadow-xs"
          title="Enviar mensaje a Jaime"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};
