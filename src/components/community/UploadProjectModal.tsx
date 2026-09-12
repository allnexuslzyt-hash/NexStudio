import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  FileUp, 
  X, 
  UploadCloud, 
  Check, 
  Trash2, 
  Globe, 
  Folder, 
  AlertCircle,
  FileCode,
  Image as ImageIcon,
  FileArchive,
  Layers,
  Sparkles
} from 'lucide-react';
import { UserRepository } from '../../types';
import { processDeviceFile, formatFileSize, ProcessedFile } from '../../lib/fileUploadHelper';
import { addProjectToRepository } from '../../lib/repositoryService';

interface UploadProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  repositories: UserRepository[];
  selectedRepoId?: string;
  userId: string;
  userName: string;
  onSuccess: (projectId: string) => void;
}

export const UploadProjectModal: React.FC<UploadProjectModalProps> = ({
  isOpen,
  onClose,
  repositories,
  selectedRepoId,
  userId,
  userName,
  onSuccess,
}) => {
  const [repoId, setRepoId] = useState<string>(
    selectedRepoId || (repositories.length > 0 ? repositories[0].id : '')
  );
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [version, setVersion] = useState('v1.0');
  const [demoUrl, setDemoUrl] = useState('');
  const [attachment, setAttachment] = useState<ProcessedFile | null>(null);
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sincronizar repositorio seleccionado si cambia el prop
  React.useEffect(() => {
    if (selectedRepoId) {
      setRepoId(selectedRepoId);
    } else if (repositories.length > 0 && !repoId) {
      setRepoId(repositories[0].id);
    }
  }, [selectedRepoId, repositories]);

  if (!isOpen) return null;

  const currentRepo = repositories.find((r) => r.id === repoId) || repositories[0];

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingFile(true);
    setError(null);

    try {
      const processed = await processDeviceFile(file);
      setAttachment(processed);
      if (!title) {
        // Sugerir nombre de archivo sin extensión como título inicial
        const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ');
        setTitle(cleanName.charAt(0).toUpperCase() + cleanName.slice(1));
      }
    } catch (err: any) {
      setError(err?.message || 'Error al procesar el archivo del dispositivo.');
    } finally {
      setIsUploadingFile(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!repoId) {
      setError('Debes seleccionar un repositorio de destino.');
      return;
    }
    if (!title.trim()) {
      setError('Por favor escribe un título para el proyecto.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const projectId = await addProjectToRepository({
        repoId,
        repoName: currentRepo ? currentRepo.name : 'Repositorio',
        ownerId: userId,
        ownerName: userName,
        title: title.trim(),
        description: description.trim(),
        attachment,
        demoUrl: demoUrl.trim() || undefined,
        version: version.trim() || 'v1.0',
        isPublic: true,
      });

      // Reset
      setTitle('');
      setDescription('');
      setAttachment(null);
      setDemoUrl('');
      setVersion('v1.0');
      onSuccess(projectId);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Error al subir el proyecto al repositorio.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-sm overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="w-full max-w-xl bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden my-auto text-left"
        >
          {/* Header */}
          <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                <FileUp className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight">
                  Subir Proyecto al Repositorio
                </h3>
                <p className="text-xs text-slate-500">
                  Sube tus archivos, código, capturas o paquetes directamente desde tu dispositivo
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {error && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Selector de Repositorio */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5 flex items-center gap-1.5">
                <Folder className="w-3.5 h-3.5 text-indigo-600" />
                <span>Repositorio de Destino</span>
              </label>
              <select
                value={repoId}
                onChange={(e) => setRepoId(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer"
              >
                {repositories.map((repo) => (
                  <option key={repo.id} value={repo.id}>
                    📁 {repo.name} ({repo.category || 'General'})
                  </option>
                ))}
              </select>
            </div>

            {/* Título y Versión */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-800 mb-1.5">
                  Título del Proyecto <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="ej. Shader Realista de Agua, Layout Dashboard"
                  maxLength={100}
                  required
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5">
                  Versión
                </label>
                <input
                  type="text"
                  value={version}
                  onChange={(e) => setVersion(e.target.value)}
                  placeholder="v1.0.0"
                  maxLength={20}
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
            </div>

            {/* Descripción */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-800">
                  Descripción del Proyecto / Notas
                </label>
                <span className="text-[11px] text-slate-400">
                  {description.length}/1000
                </span>
              </div>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                maxLength={1000}
                placeholder="Detalla qué incluye este proyecto, instrucciones de uso, compatibilidad o novedades..."
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 resize-none"
              />
            </div>

            {/* Subida de Archivo Real desde el Dispositivo */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5">
                Archivo o Paquete del Proyecto (Desde tu Dispositivo)
              </label>

              {attachment ? (
                <div className="p-3 rounded-2xl bg-indigo-50/50 border border-indigo-200 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-white border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
                      {attachment.type.startsWith('image/') ? (
                        <ImageIcon className="w-5 h-5" />
                      ) : attachment.name.endsWith('.zip') || attachment.name.endsWith('.rar') ? (
                        <FileArchive className="w-5 h-5" />
                      ) : (
                        <FileCode className="w-5 h-5" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-900 truncate">
                        {attachment.name}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        {formatFileSize(attachment.size)} · {attachment.type || 'Archivo binario'}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setAttachment(null)}
                    className="p-2 text-rose-500 hover:bg-rose-100/50 rounded-xl transition-colors cursor-pointer shrink-0"
                    title="Quitar archivo"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full p-6 border-2 border-dashed border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/20 rounded-2xl transition-colors cursor-pointer text-center group"
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    onChange={handleFileChange}
                    className="hidden"
                    accept="image/*,.zip,.rar,.tar,.gz,.json,.js,.ts,.tsx,.jsx,.html,.css,.py,.pdf,.txt,.md"
                  />
                  <UploadCloud className="w-8 h-8 text-slate-400 group-hover:text-indigo-600 mx-auto mb-2 transition-colors" />
                  <p className="text-xs sm:text-sm font-bold text-slate-700 group-hover:text-indigo-600">
                    {isUploadingFile ? 'Procesando archivo...' : 'Selecciona o arrastra un archivo desde tu dispositivo'}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Imágenes, archivos ZIP, código fuente (JS, TS, HTML, Python), PDFs o documentos (hasta 15 MB)
                  </p>
                </div>
              )}
            </div>

            {/* Enlace Demo / Web Externa */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5 flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-indigo-600" />
                <span>Enlace Demo / Vista Previa Web (Opcional)</span>
              </label>
              <input
                type="url"
                value={demoUrl}
                onChange={(e) => setDemoUrl(e.target.value)}
                placeholder="https://mi-proyecto.ejemplo.com o link de GitHub"
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            {/* Acciones */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Cancelar
              </button>

              <button
                type="submit"
                disabled={isSubmitting || !title.trim()}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold transition-all shadow-sm cursor-pointer flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Subiendo al Repositorio...</span>
                  </>
                ) : (
                  <>
                    <FileUp className="w-4 h-4" />
                    <span>Publicar Proyecto</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
