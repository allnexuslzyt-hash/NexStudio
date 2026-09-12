import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Flag, 
  Globe, 
  Calendar, 
  Heart, 
  MessageCircle, 
  ShieldCheck, 
  ExternalLink,
  Edit3,
  User,
  Quote,
  Sparkles,
  Layers
} from 'lucide-react';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../context/AuthContext';
import { CommunityPost, PostComment, UserProfile } from '../../types';
import { CommunityPostCard } from './CommunityPostCard';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string | null;
  initialName?: string;
  initialUsername?: string;
  initialPhotoURL?: string;
  allPosts: CommunityPost[];
  postComments: Record<string, PostComment[]>;
  onLikePost: (postId: string) => void;
  onSharePost: (post: CommunityPost) => void;
  onDeletePost: (postId: string) => void;
  onAddComment: (postId: string, text: string) => Promise<void>;
  onDeleteComment: (postId: string, commentId: string) => void;
  onOpenLightbox: (imageUrl: string, title?: string, authorName?: string) => void;
  onFilterTag?: (tag: string) => void;
  onReportUser: (userToReport: {
    id: string;
    name: string;
    username?: string;
    photoURL?: string;
    role?: string;
  }) => void;
  onGoToOwnProfile?: () => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  onClose,
  userId,
  initialName,
  initialUsername,
  initialPhotoURL,
  allPosts,
  postComments,
  onLikePost,
  onSharePost,
  onDeletePost,
  onAddComment,
  onDeleteComment,
  onOpenLightbox,
  onFilterTag,
  onReportUser,
  onGoToOwnProfile,
}) => {
  const { user } = useAuth();
  const [profileData, setProfileData] = useState<UserProfile | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);

  // Escuchar o cargar perfil en tiempo real desde Firestore
  useEffect(() => {
    if (!isOpen || !userId) {
      setProfileData(null);
      return;
    }

    setIsLoadingProfile(true);
    const userDocRef = doc(db, 'users', userId);

    const unsubscribe = onSnapshot(
      userDocRef,
      (docSnap) => {
        if (docSnap.exists()) {
          setProfileData(docSnap.data() as UserProfile);
        } else {
          setProfileData(null);
        }
        setIsLoadingProfile(false);
      },
      (err) => {
        console.warn('No se pudo cargar el perfil del usuario:', err);
        setIsLoadingProfile(false);
      }
    );

    return () => unsubscribe();
  }, [isOpen, userId]);

  if (!isOpen || !userId) return null;

  const isSelf = user?.uid === userId;

  // Filtrar publicaciones creadas por este creador
  const creatorPosts = allPosts.filter((p) => p.authorId === userId);
  const totalLikes = creatorPosts.reduce((acc, p) => acc + (p.likesCount || 0), 0);
  const totalComments = creatorPosts.reduce((acc, p) => acc + (p.commentsCount || 0), 0);

  const displayName = profileData?.displayName || initialName || 'Creador de NexStudio';
  const username = profileData?.username || initialUsername || 'creador';
  const photoURL = profileData?.photoURL || initialPhotoURL || `https://api.dicebear.com/7.x/identicon/svg?seed=${userId}`;
  const banner = profileData?.bannerUrl || 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #0284c7 100%)';
  const description = profileData?.description || profileData?.bio || '';
  const website = profileData?.website || '';
  const customStatus = profileData?.customStatus || '';
  const role = profileData?.role || (creatorPosts[0]?.authorRole) || 'Creador Digital';
  const isSuper = role === 'SuperAdmin';

  const handleTriggerReport = () => {
    onReportUser({
      id: userId,
      name: displayName,
      username,
      photoURL,
      role,
    });
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
    >
      <div 
        id="user-profile-modal-container"
        className="relative w-full max-w-3xl bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 max-h-[92vh] flex flex-col text-left"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabecera / Banner */}
        <div 
          className="w-full h-40 sm:h-52 relative transition-all duration-300 flex items-start justify-between p-4 shrink-0"
          style={{ 
            background: banner.startsWith('data:') || banner.startsWith('http') 
              ? `url("${banner}") center/cover no-repeat` 
              : banner 
          }}
        >
          <div className="absolute inset-0 bg-black/25 pointer-events-none" />

          {/* Badge o indicador de perfil */}
          <div className="relative z-10">
            <span className="px-3 py-1 rounded-xl bg-black/40 backdrop-blur-md text-white text-[11px] font-bold border border-white/20">
              Perfil de la Comunidad
            </span>
          </div>

          {/* Botón cerrar */}
          <button
            type="button"
            id="btn-close-profile-modal"
            onClick={onClose}
            aria-label="Cerrar perfil"
            className="relative z-10 p-2 rounded-xl bg-black/40 hover:bg-black/60 text-white backdrop-blur-md border border-white/20 transition-colors cursor-pointer min-h-[40px] min-w-[40px] flex items-center justify-center"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* CUERPO SCROLLABLE DEL PERFIL */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-8 space-y-6">
          {/* Header con Avatar, Nombres, Acciones y Métricas */}
          <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 -mt-16 sm:-mt-20 relative z-10 pb-5 border-b border-slate-100">
            <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4">
              <img
                src={photoURL}
                alt={displayName}
                className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl object-cover border-4 border-white shadow-xl bg-slate-100 shrink-0"
                referrerPolicy="no-referrer"
              />

              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                    {displayName}
                  </h2>
                  {isSuper && (
                    <span className="text-[10px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded bg-indigo-100 text-indigo-700 border border-indigo-200 flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3 text-indigo-600" />
                      SuperAdmin
                    </span>
                  )}
                </div>
                <p className="text-xs sm:text-sm text-slate-500 font-medium">
                  @{username}
                </p>
                {customStatus && (
                  <p className="text-xs text-indigo-600 font-medium mt-1">
                    💬 {customStatus}
                  </p>
                )}
              </div>
            </div>

            {/* Botones de acción: Reportar Usuario o Editar */}
            <div className="flex items-center gap-2 w-full sm:w-auto">
              {isSelf ? (
                <button
                  type="button"
                  id="btn-edit-own-profile-from-modal"
                  onClick={() => {
                    onClose();
                    if (onGoToOwnProfile) onGoToOwnProfile();
                  }}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-900 text-white hover:bg-slate-800 text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 min-h-[42px] shadow-sm"
                >
                  <Edit3 className="w-4 h-4 text-indigo-400" />
                  <span>Personalizar mi Perfil</span>
                </button>
              ) : (
                <button
                  type="button"
                  id="btn-report-creator-profile"
                  onClick={handleTriggerReport}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 min-h-[42px]"
                  title="Reportar este usuario al equipo de moderación"
                >
                  <Flag className="w-4 h-4 text-rose-600" />
                  <span>Reportar Usuario</span>
                </button>
              )}
            </div>
          </div>

          {/* SECCIÓN DE DESCRIPCIÓN DEL PERFIL */}
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-50/90 border border-slate-200/80 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Quote className="w-3.5 h-3.5 text-indigo-600" />
                <span>Descripción del Perfil</span>
              </span>
              {website && (
                <a
                  href={website.startsWith('http') ? website : `https://${website}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 hover:underline"
                >
                  <Globe className="w-3.5 h-3.5" />
                  <span>{website.replace(/^https?:\/\//, '')}</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>

            {description ? (
              <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line break-words font-normal">
                {description}
              </p>
            ) : (
              <p className="text-xs text-slate-400 italic">
                {isSelf 
                  ? 'Aún no has añadido una descripción a tu perfil. Ve a "Mi Perfil & Publicar" para agregar tu biografía.' 
                  : 'Este creador aún no ha añadido una descripción a su perfil.'}
              </p>
            )}
          </div>

          {/* Tarjetas de Métricas de la Comunidad */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-center">
              <span className="block text-base sm:text-lg font-black text-slate-900">
                {creatorPosts.length}
              </span>
              <span className="block text-[10px] uppercase font-bold text-slate-400">
                Publicaciones
              </span>
            </div>
            <div className="p-3.5 rounded-2xl bg-rose-50/70 border border-rose-100 text-center">
              <span className="block text-base sm:text-lg font-black text-rose-600 flex items-center justify-center gap-1">
                <Heart className="w-3.5 h-3.5 fill-rose-600" />
                {totalLikes}
              </span>
              <span className="block text-[10px] uppercase font-bold text-rose-400">
                Me Gusta
              </span>
            </div>
            <div className="p-3.5 rounded-2xl bg-indigo-50/70 border border-indigo-100 text-center">
              <span className="block text-base sm:text-lg font-black text-indigo-600 flex items-center justify-center gap-1">
                <MessageCircle className="w-3.5 h-3.5" />
                {totalComments}
              </span>
              <span className="block text-[10px] uppercase font-bold text-indigo-400">
                Respuestas
              </span>
            </div>
          </div>

          {/* Publicaciones del Creador */}
          <div className="space-y-4 pt-2">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-600" />
              <span>Publicaciones de {displayName} ({creatorPosts.length})</span>
            </h3>

            {creatorPosts.length === 0 ? (
              <div className="p-8 text-center rounded-2xl bg-slate-50 border border-slate-200 text-slate-400 text-xs">
                Este creador no tiene publicaciones activas en la comunidad por ahora.
              </div>
            ) : (
              <div className="space-y-4">
                {creatorPosts.map((post) => (
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
        </div>
      </div>
    </div>
  );
};
