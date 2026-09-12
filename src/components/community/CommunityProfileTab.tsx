import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Camera, 
  Upload, 
  Sparkles, 
  Save, 
  Globe, 
  Users, 
  Lock, 
  Image as ImageIcon, 
  FileUp, 
  X, 
  Send, 
  Check, 
  AlertCircle,
  ExternalLink,
  Heart,
  MessageCircle,
  Share2,
  Trash2,
  FileText,
  ShieldCheck,
  Edit3
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { CommunityPost, PostComment } from '../../types';
import { processDeviceFile, formatFileSize, ProcessedFile } from '../../lib/fileUploadHelper';
import { CommunityPostCard } from './CommunityPostCard';

interface CommunityProfileTabProps {
  userPosts: CommunityPost[];
  onPublishPost: (data: {
    content: string;
    attachment?: ProcessedFile | null;
    visibility: 'public' | 'community_only' | 'private';
  }) => Promise<void>;
  onLikePost: (postId: string) => void;
  onSharePost: (post: CommunityPost) => void;
  onDeletePost: (postId: string) => void;
  onAddComment: (postId: string, text: string) => Promise<void>;
  onDeleteComment: (postId: string, commentId: string) => void;
  postComments: Record<string, PostComment[]>;
  onOpenLightbox: (imageUrl: string, title?: string, authorName?: string) => void;
  onOpenProfile?: (authorId: string, authorName?: string, authorUsername?: string, authorPhotoURL?: string) => void;
}

