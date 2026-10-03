import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Bell,
  Sparkles,
  Plus,
  Edit3,
  Trash2,
  Eye,
  CheckCircle2,
  X,
  RotateCcw,
  Boxes,
  FolderKanban,
  Users,
  Share2,
  UserCheck,
  HelpCircle,
  Wrench,
  Zap,
  Shield,
  Layers,
  Calendar,
  Tag,
  Check,
  AlertCircle,
  FileText
} from 'lucide-react';
import { NewsItem, NewsChangelogCategory } from '../types';
import { useAdmin } from '../context/AdminContext';

interface AdminNewsManagerProps {
  onShowToast: (message: string) => void;
}

// Map icon string names to React Lucide icons
export const NEWS_ICON_OPTIONS = [
  { name: 'Boxes', label: 'Cajas / Plataforma', icon: <Boxes className="w-4 h-4 text-indigo-600" /> },
  { name: 'FolderKanban', label: 'Proyectos / Carpetas', icon: <FolderKanban className="w-4 h-4 text-violet-600" /> },
  { name: 'Wrench', label: 'Herramientas / Utilidades', icon: <Wrench className="w-4 h-4 text-amber-600" /> },
  { name: 'Users', label: 'Comunidad / Social', icon: <Users className="w-4 h-4 text-sky-600" /> },
  { name: 'Share2', label: 'Redes / Enlaces', icon: <Share2 className="w-4 h-4 text-emerald-600" /> },
  { name: 'UserCheck', label: 'Cuentas / Perfiles', icon: <UserCheck className="w-4 h-4 text-indigo-600" /> },
  { name: 'HelpCircle', label: 'Soporte / Ayuda', icon: <HelpCircle className="w-4 h-4 text-amber-600" /> },
  { name: 'Zap', label: 'Rendimiento / Velocidad', icon: <Zap className="w-4 h-4 text-amber-500" /> },
  { name: 'Shield', label: 'Seguridad / Blindaje', icon: <Shield className="w-4 h-4 text-rose-600" /> },
  { name: 'Sparkles', label: 'Especial / Novedad', icon: <Sparkles className="w-4 h-4 text-purple-600" /> },
  { name: 'Layers', label: 'Módulos / Varios', icon: <Layers className="w-4 h-4 text-cyan-600" /> }
];

export const getNewsIcon = (iconName?: string) => {
  const found = NEWS_ICON_OPTIONS.find((opt) => opt.name === iconName);
  if (found) return found.icon;
  return <Sparkles className="w-4 h-4 text-indigo-600" />;
};

