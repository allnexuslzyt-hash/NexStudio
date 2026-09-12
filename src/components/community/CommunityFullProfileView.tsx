import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowLeft, 
  FolderPlus, 
  FileUp, 
  Folder, 
  Globe, 
  Users, 
  Lock, 
  ShieldCheck, 
  Star, 
  Heart, 
  MessageCircle, 
  Layers, 
  Calendar, 
  Edit3, 
  Flag, 
  Share2, 
  Check, 
  Sparkles, 
  ExternalLink, 
  Trash2, 
  Search, 
  Filter,
  User as UserIcon,
  Tag,
  FileCode,
  Image as ImageIcon,
  FileArchive,
  Download,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { CommunityPost, PostComment, UserProfile, UserRepository, UserRepoProject } from '../../types';
import { db } from '../../lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { 
  subscribeUserRepositories, 
  subscribeUserAllProjects,
  deleteRepository 
} from '../../lib/repositoryService';
import { CommunityPostCard } from './CommunityPostCard';
import { CreateRepositoryModal } from './CreateRepositoryModal';
import { UploadProjectModal } from './UploadProjectModal';
import { RepositoryDetailModal } from './RepositoryDetailModal';
import { ProcessedFile } from '../../lib/fileUploadHelper';

interface CommunityFullProfileViewProps {
  userId: string;
  onBack: () => void;
  onReportUser: (user: {
    id: string;
    name: string;
    username?: string;
    photoURL?: string;
    role?: string;
  }) => void;
  allPosts: CommunityPost[];
  postComments: Record<string, PostComment[]>;
  onLikePost: (postId: string) => void;
  onSharePost: (post: CommunityPost) => void;
  onDeletePost: (postId: string) => void;
  onAddComment: (postId: string, text: string) => Promise<void>;
  onDeleteComment: (postId: string, commentId: string) => void;
  onOpenLightbox: (imageUrl: string, title?: string, authorName?: string) => void;
  onFilterTag?: (tag: string) => void;
  onPublishPost?: (data: {
    content: string;
    attachment?: ProcessedFile | null;
    visibility: 'public' | 'community_only' | 'private';
  }) => Promise<void>;
}

