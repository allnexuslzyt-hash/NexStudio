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
  MessageSquarePlus,
  HardDrive,
  ExternalLink
} from 'lucide-react';
import { processDeviceFile, formatFileSize, ProcessedFile } from '../../lib/fileUploadHelper';
import { GoogleDriveFile, formatDriveFileSize } from '../../lib/googleDriveService';
import { GoogleDrivePickerModal } from './GoogleDrivePickerModal';

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPublish: (params: {
    content: string;
    attachment?: ProcessedFile | null;
    driveFile?: GoogleDriveFile | null;
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
  const [driveFile, setDriveFile] = useState<GoogleDriveFile | null>(null);
  const [isDriveModalOpen, setIsDriveModalOpen] = useState(false);
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
      setDriveFile(null); // Si sube del dispositivo, reemplaza el de drive
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
    if (!trimmed && !attachment && !driveFile) {
      setError('Escribe un texto o adjunta un archivo para publicar.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      await onPublish({
        content: trimmed,
        attachment,
        driveFile,
        visibility,
      });
      setContent('');
      setAttachment(null);
      setDriveFile(null);
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
              <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                <MessageSquarePlus className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Nueva Publicación</h3>
                <p className="text-xs text-slate-500">Comparte en la comunidad NexStudio</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {/* Info autor */}
            <div className="flex items-center gap-3">
              <img
                src={userPhoto || `https://api.dicebear.com/7.x/identicon/svg?seed=user`}
                alt={userName}
                className="w-9 h-9 rounded-xl object-cover border border-slate-200 bg-slate-100 shrink-0"
                referrerPolicy="no-referrer"
              />
              <div>
                <p className="text-xs font-bold text-slate-900">{userName}</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <select
                    value={visibility}
                    onChange={(e) => setVisibility(e.target.value as any)}
                    className="text-[11px] font-semibold text-slate-600 bg-slate-100 border border-slate-200 rounded-lg px-2 py-0.5 focus:outline-none cursor-pointer"
                  >
                    <option value="public">🌍 Pública</option>
                    <option value="community_only">👥 Solo Comunidad</option>
                    <option value="private">🔒 Solo Yo</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Cuadro de texto */}
            <div className="w-full p-3.5 rounded-2xl bg-slate-50 border border-slate-200 focus-within:border-indigo-500 focus-within:bg-white transition-colors">
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="¿Qué estás desarrollando? Comparte una reflexión, ideas o sube fotos/archivos..."
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

            {/* Vista previa de archivo adjunto de Google Drive */}
            {driveFile && (
              <div className="p-3.5 rounded-2xl bg-emerald-50/80 border border-emerald-200/80 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                    <HardDrive className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="truncate max-w-[260px]">{driveFile.name}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-200 text-emerald-800 font-bold shrink-0">
                      {formatDriveFileSize(driveFile.size)}
                    </span>
                  </span>
                  <div className="flex items-center gap-1">
                    {driveFile.webViewLink && (
                      <a
                        href={driveFile.webViewLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1 text-emerald-600 hover:text-emerald-800 rounded transition-colors"
                        title="Ver en Google Drive"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                    <button
                      type="button"
                      onClick={() => setDriveFile(null)}
                      className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors cursor-pointer"
                      title="Quitar archivo"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="text-[11px] text-emerald-700 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span>Archivo de Google Drive listo para compartir con la comunidad</span>
                </div>
              </div>
            )}

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
              <div className="flex items-center gap-2 flex-wrap">
                {/* Botón de Google Drive */}
                <button
                  type="button"
                  onClick={() => setIsDriveModalOpen(true)}
                  className="px-3.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100/80 text-emerald-700 border border-emerald-200/80 text-xs font-bold flex items-center gap-2 transition-all cursor-pointer min-h-[38px] shadow-2xs"
                  title="Conectar cuenta y elegir archivo de Google Drive"
                >
                  <HardDrive className="w-4 h-4 text-emerald-600" />
                  <span>{driveFile ? 'Cambiar Google Drive' : 'Google Drive'}</span>
                </button>

                {/* Botón de subida local */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploadingFile}
                  className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer min-h-[38px]"
                >
                  <FileUp className="w-4 h-4 text-indigo-600" />
                  <span>{attachment ? 'Cambiar dispositivo' : 'Subir de mi equipo'}</span>
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
                  disabled={isSubmitting || (!content.trim() && !attachment && !driveFile)}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold shadow-md shadow-indigo-600/20 transition-all flex items-center gap-2 cursor-pointer min-h-[38px]"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isSubmitting ? 'Publicando...' : 'Publicar'}</span>
                </button>
              </div>
            </div>
          </form>
        </motion.div>

        {/* Modal de Google Drive */}
        <GoogleDrivePickerModal
          isOpen={isDriveModalOpen}
          onClose={() => setIsDriveModalOpen(false)}
          onSelectFile={(selected) => {
            setDriveFile(selected);
            setAttachment(null); // Prioriza el de Drive
          }}
        />
      </div>
    </AnimatePresence>
  );
};
