import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  FolderGit2, 
  Plus, 
  Edit3, 
  Trash2, 
  Eye, 
  EyeOff, 
  Lock, 
  Unlock, 
  Copy, 
  ExternalLink, 
  Check, 
  Search, 
  Clock, 
  Globe, 
  FileDown, 
  ShieldCheck, 
  AlertCircle, 
  X,
  RefreshCw,
  SlidersHorizontal,
  CheckCircle2,
  Palette,
  Gamepad2,
  FileText
} from 'lucide-react';
import { AdminProject, AdminCreation } from '../types';
import { useAdmin } from '../context/AdminContext';

interface AdminProjectsManagerProps {
  onShowToast: (message: string) => void;
  onPreviewProject?: (projectId: string) => void;
}

export const AdminProjectsManager: React.FC<AdminProjectsManagerProps> = ({ 
  onShowToast,
  onPreviewProject
}) => {
  const { 
    projects, 
    updateProject, 
    addProject, 
    deleteProject, 
    toggleProjectVisibility, 
    toggleProjectRestriction,
    creations,
    updateCreation,
    addCreation,
    deleteCreation,
    toggleCreationVisibility
  } = useAdmin();

  const [catalogSection, setCatalogSection] = useState<'proyectos' | 'creaciones'>('proyectos');
  const [searchQuery, setSearchQuery] = useState('');
  const [visibilityFilter, setVisibilityFilter] = useState<'all' | 'visible' | 'hidden'>('all');
  const [restrictionFilter, setRestrictionFilter] = useState<'all' | 'restricted' | 'open'>('all');

  // Modal state for projects
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<AdminProject | null>(null);
  const [projectToDelete, setProjectToDelete] = useState<AdminProject | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Modal state for creations
  const [isCreationModalOpen, setIsCreationModalOpen] = useState(false);
  const [editingCreation, setEditingCreation] = useState<AdminCreation | null>(null);
  const [creationToDelete, setCreationToDelete] = useState<AdminCreation | null>(null);
  const [formCreationTitle, setFormCreationTitle] = useState('');
  const [formCreationCategory, setFormCreationCategory] = useState('');
  const [formCreationTag, setFormCreationTag] = useState('');
  const [formCreationDescription, setFormCreationDescription] = useState('');
  const [formCreationDocUrl, setFormCreationDocUrl] = useState('');
  const [formCreationIsPublic, setFormCreationIsPublic] = useState(true);
  const [creationError, setCreationError] = useState<string | null>(null);

  // Form state
  const [formTitle, setFormTitle] = useState('');
  const [formCategory, setFormCategory] = useState('');
  const [formTag, setFormTag] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formDownloadUrl, setFormDownloadUrl] = useState('');
  const [formLinkUrl, setFormLinkUrl] = useState('');
  const [formWaitTime, setFormWaitTime] = useState(3);
  const [formIsPublic, setFormIsPublic] = useState(true);
  const [formRequireAuth, setFormRequireAuth] = useState(true);
  const [formStatus, setFormStatus] = useState<'active' | 'draft' | 'archived'>('active');
  const [formError, setFormError] = useState<string | null>(null);

  // Open modal for new project
  const handleOpenNewProject = () => {
    setEditingProject(null);
    setFormTitle('');
    setFormCategory('Proyecto ' + (projects.length + 1));
    setFormTag('Proyecto ' + (projects.length + 1));
    setFormDescription('Descripción y detalles del proyecto para los usuarios de NexStudio.');
    setFormDownloadUrl('https://drive.google.com/file/d/...');
    setFormLinkUrl('');
    setFormWaitTime(3);
    setFormIsPublic(true);
    setFormRequireAuth(true);
    setFormStatus('active');
    setFormError(null);
    setIsModalOpen(true);
  };

  // Open modal for editing existing project
  const handleOpenEditProject = (project: AdminProject) => {
    setEditingProject(project);
    setFormTitle(project.title);
    setFormCategory(project.category || '');
    setFormTag(project.tag || '');
    setFormDescription(project.description || '');
    setFormDownloadUrl(project.downloadUrl || '');
    setFormLinkUrl(project.linkUrl || '');
    setFormWaitTime(project.waitTimeSeconds ?? 3);
    setFormIsPublic(project.isPublic ?? true);
    setFormRequireAuth(project.requireAuth ?? true);
    setFormStatus(project.status || 'active');
    setFormError(null);
    setIsModalOpen(true);
  };

  // Save form handler
  const handleSaveProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      setFormError('El título del proyecto es obligatorio.');
      return;
    }
    if (!formDownloadUrl.trim()) {
      setFormError('El enlace de descarga es obligatorio.');
      return;
    }

    try {
      setIsSaving(true);
      if (editingProject) {
        // Update existing
        await updateProject({
          ...editingProject,
          title: formTitle.trim(),
          category: formCategory.trim() || undefined,
          tag: formTag.trim() || undefined,
          description: formDescription.trim(),
          downloadUrl: formDownloadUrl.trim(),
          linkUrl: formLinkUrl.trim() || undefined,
          waitTimeSeconds: Math.max(0, Number(formWaitTime) || 0),
          isPublic: formIsPublic,
          requireAuth: formRequireAuth,
          status: formStatus
        });
        onShowToast(`Proyecto "${formTitle.trim()}" actualizado correctamente`);
      } else {
        // Add new
        await addProject({
          title: formTitle.trim(),
          category: formCategory.trim() || undefined,
          tag: formTag.trim() || undefined,
          description: formDescription.trim(),
          downloadUrl: formDownloadUrl.trim(),
          linkUrl: formLinkUrl.trim() || undefined,
          waitTimeSeconds: Math.max(0, Number(formWaitTime) || 0),
          isPublic: formIsPublic,
          requireAuth: formRequireAuth,
          status: formStatus
        });
        onShowToast(`Nuevo proyecto "${formTitle.trim()}" creado con éxito`);
      }
      setIsModalOpen(false);
    } catch (err: any) {
      console.error('Error guardando proyecto:', err);
      setFormError('Error al guardar los cambios: ' + (err.message || 'Error desconocido'));
    } finally {
      setIsSaving(false);
    }
  };

  // Delete project handler
  const handleConfirmDelete = async () => {
    if (!projectToDelete) return;
    try {
      await deleteProject(projectToDelete.id);
      onShowToast(`Proyecto "${projectToDelete.title}" eliminado`);
      setProjectToDelete(null);
    } catch (err: any) {
      console.error('Error eliminando proyecto:', err);
      onShowToast('Error al eliminar el proyecto');
    }
  };

  // Creation modal open for new
  const handleOpenNewCreation = () => {
    setEditingCreation(null);
    setFormCreationTitle('');
    setFormCreationCategory('Creación Oficial');
    setFormCreationTag('Juegos · HTML5');
    setFormCreationDescription('Descripción y detalles de la creación en HTML.');
    setFormCreationDocUrl('https://docs.google.com/document/d/...');
    setFormCreationIsPublic(true);
    setCreationError(null);
    setIsCreationModalOpen(true);
  };

  // Creation modal open for edit
  const handleOpenEditCreation = (creation: AdminCreation) => {
    setEditingCreation(creation);
    setFormCreationTitle(creation.title);
    setFormCreationCategory(creation.category || 'Creación Oficial');
    setFormCreationTag(creation.tag || 'Juegos · HTML5');
    setFormCreationDescription(creation.description || '');
    setFormCreationDocUrl(creation.documentUrl || '');
    setFormCreationIsPublic(creation.isPublic ?? true);
    setCreationError(null);
    setIsCreationModalOpen(true);
  };

  // Save creation handler
  const handleSaveCreation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formCreationTitle.trim()) {
      setCreationError('El título de la creación es obligatorio.');
      return;
    }
    if (!formCreationDocUrl.trim()) {
      setCreationError('El enlace del documento es obligatorio.');
      return;
    }

    try {
      setIsSaving(true);
      if (editingCreation) {
        await updateCreation({
          ...editingCreation,
          title: formCreationTitle.trim(),
          category: formCreationCategory.trim() || 'Creación Oficial',
          tag: formCreationTag.trim() || 'Juegos · HTML5',
          description: formCreationDescription.trim(),
          documentUrl: formCreationDocUrl.trim(),
          linkUrl: formCreationDocUrl.trim(),
          isPublic: formCreationIsPublic
        });
        onShowToast(`Creación "${formCreationTitle.trim()}" actualizada correctamente`);
      } else {
        await addCreation({
          title: formCreationTitle.trim(),
          category: formCreationCategory.trim() || 'Creación Oficial',
          tag: formCreationTag.trim() || 'Juegos · HTML5',
          description: formCreationDescription.trim(),
          documentUrl: formCreationDocUrl.trim(),
          linkUrl: formCreationDocUrl.trim(),
          isPublic: formCreationIsPublic,
          status: 'active'
        });
        onShowToast(`Nueva creación "${formCreationTitle.trim()}" añadida con éxito`);
      }
      setIsCreationModalOpen(false);
    } catch (err: any) {
      console.error('Error guardando creación:', err);
      setCreationError('Error al guardar: ' + (err.message || 'Error desconocido'));
    } finally {
      setIsSaving(false);
    }
  };

  // Delete creation handler
  const handleConfirmDeleteCreation = async () => {
    if (!creationToDelete) return;
    try {
      await deleteCreation(creationToDelete.id);
      onShowToast(`Creación "${creationToDelete.title}" eliminada`);
      setCreationToDelete(null);
    } catch (err: any) {
      console.error('Error eliminando creación:', err);
      onShowToast('Error al eliminar la creación');
    }
  };

  // Copy URL to clipboard
  const handleCopyUrl = (url: string, id: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
    onShowToast('Enlace copiado al portapapeles');
  };

  // Filter projects
  const filteredProjects = projects.filter(p => {
    const matchesSearch = 
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (p.tag && p.tag.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (p.downloadUrl && p.downloadUrl.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesVisibility = 
      visibilityFilter === 'all' ||
      (visibilityFilter === 'visible' && p.isPublic) ||
      (visibilityFilter === 'hidden' && !p.isPublic);

    const matchesRestriction = 
      restrictionFilter === 'all' ||
      (restrictionFilter === 'restricted' && p.requireAuth) ||
      (restrictionFilter === 'open' && !p.requireAuth);

    return matchesSearch && matchesVisibility && matchesRestriction;
  });

  // Filter creations
  const filteredCreations = creations.filter(c => {
    const matchesSearch = 
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.description && c.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (c.tag && c.tag.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (c.category && c.category.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (c.documentUrl && c.documentUrl.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesVisibility = 
      visibilityFilter === 'all' ||
      (visibilityFilter === 'visible' && c.isPublic) ||
      (visibilityFilter === 'hidden' && !c.isPublic);

    return matchesSearch && matchesVisibility;
  });

  // Counters
  const publicCount = projects.filter(p => p.isPublic).length;
  const restrictedCount = projects.filter(p => p.requireAuth).length;
  const openCount = projects.filter(p => !p.requireAuth).length;

  const publicCreationsCount = creations.filter(c => c.isPublic).length;
  const hiddenCreationsCount = creations.filter(c => !c.isPublic).length;

  return (
    <div className="space-y-6 text-left">
      {/* Catalog Section Switcher (Proyectos vs Creaciones) */}
      <div className="flex items-center gap-2 p-1.5 bg-slate-100/90 rounded-2xl max-w-fit border border-slate-200/80">
        <button
          type="button"
          id="btn-section-proyectos"
          onClick={() => {
            setCatalogSection('proyectos');
            setSearchQuery('');
            setVisibilityFilter('all');
            setRestrictionFilter('all');
          }}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            catalogSection === 'proyectos'
              ? 'bg-white text-indigo-700 shadow-xs border border-slate-200/60'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <FolderGit2 className="w-4 h-4 text-indigo-600" />
          <span>Proyectos ({projects.length})</span>
        </button>

        <button
          type="button"
          id="btn-section-creaciones"
          onClick={() => {
            setCatalogSection('creaciones');
            setSearchQuery('');
            setVisibilityFilter('all');
            setRestrictionFilter('all');
          }}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            catalogSection === 'creaciones'
              ? 'bg-white text-violet-700 shadow-xs border border-slate-200/60'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Palette className="w-4 h-4 text-violet-600" />
          <span>Creaciones ({creations.length})</span>
        </button>
      </div>

      {catalogSection === 'proyectos' ? (
        <>
          {/* Top Banner and Actions for Projects */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-white border border-slate-200 shadow-xs">
            <div>
              <div className="flex items-center gap-2.5 mb-1">
                <div className="p-2 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600">
                  <FolderGit2 className="w-5 h-5" />
                </div>
                <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                  Gestión de Proyectos y Enlaces
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                  {projects.length} {projects.length === 1 ? 'proyecto' : 'proyectos'}
                </span>
              </div>
              <p className="text-xs text-slate-500 max-w-2xl">
                Edita títulos, enlaces de descarga directa (Google Drive, repositorios), visibilidad en la web, tiempos de cuenta regresiva y requisitos de registro previo.
              </p>
            </div>

            <button
              type="button"
              id="btn-admin-create-project"
              onClick={handleOpenNewProject}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer min-h-[42px] whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              <span>Añadir Proyecto</span>
            </button>
          </div>

          {/* Summary KPI Badges */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
              <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Total Proyectos</p>
              <p className="text-2xl font-extrabold text-slate-900 mt-1">{projects.length}</p>
            </div>

            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Visibles al Público</p>
                <Eye className="w-3.5 h-3.5 text-emerald-600" />
              </div>
              <p className="text-2xl font-extrabold text-emerald-600 mt-1">{publicCount}</p>
            </div>

            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Requieren Registro</p>
                <Lock className="w-3.5 h-3.5 text-indigo-600" />
              </div>
              <p className="text-2xl font-extrabold text-indigo-600 mt-1">{restrictedCount}</p>
            </div>

            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Descarga Libre</p>
                <Unlock className="w-3.5 h-3.5 text-teal-600" />
              </div>
              <p className="text-2xl font-extrabold text-teal-600 mt-1">{openCount}</p>
            </div>
          </div>

      {/* Search and Filters Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 p-3 bg-white rounded-xl border border-slate-200 shadow-xs">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por título, etiqueta o enlace..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 focus:bg-white border border-slate-200 focus:border-indigo-500 rounded-lg text-slate-900 placeholder:text-slate-400 transition-colors focus:outline-hidden"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 overflow-x-auto">
          {/* Visibility filter */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
            <button
              type="button"
              onClick={() => setVisibilityFilter('all')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all cursor-pointer whitespace-nowrap ${
                visibilityFilter === 'all' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Todos
            </button>
            <button
              type="button"
              onClick={() => setVisibilityFilter('visible')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1 ${
                visibilityFilter === 'visible' ? 'bg-emerald-500 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Eye className="w-3 h-3" />
              <span>Visibles</span>
            </button>
            <button
              type="button"
              onClick={() => setVisibilityFilter('hidden')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1 ${
                visibilityFilter === 'hidden' ? 'bg-slate-700 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <EyeOff className="w-3 h-3" />
              <span>Ocultos</span>
            </button>
          </div>

          {/* Restriction filter */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
            <button
              type="button"
              onClick={() => setRestrictionFilter('all')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all cursor-pointer whitespace-nowrap ${
                restrictionFilter === 'all' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Cualquier acceso
            </button>
            <button
              type="button"
              onClick={() => setRestrictionFilter('restricted')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1 ${
                restrictionFilter === 'restricted' ? 'bg-indigo-600 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Lock className="w-3 h-3" />
              <span>Con Registro</span>
            </button>
            <button
              type="button"
              onClick={() => setRestrictionFilter('open')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1 ${
                restrictionFilter === 'open' ? 'bg-teal-600 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Unlock className="w-3 h-3" />
              <span>Libre</span>
            </button>
          </div>
        </div>
      </div>

      {/* Projects List */}
      {filteredProjects.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 shadow-xs">
          <FolderGit2 className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-sm font-bold text-slate-800">No se encontraron proyectos</p>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {searchQuery ? 'Prueba ajustando los términos de búsqueda o los filtros activos.' : 'No hay proyectos configurados en el sistema.'}
          </p>
          {searchQuery && (
            <button
              type="button"
              onClick={() => { setSearchQuery(''); setVisibilityFilter('all'); setRestrictionFilter('all'); }}
              className="mt-4 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
            >
              Restablecer filtros
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredProjects.map((project) => (
            <motion.div
              key={project.id}
              layout
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs hover:border-indigo-200 transition-all space-y-4"
            >
              {/* Header row */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start sm:items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0 font-bold text-sm">
                    {project.title.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-base font-bold text-slate-900 tracking-tight">
                        {project.title}
                      </h3>
                      {project.tag && (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                          {project.tag}
                        </span>
                      )}
                      <span className="text-[10px] font-mono text-slate-400">
                        ({project.id})
                      </span>
                    </div>
                    {project.description && (
                      <p className="text-xs text-slate-600 mt-0.5 line-clamp-1">
                        {project.description}
                      </p>
                    )}
                  </div>
                </div>

                {/* Status switches and actions */}
                <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                  <button
                    type="button"
                    onClick={() => handleOpenEditProject(project)}
                    className="p-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
                    title="Editar información, enlaces y reglas"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Editar</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setProjectToDelete(project)}
                    className="p-2 rounded-xl border border-rose-200 hover:bg-rose-50 text-rose-600 text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
                    title="Eliminar proyecto"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Badges & Settings Bar */}
              <div className="pt-3 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                {/* 1. Enlace de descarga */}
                <div className="flex flex-col gap-1 p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                    <FileDown className="w-3 h-3 text-emerald-600" />
                    <span>Enlace de Descarga</span>
                  </span>
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-[11px] text-slate-700 truncate select-all" title={project.downloadUrl}>
                      {project.downloadUrl || 'Sin enlace configurado'}
                    </span>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleCopyUrl(project.downloadUrl, project.id)}
                        className="p-1 text-slate-400 hover:text-slate-700 rounded transition-colors cursor-pointer"
                        title="Copiar enlace"
                      >
                        {copiedId === project.id ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                      </button>
                      <a
                        href={project.downloadUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1 text-slate-400 hover:text-indigo-600 rounded transition-colors"
                        title="Abrir enlace en pestaña nueva"
                      >
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                </div>

                {/* 2. Tiempo de espera */}
                <div className="flex flex-col gap-1 p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                    <Clock className="w-3 h-3 text-amber-500" />
                    <span>Cuenta Regresiva</span>
                  </span>
                  <span className="font-semibold text-slate-800">
                    {project.waitTimeSeconds ?? 3} segundos de espera
                  </span>
                </div>

                {/* 3. Visibilidad Toggle */}
                <div className="flex flex-col gap-1 p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between">
                    <span>Visibilidad</span>
                    <button
                      type="button"
                      onClick={() => {
                        toggleProjectVisibility(project.id);
                        onShowToast(`Visibilidad cambiada para ${project.title}`);
                      }}
                      className="text-indigo-600 hover:text-indigo-700 text-[10px] font-bold underline cursor-pointer"
                    >
                      Alternar
                    </button>
                  </span>
                  <div>
                    {project.isPublic ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                        <Eye className="w-3 h-3" />
                        <span>Público en catálogo</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-600 bg-slate-200 px-2 py-0.5 rounded-md border border-slate-300">
                        <EyeOff className="w-3 h-3" />
                        <span>Oculto (Borrador)</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* 4. Restricción Toggle */}
                <div className="flex flex-col gap-1 p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between">
                    <span>Restricción</span>
                    <button
                      type="button"
                      onClick={() => {
                        toggleProjectRestriction(project.id);
                        onShowToast(`Restricción actualizada para ${project.title}`);
                      }}
                      className="text-indigo-600 hover:text-indigo-700 text-[10px] font-bold underline cursor-pointer"
                    >
                      Alternar
                    </button>
                  </span>
                  <div>
                    {project.requireAuth ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-200">
                        <Lock className="w-3 h-3" />
                        <span>Registro Obligatorio</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200">
                        <Unlock className="w-3 h-3" />
                        <span>Descarga Libre</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
        </>
      ) : (
        /* CREACIONES SECTION */
        <>
          {/* Top Banner and Actions for Creaciones */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-white border border-slate-200 shadow-xs">
            <div>
              <div className="flex items-center gap-2.5 mb-1">
                <div className="p-2 rounded-xl bg-violet-50 border border-violet-100 text-violet-600">
                  <Palette className="w-5 h-5" />
                </div>
                <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                  Gestión de Creaciones y Enlaces de Documentos
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-violet-50 text-violet-700 border border-violet-200">
                  {creations.length} {creations.length === 1 ? 'creación' : 'creaciones'}
                </span>
              </div>
              <p className="text-xs text-slate-500 max-w-2xl">
                Administra creaciones interactivas como <strong>Juegos En HTML</strong>, configura el enlace directo al documento oficial de Google Docs y gestiona la visibilidad en el catálogo.
              </p>
            </div>

            <button
              type="button"
              id="btn-admin-create-creation"
              onClick={handleOpenNewCreation}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 active:bg-violet-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer min-h-[42px] whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              <span>Añadir Creación</span>
            </button>
          </div>

          {/* Summary KPI Badges for Creaciones */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
              <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Total Creaciones</p>
              <p className="text-2xl font-extrabold text-slate-900 mt-1">{creations.length}</p>
            </div>

            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Visibles al Público</p>
                <Eye className="w-3.5 h-3.5 text-emerald-600" />
              </div>
              <p className="text-2xl font-extrabold text-emerald-600 mt-1">{publicCreationsCount}</p>
            </div>

            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Documentos Activos</p>
                <FileText className="w-3.5 h-3.5 text-violet-600" />
              </div>
              <p className="text-2xl font-extrabold text-violet-600 mt-1">{creations.length}</p>
            </div>

            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Ocultas</p>
                <EyeOff className="w-3.5 h-3.5 text-slate-500" />
              </div>
              <p className="text-2xl font-extrabold text-slate-600 mt-1">{hiddenCreationsCount}</p>
            </div>
          </div>

          {/* Search and Filters Bar for Creaciones */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 p-3 bg-white rounded-xl border border-slate-200 shadow-xs">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar creación por título, etiqueta o enlace del documento..."
                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 focus:bg-white border border-slate-200 focus:border-violet-500 rounded-lg text-slate-900 placeholder:text-slate-400 transition-colors focus:outline-hidden"
              />
            </div>

            <div className="flex items-center gap-2 overflow-x-auto">
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
                <button
                  type="button"
                  onClick={() => setVisibilityFilter('all')}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all cursor-pointer whitespace-nowrap ${
                    visibilityFilter === 'all' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Todas
                </button>
                <button
                  type="button"
                  onClick={() => setVisibilityFilter('visible')}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1 ${
                    visibilityFilter === 'visible' ? 'bg-emerald-500 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Eye className="w-3 h-3" />
                  <span>Visibles</span>
                </button>
                <button
                  type="button"
                  onClick={() => setVisibilityFilter('hidden')}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1 ${
                    visibilityFilter === 'hidden' ? 'bg-slate-700 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <EyeOff className="w-3 h-3" />
                  <span>Ocultas</span>
                </button>
              </div>
            </div>
          </div>

          {/* Creaciones List */}
          {filteredCreations.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 shadow-xs">
              <Palette className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-sm font-bold text-slate-800">No se encontraron creaciones</p>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                {searchQuery ? 'Prueba ajustando los términos de búsqueda o los filtros activos.' : 'No hay creaciones añadidas en el sistema.'}
              </p>
              <button
                type="button"
                onClick={handleOpenNewCreation}
                className="mt-4 px-4 py-2 rounded-xl text-xs font-bold bg-violet-600 hover:bg-violet-500 text-white transition-colors cursor-pointer"
              >
                Añadir Primera Creación
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredCreations.map((creation) => (
                <motion.div
                  key={creation.id}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs hover:border-violet-300 transition-all space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-start sm:items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-violet-50 border border-violet-100 flex items-center justify-center text-violet-600 shrink-0 font-bold text-sm">
                        <Gamepad2 className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-base font-bold text-slate-900 tracking-tight">
                            {creation.title}
                          </h3>
                          {creation.tag && (
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-violet-50 text-violet-700 border border-violet-200">
                              {creation.tag}
                            </span>
                          )}
                          {creation.category && (
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                              {creation.category}
                            </span>
                          )}
                        </div>
                        {creation.description && (
                          <p className="text-xs text-slate-600 mt-0.5 line-clamp-1">
                            {creation.description}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                      <button
                        type="button"
                        onClick={() => handleOpenEditCreation(creation)}
                        className="p-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
                        title="Editar creación y enlace"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Editar</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setCreationToDelete(creation)}
                        className="p-2 rounded-xl border border-rose-200 hover:bg-rose-50 text-rose-600 text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
                        title="Eliminar creación"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Document URL and Visibility bar */}
                  <div className="pt-3 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="flex flex-col gap-1 p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                        <FileText className="w-3 h-3 text-violet-600" />
                        <span>Enlace del Documento (Google Docs)</span>
                      </span>
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono text-[11px] text-slate-700 truncate select-all" title={creation.documentUrl}>
                          {creation.documentUrl || 'Sin enlace configurado'}
                        </span>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleCopyUrl(creation.documentUrl, creation.id)}
                            className="p-1 text-slate-400 hover:text-slate-700 rounded transition-colors cursor-pointer"
                            title="Copiar enlace del documento"
                          >
                            {copiedId === creation.id ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                          </button>
                          {creation.documentUrl && (
                            <a
                              href={creation.documentUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="p-1 text-slate-400 hover:text-violet-600 rounded transition-colors"
                              title="Abrir documento en pestaña nueva"
                            >
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-1 p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between">
                        <span>Visibilidad en el Catálogo</span>
                        <button
                          type="button"
                          onClick={() => {
                            toggleCreationVisibility(creation.id);
                            onShowToast(`Visibilidad cambiada para ${creation.title}`);
                          }}
                          className="text-violet-600 hover:text-violet-700 text-[10px] font-bold underline cursor-pointer"
                        >
                          Alternar
                        </button>
                      </span>
                      <div>
                        {creation.isPublic ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                            <Eye className="w-3 h-3" />
                            <span>Público en catálogo</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-600 bg-slate-200 px-2 py-0.5 rounded-md border border-slate-300">
                            <EyeOff className="w-3 h-3" />
                            <span>Oculto (Borrador)</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </>
      )}

      {/* MODAL: Crear o Editar Proyecto */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-xl bg-white rounded-2xl p-6 sm:p-7 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto space-y-5 text-left"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
                    <FolderGit2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">
                      {editingProject ? `Editar Proyecto: ${editingProject.title}` : 'Crear Nuevo Proyecto'}
                    </h3>
                    <p className="text-xs text-slate-500">
                      Configuración de enlaces, visibilidad en el catálogo y restricciones de descarga.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Error Alert */}
              {formError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleSaveProject} className="space-y-4">
                {/* Title */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Título del Proyecto *
                  </label>
                  <input
                    type="text"
                    required
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    placeholder="Ej. Asistente Web En HTML"
                    className="w-full px-3 py-2 text-xs bg-slate-50 focus:bg-white border border-slate-200 focus:border-indigo-500 rounded-xl text-slate-900 transition-colors focus:outline-hidden"
                  />
                </div>

                {/* Category & Tag */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Categoría
                    </label>
                    <input
                      type="text"
                      value={formCategory}
                      onChange={(e) => setFormCategory(e.target.value)}
                      placeholder="Ej. Proyecto 1, Inteligencia Artificial"
                      className="w-full px-3 py-2 text-xs bg-slate-50 focus:bg-white border border-slate-200 focus:border-indigo-500 rounded-xl text-slate-900 transition-colors focus:outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Etiqueta (Tag)
                    </label>
                    <input
                      type="text"
                      value={formTag}
                      onChange={(e) => setFormTag(e.target.value)}
                      placeholder="Ej. Proyecto 1, HTML5"
                      className="w-full px-3 py-2 text-xs bg-slate-50 focus:bg-white border border-slate-200 focus:border-indigo-500 rounded-xl text-slate-900 transition-colors focus:outline-hidden"
                    />
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Descripción del Proyecto
                  </label>
                  <textarea
                    rows={3}
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    placeholder="Describe las características y funcionalidades del proyecto..."
                    className="w-full px-3 py-2 text-xs bg-slate-50 focus:bg-white border border-slate-200 focus:border-indigo-500 rounded-xl text-slate-900 transition-colors focus:outline-hidden resize-none"
                  />
                </div>

                {/* Download URL */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <FileDown className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Enlace de Descarga Principal (Google Drive / GitHub / ZIP) *</span>
                    </span>
                  </label>
                  <input
                    type="url"
                    required
                    value={formDownloadUrl}
                    onChange={(e) => setFormDownloadUrl(e.target.value)}
                    placeholder="https://drive.google.com/file/d/..."
                    className="w-full px-3 py-2 text-xs font-mono bg-slate-50 focus:bg-white border border-slate-200 focus:border-indigo-500 rounded-xl text-slate-900 transition-colors focus:outline-hidden"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    Este es el enlace al que se redirige al usuario una vez completada la cuenta regresiva.
                  </p>
                </div>

                {/* Link URL (optional external or demo) */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Enlace Web Demo o Repositorio (Opcional)</span>
                  </label>
                  <input
                    type="url"
                    value={formLinkUrl}
                    onChange={(e) => setFormLinkUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full px-3 py-2 text-xs font-mono bg-slate-50 focus:bg-white border border-slate-200 focus:border-indigo-500 rounded-xl text-slate-900 transition-colors focus:outline-hidden"
                  />
                </div>

                {/* Countdown timer & Status */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-amber-500" />
                      <span>Espera para Descarga (Segundos)</span>
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={60}
                      value={formWaitTime}
                      onChange={(e) => setFormWaitTime(Number(e.target.value))}
                      className="w-full px-3 py-2 text-xs bg-slate-50 focus:bg-white border border-slate-200 focus:border-indigo-500 rounded-xl text-slate-900 transition-colors focus:outline-hidden"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">Segundos de cuenta atrás antes de abrir el enlace (ej. 3 seg).</p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Estado del Proyecto
                    </label>
                    <select
                      value={formStatus}
                      onChange={(e) => setFormStatus(e.target.value as any)}
                      className="w-full px-3 py-2 text-xs bg-slate-50 focus:bg-white border border-slate-200 focus:border-indigo-500 rounded-xl text-slate-900 transition-colors focus:outline-hidden cursor-pointer"
                    >
                      <option value="active">Activo (Publicado)</option>
                      <option value="draft">Borrador (Solo Admin)</option>
                      <option value="archived">Archivado</option>
                    </select>
                  </div>
                </div>

                {/* Controls: Visibilidad & Restricción */}
                <div className="space-y-3 pt-2 border-t border-slate-100">
                  {/* Visibilidad Switch */}
                  <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2.5">
                      <div className={`p-2 rounded-lg ${formIsPublic ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'}`}>
                        {formIsPublic ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-900">
                          Visibilidad en la Web ({formIsPublic ? 'Visible' : 'Oculto'})
                        </p>
                        <p className="text-[11px] text-slate-500">
                          {formIsPublic 
                            ? 'El proyecto aparecerá en la sección de Proyectos para todos los visitantes.' 
                            : 'El proyecto permanecerá oculto para visitantes regulares y solo lo verán administradores.'}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setFormIsPublic(!formIsPublic)}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                        formIsPublic ? 'bg-emerald-600' : 'bg-slate-300'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                          formIsPublic ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Restricción de Registro Switch */}
                  <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2.5">
                      <div className={`p-2 rounded-lg ${formRequireAuth ? 'bg-indigo-100 text-indigo-700' : 'bg-teal-100 text-teal-700'}`}>
                        {formRequireAuth ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-900">
                          Restricción de Descarga ({formRequireAuth ? 'Registro Obligatorio' : 'Descarga Libre'})
                        </p>
                        <p className="text-[11px] text-slate-500">
                          {formRequireAuth 
                            ? 'Requiere si o si que el usuario esté registrado e inicie sesión con Google para poder descargar.' 
                            : 'Cualquier usuario puede descargar inmediatamente sin necesidad de autenticación.'}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setFormRequireAuth(!formRequireAuth)}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                        formRequireAuth ? 'bg-indigo-600' : 'bg-slate-300'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                          formRequireAuth ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                </div>

                {/* Form Buttons */}
                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {isSaving && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                    <span>{editingProject ? 'Guardar Cambios' : 'Crear Proyecto'}</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: Confirmar Eliminación */}
      <AnimatePresence>
        {projectToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md bg-white rounded-2xl p-6 shadow-2xl border border-slate-200 space-y-4 text-left"
            >
              <div className="flex items-center gap-3 text-rose-600">
                <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-100">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Eliminar Proyecto</h3>
                  <p className="text-xs text-slate-500">Esta acción no se puede deshacer.</p>
                </div>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                ¿Estás seguro de que deseas eliminar permanentemente el proyecto <strong>"{projectToDelete.title}"</strong> (ID: {projectToDelete.id})? Los enlaces de descarga asociados ya no estarán disponibles.
              </p>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setProjectToDelete(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
                >
                  Sí, eliminar proyecto
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: Crear o Editar Creación */}
      <AnimatePresence>
        {isCreationModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-xl bg-white rounded-2xl p-6 sm:p-7 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto space-y-5 text-left"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-violet-50 text-violet-600">
                    <Palette className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">
                      {editingCreation ? `Editar Creación: ${editingCreation.title}` : 'Crear Nueva Creación'}
                    </h3>
                    <p className="text-xs text-slate-500">
                      Configura el título, enlace del documento de Google Docs y visibilidad en catálogo.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsCreationModalOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Error Alert */}
              {creationError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{creationError}</span>
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleSaveCreation} className="space-y-4">
                {/* Title */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Título de la Creación *
                  </label>
                  <input
                    type="text"
                    required
                    value={formCreationTitle}
                    onChange={(e) => setFormCreationTitle(e.target.value)}
                    placeholder="Ej. Juegos En HTML"
                    className="w-full px-3 py-2 text-xs bg-slate-50 focus:bg-white border border-slate-200 focus:border-violet-500 rounded-xl text-slate-900 transition-colors focus:outline-hidden"
                  />
                </div>

                {/* Category & Tag */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Categoría
                    </label>
                    <input
                      type="text"
                      value={formCreationCategory}
                      onChange={(e) => setFormCreationCategory(e.target.value)}
                      placeholder="Ej. Creación Oficial"
                      className="w-full px-3 py-2 text-xs bg-slate-50 focus:bg-white border border-slate-200 focus:border-violet-500 rounded-xl text-slate-900 transition-colors focus:outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Etiqueta (Tag)
                    </label>
                    <input
                      type="text"
                      value={formCreationTag}
                      onChange={(e) => setFormCreationTag(e.target.value)}
                      placeholder="Ej. Juegos · HTML5"
                      className="w-full px-3 py-2 text-xs bg-slate-50 focus:bg-white border border-slate-200 focus:border-violet-500 rounded-xl text-slate-900 transition-colors focus:outline-hidden"
                    />
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Descripción de la Creación
                  </label>
                  <textarea
                    rows={3}
                    value={formCreationDescription}
                    onChange={(e) => setFormCreationDescription(e.target.value)}
                    placeholder="Describe los juegos, tutoriales o recursos incluidos en esta creación..."
                    className="w-full px-3 py-2 text-xs bg-slate-50 focus:bg-white border border-slate-200 focus:border-violet-500 rounded-xl text-slate-900 transition-colors focus:outline-hidden resize-none"
                  />
                </div>

                {/* Document URL */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-violet-600" />
                      <span>Enlace del Documento (Google Docs) *</span>
                    </span>
                  </label>
                  <input
                    type="url"
                    required
                    value={formCreationDocUrl}
                    onChange={(e) => setFormCreationDocUrl(e.target.value)}
                    placeholder="https://docs.google.com/document/d/..."
                    className="w-full px-3 py-2 text-xs font-mono bg-slate-50 focus:bg-white border border-slate-200 focus:border-violet-500 rounded-xl text-slate-900 transition-colors focus:outline-hidden"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    Enlace permanente de Google Docs que se abrirá o embeberá cuando los usuarios exploren esta creación.
                  </p>
                </div>

                {/* Controls: Visibilidad Switch */}
                <div className="pt-2 border-t border-slate-100">
                  <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2.5">
                      <div className={`p-2 rounded-lg ${formCreationIsPublic ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'}`}>
                        {formCreationIsPublic ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-900">
                          Visibilidad en la Web ({formCreationIsPublic ? 'Visible' : 'Oculto'})
                        </p>
                        <p className="text-[11px] text-slate-500">
                          {formCreationIsPublic 
                            ? 'La creación aparecerá en la sección de Creaciones para todos los visitantes.' 
                            : 'La creación permanecerá oculta para visitantes regulares y solo la verán administradores.'}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setFormCreationIsPublic(!formCreationIsPublic)}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                        formCreationIsPublic ? 'bg-emerald-600' : 'bg-slate-300'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                          formCreationIsPublic ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                </div>

                {/* Form Buttons */}
                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsCreationModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 active:bg-violet-700 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {isSaving && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                    <span>{editingCreation ? 'Guardar Cambios' : 'Crear Creación'}</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: Confirmar Eliminación de Creación */}
      <AnimatePresence>
        {creationToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md bg-white rounded-2xl p-6 shadow-2xl border border-slate-200 space-y-4 text-left"
            >
              <div className="flex items-center gap-3 text-rose-600">
                <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-100">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Eliminar Creación</h3>
                  <p className="text-xs text-slate-500">Esta acción no se puede deshacer.</p>
                </div>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                ¿Estás seguro de que deseas eliminar permanentemente la creación <strong>"{creationToDelete.title}"</strong> (ID: {creationToDelete.id})? El enlace del documento asociado dejará de mostrarse en el catálogo.
              </p>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setCreationToDelete(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDeleteCreation}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
                >
                  Sí, eliminar creación
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