const PRESET_BANNERS = [
  { id: 'indigo', name: 'Nebulosa Índigo', bg: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #0284c7 100%)' },
  { id: 'sunset', name: 'Atardecer Creativo', bg: 'linear-gradient(135deg, #ea580c 0%, #db2777 50%, #7c3aed 100%)' },
  { id: 'emerald', name: 'Esmeralda Tech', bg: 'linear-gradient(135deg, #059669 0%, #0d9488 50%, #0284c7 100%)' },
  { id: 'slate', name: 'Minimalista Noche', bg: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)' },
];

export const CommunityFullProfileView: React.FC<CommunityFullProfileViewProps> = ({
  userId,
  onBack,
  onReportUser,
  allPosts,
  postComments,
  onLikePost,
  onSharePost,
  onDeletePost,
  onAddComment,
  onDeleteComment,
  onOpenLightbox,
  onFilterTag,
  onPublishPost,
}) => {
  const { user, profile: authProfile, updateProfileData, isAdmin } = useAuth();
  const isOwnProfile = Boolean(user && user.uid === userId);

  // Perfil del usuario cargado en tiempo real
  const [profileData, setProfileData] = useState<UserProfile | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);

  // Repositorios y proyectos del usuario
  const [repositories, setRepositories] = useState<UserRepository[]>([]);
  const [userProjects, setUserProjects] = useState<UserRepoProject[]>([]);
  const [isLoadingRepos, setIsLoadingRepos] = useState(true);
  const [repoSearch, setRepoSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Pestaña activa del perfil a pantalla completa
  const [activeTab, setActiveTab] = useState<'repositories' | 'posts' | 'settings' | 'admin_mod'>('repositories');

  // Modales
  const [isCreateRepoOpen, setIsCreateRepoOpen] = useState(false);
  const [isUploadProjectOpen, setIsUploadProjectOpen] = useState(false);
  const [selectedRepoForUpload, setSelectedRepoForUpload] = useState<string | undefined>(undefined);
  const [selectedRepoForDetail, setSelectedRepoForDetail] = useState<UserRepository | null>(null);

  // Formulario de edición del perfil propio
  const [editDisplayName, setEditDisplayName] = useState('');
  const [editUsername, setEditUsername] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editWebsite, setEditWebsite] = useState('');
  const [editCustomStatus, setEditCustomStatus] = useState('');
  const [editVisibility, setEditVisibility] = useState<'public' | 'community_only' | 'private'>('public');
  const [editBannerUrl, setEditBannerUrl] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  // 1. Cargar datos del perfil en tiempo real desde Firestore
  useEffect(() => {
    setIsLoadingProfile(true);
    const userDocRef = doc(db, 'users', userId);

    const unsubscribe = onSnapshot(
      userDocRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data() as UserProfile;
          setProfileData(data);
          setEditDisplayName(data.displayName || '');
          setEditUsername(data.username || '');
          setEditBio(data.description || data.bio || '');
          setEditWebsite(data.website || '');
          setEditCustomStatus(data.customStatus || '');
          setEditVisibility(data.visibility || 'public');
          setEditBannerUrl(data.bannerUrl || PRESET_BANNERS[0].bg);
        } else if (isOwnProfile && authProfile) {
          setProfileData(authProfile);
          setEditDisplayName(authProfile.displayName || user?.displayName || '');
          setEditUsername(authProfile.username || '');
          setEditBio(authProfile.description || authProfile.bio || '');
          setEditWebsite(authProfile.website || '');
          setEditCustomStatus(authProfile.customStatus || '');
          setEditVisibility(authProfile.visibility || 'public');
          setEditBannerUrl(authProfile.bannerUrl || PRESET_BANNERS[0].bg);
        }
        setIsLoadingProfile(false);
      },
      () => {
        setIsLoadingProfile(false);
      }
    );

    return () => unsubscribe();
  }, [userId, isOwnProfile, authProfile, user]);

  // 2. Cargar repositorios y proyectos del usuario
  useEffect(() => {
    setIsLoadingRepos(true);
    const unsubRepos = subscribeUserRepositories(userId, (repos) => {
      setRepositories(repos);
      setIsLoadingRepos(false);
    });

    const unsubProjects = subscribeUserAllProjects(userId, (projs) => {
      setUserProjects(projs);
    });

    return () => {
      unsubRepos();
      unsubProjects();
    };
  }, [userId]);

  // Publicaciones de este usuario en la comunidad
  const userPosts = useMemo(() => {
    return allPosts.filter((p) => p.authorId === userId);
  }, [allPosts, userId]);

  // Me gusta recibidos en total
  const totalLikes = useMemo(() => {
    return userPosts.reduce((acc, p) => acc + (p.likesCount || p.likes?.length || 0), 0);
  }, [userPosts]);

  // Filtrado de repositorios
  const filteredRepos = useMemo(() => {
    return repositories.filter((repo) => {
      const matchesSearch = 
        repo.name.toLowerCase().includes(repoSearch.toLowerCase()) ||
        (repo.description && repo.description.toLowerCase().includes(repoSearch.toLowerCase())) ||
        (repo.tags && repo.tags.some((t) => t.toLowerCase().includes(repoSearch.toLowerCase())));
      
      const matchesCategory = selectedCategory === 'all' || repo.category === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [repositories, repoSearch, selectedCategory]);

  const categoriesList = useMemo(() => {
    const set = new Set<string>();
    repositories.forEach((r) => {
      if (r.category) set.add(r.category);
    });
    return Array.from(set);
  }, [repositories]);

  // Guardar ajustes de perfil
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isOwnProfile) return;

    setIsSavingProfile(true);
    try {
      await updateProfileData({
        displayName: editDisplayName.trim(),
        username: editUsername.trim().toLowerCase().replace(/[^a-z0-9_]/g, ''),
        bio: editBio.trim(),
        description: editBio.trim(),
        website: editWebsite.trim(),
        customStatus: editCustomStatus.trim(),
        visibility: editVisibility,
        bannerUrl: editBannerUrl,
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      alert(err?.message || 'Error al guardar el perfil.');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleShareProfile = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2500);
  };

  const displayName = profileData?.displayName || (isOwnProfile ? user?.displayName : 'Creador NexStudio') || 'Usuario';
  const username = profileData?.username || (isOwnProfile ? user?.email?.split('@')[0] : 'creador') || 'creador';
  const photoURL = profileData?.photoURL || (isOwnProfile ? user?.photoURL : null) || `https://api.dicebear.com/7.x/identicon/svg?seed=${userId}`;
  const bannerBackground = profileData?.bannerUrl || PRESET_BANNERS[0].bg;
  const bio = profileData?.description || profileData?.bio || '';
  const isSuperAdmin = profileData?.role === 'SuperAdmin' || (profileData?.email === 'allnexuslzyt@gmail.com');

  return (
    <div className="w-full min-h-screen bg-slate-50/50 pb-16 text-slate-800 animate-in fade-in duration-300">
      {/* 1. BARRA DE NAVEGACIÓN SUPERIOR (OCUPA TODO EL ANCHO) */}
      <div className="w-full bg-white border-b border-slate-200 px-4 sm:px-8 py-3.5 flex items-center justify-between sticky top-0 z-30 shadow-xs">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Volver a la Comunidad</span>
          </button>

          <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400 truncate">
            <span>Comunidad</span>
            <span>/</span>
            <span>Creadores</span>
            <span>/</span>
            <span className="font-bold text-slate-700 truncate">@{username}</span>
          </div>
        </div>

        {/* Acciones del Header */}
        <div className="flex items-center gap-2">
          {isOwnProfile && (
            <button
              type="button"
              onClick={() => setIsCreateRepoOpen(true)}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-xs transition-all cursor-pointer flex items-center gap-1.5 shrink-0"
            >
              <FolderPlus className="w-4 h-4" />
              <span className="hidden sm:inline">Crear Repositorio</span>
              <span className="sm:hidden">Nuevo Repo</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleShareProfile}
            className="p-2 rounded-xl text-slate-600 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer shrink-0"
            title="Copiar enlace del perfil"
          >
            {copySuccess ? <Check className="w-4 h-4 text-emerald-600" /> : <Share2 className="w-4 h-4" />}
          </button>

          {!isOwnProfile && (
            <button
              type="button"
              onClick={() =>
                onReportUser({
                  id: userId,
                  name: displayName,
                  username,
                  photoURL,
                  role: profileData?.role,
                })
              }
              className="px-3.5 py-2 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 border border-rose-200 transition-colors cursor-pointer flex items-center gap-1.5 shrink-0"
              title="Reportar conducta o contenido de este usuario"
            >
              <Flag className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Reportar Usuario</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. HERO BANNER A PANTALLA COMPLETA */}
      <div 
        className="w-full h-48 sm:h-64 relative transition-all"
        style={{
          background: bannerBackground.startsWith('linear-gradient')
            ? bannerBackground
            : `url(${bannerBackground}) center/cover no-repeat`,
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/50 via-transparent to-transparent" />

        {isOwnProfile && (
          <button
            type="button"
            onClick={() => setActiveTab('settings')}
            className="absolute bottom-4 right-4 sm:right-8 px-3.5 py-2 rounded-xl bg-slate-900/80 hover:bg-slate-900 text-white text-xs font-bold backdrop-blur-sm border border-white/20 transition-all cursor-pointer flex items-center gap-1.5"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Personalizar Banner</span>
          </button>
        )}
      </div>

      {/* 3. TARJETA PRINCIPAL DEL PERFIL (AJUSTADA Y ESPACIOSA) */}
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-8 -mt-20 relative z-10 space-y-6">
        <div className="w-full bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 text-left">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 min-w-0">
              <div className="relative shrink-0">
                <img
                  src={photoURL}
                  alt={displayName}
                  className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl object-cover border-4 border-white shadow-md bg-slate-100"
                  referrerPolicy="no-referrer"
                />
                <span className="absolute bottom-1 right-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-white" title="Usuario activo" />
              </div>

              <div className="space-y-1.5 min-w-0">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h1 className="text-xl sm:text-3xl font-black text-slate-900 tracking-tight">
                    {displayName}
                  </h1>

                  {isSuperAdmin && (
                    <span className="px-2.5 py-0.5 rounded-md text-[10px] uppercase tracking-wider font-extrabold bg-indigo-100 text-indigo-700 border border-indigo-200 flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
                      SuperAdmin
                    </span>
                  )}

                  {profileData?.visibility === 'public' && (
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                      <Globe className="w-3 h-3 text-emerald-600" />
                      Público
                    </span>
                  )}
                  {profileData?.visibility === 'community_only' && (
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-600 flex items-center gap-1">
                      <Users className="w-3 h-3 text-slate-500" />
                      Comunidad
                    </span>
                  )}
                  {profileData?.visibility === 'private' && (
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1">
                      <Lock className="w-3 h-3 text-amber-600" />
                      Privado
                    </span>
                  )}
                </div>

                <p className="text-xs sm:text-sm font-semibold text-slate-500">
                  @{username}
                  {profileData?.website && (
                    <>
                      <span> · </span>
                      <a
                        href={profileData.website.startsWith('http') ? profileData.website : `https://${profileData.website}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-indigo-600 hover:underline inline-flex items-center gap-1"
                      >
                        <span>{profileData.website.replace(/^https?:\/\//, '')}</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </>
                  )}
                </p>

                {profileData?.customStatus && (
                  <p className="text-xs text-indigo-600 font-medium pt-0.5">
                    💬 {profileData.customStatus}
                  </p>
                )}
              </div>
            </div>

            {/* Acciones principales */}
            <div className="flex items-center gap-2.5 flex-wrap w-full md:w-auto">
              {isOwnProfile ? (
                <>
                  <button
                    type="button"
                    onClick={() => setIsCreateRepoOpen(true)}
                    className="flex-1 sm:flex-initial px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-sm transition-all cursor-pointer flex items-center justify-center gap-2 min-h-[42px]"
                  >
                    <FolderPlus className="w-4 h-4" />
                    <span>Crear Repositorio</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('settings')}
                    className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition-colors cursor-pointer flex items-center justify-center gap-2 min-h-[42px]"
                  >
                    <Edit3 className="w-4 h-4 text-slate-600" />
                    <span>Personalizar Perfil</span>
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() =>
                      onReportUser({
                        id: userId,
                        name: displayName,
                        username,
                        photoURL,
                        role: profileData?.role,
                      })
                    }
                    className="px-4 py-2.5 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 border border-rose-200 transition-colors cursor-pointer flex items-center gap-2 min-h-[42px]"
                  >
                    <Flag className="w-4 h-4" />
                    <span>Reportar Creador</span>
                  </button>

                  {isAdmin && (
                    <button
                      type="button"
                      onClick={() => setActiveTab('admin_mod')}
                      className="px-4 py-2.5 rounded-xl text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 transition-colors cursor-pointer flex items-center gap-2 min-h-[42px]"
                    >
                      <ShieldCheck className="w-4 h-4 text-indigo-600" />
                      <span>Modelar Usuario (Admin)</span>
                    </button>
                  )}
                </>
              )}
            </div>
          </div>

          {/* DESCRIPCIÓN / BIOGRAFÍA ESPACIOSA Y BIEN AJUSTADA */}
          <div className="mt-6 pt-6 border-t border-slate-100">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
              <span>Biografía & Descripción del Creador</span>
            </h3>

            {bio ? (
              <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                {bio}
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-slate-50 border border-dashed border-slate-200 text-xs text-slate-400 flex items-center justify-between">
                <span>Este usuario aún no ha agregado una descripción a su perfil.</span>
                {isOwnProfile && (
                  <button
                    type="button"
                    onClick={() => setActiveTab('settings')}
                    className="text-indigo-600 font-bold hover:underline cursor-pointer ml-2 shrink-0"
                  >
                    + Añadir descripción
                  </button>
                )}
              </div>
            )}
          </div>

          {/* MÉTRICAS DEL CREADOR (GRID LIMPIO Y BALANCEADO) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-slate-100">
            <div className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-100/80 text-center">
              <span className="block text-2xl font-black text-indigo-900">{repositories.length}</span>
              <span className="block text-[11px] font-bold uppercase text-indigo-600/80 mt-0.5 flex items-center justify-center gap-1">
                <Folder className="w-3.5 h-3.5" />
                Repositorios
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-sky-50/60 border border-sky-100/80 text-center">
              <span className="block text-2xl font-black text-sky-900">{userProjects.length}</span>
              <span className="block text-[11px] font-bold uppercase text-sky-600/80 mt-0.5 flex items-center justify-center gap-1">
                <Layers className="w-3.5 h-3.5" />
                Proyectos Subidos
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-center">
              <span className="block text-2xl font-black text-slate-900">{userPosts.length}</span>
              <span className="block text-[11px] font-bold uppercase text-slate-500 mt-0.5 flex items-center justify-center gap-1">
                <MessageCircle className="w-3.5 h-3.5" />
                Publicaciones
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-rose-50/60 border border-rose-100/80 text-center">
              <span className="block text-2xl font-black text-rose-600">{totalLikes}</span>
              <span className="block text-[11px] font-bold uppercase text-rose-500 mt-0.5 flex items-center justify-center gap-1">
                <Heart className="w-3.5 h-3.5 fill-rose-500" />
                Me Gusta
              </span>
            </div>
          </div>
        </div>

        {/* 4. BARRA DE PESTAÑAS PRINCIPALES DEL PERFIL A PANTALLA COMPLETA */}
        <div className="w-full flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('repositories')}
            className={`px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
              activeTab === 'repositories'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Folder className="w-4 h-4" />
            <span>Repositorios & Proyectos ({repositories.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('posts')}
            className={`px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
              activeTab === 'posts'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <MessageCircle className="w-4 h-4" />
            <span>Publicaciones en Comunidad ({userPosts.length})</span>
          </button>

          {isOwnProfile && (
            <button
              type="button"
              onClick={() => setActiveTab('settings')}
              className={`px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
                activeTab === 'settings'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Edit3 className="w-4 h-4" />
              <span>Personalizar Mi Perfil</span>
            </button>
          )}

          {isAdmin && (
            <button
              type="button"
              onClick={() => setActiveTab('admin_mod')}
              className={`px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
                activeTab === 'admin_mod'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Modelar Usuario (Admin)</span>
            </button>
          )}
        </div>

        {/* 5. CONTENIDO DE LA PESTAÑA: REPOSITORIOS Y PROYECTOS */}
        {activeTab === 'repositories' && (
          <div className="space-y-6 text-left">
            {/* Barra de Filtros y Búsqueda de Repositorios */}
            <div className="w-full flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={repoSearch}
                  onChange={(e) => setRepoSearch(e.target.value)}
                  placeholder="Buscar repositorio por nombre, tema o etiqueta..."
                  className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm text-slate-800 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {categoriesList.length > 0 && (
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none cursor-pointer min-h-[38px]"
                  >
                    <option value="all">Todas las Categorías</option>
                    {categoriesList.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                )}

                {(isOwnProfile || isAdmin) && (
                  <button
                    type="button"
                    onClick={() => setIsCreateRepoOpen(true)}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-all cursor-pointer flex items-center gap-1.5 min-h-[38px] shadow-xs"
                  >
                    <FolderPlus className="w-4 h-4" />
                    <span>Nuevo Repositorio</span>
                  </button>
                )}
              </div>
            </div>

            {/* Listado de Repositorios */}
            {isLoadingRepos ? (
              <div className="w-full py-20 text-center">
                <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <p className="text-xs text-slate-500 font-medium">Cargando repositorios del creador...</p>
              </div>
            ) : filteredRepos.length === 0 ? (
              <div className="w-full py-20 text-center rounded-3xl bg-white border border-slate-200 p-8 shadow-xs">
                <Folder className="w-14 h-14 text-slate-300 mx-auto mb-3" />
                <h3 className="text-base font-bold text-slate-900 mb-1">
                  {repoSearch ? 'No se encontraron repositorios con ese filtro' : 'Aún no hay repositorios creados'}
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto mb-6">
                  {isOwnProfile
                    ? 'Crea un repositorio para organizar tus proyectos, subir tus archivos de código o mostrar tus creaciones.'
                    : 'Este creador aún no tiene repositorios públicos.'}
                </p>

                {(isOwnProfile || isAdmin) && (
                  <button
                    type="button"
                    onClick={() => setIsCreateRepoOpen(true)}
                    className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md transition-all cursor-pointer inline-flex items-center gap-2"
                  >
                    <FolderPlus className="w-4 h-4" />
                    <span>Crear Mi Primer Repositorio</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredRepos.map((repo) => {
                  const repoProjectsCount = userProjects.filter((p) => p.repoId === repo.id).length;
                  return (
                    <div
                      key={repo.id}
                      className="p-5 sm:p-6 rounded-3xl bg-white border border-slate-200 hover:border-indigo-200 hover:shadow-md transition-all flex flex-col justify-between group"
                    >
                      <div className="space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-100 flex items-center gap-1">
                            <Folder className="w-3 h-3 text-indigo-600" />
                            {repo.category || 'General'}
                          </span>

                          <div className="flex items-center gap-1">
                            {repo.visibility === 'public' && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                Público
                              </span>
                            )}
                            {repo.visibility === 'community_only' && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600">
                                Comunidad
                              </span>
                            )}
                            {repo.visibility === 'private' && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                                Privado
                              </span>
                            )}
                            {repo.isFeatured && (
                              <span className="p-1 rounded bg-amber-400 text-slate-950" title="Destacado por administradores">
                                <Star className="w-3 h-3 fill-slate-950" />
                              </span>
                            )}
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => setSelectedRepoForDetail(repo)}
                          className="text-left w-full focus:outline-none"
                        >
                          <h4 className="text-base sm:text-lg font-black text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-1">
                            {repo.name}
                          </h4>
                          <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                            {repo.description || 'Sin descripción.'}
                          </p>
                        </button>

                        {/* Etiquetas */}
                        {repo.tags && repo.tags.length > 0 && (
                          <div className="flex items-center gap-1.5 flex-wrap pt-1">
                            {repo.tags.slice(0, 3).map((tag) => (
                              <span
                                key={tag}
                                className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 text-slate-600"
                              >
                                #{tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Footer del Repositorio */}
                      <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-500 flex items-center gap-1">
                          <Layers className="w-3.5 h-3.5 text-indigo-500" />
                          <span>{repoProjectsCount} proyecto{repoProjectsCount === 1 ? '' : 's'}</span>
                        </span>

                        <div className="flex items-center gap-1.5">
                          {(isOwnProfile || isAdmin) && (
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedRepoForUpload(repo.id);
                                setIsUploadProjectOpen(true);
                              }}
                              className="px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
                              title="Subir proyecto o archivo a este repositorio"
                            >
                              <FileUp className="w-3.5 h-3.5" />
                              <span>Subir</span>
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => setSelectedRepoForDetail(repo)}
                            className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors cursor-pointer"
                          >
                            Ver Todo →
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* 6. CONTENIDO DE LA PESTAÑA: PUBLICACIONES EN COMUNIDAD */}
        {activeTab === 'posts' && (
          <div className="space-y-6 text-left">
            {userPosts.length === 0 ? (
              <div className="w-full py-20 text-center rounded-3xl bg-white border border-slate-200 p-8 shadow-xs">
                <MessageCircle className="w-14 h-14 text-slate-300 mx-auto mb-3" />
                <h3 className="text-base font-bold text-slate-900 mb-1">
                  Aún no hay publicaciones de este usuario en la comunidad
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
                  {isOwnProfile
                    ? 'Ve al feed principal para compartir tus reflexiones, capturas o proyectos con la comunidad.'
                    : 'Cuando este usuario publique fotos o actualizaciones, aparecerán aquí.'}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
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
                    onFilterTag={onFilterTag}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* 7. CONTENIDO DE LA PESTAÑA: PERSONALIZACIÓN (SOLO DUEÑO) */}
        {activeTab === 'settings' && isOwnProfile && (
          <div className="w-full bg-white rounded-3xl border border-slate-200 shadow-xs p-6 sm:p-8 text-left space-y-6">
            <div>
              <h3 className="text-lg font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-indigo-600" />
                <span>Personalización del Perfil y Banner</span>
              </h3>
              <p className="text-xs text-slate-500">
                Ajusta tu nombre, biografía completa, banner de cabecera y privacidad.
              </p>
            </div>

            {saveSuccess && (
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-800 flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600" />
                <span>¡Perfil y banner actualizados correctamente!</span>
              </div>
            )}

            <form onSubmit={handleSaveProfile} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1.5">
                    Nombre a mostrar
                  </label>
                  <input
                    type="text"
                    value={editDisplayName}
                    onChange={(e) => setEditDisplayName(e.target.value)}
                    maxLength={60}
                    required
                    className="w-full px-4 py-2.5 text-xs sm:text-sm text-slate-900 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1.5">
                    Nombre de usuario (@)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">@</span>
                    <input
                      type="text"
                      value={editUsername}
                      onChange={(e) => setEditUsername(e.target.value)}
                      maxLength={30}
                      className="w-full pl-8 pr-4 py-2.5 text-xs sm:text-sm text-slate-900 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>
                </div>

                {/* DESCRIPCIÓN COMPLETA DEL PERFIL */}
                <div className="md:col-span-2">
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold text-slate-800">
                      Descripción del Perfil / Biografía (Visible en tu perfil)
                    </label>
                    <span className="text-[11px] text-slate-400">{editBio.length}/800</span>
                  </div>
                  <textarea
                    value={editBio}
                    onChange={(e) => setEditBio(e.target.value)}
                    rows={4}
                    maxLength={800}
                    placeholder="Cuéntale a la comunidad sobre ti: tus intereses, herramientas que manejas, proyectos en marcha o cómo colaborar..."
                    className="w-full px-4 py-3 text-xs sm:text-sm text-slate-900 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 resize-none leading-relaxed"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1.5">
                    Sitio Web o Portfolio
                  </label>
                  <input
                    type="text"
                    value={editWebsite}
                    onChange={(e) => setEditWebsite(e.target.value)}
                    placeholder="https://miportafolio.com"
                    className="w-full px-4 py-2.5 text-xs sm:text-sm text-slate-900 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1.5">
                    Estado personalizado
                  </label>
                  <input
                    type="text"
                    value={editCustomStatus}
                    onChange={(e) => setEditCustomStatus(e.target.value)}
                    placeholder="ej. Creando nuevos proyectos 🚀"
                    className="w-full px-4 py-2.5 text-xs sm:text-sm text-slate-900 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-800 mb-2">
                    Banner de Perfil Predefinido
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {PRESET_BANNERS.map((preset) => (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => setEditBannerUrl(preset.bg)}
                        className={`h-20 rounded-2xl relative overflow-hidden border-2 transition-all cursor-pointer ${
                          editBannerUrl === preset.bg
                            ? 'border-indigo-600 ring-2 ring-indigo-500/30'
                            : 'border-transparent hover:opacity-90'
                        }`}
                        style={{ background: preset.bg }}
                      >
                        <span className="absolute bottom-2 left-2 text-[10px] font-bold text-white drop-shadow-md">
                          {preset.name}
                        </span>
                        {editBannerUrl === preset.bg && (
                          <span className="absolute top-2 right-2 p-1 rounded-full bg-white text-indigo-600 shadow-sm">
                            <Check className="w-3 h-3" />
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end">
                <button
                  type="submit"
                  disabled={isSavingProfile}
                  className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md transition-all cursor-pointer flex items-center gap-2"
                >
                  {isSavingProfile ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Guardando...</span>
                    </>
                  ) : (
                    <span>Guardar Cambios del Perfil</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* 8. CONTENIDO DE LA PESTAÑA: MODELADO ADMIN (EXCLUSIVO ADMIN) */}
        {activeTab === 'admin_mod' && isAdmin && (
          <div className="w-full bg-slate-900 text-white rounded-3xl p-6 sm:p-8 text-left space-y-6 shadow-xl border border-slate-800">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-lg font-black text-white flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-400" />
                  <span>Panel de Modelado y Moderación del Creador</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Como Administrador (`allnexuslzyt@gmail.com`), tienes autoridad para modelar, auditar o eliminar repositorios y proyectos.
                </p>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                SuperAdmin Conectado
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700">
                <span className="text-xs text-slate-400">Total Repositorios Auditables</span>
                <p className="text-2xl font-black text-white mt-1">{repositories.length}</p>
              </div>
              <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700">
                <span className="text-xs text-slate-400">Proyectos Subidos</span>
                <p className="text-2xl font-black text-white mt-1">{userProjects.length}</p>
              </div>
              <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700">
                <span className="text-xs text-slate-400">Publicaciones en Feed</span>
                <p className="text-2xl font-black text-white mt-1">{userPosts.length}</p>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Repositorios de este usuario (Acción Directa de Modelado)
              </h4>
              {repositories.length === 0 ? (
                <p className="text-xs text-slate-500">Este usuario no tiene repositorios para auditar.</p>
              ) : (
                <div className="space-y-2">
                  {repositories.map((repo) => (
                    <div
                      key={repo.id}
                      className="p-4 rounded-2xl bg-slate-800 border border-slate-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-white">{repo.name}</span>
                          <span className="text-[10px] px-2 py-0.5 rounded bg-slate-700 text-slate-300">
                            {repo.category}
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-900/60 text-indigo-300">
                            {repo.visibility}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {repo.description || 'Sin descripción.'}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => setSelectedRepoForDetail(repo)}
                          className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold cursor-pointer"
                        >
                          Modelar / Abrir
                        </button>
                        <button
                          type="button"
                          onClick={async () => {
                            if (!window.confirm(`¿Admin, eliminar el repositorio "${repo.name}" y sus proyectos?`)) return;
                            await deleteRepository(repo.id);
                          }}
                          className="p-2 rounded-xl bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white transition-colors cursor-pointer"
                          title="Eliminar repositorio como administrador"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* MODAL PARA CREAR REPOSITORIO */}
      <CreateRepositoryModal
        isOpen={isCreateRepoOpen}
        onClose={() => setIsCreateRepoOpen(false)}
        userId={userId}
        userName={displayName}
        userUsername={username}
        userPhotoURL={photoURL}
        onSuccess={(newRepoId) => {
          // Si el usuario crea un repositorio, abrir opcionalmente el modal de subida de proyectos
          setSelectedRepoForUpload(newRepoId);
        }}
      />

      {/* MODAL PARA SUBIR PROYECTO */}
      <UploadProjectModal
        isOpen={isUploadProjectOpen}
        onClose={() => setIsUploadProjectOpen(false)}
        repositories={repositories}
        selectedRepoId={selectedRepoForUpload}
        userId={userId}
        userName={displayName}
        onSuccess={() => {
          // El proyecto se sincroniza automáticamente con el snapshot
        }}
      />

      {/* MODAL DETALLADO DEL REPOSITORIO Y SUS PROYECTOS */}
      <RepositoryDetailModal
        isOpen={Boolean(selectedRepoForDetail)}
        onClose={() => setSelectedRepoForDetail(null)}
        repository={selectedRepoForDetail}
        currentUserId={user?.uid}
        isAdmin={isAdmin}
        onOpenUploadProject={(rId) => {
          setSelectedRepoForUpload(rId);
          setIsUploadProjectOpen(true);
        }}
        onRepoDeleted={() => setSelectedRepoForDetail(null)}
      />
    </div>
  );
};
