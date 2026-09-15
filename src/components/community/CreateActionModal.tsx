import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, MessageSquarePlus, FolderPlus, Plus, Sparkles } from 'lucide-react';

interface CreateActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPost: () => void;
  onSelectRepo: () => void;
}

export const CreateActionModal: React.FC<CreateActionModalProps> = ({
  isOpen,
  onClose,
  onSelectPost,
  onSelectRepo,
}) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="w-full max-w-md rounded-3xl bg-white border border-slate-200 shadow-2xl overflow-hidden p-6"
        >
          {/* Cabecera */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                <Plus className="w-5 h-5 stroke-[2.5]" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900">¿Qué deseas crear?</h3>
                <p className="text-xs text-slate-500">Elige una de las dos opciones para continuar</p>
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

          {/* Opciones */}
          <div className="space-y-3">
            {/* Opción 1: Publicación */}
            <button
              type="button"
              id="btn-action-create-post"
              onClick={() => {
                onClose();
                onSelectPost();
              }}
              className="w-full p-4 rounded-2xl border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/40 text-left transition-all group flex items-start gap-4 cursor-pointer"
            >
              <div className="w-11 h-11 rounded-xl bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors flex items-center justify-center shrink-0 shadow-xs">
                <MessageSquarePlus className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                  Añadir Publicación
                </h4>
                <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                  Comparte una reflexión, foto o archivo de tu dispositivo en el feed de la comunidad.
                </p>
              </div>
            </button>

            {/* Opción 2: Repositorio */}
            <button
              type="button"
              id="btn-action-create-repo"
              onClick={() => {
                onClose();
                onSelectRepo();
              }}
              className="w-full p-4 rounded-2xl border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/40 text-left transition-all group flex items-start gap-4 cursor-pointer"
            >
              <div className="w-11 h-11 rounded-xl bg-violet-50 text-violet-600 group-hover:bg-violet-600 group-hover:text-white transition-colors flex items-center justify-center shrink-0 shadow-xs">
                <FolderPlus className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-bold text-slate-900 group-hover:text-violet-600 transition-colors">
                  Añadir Repositorio
                </h4>
                <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                  Crea un nuevo repositorio organizado para almacenar proyectos, archivos y código.
                </p>
              </div>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
