import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Send, 
  FileUp, 
  Check, 
  FileText, 
  Globe, 
  Users, 
  Lock, 
  Sparkles,
  MessageSquarePlus
} from 'lucide-react';
import { processDeviceFile, formatFileSize, ProcessedFile } from '../../lib/fileUploadHelper';

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPublish: (params: {
    content: string;
    attachment?: ProcessedFile | null;
    visibility: 'public' | 'community_only' | 'private';
  }) => Promise<void>;
  userName?: string;
  userPhoto?: string;
}

export const CreatePostModal: React.FC<CreatePostModalProps> = ({
  isOpen,
  onClose,
  onPublish,
  userName = 'Creador',
  userPhoto
}) => {
  const [content, setContent] = useState('');
  const [attachment, setAttachment] = useState<ProcessedFile | null>(null);
  const [visibility, setVisibility] = useState<'public' | 'community_only' | 'private'>('public');
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingFile(true);
    setError(null);
    try {
      const processed = await processDeviceFile(file);
      setAttachment(processed);
    } catch (err: any) {
      setError(err.message || 'Error al procesar el archivo del dispositivo.');
    } finally {
      setIsUploadingFile(false);
      if (e.target) e.target.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = content.trim();
    if (!trimmed && !attachment) {
      setError('Escribe un texto o adjunta un archivo para publicar.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      await onPublish({
        content: trimmed,
        attachment,
        visibility,
      });
      setContent('');
      setAttachment(null);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Error al crear la publicación.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="w-full max-w-lg rounded-3xl bg-white border border-slate-200 shadow-2xl overflow-hidden my-auto"
        >
          {/* Cabecera */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                <MessageSquarePlus className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800">Crear Publicación</h3>
                <p className="text-[11px] text-slate-400">Comparte actualizaciones o ideas con la comunidad</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {/* Autor y selector de visibilidad */}
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <img
                  src={userPhoto || `https://api.dicebear.com/7.x/identicon/svg?seed=${userName}`}
                  alt={userName}
                  className="w-8 h-8 rounded-full border border-slate-200 object-cover shrink-0"
                />
                <span className="text-xs font-bold text-slate-700 truncate">{userName}</span>
              </div>

              {/* Selector de visibilidad */}
              <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl text-[11px] font-semibold text-slate-600">
                <button
                  type="button"
                  onClick={() => setVisibility('public')}
                  className={`px-2 py-1 rounded-lg flex items-center gap-1 transition-all cursor-pointer ${
                    visibility === 'public'
                      ? 'bg-white text-indigo-600 shadow-2xs font-bold'
                      : 'hover:text-slate-900'
                  }`}
                  title="Visible para todos"
                >
                  <Globe className="w-3 h-3" />
                  <span className="hidden sm:inline">Público</span>
                </button>
                <button
                  type="button"
                  onClick={() => setVisibility('community_only')}
                  className={`px-2 py-1 rounded-lg flex items-center gap-1 transition-all cursor-pointer ${
                    visibility === 'community_only'
                      ? 'bg-white text-indigo-600 shadow-2xs font-bold'
                      : 'hover:text-slate-900'
                  }`}
                  title="Visible para miembros registrados"
                >
                  <Users className="w-3 h-3" />
                  <span className="hidden sm:inline">Comunidad</span>
                </button>
                <button
                  type="button"
                  onClick={() => setVisibility('private')}
                  className={`px-2 py-1 rounded-lg flex items-center gap-1 transition-all cursor-pointer ${
                    visibility === 'private'
                      ? 'bg-white text-indigo-600 shadow-2xs font-bold'
                      : 'hover:text-slate-900'
                  }`}
                  title="Solo visible en tu perfil"
                >
                  <Lock className="w-3 h-3" />
                  <span className="hidden sm:inline">Privado</span>
                </button>
              </div>
            </div>

            {/* Área de texto */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 focus-within:bg-white focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/10 transition-all">
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="¿En qué estás trabajando hoy? Comparte avances, diseños o proyectos..."
                rows={4}
                maxLength={800}
                className="w-full text-sm text-slate-800 placeholder-slate-400 bg-transparent border-none focus:outline-none resize-none leading-relaxed"
                autoFocus
              />
              <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-200/60">
                <span>Puedes usar #hashtags</span>
                <span>{800 - content.length} restantes</span>
              </div>
            </div>

            {/* Vista previa de archivo adjunto local */}
            {attachment && (
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    {attachment.name} ({formatFileSize(attachment.size)})
                  </span>
                  <button
                    type="button"
                    onClick={() => setAttachment(null)}
                    className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {attachment.type === 'image' ? (
                  <div className="max-h-[220px] overflow-hidden rounded-xl bg-slate-900 flex items-center justify-center">
                    <img
                      src={attachment.dataUrl}
                      alt={attachment.name}
                      className="max-h-[220px] w-auto object-contain"
                    />
                  </div>
                ) : (
                  <div className="p-3 rounded-xl bg-white border border-slate-200 flex items-center gap-2.5">
                    <FileText className="w-5 h-5 text-indigo-600 shrink-0" />
                    <span className="text-xs text-slate-700 font-medium truncate">{attachment.name}</span>
                  </div>
                )}
              </div>
            )}

            {error && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium">
                {error}
              </div>
            )}

            {/* Botones inferiores */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
              <div className="flex items-center gap-2">
                {/* Botón de subida local */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploadingFile}
                  className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer min-h-[38px]"
                >
                  <FileUp className="w-4 h-4 text-indigo-600" />
                  <span>{attachment ? 'Cambiar archivo' : 'Adjuntar archivo'}</span>
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  onChange={handleFileUpload}
                />
              </div>

              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer min-h-[38px]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || (!content.trim() && !attachment)}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold shadow-md shadow-indigo-600/20 transition-all flex items-center gap-2 cursor-pointer min-h-[38px]"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isSubmitting ? 'Publicando...' : 'Publicar'}</span>
                </button>
              </div>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
