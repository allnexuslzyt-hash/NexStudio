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
  Zap,
  Download,
  Headphones,
  Users,
  ExternalLink,
  AlertCircle,
  Megaphone,
  Check
} from 'lucide-react';
import { AppNotification } from '../types';
import { useAdmin } from '../context/AdminContext';

interface AdminNotificationsManagerProps {
  onShowToast: (message: string) => void;
}

export const NOTIFICATION_TYPE_CONFIG = {
  update: {
    label: 'Actualización / Novedad',
    icon: <Sparkles className="w-4 h-4 text-indigo-600" />,
    badgeClass: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    iconBg: 'bg-indigo-50 border-indigo-200 text-indigo-600'
  },
  system: {
    label: 'Aviso del Sistema',
    icon: <Zap className="w-4 h-4 text-amber-600" />,
    badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
    iconBg: 'bg-amber-50 border-amber-200 text-amber-600'
  },
  download: {
    label: 'Descarga / Software',
    icon: <Download className="w-4 h-4 text-emerald-600" />,
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    iconBg: 'bg-emerald-50 border-emerald-200 text-emerald-600'
  },
  support: {
    label: 'Soporte & Atención',
    icon: <Headphones className="w-4 h-4 text-purple-600" />,
    badgeClass: 'bg-purple-50 text-purple-700 border-purple-200',
    iconBg: 'bg-purple-50 border-purple-200 text-purple-600'
  },
  community: {
    label: 'Comunidad & Social',
    icon: <Users className="w-4 h-4 text-sky-600" />,
    badgeClass: 'bg-sky-50 text-sky-700 border-sky-200',
    iconBg: 'bg-sky-50 border-sky-200 text-sky-600'
  }
};

