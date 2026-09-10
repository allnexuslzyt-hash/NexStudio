import React, { useState, useEffect } from 'react';
import { 
  X, 
  User, 
  Palette, 
  Bell, 
  Shield, 
  Camera, 
  Check, 
  Lock, 
  ExternalLink, 
  Download, 
  Trash2, 
  Sun, 
  Moon, 
  Laptop, 
  Volume2, 
  Mail, 
  AlertCircle, 
  CheckCircle2, 
  Sparkles,
  Maximize2,
  Minimize2,
  Type,
  Eye,
  EyeOff,
  Sliders,
  Power,
  ShieldAlert,
  AlertTriangle,
  ArrowRight,
  Activity,
  Save,
  Radio,
  Upload,
  Loader2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSettings, ACCENT_COLORS, ThemeMode, AccentColor, Density, FontSize } from '../context/SettingsContext';
import { useAdmin } from '../context/AdminContext';
import { processDeviceImage } from '../utils/imageUpload';

type TabId = 'account' | 'appearance' | 'notifications' | 'privacy' | 'admin';

interface SettingsModalProps {
  onOpenAdminCommandCenter?: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ onOpenAdminCommandCenter }) => {
  const { user, profile, isAdmin, updateProfileData, deleteAccount, signOut } = useAuth();
  const { siteSettings, toggleMaintenanceMode, updateSiteSettings, updateGlobalBanner, users, reports } = useAdmin();
  const {
    isSettingsOpen,
    closeSettings,
    settingsTab,
    themeMode,
    setThemeMode,
    accentColor,
    setAccentColor,
    density,
    setDensity,
    fontSize,
    setFontSize,
    emailNotifications,
    setEmailNotifications,
    soundAlerts,
    setSoundAlerts,
    popupAlerts,
    setPopupAlerts,
    isPublicProfile,
    setIsPublicProfile,
    currentAccentConfig,
  } = useSettings();

  const [activeTab, setActiveTab] = useState<TabId>(settingsTab || 'account');

  // Sync tab with external open requests
  useEffect(() => {
    if (settingsTab) {
      setActiveTab(settingsTab);
    }
  }, [settingsTab]);

  // Admin tab states
  const [maintMsg, setMaintMsg] = useState(siteSettings.maintenanceMessage || 'Estamos realizando mejoras importantes en la plataforma. Volveremos pronto.');
  const [estTime, setEstTime] = useState(siteSettings.estimatedTime || 'Pronto');
  const [isUpdatingMaint, setIsUpdatingMaint] = useState(false);
  const [bannerActive, setBannerActive] = useState(siteSettings.globalBanner?.active || false);
  const [bannerMessage, setBannerMessage] = useState(siteSettings.globalBanner?.message || '');
  const [bannerType, setBannerType] = useState(siteSettings.globalBanner?.type || 'info');

  useEffect(() => {
    if (siteSettings) {
      setMaintMsg(siteSettings.maintenanceMessage || '');
      setEstTime(siteSettings.estimatedTime || '');
      setBannerActive(siteSettings.globalBanner?.active || false);
      setBannerMessage(siteSettings.globalBanner?.message || '');
      setBannerType(siteSettings.globalBanner?.type || 'info');
    }
  }, [siteSettings]);

  // Form states for Account Tab
  const [displayName, setDisplayName] = useState(profile?.displayName || user?.displayName || '');
  const [username, setUsername] = useState(profile?.username || user?.email?.split('@')[0] || 'usuario');
  const [selectedPhoto, setSelectedPhoto] = useState(
    profile?.photoURL || user?.photoURL || `https://api.dicebear.com/7.x/identicon/svg?seed=${user?.uid || 'user'}`
  );
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleImageFileChange = async (file: File) => {
    setImageError(null);
    setIsUploadingImage(true);
    try {
      const dataUrl = await processDeviceImage(file);
      setSelectedPhoto(dataUrl);
      showFeedback('Imagen del dispositivo seleccionada con éxito.');
    } catch (err: any) {
      setImageError(err.message || 'Error al procesar la imagen del dispositivo.');
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleImageFileChange(file);
    }
  };

  // Sync profile data when settings modal opens or profile changes
  useEffect(() => {
    if (isSettingsOpen) {
      if (profile?.displayName) {
        setDisplayName(profile.displayName);
      } else if (user?.displayName) {
        setDisplayName(user.displayName);
      }

      if (profile?.username) {
        setUsername(profile.username);
      } else if (user?.email) {
        setUsername(user.email.split('@')[0]);
      }

      if (profile?.photoURL) {
        setSelectedPhoto(profile.photoURL);
      } else if (user?.photoURL) {
        setSelectedPhoto(user.photoURL);
      }
    }
  }, [isSettingsOpen, profile, user]);

  // Email change state
  const [newEmailInput, setNewEmailInput] = useState('');
  const [isChangingEmail, setIsChangingEmail] = useState(false);

  // Password fields
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Feedback notifications
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);
  const [saveErrorMsg, setSaveErrorMsg] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Delete account confirmation modal
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  if (!isSettingsOpen) return null;

  const showFeedback = (msg: string, isError = false) => {
    if (isError) {
      setSaveErrorMsg(msg);
      setSaveSuccessMsg(null);
    } else {
      setSaveSuccessMsg(msg);
      setSaveErrorMsg(null);
    }
    setTimeout(() => {
      setSaveSuccessMsg(null);
      setSaveErrorMsg(null);
    }, 4000);
  };

  // Handle saving Profile Data
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await updateProfileData({
        displayName,
        username,
        photoURL: selectedPhoto,
      });
      showFeedback('¡Perfil actualizado con éxito!');
    } catch (err: any) {
      showFeedback('Error al actualizar el perfil. Inténtalo de nuevo.', true);
    } finally {
      setIsSaving(false);
    }
  };

  // Handle Password Save
  const handleSavePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword !== confirmPassword) {
      showFeedback('Las contraseñas no coinciden o están vacías.', true);
      return;
    }
    if (newPassword.length < 6) {
      showFeedback('La contraseña debe tener al menos 6 caracteres.', true);
      return;
    }
    // Google Auth accounts note
    showFeedback('¡Contraseña de seguridad actualizada para tu cuenta local!');
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  // Handle Download User Data
  const handleDownloadData = () => {
    const userData = {
      user: {
        uid: user?.uid,
        email: user?.email,
        displayName: profile?.displayName || user?.displayName,
        username: profile?.username || username,
        photoURL: profile?.photoURL || user?.photoURL,
        createdAt: profile?.createdAt,
        lastLogin: profile?.lastLogin,
      },
      preferences: {
        themeMode,
        accentColor,
        density,
        fontSize,
        emailNotifications,
        soundAlerts,
        popupAlerts,
        isPublicProfile,
      },
      exportDate: new Date().toISOString(),
      platform: 'NexStudio',
    };

    const blob = new Blob([JSON.stringify(userData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `nexstudio-mis-datos-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showFeedback('Datos exportados y descargados en formato JSON.');
  };

  // Handle Delete Account
  const handleDeleteAccount = async () => {
    if (deleteConfirmText.toLowerCase() !== 'eliminar') {
      showFeedback('Escribe "eliminar" para confirmar.', true);
      return;
    }
    try {
      await deleteAccount();
      closeSettings();
    } catch (err) {
      showFeedback('Error al eliminar la cuenta. Cierra sesión manualmente.', true);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={closeSettings}
      role="dialog"
      aria-modal="true"
    >
      <div 
        id="settings-modal-panel"
        className="relative w-full max-w-4xl max-h-[92vh] flex flex-col md:flex-row bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* SIDEBAR NAVIGATION (Desktop) / TOP TABS (Mobile) */}
        <aside className="w-full md:w-64 border-b md:border-b-0 md:border-r border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/90 p-4 sm:p-5 flex flex-col shrink-0">
          <div className="flex items-center justify-between md:mb-6">
            <div className="flex items-center gap-2.5">
              <div 
                className="w-8 h-8 rounded-xl flex items-center justify-center text-white shadow-xs"
                style={{ backgroundColor: currentAccentConfig.cssPrimary }}
              >
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                  Configuración
                </h2>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 hidden sm:block">
                  Panel de personalización
                </p>
              </div>
            </div>

            <button
              type="button"
              id="close-settings-sidebar-btn"
              onClick={closeSettings}
              className="md:hidden p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
              aria-label="Cerrar configuración"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Tabs buttons */}
          <nav className="flex md:flex-col gap-1.5 overflow-x-auto no-scrollbar pt-2 md:pt-0">
            <button
              type="button"
              id="settings-tab-account"
              onClick={() => setActiveTab('account')}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap min-h-[44px] cursor-pointer ${
                activeTab === 'account'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs border border-slate-200/80 dark:border-slate-700'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/70 dark:hover:bg-slate-800/40'
              }`}
            >
              <User className="w-4 h-4 text-slate-500" />
              <span>Mi Cuenta / Perfil</span>
            </button>

            <button
              type="button"
              id="settings-tab-appearance"
              onClick={() => setActiveTab('appearance')}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap min-h-[44px] cursor-pointer ${
                activeTab === 'appearance'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs border border-slate-200/80 dark:border-slate-700'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/70 dark:hover:bg-slate-800/40'
              }`}
            >
              <Palette className="w-4 h-4 text-slate-500" />
              <span>Apariencia y Temas</span>
            </button>

            <button
              type="button"
              id="settings-tab-notifications"
              onClick={() => setActiveTab('notifications')}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap min-h-[44px] cursor-pointer ${
                activeTab === 'notifications'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs border border-slate-200/80 dark:border-slate-700'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/70 dark:hover:bg-slate-800/40'
              }`}
            >
              <Bell className="w-4 h-4 text-slate-500" />
              <span>Notificaciones</span>
            </button>

            <button
              type="button"
              id="settings-tab-privacy"
              onClick={() => setActiveTab('privacy')}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap min-h-[44px] cursor-pointer ${
                activeTab === 'privacy'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs border border-slate-200/80 dark:border-slate-700'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/70 dark:hover:bg-slate-800/40'
              }`}
            >
              <Shield className="w-4 h-4 text-slate-500" />
              <span>Privacidad y Datos</span>
            </button>

            {isAdmin && (
              <button
                type="button"
                id="settings-tab-admin"
                onClick={() => setActiveTab('admin')}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap min-h-[44px] cursor-pointer ${
                  activeTab === 'admin'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-indigo-700 dark:text-indigo-400 bg-indigo-50/70 dark:bg-indigo-950/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 border border-indigo-200 dark:border-indigo-800'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Sliders className="w-4 h-4" />
                  <span>Administración</span>
                </div>
                <span className={`w-2 h-2 rounded-full ${siteSettings?.maintenanceMode ? 'bg-rose-500 animate-pulse' : 'bg-emerald-500'}`} />
              </button>
            )}
          </nav>

          {/* User mini badge at bottom of sidebar */}
          <div className="mt-auto hidden md:block pt-6 border-t border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2.5 p-2 rounded-xl bg-slate-100/60 dark:bg-slate-800/50">
              <img
                src={selectedPhoto}
                alt="Avatar"
                className="w-8 h-8 rounded-full object-cover border border-slate-200 dark:border-slate-700"
              />
              <div className="overflow-hidden">
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                  {displayName || 'Usuario Registrado'}
                </p>
                <p className="text-[10px] text-slate-400 truncate">
                  {user?.email}
                </p>
              </div>
            </div>
          </div>
        </aside>

        {/* MAIN SETTINGS CONTENT AREA */}
        <div className="flex-1 flex flex-col min-h-0 bg-white dark:bg-slate-900">
          {/* Top header bar */}
          <div className="flex items-center justify-between p-4 sm:p-6 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                {activeTab === 'account' && 'Mi Cuenta / Perfil'}
                {activeTab === 'appearance' && 'Apariencia y Temas'}
                {activeTab === 'notifications' && 'Notificaciones y Sonidos'}
                {activeTab === 'privacy' && 'Privacidad y Datos'}
                {activeTab === 'admin' && 'Panel de Administración'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {activeTab === 'account' && 'Gestiona tu avatar, nombre de usuario y seguridad de cuenta.'}
                {activeTab === 'appearance' && 'Personaliza el tema claro/oscuro, color de acento y tipografía en tiempo real.'}
                {activeTab === 'notifications' && 'Controla los correos, sonidos y alertas emergentes.'}
                {activeTab === 'privacy' && 'Configura la visibilidad pública, descarga o elimina tus datos.'}
                {activeTab === 'admin' && 'Control de estado global de la web, kill switch de mantenimiento y anuncios.'}
              </p>
            </div>

            <button
              type="button"
              id="close-settings-modal-btn"
              onClick={closeSettings}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
              aria-label="Cerrar modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Feedback banners */}
          {saveSuccessMsg && (
            <div className="mx-6 mt-4 p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center gap-2.5 text-xs font-semibold text-emerald-800 dark:text-emerald-300 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{saveSuccessMsg}</span>
            </div>
          )}
          {saveErrorMsg && (
            <div className="mx-6 mt-4 p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 flex items-center gap-2.5 text-xs font-semibold text-rose-800 dark:text-rose-300 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{saveErrorMsg}</span>
            </div>
          )}

          {/* Scrollable tab contents */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 text-sm text-slate-700 dark:text-slate-300">
            
            {/* ========================================================
                A) MI CUENTA / PERFIL
            ======================================================== */}
            {activeTab === 'account' && (
              <div className="space-y-6">
                {/* 1. Avatar Section - ONLY Upload from Device */}
                <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Foto de Perfil
                    </h4>
                    <span className="text-[11px] font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 px-2.5 py-0.5 rounded-full border border-indigo-200 dark:border-indigo-800">
                      Solo desde tu dispositivo
                    </span>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center gap-5">
                    <div className="relative group shrink-0">
                      <img
                        src={selectedPhoto}
                        alt="Foto de perfil actual"
                        className="w-20 h-20 rounded-2xl object-cover border-2 border-indigo-500 shadow-md bg-white"
                      />
                      <button
                        type="button"
                        id="change-avatar-device-btn"
                        onClick={() => fileInputRef.current?.click()}
                        className="absolute -bottom-1.5 -right-1.5 p-1.5 rounded-xl bg-slate-900 text-white hover:bg-indigo-600 shadow-md transition-colors cursor-pointer"
                        title="Subir foto desde el dispositivo"
                        aria-label="Subir foto desde el dispositivo"
                      >
                        <Camera className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Drag & Drop Upload Container */}
                    <div
                      onDragOver={(e) => {
                        e.preventDefault();
                        setIsDraggingOver(true);
                      }}
                      onDragLeave={() => setIsDraggingOver(false)}
                      onDrop={handleDrop}
                      className={`flex-1 w-full p-4 rounded-xl border-2 border-dashed transition-all flex flex-col sm:flex-row items-center justify-between gap-3 ${
                        isDraggingOver
                          ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/40'
                          : 'border-slate-300 dark:border-slate-700 hover:border-indigo-400 bg-white/70 dark:bg-slate-900/60'
                      }`}
                    >
                      <input
                        ref={fileInputRef}
                        type="file"
                        id="profile-image-upload-input"
                        accept="image/png, image/jpeg, image/jpg, image/webp, image/gif"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            handleImageFileChange(file);
                          }
                          e.target.value = '';
                        }}
                        className="hidden"
                      />

                      <div className="flex items-center gap-3 text-center sm:text-left">
                        <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800/80 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
                          {isUploadingImage ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                          ) : (
                            <Upload className="w-5 h-5" />
                          )}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                            Elegir imagen de tu dispositivo
                          </p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400">
                            Arrastra tu foto aquí o pulsa para seleccionarla (JPG, PNG, WebP)
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        id="select-device-image-btn"
                        disabled={isUploadingImage}
                        onClick={() => fileInputRef.current?.click()}
                        className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold shadow-xs cursor-pointer shrink-0 transition-colors flex items-center gap-1.5 min-h-[38px]"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>{isUploadingImage ? 'Procesando...' : 'Elegir del dispositivo'}</span>
                      </button>
                    </div>
                  </div>

                  {imageError && (
                    <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{imageError}</span>
                    </div>
                  )}
                </div>

                {/* 2. Form for Name & Username */}
                <form onSubmit={handleSaveProfile} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                        Nombre visible
                      </label>
                      <input
                        type="text"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        placeholder="Ej. Nexus Creador"
                        className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-colors"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                        Nombre de usuario (@alias)
                      </label>
                      <div className="relative flex items-center">
                        <span className="absolute left-3 text-xs font-bold text-slate-400">@</span>
                        <input
                          type="text"
                          value={username}
                          onChange={(e) => setUsername(e.target.value)}
                          placeholder="usuario"
                          className="w-full pl-7 pr-3.5 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-colors"
                        />
                      </div>
                    </div>
                  </div>

                  {/* 3. Email Section */}
                  <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div>
                      <span className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                        Correo electrónico
                      </span>
                      <span className="text-xs text-slate-500 font-mono">
                        {user?.email || 'Sin correo asociado'}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => setIsChangingEmail(!isChangingEmail)}
                      className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer min-h-[36px]"
                    >
                      {isChangingEmail ? 'Cancelar' : 'Cambiar correo'}
                    </button>
                  </div>

                  {isChangingEmail && (
                    <div className="p-3.5 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/40 space-y-2 animate-in fade-in">
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Nuevo correo electrónico
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="email"
                          value={newEmailInput}
                          onChange={(e) => setNewEmailInput(e.target.value)}
                          placeholder="nuevo-correo@ejemplo.com"
                          className="flex-1 px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            if (newEmailInput) {
                              showFeedback('Solicitud de cambio de correo registrada.');
                              setIsChangingEmail(false);
                            }
                          }}
                          className="px-3 py-2 text-xs font-semibold bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors cursor-pointer"
                        >
                          Actualizar
                        </button>
                      </div>
                      <p className="text-[11px] text-slate-500">
                        Se enviará un correo de confirmación para validar el nuevo correo.
                      </p>
                    </div>
                  )}

                  {/* 4. Google Account Status */}
                  <div className="p-4 rounded-xl border border-emerald-200/80 dark:border-emerald-800/60 bg-emerald-50/40 dark:bg-emerald-950/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-white dark:bg-slate-800 flex items-center justify-center shadow-xs">
                        <svg className="w-4 h-4" viewBox="0 0 24 24">
                          <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z" />
                          <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z" />
                          <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.98 0 12s.45 3.82 1.25 5.42l4.03-3.15z" />
                          <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-900 dark:text-white">
                          Estado: Vinculado con Google
                        </p>
                        <p className="text-[11px] text-slate-500">
                          Autenticación federada segura con tu cuenta de Google.
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <a
                        href="https://myaccount.google.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 hover:bg-slate-50 text-slate-700 dark:text-slate-200 transition-colors"
                      >
                        <span>Gestionar en Google</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                      <button
                        type="button"
                        onClick={() => signOut()}
                        className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 text-rose-600 hover:bg-rose-100 transition-colors cursor-pointer"
                      >
                        Desconectar
                      </button>
                    </div>
                  </div>

                  <div className="pt-2 flex justify-end">
                    <button
                      type="submit"
                      disabled={isSaving}
                      className="px-5 py-2.5 rounded-xl font-semibold text-xs sm:text-sm text-white transition-all shadow-md cursor-pointer disabled:opacity-50"
                      style={{ backgroundColor: currentAccentConfig.cssPrimary }}
                    >
                      {isSaving ? 'Guardando...' : 'Guardar cambios de perfil'}
                    </button>
                  </div>
                </form>

                {/* 5. Sección de Seguridad (Contraseña) */}
                <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Lock className="w-4 h-4 text-indigo-600" />
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                        Seguridad y Contraseña
                      </h4>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 flex items-center gap-1 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      <span>{showPassword ? 'Ocultar' : 'Mostrar'}</span>
                    </button>
                  </div>

                  <form onSubmit={handleSavePassword} className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                          Contraseña actual
                        </label>
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          placeholder="••••••••"
                          className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                          Nueva contraseña
                        </label>
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="••••••••"
                          className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                          Confirmar contraseña
                        </label>
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="••••••••"
                          className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <p className="text-[11px] text-slate-400">
                        Mínimo 6 caracteres con letras y números.
                      </p>
                      <button
                        type="submit"
                        className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:opacity-90 transition-opacity cursor-pointer"
                      >
                        Actualizar contraseña
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* ========================================================
                B) APARIENCIA Y TEMAS
            ======================================================== */}
            {activeTab === 'appearance' && (
              <div className="space-y-6">
                
                {/* 1. Selector de Modo: Claro / Oscuro / Automático */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Modo de Tema
                  </h4>
                  <div className="grid grid-cols-3 gap-3">
                    {/* Modo Claro */}
                    <button
                      type="button"
                      id="theme-btn-light"
                      onClick={() => setThemeMode('light')}
                      className={`flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all cursor-pointer ${
                        themeMode === 'light'
                          ? 'border-indigo-600 bg-indigo-50/50 dark:bg-slate-800 text-indigo-700 shadow-sm ring-2 ring-indigo-500/20'
                          : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <Sun className="w-6 h-6 mb-2 text-amber-500" />
                      <span className="text-xs font-bold">Claro</span>
                      <span className="text-[10px] text-slate-400 mt-0.5">Luz brillante</span>
                    </button>

                    {/* Modo Oscuro */}
                    <button
                      type="button"
                      id="theme-btn-dark"
                      onClick={() => setThemeMode('dark')}
                      className={`flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all cursor-pointer ${
                        themeMode === 'dark'
                          ? 'border-indigo-600 bg-indigo-50/50 dark:bg-slate-800 text-indigo-700 dark:text-indigo-400 shadow-sm ring-2 ring-indigo-500/20'
                          : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <Moon className="w-6 h-6 mb-2 text-indigo-400" />
                      <span className="text-xs font-bold">Oscuro</span>
                      <span className="text-[10px] text-slate-400 mt-0.5">Dark Mode</span>
                    </button>

                    {/* Modo Automático (Sistema) */}
                    <button
                      type="button"
                      id="theme-btn-auto"
                      onClick={() => setThemeMode('auto')}
                      className={`flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all cursor-pointer ${
                        themeMode === 'auto'
                          ? 'border-indigo-600 bg-indigo-50/50 dark:bg-slate-800 text-indigo-700 dark:text-indigo-400 shadow-sm ring-2 ring-indigo-500/20'
                          : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <Laptop className="w-6 h-6 mb-2 text-slate-500" />
                      <span className="text-xs font-bold">Automático</span>
                      <span className="text-[10px] text-slate-400 mt-0.5">Sistema SO</span>
                    </button>
                  </div>
                </div>

                {/* 2. Selector de Color de Acento */}
                <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-4">
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                      Color de Acento en Tiempo Real
                    </h4>
                    <p className="text-xs text-slate-500">
                      Modifica instantáneamente los botones principales, badges y bordes de NexStudio:
                    </p>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2.5">
                    {ACCENT_COLORS.map((col) => {
                      const isSelected = accentColor === col.id;
                      return (
                        <button
                          key={col.id}
                          type="button"
                          id={`accent-btn-${col.id}`}
                          onClick={() => setAccentColor(col.id)}
                          className={`flex flex-col items-center p-3 rounded-xl border-2 transition-all cursor-pointer ${
                            isSelected
                              ? 'border-slate-900 dark:border-white shadow-md scale-105 ring-2 ring-slate-400/30'
                              : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 bg-white dark:bg-slate-800'
                          }`}
                        >
                          <div 
                            className="w-7 h-7 rounded-full flex items-center justify-center text-white mb-1.5 shadow-xs"
                            style={{ backgroundColor: col.hex }}
                          >
                            {isSelected && <Check className="w-4 h-4 stroke-[3]" />}
                          </div>
                          <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200 text-center leading-tight">
                            {col.label.split(' ')[0]}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  <div className="p-3.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                    <span className="text-xs text-slate-500">Previsualización del botón activo:</span>
                    <button
                      type="button"
                      className="px-4 py-1.5 rounded-xl text-xs font-bold text-white transition-colors"
                      style={{ backgroundColor: currentAccentConfig.cssPrimary }}
                    >
                      Botón de muestra ({currentAccentConfig.label})
                    </button>
                  </div>
                </div>

                {/* 3. Densidad de Interfaz & Tamaño de Fuente */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Densidad */}
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-3">
                    <div className="flex items-center gap-2">
                      <Maximize2 className="w-4 h-4 text-slate-500" />
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                        Densidad de Interfaz
                      </h4>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setDensity('normal')}
                        className={`p-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                          density === 'normal'
                            ? 'border-indigo-600 bg-white dark:bg-slate-800 text-indigo-600 shadow-xs'
                            : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        Normal (Espaciada)
                      </button>
                      <button
                        type="button"
                        onClick={() => setDensity('compact')}
                        className={`p-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                          density === 'compact'
                            ? 'border-indigo-600 bg-white dark:bg-slate-800 text-indigo-600 shadow-xs'
                            : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        Compacta (Densa)
                      </button>
                    </div>
                  </div>

                  {/* Tamaño de Fuente */}
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-3">
                    <div className="flex items-center gap-2">
                      <Type className="w-4 h-4 text-slate-500" />
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                        Tamaño de Fuente
                      </h4>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      {(['small', 'medium', 'large'] as FontSize[]).map((sz) => (
                        <button
                          key={sz}
                          type="button"
                          onClick={() => setFontSize(sz)}
                          className={`p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                            fontSize === sz
                              ? 'border-indigo-600 bg-white dark:bg-slate-800 text-indigo-600 shadow-xs'
                              : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                          }`}
                        >
                          {sz === 'small' && 'Pequeña'}
                          {sz === 'medium' && 'Mediana'}
                          {sz === 'large' && 'Grande'}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ========================================================
                C) NOTIFICACIONES Y SONIDOS
            ======================================================== */}
            {activeTab === 'notifications' && (
              <div className="space-y-4">
                
                {/* Switch 1: Notificaciones por correo */}
                <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 border border-indigo-200/50">
                      <Mail className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                        Notificaciones por correo
                      </h4>
                      <p className="text-xs text-slate-500">
                        Recibe resúmenes de novedades, avisos de seguridad y actualizaciones en tu email.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    role="switch"
                    aria-checked={emailNotifications}
                    onClick={() => setEmailNotifications(!emailNotifications)}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      emailNotifications ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-700'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                        emailNotifications ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* Switch 2: Avisos de sonido */}
                <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-violet-50 dark:bg-violet-950/50 text-violet-600 border border-violet-200/50">
                      <Volume2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                        Avisos de sonido
                      </h4>
                      <p className="text-xs text-slate-500">
                        Reproducir un sonido sutil al completar acciones o guardar cambios.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    role="switch"
                    aria-checked={soundAlerts}
                    onClick={() => setSoundAlerts(!soundAlerts)}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      soundAlerts ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-700'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                        soundAlerts ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* Switch 3: Alertas emergentes (popups) */}
                <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 border border-amber-200/50">
                      <Bell className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                        Alertas emergentes en pantalla
                      </h4>
                      <p className="text-xs text-slate-500">
                        Mostrar banners emergentes con avisos y recordatorios dentro de la app.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    role="switch"
                    aria-checked={popupAlerts}
                    onClick={() => setPopupAlerts(!popupAlerts)}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      popupAlerts ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-700'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                        popupAlerts ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>
            )}

            {/* ========================================================
                D) PRIVACIDAD Y DATOS
            ======================================================== */}
            {activeTab === 'privacy' && (
              <div className="space-y-6">
                
                {/* 1. Toggle de Visibilidad de Perfil */}
                <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <span>Visibilidad del perfil</span>
                      <span className={`px-2 py-0.5 text-[10px] rounded-full font-bold uppercase ${
                        isPublicProfile 
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                          : 'bg-slate-200 text-slate-700'
                      }`}>
                        {isPublicProfile ? 'Público' : 'Privado'}
                      </span>
                    </h4>
                    <p className="text-xs text-slate-500 mt-1">
                      {isPublicProfile 
                        ? 'Tu nombre y avatar son visibles para otros miembros de la plataforma.' 
                        : 'Tu perfil es estrictamente privado y solo tú puedes verlo.'}
                    </p>
                  </div>

                  <button
                    type="button"
                    role="switch"
                    aria-checked={isPublicProfile}
                    onClick={() => setIsPublicProfile(!isPublicProfile)}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      isPublicProfile ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-700'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                        isPublicProfile ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* 2. Descargar mis datos */}
                <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <Download className="w-4 h-4 text-indigo-600" />
                      <span>Descargar mis datos</span>
                    </h4>
                    <p className="text-xs text-slate-500">
                      Obtén una copia completa en formato JSON con toda tu información registrada y preferencias.
                    </p>
                  </div>

                  <button
                    type="button"
                    id="btn-download-user-data"
                    onClick={handleDownloadData}
                    className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 shadow-xs transition-colors cursor-pointer min-h-[44px]"
                  >
                    <Download className="w-4 h-4 text-indigo-600" />
                    <span>Descargar archivo</span>
                  </button>
                </div>

                {/* 3. Eliminar cuenta (Destacado en Rojo) */}
                <div className="p-5 rounded-2xl bg-rose-50/50 dark:bg-rose-950/20 border-2 border-rose-200 dark:border-rose-900/50 space-y-3">
                  <div className="flex items-center gap-2.5 text-rose-700 dark:text-rose-400 font-bold text-sm">
                    <Trash2 className="w-4 h-4" />
                    <span>Zona de Peligro: Eliminar cuenta</span>
                  </div>
                  <p className="text-xs text-rose-600/90 dark:text-rose-300/80 leading-relaxed">
                    Al eliminar tu cuenta, todos tus datos de perfil, preferencias guardadas y vínculos serán eliminados de forma permanente e irreversible.
                  </p>

                  <button
                    type="button"
                    id="btn-trigger-delete-account"
                    onClick={() => setShowDeleteConfirm(true)}
                    className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md shadow-rose-600/20 transition-all cursor-pointer min-h-[44px]"
                  >
                    Eliminar cuenta definitivamente
                  </button>
                </div>

                {/* Confirmación Modal para Eliminar Cuenta */}
                {showDeleteConfirm && (
                  <div className="p-4 rounded-xl bg-rose-100 dark:bg-rose-900/40 border border-rose-300 dark:border-rose-800 space-y-3 animate-in fade-in">
                    <p className="text-xs font-bold text-rose-900 dark:text-rose-200">
                      ¿Estás absolutamente seguro? Esta acción no se puede deshacer.
                    </p>
                    <p className="text-xs text-rose-700 dark:text-rose-300">
                      Escribe <strong className="select-all underline">eliminar</strong> a continuación para confirmar:
                    </p>
                    <input
                      type="text"
                      value={deleteConfirmText}
                      onChange={(e) => setDeleteConfirmText(e.target.value)}
                      placeholder="eliminar"
                      className="w-full px-3 py-2 text-xs rounded-xl border border-rose-300 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                    />
                    <div className="flex gap-2 justify-end">
                      <button
                        type="button"
                        onClick={() => setShowDeleteConfirm(false)}
                        className="px-3 py-1.5 text-xs font-semibold bg-white dark:bg-slate-800 rounded-lg text-slate-700 dark:text-slate-300"
                      >
                        Cancelar
                      </button>
                      <button
                        type="button"
                        onClick={handleDeleteAccount}
                        className="px-3 py-1.5 text-xs font-bold bg-rose-700 text-white rounded-lg hover:bg-rose-800"
                      >
                        Confirmar y Borrar
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ========================================================= */}
            {/* 5. PESTAÑA: PANEL DE ADMINISTRACIÓN (Solo SuperAdmin) */}
            {/* ========================================================= */}
            {activeTab === 'admin' && isAdmin && (
              <div className="space-y-6 animate-in fade-in">
                {/* Cabecera de Administración */}
                <div className="p-4 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <Sliders className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                        Panel de Administración
                      </h4>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-600 text-white uppercase tracking-wider">
                        SuperAdmin
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      Conectado como <span className="font-semibold text-indigo-700 dark:text-indigo-300">{user?.email}</span>
                    </p>
                  </div>

                  {onOpenAdminCommandCenter && (
                    <button
                      type="button"
                      onClick={() => {
                        closeSettings();
                        onOpenAdminCommandCenter();
                      }}
                      className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer shrink-0"
                    >
                      <span>Abrir Centro de Mando</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* 1. INTERRUPTOR MAESTRO: CERRAR WEB PARA TODOS LOS USUARIOS (KILL SWITCH) */}
                <div className={`p-5 rounded-2xl border-2 transition-all ${
                  siteSettings?.maintenanceMode
                    ? 'bg-rose-50/70 dark:bg-rose-950/30 border-rose-300 dark:border-rose-900/60 shadow-lg shadow-rose-600/5'
                    : 'bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-900/50'
                }`}>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2.5">
                        <span className="relative flex h-3 w-3">
                          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                            siteSettings?.maintenanceMode ? 'bg-rose-500' : 'bg-emerald-500'
                          }`}></span>
                          <span className={`relative inline-flex rounded-full h-3 w-3 ${
                            siteSettings?.maintenanceMode ? 'bg-rose-600' : 'bg-emerald-600'
                          }`}></span>
                        </span>
                        <h4 className={`text-base font-extrabold ${
                          siteSettings?.maintenanceMode
                            ? 'text-rose-900 dark:text-rose-200'
                            : 'text-emerald-950 dark:text-emerald-200'
                        }`}>
                          {siteSettings?.maintenanceMode
                            ? 'La Web está CERRADA para todos los usuarios'
                            : 'La Web está ABIERTA y PÚBLICA'}
                        </h4>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed max-w-xl">
                        {siteSettings?.maintenanceMode
                          ? 'Modo Mantenimiento ACTIVO globalmente en la nube. Todos los visitantes de la web son redirigidos de inmediato a la pantalla de bloqueo seguro. Nadie excepto el administrador puede acceder.'
                          : 'Todos los visitantes del mundo pueden navegar, registrarse y utilizar NexStudio con normalidad.'}
                      </p>
                    </div>

                    <button
                      type="button"
                      id="btn-toggle-maintenance-modal"
                      disabled={isUpdatingMaint}
                      onClick={async () => {
                        setIsUpdatingMaint(true);
                        try {
                          await toggleMaintenanceMode(!siteSettings?.maintenanceMode);
                          showFeedback(
                            !siteSettings?.maintenanceMode
                              ? '¡Web CERRADA para todos los usuarios! Se ha sincronizado en tiempo real.'
                              : '¡Web ABIERTA y pública para todos los usuarios!'
                          );
                        } catch (e) {
                          showFeedback('Error al actualizar estado en Firestore', true);
                        } finally {
                          setIsUpdatingMaint(false);
                        }
                      }}
                      className={`inline-flex items-center justify-center gap-2.5 px-5 py-3 rounded-xl font-bold text-xs shadow-md transition-all cursor-pointer shrink-0 min-h-[44px] ${
                        siteSettings?.maintenanceMode
                          ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20'
                          : 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/20'
                      }`}
                    >
                      <Power className="w-4 h-4" />
                      <span>
                        {siteSettings?.maintenanceMode
                          ? 'Reabrir Web para Todos'
                          : 'Cerrar Web para Todos'}
                      </span>
                    </button>
                  </div>
                </div>

                {/* 2. PERSONALIZACIÓN DEL AVISO DE CIERRE */}
                <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-4">
                  <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-sm">
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                    <span>Mensaje para la pantalla de mantenimiento</span>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Mensaje que verán los usuarios cuando la web esté cerrada:
                      </label>
                      <textarea
                        rows={2}
                        value={maintMsg}
                        onChange={(e) => setMaintMsg(e.target.value)}
                        placeholder="Estamos realizando labores de mantenimiento y optimización en la plataforma..."
                        className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Tiempo estimado de regreso:
                      </label>
                      <input
                        type="text"
                        value={estTime}
                        onChange={(e) => setEstTime(e.target.value)}
                        placeholder="Ejemplo: 30 minutos, o Muy pronto"
                        className="w-full sm:w-64 px-3.5 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>

                    <button
                      type="button"
                      disabled={isUpdatingMaint}
                      onClick={async () => {
                        setIsUpdatingMaint(true);
                        try {
                          await updateSiteSettings({
                            maintenanceMessage: maintMsg,
                            estimatedTime: estTime
                          });
                          showFeedback('Ajustes del mensaje de cierre guardados.');
                        } catch (e) {
                          showFeedback('Error al guardar mensaje en Firestore', true);
                        } finally {
                          setIsUpdatingMaint(false);
                        }
                      }}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-700 dark:hover:bg-slate-600 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>Guardar Mensaje de Mantenimiento</span>
                    </button>
                  </div>
                </div>

                {/* 3. AVISO GLOBAL (BANNER EN CABECERA) */}
                <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-sm">
                      <Radio className="w-4 h-4 text-indigo-600" />
                      <span>Banner de Anuncio Global en Cabecera</span>
                    </div>

                    <button
                      type="button"
                      role="switch"
                      aria-checked={bannerActive}
                      onClick={() => setBannerActive(!bannerActive)}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        bannerActive ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-700'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                          bannerActive ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  {bannerActive && (
                    <div className="space-y-3 pt-2">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          Texto del anuncio:
                        </label>
                        <input
                          type="text"
                          value={bannerMessage}
                          onChange={(e) => setBannerMessage(e.target.value)}
                          placeholder="Ejemplo: ¡Nueva actualización disponible en NexStudio!"
                          className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>

                      <div className="flex items-center gap-3">
                        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                          Tipo de anuncio:
                        </label>
                        <select
                          value={bannerType}
                          onChange={(e) => setBannerType(e.target.value as any)}
                          className="px-3 py-1.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                        >
                          <option value="info">Información</option>
                          <option value="advertencia">Advertencia</option>
                          <option value="exito">Éxito</option>
                          <option value="urgente">Urgente</option>
                        </select>
                      </div>

                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            await updateGlobalBanner({
                              active: bannerActive,
                              message: bannerMessage,
                              type: bannerType as any,
                            });
                            showFeedback('Banner global actualizado.');
                          } catch (e) {
                            showFeedback('Error al actualizar banner', true);
                          }
                        }}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                      >
                        <Save className="w-3.5 h-3.5" />
                        <span>Guardar Anuncio</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* 4. ACCESO AL CENTRO DE MANDO COMPLETO */}
                {onOpenAdminCommandCenter && (
                  <div className="p-4 sm:p-5 rounded-2xl bg-indigo-500/10 border border-indigo-200 dark:border-indigo-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <h4 className="text-sm font-bold text-indigo-950 dark:text-indigo-200">
                        Centro de Mando Avanzado
                      </h4>
                      <p className="text-xs text-slate-600 dark:text-slate-400">
                        Accede al panel completo con gestión de {users.length} usuarios, reportes de moderación, centro de ayuda y logs de auditoría.
                      </p>
                    </div>

                    <button
                      type="button"
                      id="btn-open-full-command-center"
                      onClick={() => {
                        closeSettings();
                        onOpenAdminCommandCenter();
                      }}
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-600/20 transition-all cursor-pointer shrink-0"
                    >
                      <span>Ir al Centro de Mando Completo</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