export const AdminNewsManager: React.FC<AdminNewsManagerProps> = ({ onShowToast }) => {
  const {
    newsList,
    addNewsItem,
    updateNewsItem,
    deleteNewsItem,
    toggleNewsPublish,
    setCurrentNews,
    resetNewsToDefault
  } = useAdmin();

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [activeModalTab, setActiveModalTab] = useState<'info' | 'categories' | 'preview'>('info');

  // Form Fields
  const [formTitle, setFormTitle] = useState('');
  const [formVersion, setFormVersion] = useState('');
  const [formBadge, setFormBadge] = useState('');
  const [formSubtitle, setFormSubtitle] = useState('');
  const [formDate, setFormDate] = useState('');
  const [formIsPublished, setFormIsPublished] = useState(true);
  const [formIsCurrent, setFormIsCurrent] = useState(true);
  const [formCategories, setFormCategories] = useState<NewsChangelogCategory[]>([]);

  // Preview Modal for individual news
  const [previewItem, setPreviewItem] = useState<NewsItem | null>(null);

  // Open modal for new item
  const handleOpenCreateModal = () => {
    setEditingId(null);
    setFormTitle('Actualización 1.1');
    setFormVersion('1.1');
    setFormBadge('Versión 1.1');
    setFormSubtitle('Nuevas mejoras, optimizaciones y funciones añadidas a NexStudio');
    setFormDate('Octubre 2026');
    setFormIsPublished(true);
    setFormIsCurrent(true);
    setFormCategories([
      {
        id: `cat-${Date.now()}-1`,
        title: 'Nuevas Funciones',
        iconName: 'Sparkles',
        items: ['Primera novedad destacada de la actualización.']
      },
      {
        id: `cat-${Date.now()}-2`,
        title: 'Mejoras y Correcciones',
        iconName: 'Wrench',
        items: ['Optimización de rendimiento en la navegación.']
      }
    ]);
    setActiveModalTab('info');
    setIsModalOpen(true);
  };

  // Open modal for editing existing item
  const handleOpenEditModal = (item: NewsItem) => {
    setEditingId(item.id);
    setFormTitle(item.title);
    setFormVersion(item.version);
    setFormBadge(item.badge || `Versión ${item.version}`);
    setFormSubtitle(item.subtitle || '');
    setFormDate(item.date || '');
    setFormIsPublished(item.isPublished);
    setFormIsCurrent(item.isCurrent ?? false);
    setFormCategories(
      item.categories.map((c, i) => ({
        id: c.id || `cat-${i}-${Date.now()}`,
        title: c.title,
        iconName: c.iconName || 'Sparkles',
        items: [...c.items]
      }))
    );
    setActiveModalTab('info');
    setIsModalOpen(true);
  };

  // Category & Bullet points manipulation
  const handleAddCategory = () => {
    setFormCategories((prev) => [
      ...prev,
      {
        id: `cat-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        title: 'Nueva Sección',
        iconName: 'Boxes',
        items: ['Nuevo cambio o función agregada.']
      }
    ]);
  };

  const handleUpdateCategoryTitle = (catIndex: number, newTitle: string) => {
    setFormCategories((prev) =>
      prev.map((c, i) => (i === catIndex ? { ...c, title: newTitle } : c))
    );
  };

  const handleUpdateCategoryIcon = (catIndex: number, newIconName: string) => {
    setFormCategories((prev) =>
      prev.map((c, i) => (i === catIndex ? { ...c, iconName: newIconName } : c))
    );
  };

  const handleDeleteCategory = (catIndex: number) => {
    setFormCategories((prev) => prev.filter((_, i) => i !== catIndex));
  };

  const handleAddBulletItem = (catIndex: number) => {
    setFormCategories((prev) =>
      prev.map((c, i) =>
        i === catIndex ? { ...c, items: [...c.items, 'Nueva mejora o detalle agregado.'] } : c
      )
    );
  };

  const handleUpdateBulletItem = (catIndex: number, itemIndex: number, newText: string) => {
    setFormCategories((prev) =>
      prev.map((c, i) => {
        if (i !== catIndex) return c;
        const newItems = [...c.items];
        newItems[itemIndex] = newText;
        return { ...c, items: newItems };
      })
    );
  };

  const handleDeleteBulletItem = (catIndex: number, itemIndex: number) => {
    setFormCategories((prev) =>
      prev.map((c, i) => {
        if (i !== catIndex) return c;
        return { ...c, items: c.items.filter((_, idx) => idx !== itemIndex) };
      })
    );
  };

  // Save changes
  const handleSave = async () => {
    if (!formTitle.trim()) {
      onShowToast('El título de la actualización no puede estar vacío');
      return;
    }

    try {
      if (editingId) {
        // Edit existing
        const updated: NewsItem = {
          id: editingId,
          title: formTitle.trim(),
          version: formVersion.trim() || '1.0',
          badge: formBadge.trim() || `Versión ${formVersion}`,
          subtitle: formSubtitle.trim(),
          date: formDate.trim() || 'Reciente',
          isPublished: formIsPublished,
          isCurrent: formIsCurrent,
          categories: formCategories.filter((c) => c.title.trim().length > 0),
          updatedAt: new Date().toISOString()
        };
        await updateNewsItem(updated);
        onShowToast(`Actualización "${formTitle}" guardada con éxito`);
      } else {
        // Add new
        await addNewsItem({
          title: formTitle.trim(),
          version: formVersion.trim() || '1.0',
          badge: formBadge.trim() || `Versión ${formVersion}`,
          subtitle: formSubtitle.trim(),
          date: formDate.trim() || 'Reciente',
          isPublished: formIsPublished,
          isCurrent: formIsCurrent,
          categories: formCategories.filter((c) => c.title.trim().length > 0)
        });
        onShowToast(`Nueva actualización "${formTitle}" creada con éxito`);
      }
      setIsModalOpen(false);
    } catch {
      onShowToast('Error al guardar la actualización');
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (window.confirm(`¿Estás seguro de que deseas eliminar la actualización "${title}"?`)) {
      await deleteNewsItem(id);
      onShowToast(`Actualización "${title}" eliminada`);
    }
  };

  const handleResetDefaults = async () => {
    if (window.confirm('¿Restablecer las noticias a la Actualización 1.0 original de NexStudio?')) {
      await resetNewsToDefault();
      onShowToast('Noticias restablecidas a la versión oficial original');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-white border border-slate-200 shadow-xs">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200/80 mb-2">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            <span>Gestor de Changelog & Notas de Versión</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            Gestión de Noticias y Actualizaciones
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Modifica los textos, añade nuevas versiones o edita los puntos y categorías de la sección <strong>Noticias</strong> en tiempo real.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={handleResetDefaults}
            className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold transition-all cursor-pointer shadow-xs"
            title="Restablece las noticias a la versión original de lanzamiento"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
            <span>Restaurar por defecto</span>
          </button>

          <button
            type="button"
            id="btn-admin-add-news"
            onClick={handleOpenCreateModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all cursor-pointer shadow-md shadow-indigo-600/20"
          >
            <Plus className="w-4 h-4" />
            <span>Nueva Actualización</span>
          </button>
        </div>
      </div>

      {/* List of News Items */}
      <div className="space-y-4">
        {newsList.map((item) => (
          <div
            key={item.id}
            className={`p-6 rounded-3xl bg-white border transition-all shadow-xs ${
              item.isCurrent
                ? 'border-indigo-400 ring-2 ring-indigo-500/10'
                : 'border-slate-200 hover:border-slate-300'
            }`}
          >
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-base sm:text-lg font-extrabold text-slate-900">
                    {item.title}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-lg text-xs font-bold bg-indigo-600 text-white">
                    {item.badge || `v${item.version}`}
                  </span>
                  {item.isCurrent && (
                    <span className="px-2.5 py-0.5 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      <span>Versión Actual Destacada</span>
                    </span>
                  )}
                  <span
                    className={`px-2 py-0.5 rounded-md text-[11px] font-semibold border ${
                      item.isPublished
                        ? 'bg-blue-50 text-blue-700 border-blue-200'
                        : 'bg-slate-100 text-slate-600 border-slate-200'
                    }`}
                  >
                    {item.isPublished ? 'Publicada para todos' : 'Borrador (Oculta)'}
                  </span>
                </div>

                <p className="text-xs text-slate-600 max-w-2xl font-normal leading-relaxed">
                  {item.subtitle || 'Sin descripción resumida'}
                </p>

                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 pt-1">
                  {item.date && (
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      {item.date}
                    </span>
                  )}
                  <span>
                    <strong>{item.categories.length}</strong> secciones &bull;{' '}
                    <strong>{item.categories.reduce((acc, c) => acc + c.items.length, 0)}</strong> puntos en el changelog
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                <button
                  type="button"
                  onClick={() => setPreviewItem(item)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold transition-all cursor-pointer"
                  title="Ver vista previa como lo ven los visitantes"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Vista previa</span>
                </button>

                {!item.isCurrent && (
                  <button
                    type="button"
                    onClick={() => {
                      setCurrentNews(item.id);
                      onShowToast(`"${item.title}" marcada como versión destacada`);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-all cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Hacer actual</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    toggleNewsPublish(item.id);
                    onShowToast(`Visibilidad cambiada para "${item.title}"`);
                  }}
                  className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                    item.isPublished
                      ? 'border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100'
                      : 'border-blue-200 bg-blue-50 text-blue-800 hover:bg-blue-100'
                  }`}
                >
                  <span>{item.isPublished ? 'Ocultar' : 'Publicar'}</span>
                </button>

                <button
                  type="button"
                  id={`btn-edit-news-${item.id}`}
                  onClick={() => handleOpenEditModal(item)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-bold transition-all cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Editar</span>
                </button>

                {newsList.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleDelete(item.id, item.title)}
                    className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                    title="Eliminar actualización"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Complete Edit / Create Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-4xl bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden my-8 max-h-[90vh] flex flex-col"
            >
              {/* Modal Header */}
              <div className="p-6 bg-slate-50 border-b border-slate-200 flex items-center justify-between shrink-0">
                <div>
                  <h3 className="text-lg sm:text-xl font-bold text-slate-900">
                    {editingId ? `Editar: ${formTitle}` : 'Crear Nueva Actualización'}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Configura la información general, añade secciones y redacta los puntos del changelog.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Tabs */}
              <div className="flex items-center gap-2 px-6 pt-4 border-b border-slate-100 bg-white shrink-0">
                <button
                  type="button"
                  onClick={() => setActiveModalTab('info')}
                  className={`pb-3 text-xs font-bold border-b-2 transition-all cursor-pointer ${
                    activeModalTab === 'info'
                      ? 'border-indigo-600 text-indigo-700'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  1. Información Principal
                </button>
                <button
                  type="button"
                  onClick={() => setActiveModalTab('categories')}
                  className={`pb-3 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
                    activeModalTab === 'categories'
                      ? 'border-indigo-600 text-indigo-700'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <span>2. Secciones y Puntos</span>
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-indigo-100 text-indigo-800 font-bold">
                    {formCategories.length}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveModalTab('preview')}
                  className={`pb-3 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
                    activeModalTab === 'preview'
                      ? 'border-indigo-600 text-indigo-700'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>3. Vista Previa en Vivo</span>
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 overflow-y-auto flex-1 space-y-6">
                {/* TAB 1: INFORMACIÓN PRINCIPAL */}
                {activeModalTab === 'info' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-800 mb-1.5">
                          Título de la Actualización:
                        </label>
                        <input
                          type="text"
                          value={formTitle}
                          onChange={(e) => setFormTitle(e.target.value)}
                          placeholder="Ej. Actualización 1.0"
                          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20 outline-none transition-all"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-800 mb-1.5">
                          Versión / Etiqueta del Badge:
                        </label>
                        <input
                          type="text"
                          value={formBadge}
                          onChange={(e) => setFormBadge(e.target.value)}
                          placeholder="Ej. Versión 1.0"
                          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20 outline-none transition-all"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-800 mb-1.5">
                        Subtítulo / Resumen de la Versión:
                      </label>
                      <input
                        type="text"
                        value={formSubtitle}
                        onChange={(e) => setFormSubtitle(e.target.value)}
                        placeholder="Ej. Lanzamiento oficial de la plataforma con nuevas funciones y optimizaciones"
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20 outline-none transition-all"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-800 mb-1.5">
                          Fecha Mostrada:
                        </label>
                        <input
                          type="text"
                          value={formDate}
                          onChange={(e) => setFormDate(e.target.value)}
                          placeholder="Ej. Octubre 2026 o Lanzamiento Oficial"
                          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-indigo-600 outline-none transition-all"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-800 mb-1.5">
                          Número de versión interna:
                        </label>
                        <input
                          type="text"
                          value={formVersion}
                          onChange={(e) => setFormVersion(e.target.value)}
                          placeholder="1.0"
                          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-indigo-600 outline-none transition-all"
                        />
                      </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center gap-6">
                      <label className="flex items-center gap-2.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formIsPublished}
                          onChange={(e) => setFormIsPublished(e.target.checked)}
                          className="w-4 h-4 text-indigo-600 rounded"
                        />
                        <span className="text-xs font-semibold text-slate-800">
                          Publicada inmediatamente para los usuarios
                        </span>
                      </label>

                      <label className="flex items-center gap-2.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formIsCurrent}
                          onChange={(e) => setFormIsCurrent(e.target.checked)}
                          className="w-4 h-4 text-indigo-600 rounded"
                        />
                        <span className="text-xs font-semibold text-slate-800">
                          Marcar como versión destacada actual
                        </span>
                      </label>
                    </div>
                  </div>
                )}

                {/* TAB 2: SECCIONES Y PUNTOS DEL CHANGELOG */}
                {activeModalTab === 'categories' && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-700">
                        Categorías y Lista de Puntos:
                      </span>
                      <button
                        type="button"
                        onClick={handleAddCategory}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold transition-all cursor-pointer border border-indigo-200"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Añadir Nueva Categoría</span>
                      </button>
                    </div>

                    {formCategories.map((cat, catIdx) => (
                      <div
                        key={cat.id || catIdx}
                        className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4"
                      >
                        {/* Category Title & Icon Row */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
                          <div className="flex items-center gap-3 flex-1">
                            {/* Icon picker dropdown */}
                            <div className="shrink-0 flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200">
                              <span className="p-1">{getNewsIcon(cat.iconName)}</span>
                              <select
                                value={cat.iconName || 'Boxes'}
                                onChange={(e) => handleUpdateCategoryIcon(catIdx, e.target.value)}
                                className="text-xs bg-transparent outline-none cursor-pointer pr-1"
                              >
                                {NEWS_ICON_OPTIONS.map((opt) => (
                                  <option key={opt.name} value={opt.name}>
                                    {opt.label}
                                  </option>
                                ))}
                              </select>
                            </div>

                            <input
                              type="text"
                              value={cat.title}
                              onChange={(e) => handleUpdateCategoryTitle(catIdx, e.target.value)}
                              placeholder="Nombre de la categoría (ej. Plataforma, Proyectos...)"
                              className="flex-1 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-sm font-bold text-slate-900 focus:border-indigo-600 outline-none"
                            />
                          </div>

                          <button
                            type="button"
                            onClick={() => handleDeleteCategory(catIdx)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors self-end sm:self-auto cursor-pointer"
                            title="Eliminar esta categoría"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Bullet points list */}
                        <div className="space-y-2 pl-2">
                          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                            Puntos incluidos:
                          </span>

                          {cat.items.map((bullet, bulletIdx) => (
                            <div key={bulletIdx} className="flex items-center gap-2">
                              <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" />
                              <input
                                type="text"
                                value={bullet}
                                onChange={(e) =>
                                  handleUpdateBulletItem(catIdx, bulletIdx, e.target.value)
                                }
                                placeholder="Describe el cambio o novedad..."
                                className="flex-1 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs sm:text-sm text-slate-700 focus:border-indigo-600 outline-none"
                              />
                              <button
                                type="button"
                                onClick={() => handleDeleteBulletItem(catIdx, bulletIdx)}
                                className="p-1 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                                title="Eliminar punto"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}

                          <button
                            type="button"
                            onClick={() => handleAddBulletItem(catIdx)}
                            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold text-indigo-600 hover:bg-indigo-50 transition-colors cursor-pointer mt-1"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Añadir punto a esta sección</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* TAB 3: VISTA PREVIA EN VIVO */}
                {activeModalTab === 'preview' && (
                  <div className="space-y-4">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                      Así verán esta actualización los visitantes:
                    </span>

                    <article className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
                      <div className="p-6 bg-gradient-to-r from-slate-50 via-indigo-50/20 to-slate-50 border-b border-slate-200/80 flex items-center justify-between">
                        <div>
                          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900">
                            {formTitle || 'Título de la Actualización'}
                          </h2>
                          <p className="text-xs text-slate-500 mt-0.5">
                            {formSubtitle || 'Subtítulo o resumen'}
                          </p>
                        </div>
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold bg-indigo-600 text-white shadow-xs">
                          <Sparkles className="w-3 h-3" />
                          {formBadge || 'Versión 1.0'}
                        </span>
                      </div>

                      <div className="p-6 sm:p-8 space-y-6">
                        {formCategories.map((section, idx) => (
                          <div key={idx} className="space-y-2">
                            <div className="flex items-center gap-2">
                              <span className="p-1.5 rounded-md bg-slate-100 text-slate-700">
                                {getNewsIcon(section.iconName)}
                              </span>
                              <h3 className="text-sm font-bold text-slate-900">{section.title}</h3>
                            </div>
                            <ul className="space-y-1.5 pl-7">
                              {section.items.map((item, bIdx) => (
                                <li
                                  key={bIdx}
                                  className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-600"
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600 shrink-0 mt-0.5" />
                                  <span>{item}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    </article>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="p-6 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-bold transition-all cursor-pointer"
                >
                  Cancelar
                </button>

                <button
                  type="button"
                  id="btn-admin-save-news"
                  onClick={handleSave}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>Guardar y Aplicar Cambios</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Standalone Preview Modal */}
      <AnimatePresence>
        {previewItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-3xl bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden my-8"
            >
              <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-600">
                  Vista Previa de "{previewItem.title}"
                </span>
                <button
                  type="button"
                  onClick={() => setPreviewItem(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <article className="overflow-hidden">
                <div className="p-6 bg-gradient-to-r from-slate-50 via-indigo-50/20 to-slate-50 border-b border-slate-200/80 flex items-center justify-between">
                  <div>
                    <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900">
                      {previewItem.title}
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">{previewItem.subtitle}</p>
                  </div>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold bg-indigo-600 text-white shadow-xs">
                    <Sparkles className="w-3 h-3" />
                    {previewItem.badge || `v${previewItem.version}`}
                  </span>
                </div>

                <div className="p-6 sm:p-8 space-y-6 max-h-[70vh] overflow-y-auto">
                  {previewItem.categories.map((section, idx) => (
                    <div key={idx} className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="p-1.5 rounded-md bg-slate-100 text-slate-700">
                          {getNewsIcon(section.iconName)}
                        </span>
                        <h3 className="text-sm font-bold text-slate-900">{section.title}</h3>
                      </div>
                      <ul className="space-y-1.5 pl-7">
                        {section.items.map((bullet, bIdx) => (
                          <li
                            key={bIdx}
                            className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-600"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600 shrink-0 mt-0.5" />
                            <span>{bullet}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </article>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