export const AdminNotificationsManager: React.FC<AdminNotificationsManagerProps> = ({ onShowToast }) => {
  const {
    globalNotifications,
    addGlobalNotification,
    updateGlobalNotification,
    deleteGlobalNotification,
    clearAllGlobalNotifications,
    resetGlobalNotificationsToDefault
  } = useAdmin();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingNotif, setEditingNotif] = useState<AppNotification | null>(null);
  const [notifToDelete, setNotifToDelete] = useState<AppNotification | null>(null);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [isClearConfirmOpen, setIsClearConfirmOpen] = useState(false);

  // Form state
  const [formTitle, setFormTitle] = useState('');
  const [formMessage, setFormMessage] = useState('');
  const [formType, setFormType] = useState<AppNotification['type']>('update');
  const [formActionView, setFormActionView] = useState<string>('noticias');
  const [formTimestamp, setFormTimestamp] = useState('Hace unos momentos');
  const [formError, setFormError] = useState<string | null>(null);

  // Open modal for creating new notification
  const handleOpenNew = () => {
    setEditingNotif(null);
    setFormTitle('');
    setFormMessage('');
    setFormType('update');
    setFormActionView('noticias');
    setFormTimestamp('Hace unos momentos');
    setFormError(null);
    setIsModalOpen(true);
  };

  // Open modal for editing notification
  const handleOpenEdit = (item: AppNotification) => {
    setEditingNotif(item);
    setFormTitle(item.title);
    setFormMessage(item.message);
    setFormType(item.type);
    setFormActionView(item.actionView || 'none');
    setFormTimestamp(item.timestamp || 'Hace unos momentos');
    setFormError(null);
    setIsModalOpen(true);
  };

  // Save handler
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      setFormError('El título del aviso es obligatorio.');
      return;
    }
    if (!formMessage.trim()) {
      setFormError('El mensaje descriptivo es obligatorio.');
      return;
    }

    try {
      if (editingNotif) {
        await updateGlobalNotification({
          ...editingNotif,
          title: formTitle.trim(),
          message: formMessage.trim(),
          type: formType,
          actionView: formActionView === 'none' ? undefined : formActionView,
          timestamp: formTimestamp.trim() || 'Hace unos momentos'
        });
        onShowToast('Notificación actualizada correctamente para todos los usuarios.');
      } else {
        await addGlobalNotification({
          title: formTitle.trim(),
          message: formMessage.trim(),
          type: formType,
          actionView: formActionView === 'none' ? undefined : formActionView,
          timestamp: formTimestamp.trim() || 'Hace unos momentos',
          isRead: false
        });
        onShowToast('Nueva notificación enviada a todos los usuarios registrados.');
      }
      setIsModalOpen(false);
    } catch {
      setFormError('Error al guardar la notificación. Inténtalo de nuevo.');
    }
  };

  // Confirm delete handler
  const handleConfirmDelete = async () => {
    if (!notifToDelete) return;
    try {
      await deleteGlobalNotification(notifToDelete.id);
      onShowToast(`Aviso "${notifToDelete.title}" eliminado para todos los usuarios.`);
      setNotifToDelete(null);
    } catch {
      onShowToast('Error al eliminar la notificación.');
    }
  };

  // Clear all handler
  const handleConfirmClearAll = async () => {
    try {
      await clearAllGlobalNotifications();
      setIsClearConfirmOpen(false);
      onShowToast('Todas las notificaciones han sido eliminadas para todos los usuarios.');
    } catch {
      onShowToast('Error al vaciar las notificaciones.');
    }
  };

  // Reset to default
  const handleConfirmReset = async () => {
    try {
      await resetGlobalNotificationsToDefault();
      setIsResetConfirmOpen(false);
      onShowToast('Notificaciones restablecidas a la configuración oficial por defecto.');
    } catch {
      onShowToast('Error al restablecer las notificaciones.');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 text-left">
      {/* Top Banner / Header */}
      <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-200 text-amber-600 flex items-center justify-center shadow-xs shrink-0">
            <Megaphone className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Notificaciones para Todos los Usuarios
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-200">
                Difusión Global
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 max-w-2xl leading-relaxed">
              Agrega, edita o elimina los avisos que verán todos los usuarios en la campana de notificaciones al iniciar sesión.
            </p>
          </div>
        </div>

        {/* Global Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() => setIsResetConfirmOpen(true)}
            className="px-3 py-2 rounded-xl border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer"
            title="Restablecer a notificaciones predeterminadas"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
            <span>Restablecer</span>
          </button>

          {globalNotifications.length > 0 && (
            <button
              type="button"
              onClick={() => setIsClearConfirmOpen(true)}
              className="px-3 py-2 rounded-xl border border-rose-200 hover:border-rose-300 bg-rose-50/70 hover:bg-rose-100 text-rose-700 text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer"
              title="Borrar todas las notificaciones"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Vaciar Todo</span>
            </button>
          )}

          <button
            type="button"
            id="btn-admin-add-notification"
            onClick={handleOpenNew}
            className="px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 active:bg-amber-700 text-white text-xs font-bold shadow-md shadow-amber-600/25 transition-all flex items-center gap-2 cursor-pointer hover:scale-102"
          >
            <Plus className="w-4 h-4" />
            <span>Nueva Notificación</span>
          </button>
        </div>
      </div>

      {/* Stats Summary Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
            Total Avisos Activos
          </span>
          <div className="text-2xl font-black text-slate-900">
            {globalNotifications.length}
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
            Novedades & Updates
          </span>
          <div className="text-2xl font-black text-indigo-600">
            {globalNotifications.filter((n) => n.type === 'update').length}
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
            Avisos de Sistema
          </span>
          <div className="text-2xl font-black text-amber-600">
            {globalNotifications.filter((n) => n.type === 'system').length}
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
            Destinatarios
          </span>
          <div className="text-sm font-extrabold text-emerald-700 flex items-center gap-1.5 mt-1">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Todos los usuarios</span>
          </div>
        </div>
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {globalNotifications.length === 0 ? (
          <div className="p-12 text-center rounded-3xl bg-white border border-slate-200 shadow-xs">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-3 text-slate-400">
              <Bell className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-1">
              No hay notificaciones activas
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
              Actualmente los usuarios no tienen avisos en su campana. Haz clic en "Nueva Notificación" para publicar un mensaje para todos.
            </p>
            <button
              type="button"
              onClick={handleOpenNew}
              className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold shadow-xs hover:bg-indigo-500 cursor-pointer"
            >
              Publicar Notificación
            </button>
          </div>
        ) : (
          globalNotifications.map((notif, index) => {
            const config = NOTIFICATION_TYPE_CONFIG[notif.type] || NOTIFICATION_TYPE_CONFIG.update;
            return (
              <motion.div
                key={notif.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: index * 0.04 }}
                className="p-5 rounded-2xl bg-white border border-slate-200/90 hover:border-slate-300 shadow-xs hover:shadow-md transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="flex items-start gap-3.5">
                  <div className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${config.iconBg}`}>
                    {config.icon}
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <h4 className="text-sm font-bold text-slate-900">
                        {notif.title}
                      </h4>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${config.badgeClass}`}>
                        {config.label}
                      </span>
                      {notif.actionView && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                          Acción: /{notif.actionView}
                        </span>
                      )}
                      <span className="text-[11px] text-slate-400 font-medium">
                        • {notif.timestamp}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 max-w-2xl leading-relaxed">
                      {notif.message}
                    </p>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(notif)}
                    className="p-2 rounded-xl text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                    title="Editar notificación"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Editar</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setNotifToDelete(notif)}
                    className="p-2 rounded-xl text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                    title="Eliminar notificación para todos"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Eliminar</span>
                  </button>
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      {/* Modal Create / Edit Notification */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden my-8"
            >
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
                    <Bell className="w-4 h-4" />
                  </div>
                  <h3 className="text-base font-bold text-slate-900">
                    {editingNotif ? 'Editar Notificación' : 'Crear Notificación para Todos'}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSave} className="p-6 space-y-4">
                {formError && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{formError}</span>
                  </div>
                )}

                {/* Title */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Título de la Notificación *
                  </label>
                  <input
                    type="text"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    placeholder="Ej. 🚀 Actualización 1.1 Disponible"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-xs font-semibold text-slate-900 outline-none"
                    required
                  />
                </div>

                {/* Message */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Mensaje Descriptivo *
                  </label>
                  <textarea
                    rows={3}
                    value={formMessage}
                    onChange={(e) => setFormMessage(e.target.value)}
                    placeholder="Escribe el contenido o aviso que leerán los usuarios..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-xs text-slate-900 outline-none resize-none"
                    required
                  />
                </div>

                {/* Category / Type & Action View */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Categoría / Tipo
                    </label>
                    <select
                      value={formType}
                      onChange={(e) => setFormType(e.target.value as AppNotification['type'])}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-white outline-none cursor-pointer"
                    >
                      <option value="update">✨ Actualización / Novedad</option>
                      <option value="system">⚡ Aviso del Sistema</option>
                      <option value="download">💾 Descarga / Software</option>
                      <option value="support">🎧 Soporte y Atención</option>
                      <option value="community">👥 Comunidad y Social</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Acción al hacer clic
                    </label>
                    <select
                      value={formActionView}
                      onChange={(e) => setFormActionView(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-white outline-none cursor-pointer"
                    >
                      <option value="none">Ninguna (Solo informativa)</option>
                      <option value="noticias">Abrir Noticias y Changelog</option>
                      <option value="proyectos">Abrir Proyectos Oficiales</option>
                      <option value="creaciones">Abrir Creaciones</option>
                      <option value="herramientas">Abrir Herramientas</option>
                      <option value="soporte">Abrir Canal de Soporte</option>
                      <option value="comunidad">Abrir Comunidad Social</option>
                    </select>
                  </div>
                </div>

                {/* Timestamp */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Texto de Fecha / Tiempo visible
                  </label>
                  <input
                    type="text"
                    value={formTimestamp}
                    onChange={(e) => setFormTimestamp(e.target.value)}
                    placeholder="Ej. Hace unos momentos, Hoy, Esta semana"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs text-slate-700 outline-none"
                  />
                </div>

                {/* Live Preview Box */}
                <div>
                  <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    Previsualización para el Usuario:
                  </span>
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/90 flex items-start gap-3">
                    <div className="w-8 h-8 rounded-xl bg-amber-100 border border-amber-200 text-amber-700 flex items-center justify-center shrink-0">
                      {NOTIFICATION_TYPE_CONFIG[formType]?.icon || <Bell className="w-4 h-4" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <span className="text-xs font-bold text-slate-900 truncate">
                          {formTitle.trim() || 'Título de ejemplo'}
                        </span>
                        <span className="text-[10px] text-slate-400 shrink-0">
                          {formTimestamp.trim() || 'Ahora'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 line-clamp-2">
                        {formMessage.trim() || 'El contenido del aviso aparecerá aquí para los usuarios...'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold shadow-md shadow-amber-600/25 transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <Check className="w-4 h-4" />
                    <span>{editingNotif ? 'Guardar Cambios' : 'Publicar para Todos'}</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {notifToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-white rounded-3xl p-6 border border-slate-200 shadow-2xl text-left"
            >
              <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mb-4">
                <Trash2 className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-1">
                ¿Eliminar notificación para todos?
              </h3>
              <p className="text-xs text-slate-600 mb-5 leading-relaxed">
                El aviso <strong className="text-slate-900 font-bold">"{notifToDelete.title}"</strong> será eliminado permanentemente de la campana de notificaciones de todos los usuarios.
              </p>
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setNotifToDelete(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-md shadow-rose-600/25 transition-all cursor-pointer"
                >
                  Sí, eliminar aviso
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Clear All Confirmation Modal */}
      <AnimatePresence>
        {isClearConfirmOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-white rounded-3xl p-6 border border-slate-200 shadow-2xl text-left"
            >
              <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mb-4">
                <Trash2 className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-1">
                ¿Vaciar todas las notificaciones?
              </h3>
              <p className="text-xs text-slate-600 mb-5 leading-relaxed">
                Esta acción eliminará todos los avisos ({globalNotifications.length}) para todos los usuarios. La campana quedará completamente vacía.
              </p>
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsClearConfirmOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleConfirmClearAll}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-md shadow-rose-600/25 transition-all cursor-pointer"
                >
                  Sí, vaciar todo
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Reset Confirmation Modal */}
      <AnimatePresence>
        {isResetConfirmOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-white rounded-3xl p-6 border border-slate-200 shadow-2xl text-left"
            >
              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mb-4">
                <RotateCcw className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-1">
                ¿Restablecer notificaciones oficiales?
              </h3>
              <p className="text-xs text-slate-600 mb-5 leading-relaxed">
                Se restaurará el listado oficial de notificaciones de lanzamiento para todos los usuarios de la plataforma.
              </p>
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsResetConfirmOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleConfirmReset}
                  className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold shadow-md shadow-amber-600/25 transition-all cursor-pointer"
                >
                  Sí, restablecer
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