const PRESET_BANNERS = [
  { id: 'indigo', name: 'Nebulosa Índigo', bg: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #0284c7 100%)' },
  { id: 'sunset', name: 'Atardecer Creativo', bg: 'linear-gradient(135deg, #ea580c 0%, #db2777 50%, #7c3aed 100%)' },
  { id: 'emerald', name: 'Esmeralda Tech', bg: 'linear-gradient(135deg, #059669 0%, #0d9488 50%, #0284c7 100%)' },
  { id: 'slate', name: 'Minimalista Noche', bg: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)' },
];

export const CommunityProfileTab: React.FC<CommunityProfileTabProps> = ({
  userPosts,
  onPublishPost,
  onLikePost,
  onSharePost,
  onDeletePost,
  onAddComment,
  onDeleteComment,
  postComments,
  onOpenLightbox,
  onOpenProfile,
}) => {
  const { user, profile, updateProfileData, isAdmin } = useAuth();

  // Estados para personalización del perfil
  const [displayName, setDisplayName] = useState(profile?.displayName || user?.displayName || '');
  const [username, setUsername] = useState(profile?.username || user?.email?.split('@')[0] || '');
  const [bio, setBio] = useState(profile?.bio || '');
  const [website, setWebsite] = useState(profile?.website || '');
  const [customStatus, setCustomStatus] = useState(profile?.customStatus || '');
  const [visibility, setVisibility] = useState<'public' | 'community_only' | 'private'>(
    profile?.visibility || 'public'
  );
  const [bannerUrl, setBannerUrl] = useState<string>(profile?.bannerUrl || PRESET_BANNERS[0].bg);
  const [avatarUrl, setAvatarUrl] = useState<string>(profile?.photoURL || user?.photoURL || '');
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileSaveSuccess, setProfileSaveSuccess] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  // Estados para el publicador exclusivo
  const [newContent, setNewContent] = useState('');
  const [postVisibility, setPostVisibility] = useState<'public' | 'community_only' | 'private'>('public');
  const [selectedAttachment, setSelectedAttachment] = useState<ProcessedFile | null>(null);
  const [isUploadingAttachment, setIsUploadingAttachment] = useState(false);
  const [isSubmittingPost, setIsSubmittingPost] = useState(false);
  const [postFeedback, setPostFeedback] = useState<string | null>(null);

  // Referencias a inputs de archivos del dispositivo
  const bannerFileInputRef = useRef<HTMLInputElement>(null);
  const avatarFileInputRef = useRef<HTMLInputElement>(null);
  const postFileInputRef = useRef<HTMLInputElement>(null);

  // Subir imagen de Banner desde el dispositivo
  const handleBannerDeviceUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const processed = await processDeviceFile(file);
      setBannerUrl(processed.dataUrl);
    } catch (err: any) {
      alert(err.message || 'Error al procesar la imagen de banner del dispositivo.');
    } finally {
      if (e.target) e.target.value = '';
    }
  };

  // Subir imagen de Avatar desde el dispositivo
  const handleAvatarDeviceUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const processed = await processDeviceFile(file);
      setAvatarUrl(processed.dataUrl);
    } catch (err: any) {
      alert(err.message || 'Error al procesar la foto de avatar.');
    } finally {
      if (e.target) e.target.value = '';
    }
  };

  // Subir archivo o imagen para publicación desde el dispositivo
  const handlePostDeviceFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingAttachment(true);
    setPostFeedback(null);
    try {
      const processed = await processDeviceFile(file);
      setSelectedAttachment(processed);
    } catch (err: any) {
      setPostFeedback(err.message || 'Error al cargar el archivo desde tu dispositivo.');
    } finally {
      setIsUploadingAttachment(false);
      if (e.target) e.target.value = '';
    }
  };

  // Guardar perfil en Firestore
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsSavingProfile(true);
    setProfileError(null);
    setProfileSaveSuccess(false);

    try {
      await updateProfileData({
        displayName: displayName.trim(),
        username: username.trim().toLowerCase().replace(/[^a-z0-9_]/g, ''),
        bio: bio.trim(),
        description: bio.trim(),
        website: website.trim(),
        customStatus: customStatus.trim(),
        visibility,
        bannerUrl,
        photoURL: avatarUrl,
      });

      setProfileSaveSuccess(true);
      setTimeout(() => setProfileSaveSuccess(false), 3000);
    } catch (err: any) {
      setProfileError(err?.message || 'Error al guardar los cambios del perfil.');
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Enviar publicación desde la pestaña exclusiva
  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newContent.trim();
    if (!trimmed && !selectedAttachment) return;

    setIsSubmittingPost(true);
    setPostFeedback(null);

    try {
      await onPublishPost({
        content: trimmed,
        attachment: selectedAttachment,
        visibility: postVisibility,
      });

      setNewContent('');
      setSelectedAttachment(null);
      setPostFeedback('¡Publicación creada exitosamente en tu perfil y comunidad!');
      setTimeout(() => setPostFeedback(null), 3000);
    } catch (err: any) {
      setPostFeedback(err?.message || 'Error al publicar.');
    } finally {
      setIsSubmittingPost(false);
    }
  };

  // Calcular estadísticas del usuario
  const totalLikes = userPosts.reduce((acc, p) => acc + (p.likesCount || 0), 0);
  const totalComments = userPosts.reduce((acc, p) => acc + (p.commentsCount || 0), 0);

  return (
    <div className="w-full space-y-8 animate-in fade-in duration-300">
      {/* 1. SECCIÓN DE PERFIL CON BANNER Y AVATAR PERSONALIZABLE */}
      <div className="w-full rounded-3xl bg-white border border-slate-200 overflow-hidden shadow-xs text-left">
        {/* Banner Grande Adaptado a Toda la Pantalla */}
        <div 
          className="w-full h-44 sm:h-64 relative transition-all duration-300 flex items-end justify-end p-4"
          style={{ 
            background: bannerUrl.startsWith('data:') || bannerUrl.startsWith('http') 
              ? `url("${bannerUrl}") center/cover no-repeat` 
              : bannerUrl 
          }}
        >
          <div className="absolute inset-0 bg-black/20 pointer-events-none" />

          {/* Botón para cambiar banner desde el dispositivo */}
          <div className="relative z-10 flex items-center gap-2">
            <button
              type="button"
              id="btn-upload-banner-device"
              onClick={() => bannerFileInputRef.current?.click()}
              className="px-3.5 py-2 rounded-xl bg-slate-900/80 hover:bg-slate-900 text-white text-xs font-semibold backdrop-blur-md border border-white/20 shadow-md flex items-center gap-1.5 transition-all cursor-pointer min-h-[38px]"
            >
              <Camera className="w-4 h-4 text-indigo-300" />
              <span>Cambiar Banner (Dispositivo)</span>
            </button>
            <input
              ref={bannerFileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleBannerDeviceUpload}
            />
          </div>
        </div>

        {/* Presets rápidos de banner */}
        <div className="px-6 py-2.5 bg-slate-50 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
          <span className="text-slate-500 font-medium text-[11px]">
            O selecciona una paleta predeterminada:
          </span>
          <div className="flex items-center gap-2">
            {PRESET_BANNERS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => setBannerUrl(preset.bg)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-all cursor-pointer ${
                  bannerUrl === preset.bg
                    ? 'border-indigo-600 text-indigo-700 bg-indigo-50 font-bold'
                    : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-white'
                }`}
              >
                {preset.name}
              </button>
            ))}
          </div>
        </div>

        {/* Contenido del Perfil y Formulario de Personalización */}
        <div className="p-6 sm:p-8">
          {/* Avatar sobrepuesto y datos principales */}
          <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-6 -mt-16 sm:-mt-20 mb-6 relative z-10">
            <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4">
              <div className="relative group">
                <img
                  src={avatarUrl || `https://api.dicebear.com/7.x/identicon/svg?seed=${user?.uid}`}
                  alt={displayName}
                  className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl object-cover border-4 border-white shadow-lg bg-slate-100"
                  referrerPolicy="no-referrer"
                />
                <button
                  type="button"
                  id="btn-upload-avatar-device"
                  onClick={() => avatarFileInputRef.current?.click()}
                  className="absolute inset-0 bg-black/50 text-white rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-[10px] font-bold cursor-pointer"
                  title="Cambiar foto de perfil desde el dispositivo"
                >
                  <Camera className="w-5 h-5 mb-0.5" />
                  <span>Subir foto</span>
                </button>
                <input
                  ref={avatarFileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarDeviceUpload}
                />
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                    {displayName || 'Tu Nombre de Creador'}
                  </h2>
                  {isAdmin && (
                    <span className="text-[10px] uppercase tracking-wider font-extrabold px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-700 border border-indigo-200 flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3 text-indigo-600" />
                      SuperAdmin
                    </span>
                  )}
                </div>
                <p className="text-xs sm:text-sm text-slate-500 font-medium">
                  @{username || 'usuario'} · {user?.email}
                </p>
                {customStatus && (
                  <p className="text-xs text-indigo-600 font-medium mt-1">
                    💬 {customStatus}
                  </p>
                )}
                {bio && (
                  <p className="text-xs sm:text-sm text-slate-700 mt-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 leading-relaxed whitespace-pre-line max-w-xl">
                    {bio}
                  </p>
                )}
              </div>
            </div>

            {/* Tarjetas de Métricas de tu Perfil */}
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="flex-1 sm:flex-initial px-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-center">
                <span className="block text-lg font-black text-slate-900">{userPosts.length}</span>
                <span className="block text-[10px] uppercase font-bold text-slate-400">Publicaciones</span>
              </div>
              <div className="flex-1 sm:flex-initial px-4 py-2.5 rounded-2xl bg-rose-50/70 border border-rose-100 text-center">
                <span className="block text-lg font-black text-rose-600 flex items-center justify-center gap-1">
                  <Heart className="w-4 h-4 fill-rose-600" />
                  {totalLikes}
                </span>
                <span className="block text-[10px] uppercase font-bold text-rose-400">Me Gusta</span>
              </div>
              <div className="flex-1 sm:flex-initial px-4 py-2.5 rounded-2xl bg-indigo-50/70 border border-indigo-100 text-center">
                <span className="block text-lg font-black text-indigo-600 flex items-center justify-center gap-1">
                  <MessageCircle className="w-4 h-4" />
                  {totalComments}
                </span>
                <span className="block text-[10px] uppercase font-bold text-indigo-400">Respuestas</span>
              </div>
            </div>
          </div>

          {/* Formulario de Ajustes del Perfil */}
          <form onSubmit={handleSaveProfile} className="space-y-4 pt-4 border-t border-slate-100">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Edit3 className="w-4 h-4 text-indigo-600" />
              <span>Personalizar Perfil y Visibilidad</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nombre a mostrar
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  maxLength={60}
                  className="w-full px-3.5 py-2 text-xs sm:text-sm text-slate-800 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nombre de usuario (@)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">@</span>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    maxLength={30}
                    className="w-full pl-8 pr-3.5 py-2 text-xs sm:text-sm text-slate-800 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
              </div>

              <div className="md:col-span-2">
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700">
                    Descripción del Perfil / Biografía (Visible en tu perfil público)
                  </label>
                  <span className="text-[11px] text-slate-400">
                    {bio.length}/500
                  </span>
                </div>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={3}
                  maxLength={500}
                  placeholder="Cuéntale a la comunidad sobre ti: tus intereses, proyectos, habilidades o herramientas que utilizas..."
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm text-slate-800 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Estado personalizado
                </label>
                <input
                  type="text"
                  value={customStatus}
                  onChange={(e) => setCustomStatus(e.target.value)}
                  placeholder="Ej: Construyendo en NexStudio 🚀"
                  maxLength={80}
                  className="w-full px-3.5 py-2 text-xs sm:text-sm text-slate-800 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Sitio web o enlace de portafolio
                </label>
                <input
                  type="text"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  placeholder="https://tu-portfolio.com"
                  className="w-full px-3.5 py-2 text-xs sm:text-sm text-slate-800 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
            </div>

            {/* Visibilidad del Perfil en Comunidad */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                Visibilidad de tu perfil en la comunidad
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <label className={`flex items-start gap-2.5 p-3 rounded-xl border cursor-pointer transition-all ${
                  visibility === 'public'
                    ? 'bg-white border-indigo-600 shadow-xs'
                    : 'bg-white/50 border-slate-200 hover:border-slate-300'
                }`}>
                  <input
                    type="radio"
                    name="profile-visibility"
                    checked={visibility === 'public'}
                    onChange={() => setVisibility('public')}
                    className="mt-0.5 text-indigo-600"
                  />
                  <div>
                    <span className="text-xs font-bold text-slate-900 flex items-center gap-1">
                      <Globe className="w-3.5 h-3.5 text-emerald-600" />
                      Público
                    </span>
                    <span className="text-[11px] text-slate-500 leading-tight block mt-0.5">
                      Visible para cualquier persona en NexStudio.
                    </span>
                  </div>
                </label>

                <label className={`flex items-start gap-2.5 p-3 rounded-xl border cursor-pointer transition-all ${
                  visibility === 'community_only'
                    ? 'bg-white border-indigo-600 shadow-xs'
                    : 'bg-white/50 border-slate-200 hover:border-slate-300'
                }`}>
                  <input
                    type="radio"
                    name="profile-visibility"
                    checked={visibility === 'community_only'}
                    onChange={() => setVisibility('community_only')}
                    className="mt-0.5 text-indigo-600"
                  />
                  <div>
                    <span className="text-xs font-bold text-slate-900 flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-indigo-600" />
                      Solo Comunidad
                    </span>
                    <span className="text-[11px] text-slate-500 leading-tight block mt-0.5">
                      Solo usuarios con sesión iniciada en la red.
                    </span>
                  </div>
                </label>

                <label className={`flex items-start gap-2.5 p-3 rounded-xl border cursor-pointer transition-all ${
                  visibility === 'private'
                    ? 'bg-white border-indigo-600 shadow-xs'
                    : 'bg-white/50 border-slate-200 hover:border-slate-300'
                }`}>
                  <input
                    type="radio"
                    name="profile-visibility"
                    checked={visibility === 'private'}
                    onChange={() => setVisibility('private')}
                    className="mt-0.5 text-indigo-600"
                  />
                  <div>
                    <span className="text-xs font-bold text-slate-900 flex items-center gap-1">
                      <Lock className="w-3.5 h-3.5 text-amber-600" />
                      Privado
                    </span>
                    <span className="text-[11px] text-slate-500 leading-tight block mt-0.5">
                      Tus datos y publicaciones se ocultan del feed público.
                    </span>
                  </div>
                </label>
              </div>
            </div>

            {/* Feedback y Botón Guardar Perfil */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <div>
                {profileSaveSuccess && (
                  <span className="text-xs font-bold text-emerald-600 flex items-center gap-1.5">
                    <Check className="w-4 h-4" />
                    ¡Perfil de comunidad guardado correctamente!
                  </span>
                )}
                {profileError && (
                  <span className="text-xs font-bold text-rose-600 flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4" />
                    {profileError}
                  </span>
                )}
              </div>

              <button
                type="submit"
                id="btn-save-community-profile"
                disabled={isSavingProfile}
                className="px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white text-xs sm:text-sm font-bold shadow-md transition-all flex items-center gap-2 cursor-pointer min-h-[42px]"
              >
                <Save className="w-4 h-4 text-emerald-400" />
                <span>{isSavingProfile ? 'Guardando...' : 'Guardar Cambios de Perfil'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* 2. PESTAÑA EXCLUSIVA PARA PUBLICAR */}
      <div className="w-full p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 shadow-xs text-left">
        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
            <Send className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-slate-900 tracking-tight">
              Crear Nueva Publicación
            </h3>
            <p className="text-xs text-slate-500">
              Comparte proyectos, archivos o reflexiones directamente desde tu dispositivo.
            </p>
          </div>
        </div>

        <form onSubmit={handlePublish} className="space-y-4">
          {/* Textarea adaptada a toda la pantalla */}
          <div className="w-full p-3 rounded-2xl bg-slate-50 border border-slate-200 focus-within:border-indigo-500 focus-within:bg-white transition-colors">
            <textarea
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              placeholder="¿Qué estás desarrollando? Escribe aquí y sube fotos o archivos de tu dispositivo..."
              rows={4}
              maxLength={800}
              className="w-full text-sm text-slate-800 placeholder-slate-400 bg-transparent border-none focus:outline-none resize-none leading-relaxed"
            />
            <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-200/60">
              <span>Puedes usar #hashtags para etiquetar temas</span>
              <span>{800 - newContent.length} restantes</span>
            </div>
          </div>

          {/* VISTA PREVIA EN GRANDE DEL ARCHIVO/IMAGEN SUBIDO DESDE EL DISPOSITIVO */}
          {selectedAttachment && (
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-emerald-600" />
                  Archivo seleccionado de tu dispositivo
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedAttachment(null)}
                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                  title="Quitar archivo"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {selectedAttachment.type === 'image' ? (
                /* Vista previa en grande de la imagen seleccionada */
                <div className="relative rounded-xl overflow-hidden bg-slate-900 border border-slate-200 max-h-[420px] flex items-center justify-center">
                  <img
                    src={selectedAttachment.dataUrl}
                    alt={selectedAttachment.name}
                    className="w-full max-h-[420px] object-contain"
                  />
                  <div className="absolute bottom-2 left-2 px-3 py-1 rounded-lg bg-black/70 backdrop-blur-md text-white text-xs font-medium">
                    {selectedAttachment.name} ({formatFileSize(selectedAttachment.size)})
                  </div>
                </div>
              ) : (
                /* Vista previa en grande de archivo no imagen */
                <div className="p-4 rounded-xl bg-white border border-slate-200 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-slate-900 truncate">
                      {selectedAttachment.name}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      {formatFileSize(selectedAttachment.size)} · Listo para compartir
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Barra de herramientas para subir desde el dispositivo y visibilidad */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
            <div className="flex items-center gap-2">
              {/* Botón Subir Archivo del Dispositivo */}
              <button
                type="button"
                id="btn-upload-file-device"
                onClick={() => postFileInputRef.current?.click()}
                disabled={isUploadingAttachment}
                className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer min-h-[38px]"
              >
                <FileUp className="w-4 h-4 text-indigo-600" />
                <span>{selectedAttachment ? 'Cambiar archivo del dispositivo' : 'Subir archivo o foto de tu dispositivo'}</span>
              </button>
              <input
                ref={postFileInputRef}
                type="file"
                className="hidden"
                onChange={handlePostDeviceFileUpload}
              />

              {/* Selector de visibilidad para esta publicación */}
              <select
                value={postVisibility}
                onChange={(e) => setPostVisibility(e.target.value as any)}
                className="px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 border border-slate-200 rounded-xl focus:outline-none min-h-[38px] cursor-pointer"
              >
                <option value="public">🌍 Pública</option>
                <option value="community_only">👥 Solo Comunidad</option>
                <option value="private">🔒 Solo Yo (Privada)</option>
              </select>
            </div>

            <button
              type="submit"
              id="btn-publish-exclusive-post"
              disabled={isSubmittingPost || (!newContent.trim() && !selectedAttachment)}
              className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs sm:text-sm font-bold shadow-md shadow-indigo-600/20 transition-all flex items-center gap-2 cursor-pointer min-h-[40px]"
            >
              <Send className="w-4 h-4" />
              <span>{isSubmittingPost ? 'Publicando...' : 'Publicar'}</span>
            </button>
          </div>

          {postFeedback && (
            <p className="text-xs font-bold text-indigo-600 animate-in fade-in">
              {postFeedback}
            </p>
          )}
        </form>
      </div>

      {/* 3. TUS PUBLICACIONES EN LA COMUNIDAD */}
      <div className="space-y-4 text-left">
        <div className="flex items-center justify-between gap-4">
          <h3 className="text-lg font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <span>Tus Publicaciones</span>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
              {userPosts.length}
            </span>
          </h3>
        </div>

        {userPosts.length === 0 ? (
          <div className="w-full py-16 text-center rounded-3xl bg-white border border-slate-200 p-8 shadow-xs">
            <ImageIcon className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h4 className="text-base font-bold text-slate-800 mb-1">
              Aún no tienes publicaciones
            </h4>
            <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
              Utiliza el publicador de arriba para subir fotos de tus proyectos o archivos desde tu dispositivo y compartir tus avances.
            </p>
          </div>
        ) : (
          <div className="space-y-4 w-full">
            {userPosts.map((post) => (
              <CommunityPostCard
                key={post.id}
                post={post}
                onLike={onLikePost}
                onShare={onSharePost}
                onDelete={onDeletePost}
                onAddComment={onAddComment}
                onDeleteComment={onDeleteComment}
                comments={postComments[post.id] || []}
                onOpenLightbox={onOpenLightbox}
                onOpenProfile={onOpenProfile}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
