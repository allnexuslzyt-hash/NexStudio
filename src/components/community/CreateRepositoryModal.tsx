import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  FolderPlus, 
  X, 
  Globe, 
  Users, 
  Lock, 
  Sparkles, 
  Tag, 
  Layers,
  AlertCircle 
} from 'lucide-react';
import { createRepository } from '../../lib/repositoryService';

interface CreateRepositoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  userName: string;
  userUsername?: string;
  userPhotoURL?: string;
  onSuccess: (repoId: string) => void;
}

const CATEGORIES = [
  'Código & Web',
  'Diseño UI/UX',
  'Modelado 3D & CGI',
  'Arte Digital & Ilustración',
  'Plantillas & Componentes',
  'Audio & Efectos',
  'Herramientas & Scripts',
  'General'
];

export const CreateRepositoryModal: React.FC<CreateRepositoryModalProps> = ({
  isOpen,
  onClose,
  userId,
  userName,
  userUsername,
  userPhotoURL,
  onSuccess,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [tagsInput, setTagsInput] = useState('');
  const [visibility, setVisibility] = useState<'public' | 'community_only' | 'private'>('public');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Por favor indica un nombre para el repositorio.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const tags = tagsInput
      .split(',')
      .map((t) => t.trim().toLowerCase().replace(/^#/, ''))
      .filter((t) => t.length > 0);

    try {
      const repoId = await createRepository({
        ownerId: userId,
        ownerName: userName,
        ownerUsername: userUsername,
        ownerPhotoURL: userPhotoURL,
        name: name.trim(),
        description: description.trim(),
        category,
        tags,
        visibility,
      });

      // Reset
      setName('');
      setDescription('');
      setTagsInput('');
      setCategory(CATEGORIES[0]);
      setVisibility('public');
      onSuccess(repoId);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Error al crear el repositorio.');
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
                <FolderPlus className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight">
                  Crear Nuevo Repositorio
                </h3>
                <p className="text-xs text-slate-500">
                  Organiza y sube tus proyectos, archivos de código o creaciones
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

            {/* Nombre */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5">
                Nombre del Repositorio <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="ej. Sistema de Componentes UI, Renderizados 3D, Asistente IA"
                maxLength={80}
                required
                className="w-full px-4 py-2.5 text-xs sm:text-sm text-slate-900 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            {/* Descripción */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-800">
                  Descripción del Repositorio
                </label>
                <span className="text-[11px] text-slate-400">
                  {description.length}/800
                </span>
              </div>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                maxLength={800}
                placeholder="Explica de qué trata este repositorio, qué proyectos vas a subir y cómo pueden usarlo otros creadores..."
                className="w-full px-4 py-2.5 text-xs sm:text-sm text-slate-900 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 resize-none"
              />
            </div>

            {/* Categoría y Etiquetas */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Categoría Principal</span>
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5 flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Etiquetas (separadas por coma)</span>
                </label>
                <input
                  type="text"
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  placeholder="react, tailwind, 3d, open-source"
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
            </div>

            {/* Visibilidad */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-2">
                Visibilidad del Repositorio
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <button
                  type="button"
                  onClick={() => setVisibility('public')}
                  className={`p-3 rounded-xl border text-left flex flex-col gap-1 transition-all cursor-pointer ${
                    visibility === 'public'
                      ? 'border-indigo-600 bg-indigo-50/40 text-indigo-900 shadow-xs'
                      : 'border-slate-200 bg-slate-50 hover:bg-white text-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-bold text-xs">
                    <Globe className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Público</span>
                  </div>
                  <span className="text-[11px] text-slate-500 leading-tight">
                    Cualquiera en la web puede ver y explorar este repositorio.
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setVisibility('community_only')}
                  className={`p-3 rounded-xl border text-left flex flex-col gap-1 transition-all cursor-pointer ${
                    visibility === 'community_only'
                      ? 'border-indigo-600 bg-indigo-50/40 text-indigo-900 shadow-xs'
                      : 'border-slate-200 bg-slate-50 hover:bg-white text-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-bold text-xs">
                    <Users className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Comunidad</span>
                  </div>
                  <span className="text-[11px] text-slate-500 leading-tight">
                    Solo miembros registrados de NexStudio pueden acceder.
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setVisibility('private')}
                  className={`p-3 rounded-xl border text-left flex flex-col gap-1 transition-all cursor-pointer ${
                    visibility === 'private'
                      ? 'border-indigo-600 bg-indigo-50/40 text-indigo-900 shadow-xs'
                      : 'border-slate-200 bg-slate-50 hover:bg-white text-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-bold text-xs">
                    <Lock className="w-3.5 h-3.5 text-amber-600" />
                    <span>Privado</span>
                  </div>
                  <span className="text-[11px] text-slate-500 leading-tight">
                    Solo tú y los administradores autorizados pueden verlo.
                  </span>
                </button>
              </div>
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
                disabled={isSubmitting || !name.trim()}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold transition-all shadow-sm cursor-pointer flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Creando...</span>
                  </>
                ) : (
                  <>
                    <FolderPlus className="w-4 h-4" />
                    <span>Crear Repositorio</span>
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
