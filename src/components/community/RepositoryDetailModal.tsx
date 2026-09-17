import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Folder, 
  X, 
  FileUp, 
  Download, 
  ExternalLink, 
  Trash2, 
  Edit3, 
  ShieldCheck, 
  Star, 
  Globe, 
  Users, 
  Lock, 
  Calendar, 
  FileCode, 
  Image as ImageIcon, 
  FileArchive, 
  Tag, 
  Sparkles,
  Layers,
  AlertTriangle,
  CheckCircle2
} from 'lucide-react';
import { UserRepository, UserRepoProject } from '../../types';
import { 
  subscribeRepoProjects, 
  deleteRepository, 
  deleteRepoProject, 
  updateRepository, 
  adminModerateRepository 
} from '../../lib/repositoryService';
import { formatFileSize } from '../../lib/fileUploadHelper';

interface RepositoryDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  repository: UserRepository | null;
  currentUserId?: string;
  isAdmin: boolean;
  onOpenUploadProject: (repoId: string) => void;
  onRepoDeleted?: () => void;
}

export const RepositoryDetailModal: React.FC<RepositoryDetailModalProps> = ({
  isOpen,
  onClose,
  repository,
  currentUserId,
  isAdmin,
  onOpenUploadProject,
  onRepoDeleted,
}) => {
  const [projects, setProjects] = useState<UserRepoProject[]>([]);
  const [isLoadingProjects, setIsLoadingProjects] = useState(true);
  const [isEditingRepo, setIsEditingRepo] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editVisibility, setEditVisibility] = useState<'public' | 'community_only' | 'private'>('public');
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  const isOwner = Boolean(currentUserId && repository && repository.ownerId === currentUserId);
  const canManage = isOwner || isAdmin;

  useEffect(() => {
    if (!repository || !isOpen) return;

    setEditName(repository.name);
    setEditDesc(repository.description || '');
    setEditCategory(repository.category || 'General');
    setEditVisibility(repository.visibility || 'public');

    setIsLoadingProjects(true);
    const unsubscribe = subscribeRepoProjects(repository.id, (list) => {
      setProjects(list);
      setIsLoadingProjects(false);
    });

    return () => unsubscribe();
  }, [repository, isOpen]);

  if (!isOpen || !repository) return null;

  const showFeedback = (msg: string) => {
    setActionFeedback(msg);
    setTimeout(() => setActionFeedback(null), 3500);
  };

  const handleSaveRepoEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim()) return;

    setIsSavingEdit(true);
    try {
      await updateRepository(repository.id, {
        name: editName.trim(),
        description: editDesc.trim(),
        category: editCategory,
        visibility: editVisibility,
      });
      setIsEditingRepo(false);
      showFeedback('Repositorio actualizado correctamente');
    } catch (err: any) {
      alert(err?.message || 'Error al guardar los cambios.');
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleDeleteRepo = async () => {
    const confirmMsg = isAdmin && !isOwner
      ? `¿Como Administrador, confirmas que deseas eliminar el repositorio "${repository.name}" y todos sus proyectos?`
      : `¿Estás seguro de que deseas eliminar el repositorio "${repository.name}"? Esta acción no se puede deshacer.`;

    if (!window.confirm(confirmMsg)) return;

    try {
      await deleteRepository(repository.id);
      if (onRepoDeleted) onRepoDeleted();
      onClose();
    } catch (err: any) {
      alert(err?.message || 'Error al eliminar el repositorio.');
    }
  };

  const handleDeleteProject = async (projectId: string, title: string) => {
    if (!window.confirm(`¿Deseas eliminar el proyecto "${title}" de este repositorio?`)) return;

    try {
      await deleteRepoProject(projectId, repository.id);
      showFeedback('Proyecto eliminado del repositorio');
    } catch (err: any) {
      alert(err?.message || 'Error al eliminar el proyecto.');
    }
  };

  const handleToggleFeatured = async () => {
    if (!isAdmin) return;
    try {
      await adminModerateRepository(repository.id, {
        isFeatured: !repository.isFeatured,
      });
      showFeedback(repository.isFeatured ? 'Repositorio desmarcado' : 'Repositorio marcado como Destacado');
    } catch (err: any) {
      alert(err?.message || 'Error al moderar repositorio.');
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/65 backdrop-blur-sm overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 15 }}
          className="w-full max-w-4xl bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden my-auto text-left max-h-[90vh] flex flex-col"
        >
          {/* Header del Repositorio */}
          <div className="p-6 sm:p-8 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white relative shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="absolute top-5 right-5 p-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1.5 max-w-2xl">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-indigo-500/30 text-indigo-200 border border-indigo-400/30 flex items-center gap-1">
                    <Folder className="w-3 h-3 text-indigo-300" />
                    {repository.category || 'General'}
                  </span>

                  {repository.visibility === 'public' && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 flex items-center gap-1">
                      <Globe className="w-3 h-3 text-emerald-400" />
                      Público
                    </span>
                  )}
                  {repository.visibility === 'community_only' && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-500/20 text-sky-300 border border-sky-400/30 flex items-center gap-1">
                      <Users className="w-3 h-3 text-sky-400" />
                      Comunidad
                    </span>
                  )}
                  {repository.visibility === 'private' && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-400/30 flex items-center gap-1">
                      <Lock className="w-3 h-3 text-amber-400" />
                      Privado
                    </span>
                  )}

                  {repository.isFeatured && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-amber-400 text-slate-950 flex items-center gap-1 shadow-xs">
                      <Star className="w-3 h-3 fill-slate-950" />
                      Destacado
                    </span>
                  )}
                </div>

                <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  {repository.name}
                </h2>

                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  {repository.description || 'Sin descripción detallada.'}
                </p>

                <div className="flex items-center gap-3 text-xs text-slate-400 pt-2">
                  <span>Creado por: <strong className="text-slate-200">{repository.ownerName}</strong> (@{repository.ownerUsername || 'usuario'})</span>
                  <span>·</span>
                  <span>{projects.length} proyecto{projects.length === 1 ? '' : 's'}</span>
                </div>
              </div>

              {/* Botones de acción del Repositorio */}
              <div className="flex items-center gap-2 flex-wrap shrink-0">
                {canManage && (
                  <button
                    type="button"
                    onClick={() => onOpenUploadProject(repository.id)}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <FileUp className="w-4 h-4" />
                    <span>Subir Proyecto</span>
                  </button>
                )}

                {canManage && (
                  <button
                    type="button"
                    onClick={() => setIsEditingRepo(!isEditingRepo)}
                    className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                    title="Editar detalles del repositorio"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                )}

                {canManage && (
                  <button
                    type="button"
                    onClick={handleDeleteRepo}
                    className="p-2 rounded-xl bg-rose-500/20 hover:bg-rose-500 text-rose-300 hover:text-white transition-colors cursor-pointer"
                    title="Eliminar repositorio"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}

                {isAdmin && (
                  <button
                    type="button"
                    onClick={handleToggleFeatured}
                    className={`p-2 rounded-xl transition-colors cursor-pointer ${
                      repository.isFeatured
                        ? 'bg-amber-400 text-slate-950 font-bold'
                        : 'bg-white/10 text-amber-300 hover:bg-white/20'
                    }`}
                    title={repository.isFeatured ? 'Desmarcar Destacado' : 'Marcar como Destacado (Admin)'}
                  >
                    <Star className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Banner de Moderación Admin si aplica */}
            {isAdmin && (
              <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs text-indigo-300">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Modo Modelado Admin: Puedes editar, auditar, destacar o eliminar proyectos y repositorios libremente.</span>
                </span>
              </div>
            )}
          </div>

          {/* Notificación de feedback */}
          {actionFeedback && (
            <div className="px-6 py-2.5 bg-emerald-50 border-b border-emerald-200 text-xs font-bold text-emerald-800 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{actionFeedback}</span>
            </div>
          )}

          {/* Formulario de edición rápida del repositorio */}
          {isEditingRepo && (
            <form onSubmit={handleSaveRepoEdit} className="p-6 bg-slate-50 border-b border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <Edit3 className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Editar Información del Repositorio</span>
                </h4>
                <button
                  type="button"
                  onClick={() => setIsEditingRepo(false)}
                  className="text-xs text-slate-500 hover:text-slate-800"
                >
                  Cancelar
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="Nombre del repositorio"
                  className="px-3 py-2 text-xs text-slate-800 bg-white border border-slate-200 rounded-xl"
                  required
                />
                <select
                  value={editVisibility}
                  onChange={(e) => setEditVisibility(e.target.value as any)}
                  className="px-3 py-2 text-xs text-slate-800 bg-white border border-slate-200 rounded-xl"
                >
                  <option value="public">Público</option>
                  <option value="community_only">Solo Comunidad</option>
                  <option value="private">Privado</option>
                </select>
              </div>

              <textarea
                value={editDesc}
                onChange={(e) => setEditDesc(e.target.value)}
                placeholder="Descripción del repositorio..."
                rows={2}
                className="w-full px-3 py-2 text-xs text-slate-800 bg-white border border-slate-200 rounded-xl resize-none"
              />

              <div className="flex justify-end gap-2">
                <button
                  type="submit"
                  disabled={isSavingEdit}
                  className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold"
                >
                  {isSavingEdit ? 'Guardando...' : 'Guardar Cambios'}
                </button>
              </div>
            </form>
          )}

          {/* Lista de Proyectos dentro del Repositorio */}
          <div className="p-6 sm:p-8 overflow-y-auto flex-1 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm sm:text-base font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-600" />
                <span>Proyectos y Archivos ({projects.length})</span>
              </h3>

              {canManage && (
                <button
                  type="button"
                  onClick={() => onOpenUploadProject(repository.id)}
                  className="text-xs font-bold text-indigo-600 hover:text-indigo-700 cursor-pointer flex items-center gap-1"
                >
                  <FileUp className="w-3.5 h-3.5" />
                  <span>+ Subir Proyecto</span>
                </button>
              )}
            </div>

            {isLoadingProjects ? (
              <div className="py-16 text-center">
                <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                <p className="text-xs text-slate-500">Cargando proyectos del repositorio...</p>
              </div>
            ) : projects.length === 0 ? (
              <div className="py-16 text-center rounded-2xl bg-slate-50 border border-slate-200 p-8">
                <Layers className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h4 className="text-sm font-bold text-slate-800 mb-1">
                  Aún no hay proyectos en este repositorio
                </h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
                  {canManage
                    ? 'Sube tus archivos de código, imágenes o paquetes para inaugurar este repositorio.'
                    : 'El creador aún no ha subido archivos públicos a este repositorio.'}
                </p>
                {canManage && (
                  <button
                    type="button"
                    onClick={() => onOpenUploadProject(repository.id)}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs cursor-pointer inline-flex items-center gap-1.5 shadow-xs"
                  >
                    <FileUp className="w-3.5 h-3.5" />
                    <span>Subir Primer Proyecto</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {projects.map((proj) => (
                  <div
                    key={proj.id}
                    className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 hover:border-slate-300 shadow-xs transition-all flex flex-col justify-between"
                  >
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm sm:text-base font-bold text-slate-900">
                              {proj.title}
                            </h4>
                            {proj.version && (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                                {proj.version}
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-slate-400">
                            Subido por {proj.ownerName}
                          </span>
                        </div>

                        {canManage && (
                          <button
                            type="button"
                            onClick={() => handleDeleteProject(proj.id, proj.title)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer shrink-0"
                            title="Eliminar proyecto"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>

                      {proj.description && (
                        <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">
                          {proj.description}
                        </p>
                      )}

                      {/* Archivo adjunto del proyecto */}
                      {proj.attachmentUrl && (
                        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
                              {proj.attachmentType?.startsWith('image/') ? (
                                <ImageIcon className="w-4 h-4" />
                              ) : proj.attachmentName?.endsWith('.zip') ? (
                                <FileArchive className="w-4 h-4" />
                              ) : (
                                <FileCode className="w-4 h-4" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-semibold text-slate-800 truncate">
                                {proj.attachmentName || 'archivo-proyecto'}
                              </p>
                              {proj.attachmentSize ? (
                                <p className="text-[10px] text-slate-400">
                                  {formatFileSize(proj.attachmentSize)}
                                </p>
                              ) : null}
                            </div>
                          </div>

                          <a
                            href={proj.attachmentUrl}
                            download={proj.attachmentName || 'proyecto-nexstudio'}
                            className="p-2 text-indigo-600 hover:bg-indigo-100/60 rounded-lg transition-colors cursor-pointer shrink-0"
                            title="Descargar archivo"
                          >
                            <Download className="w-4 h-4" />
                          </a>
                        </div>
                      )}
                    </div>

                    {/* Footer con Demo URL y fecha */}
                    <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                      <span>{new Date(proj.createdAt).toLocaleDateString()}</span>

                      {proj.demoUrl && (
                        <a
                          href={proj.demoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-bold text-indigo-600 hover:underline flex items-center gap-1"
                        >
                          <span>Ver Demo</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
