import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowLeft,
  MessageCircle,
  Sparkles,
  Search,
  Filter,
  Flame,
  LogIn,
  Layers,
  Copy,
  User,
  Send,
  Image as ImageIcon,
  FileUp,
  X,
  Check,
  Globe,
  Lock,
  Users
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { db, handleFirestoreError, OperationType, removeUndefinedFields } from '../lib/firebase';
import { 
  collection, 
  doc, 
  setDoc, 
  getDocs, 
  deleteDoc, 
  onSnapshot, 
  query, 
  orderBy, 
  serverTimestamp,
  updateDoc
} from 'firebase/firestore';
import { CommunityPost, PostComment } from '../types';
import { CommunityPostCard } from './community/CommunityPostCard';
import { CommunityProfileTab } from './community/CommunityProfileTab';
import { CommunityFullProfileView } from './community/CommunityFullProfileView';
import { CommunityMediaModal } from './community/CommunityMediaModal';
import { ReportUserModal } from './community/ReportUserModal';
import { processDeviceFile, formatFileSize, ProcessedFile } from '../lib/fileUploadHelper';

interface CommunityFeedViewProps {
  onBack: () => void;
}

export const CommunityFeedView: React.FC<CommunityFeedViewProps> = ({ onBack }) => {
  const { user, profile, isAdmin, signInWithGoogle } = useAuth();

  // Pestañas principales de la Comunidad:
  // 'feed' = Explorar Comunidad a pantalla completa
  // 'profile' = Pestaña exclusiva para publicar, ver tus posts y personalizar perfil/banner/visibilidad
  const [activeTab, setActiveTab] = useState<'feed' | 'profile'>('feed');

  // Estado de publicaciones reales de Firestore (SIN publicaciones de mentira)
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [postComments, setPostComments] = useState<Record<string, PostComment[]>>({});
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  // Estados del compositor rápido del feed principal
  const [quickPostContent, setQuickPostContent] = useState('');
  const [quickPostVisibility, setQuickPostVisibility] = useState<'public' | 'community_only' | 'private'>('public');
  const [quickAttachment, setQuickAttachment] = useState<ProcessedFile | null>(null);
  const [isUploadingQuickFile, setIsUploadingQuickFile] = useState(false);
  const [isSubmittingQuick, setIsSubmittingQuick] = useState(false);

  // Lightbox modal para ver imágenes en grande
  const [lightboxData, setLightboxData] = useState<{
    isOpen: boolean;
    imageUrl?: string;
    title?: string;
    authorName?: string;
  }>({ isOpen: false });

  // Estado para visualización de perfil a pantalla completa
  const [viewingProfileUserId, setViewingProfileUserId] = useState<string | null>(null);

  // Modal para reportar usuario y crear ticket
  const [userToReport, setUserToReport] = useState<{
    id: string;
    name: string;
    username?: string;
    photoURL?: string;
    role?: string;
  } | null>(null);

  const handleOpenUserProfile = (
    authorId: string,
    _authorName?: string,
    _authorUsername?: string,
    _authorPhotoURL?: string
  ) => {
    setViewingProfileUserId(authorId);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleReportUser = (reported: {
    id: string;
    name: string;
    username?: string;
    photoURL?: string;
    role?: string;
  }) => {
    setUserToReport(reported);
  };

  // Mensaje flotante de notificación
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // 1. Cargar publicaciones reales en tiempo real desde Firestore (omitiendo posts falsos/seed)
  useEffect(() => {
    setIsLoading(true);
    const postsRef = collection(db, 'community_posts');
    const q = query(postsRef, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const fetchedPosts: CommunityPost[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data() as CommunityPost;
          // Filtrar cualquier post de prueba o semilla falsa anterior
          if (!data.id.startsWith('seed-post-')) {
            fetchedPosts.push({
              ...data,
              id: docSnap.id,
              likes: Array.isArray(data.likes) ? data.likes : [],
              likesCount: typeof data.likesCount === 'number' ? data.likesCount : (data.likes?.length || 0),
              commentsCount: typeof data.commentsCount === 'number' ? data.commentsCount : 0,
              sharesCount: typeof data.sharesCount === 'number' ? data.sharesCount : 0,
            });
          }
        });

        // Ordenar por fecha descendente
        fetchedPosts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setPosts(fetchedPosts);
        setIsLoading(false);
      },
      (err) => {
        console.warn('Error en snapshot de community_posts:', err);
        handleFirestoreError(err, OperationType.GET, 'community_posts');
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // 2. Cargar comentarios en tiempo real para las publicaciones
  useEffect(() => {
    const commentsRef = collection(db, 'post_comments');
    const q = query(commentsRef, orderBy('createdAt', 'asc'));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const grouped: Record<string, PostComment[]> = {};
        snapshot.forEach((docSnap) => {
          const data = docSnap.data() as PostComment;
          if (!grouped[data.postId]) grouped[data.postId] = [];
          grouped[data.postId].push({ ...data, id: docSnap.id });
        });
        setPostComments(grouped);
      },
      (err) => {
        console.warn('Error cargando comentarios:', err);
      }
    );

    return () => unsubscribe();
  }, []);

  // Función unificada para publicar una nueva publicación con archivo del dispositivo
  const handleCreatePost = async (params: {
    content: string;
    attachment?: ProcessedFile | null;
    visibility: 'public' | 'community_only' | 'private';
  }) => {
    if (!user) {
      signInWithGoogle();
      return;
    }

    const newPostId = `post_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const postDocRef = doc(db, 'community_posts', newPostId);

    // Extraer hashtags del contenido (#ejemplo)
    const detectedTags = (params.content.match(/#[\w\u00C0-\u017F]+/g) || []).map((t) =>
      t.substring(1).toLowerCase()
    );

    const postPayload: Record<string, any> = {
      id: newPostId,
      authorId: user.uid,
      authorName: profile?.displayName || user.displayName || 'Creador NexStudio',
      authorUsername: profile?.username || user.email?.split('@')[0] || 'creador',
      authorPhotoURL: profile?.photoURL || user.photoURL || `https://api.dicebear.com/7.x/identicon/svg?seed=${user.uid}`,
      authorRole: isAdmin ? 'SuperAdmin' : (profile?.role || 'Creador Digital'),
      content: params.content,
      visibility: params.visibility || 'public',
      likes: [],
      likesCount: 0,
      commentsCount: 0,
      sharesCount: 0,
      createdAt: new Date().toISOString(),
    };

    if (params.attachment?.dataUrl) {
      postPayload.attachmentUrl = params.attachment.dataUrl;
    }
    if (params.attachment?.name) {
      postPayload.attachmentName = params.attachment.name;
    }
    if (params.attachment?.type) {
      postPayload.attachmentType = params.attachment.type;
    }
    if (typeof params.attachment?.size === 'number') {
      postPayload.attachmentSize = params.attachment.size;
    }
    if (detectedTags.length > 0) {
      postPayload.tags = detectedTags;
    }

    const newPost = removeUndefinedFields(postPayload) as CommunityPost;

    try {
      await setDoc(postDocRef, newPost);
      showToast('¡Publicación compartida con éxito en la comunidad!');
    } catch (err) {
      console.error('Error al crear publicación en Firestore:', err);
      handleFirestoreError(err, OperationType.WRITE, `community_posts/${newPostId}`);
      // Agregar en estado local como fallback para experiencia fluida
      setPosts((prev) => [newPost, ...prev]);
      showToast('Publicación creada localmente.');
    }
  };

  // Manejar envío del publicador rápido del feed
  const handleQuickSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = quickPostContent.trim();
    if (!trimmed && !quickAttachment) return;

    setIsSubmittingQuick(true);
    try {
      await handleCreatePost({
        content: trimmed,
        attachment: quickAttachment,
        visibility: quickPostVisibility,
      });
      setQuickPostContent('');
      setQuickAttachment(null);
    } finally {
      setIsSubmittingQuick(false);
    }
  };

  // Subir archivo desde dispositivo en el compositor rápido
  const handleQuickFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingQuickFile(true);
    try {
      const processed = await processDeviceFile(file);
      setQuickAttachment(processed);
    } catch (err: any) {
      alert(err.message || 'Error al procesar el archivo del dispositivo.');
    } finally {
      setIsUploadingQuickFile(false);
      if (e.target) e.target.value = '';
    }
  };

  // Manejador de Likes con persistencia en Firestore
  const handleToggleLike = async (postId: string) => {
    if (!user) {
      signInWithGoogle();
      return;
    }

    const post = posts.find((p) => p.id === postId);
    if (!post) return;

    const alreadyLiked = post.likes.includes(user.uid);
    const updatedLikes = alreadyLiked
      ? post.likes.filter((uid) => uid !== user.uid)
      : [...post.likes, user.uid];

    const updatedCount = updatedLikes.length;

    // Actualización optimista local
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId ? { ...p, likes: updatedLikes, likesCount: updatedCount } : p
      )
    );

    try {
      const postRef = doc(db, 'community_posts', postId);
      await updateDoc(postRef, {
        likes: updatedLikes,
        likesCount: updatedCount,
      });
    } catch (err) {
      console.warn('Error actualizando like en Firestore:', err);
    }
  };

  // Manejador para compartir publicación
  const handleShare = async (post: CommunityPost) => {
    const shareUrl = `${window.location.origin}?view=comunidad#${post.id}`;
    const shareText = `"${post.content.substring(0, 100)}..." por ${post.authorName} en NexStudio`;

    if (navigator.clipboard) {
      await navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
      showToast('¡Enlace de la publicación copiado al portapapeles!');
    }

    const updatedShares = (post.sharesCount || 0) + 1;
    setPosts((prev) =>
      prev.map((p) => (p.id === post.id ? { ...p, sharesCount: updatedShares } : p))
    );

    try {
      const postRef = doc(db, 'community_posts', post.id);
      await updateDoc(postRef, { sharesCount: updatedShares });
    } catch (e) {}
  };

  // Manejador para eliminar publicación
  const handleDeletePost = async (postId: string) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar esta publicación?')) return;

    setPosts((prev) => prev.filter((p) => p.id !== postId));
    try {
      await deleteDoc(doc(db, 'community_posts', postId));
      showToast('Publicación eliminada correctamente.');
    } catch (err) {
      console.error('Error eliminando publicación:', err);
      handleFirestoreError(err, OperationType.DELETE, `community_posts/${postId}`);
    }
  };

  // Manejador para agregar comentario
  const handleAddComment = async (postId: string, text: string) => {
    if (!user) return;

    const commentId = `comment_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const commentRef = doc(db, 'post_comments', commentId);

    const commentPayload: Record<string, any> = {
      id: commentId,
      postId,
      authorId: user.uid,
      authorName: profile?.displayName || user.displayName || 'Usuario NexStudio',
      authorUsername: profile?.username || user.email?.split('@')[0] || 'usuario',
      authorPhotoURL: profile?.photoURL || user.photoURL || `https://api.dicebear.com/7.x/identicon/svg?seed=${user.uid}`,
      content: text,
      createdAt: new Date().toISOString(),
    };

    const newComment = removeUndefinedFields(commentPayload) as PostComment;

    try {
      await setDoc(commentRef, newComment);
      const targetPost = posts.find((p) => p.id === postId);
      if (targetPost) {
        const postRef = doc(db, 'community_posts', postId);
        await updateDoc(postRef, {
          commentsCount: (targetPost.commentsCount || 0) + 1,
        });
      }
      showToast('Respuesta publicada.');
    } catch (err) {
      console.error('Error al agregar comentario:', err);
      handleFirestoreError(err, OperationType.WRITE, `post_comments/${commentId}`);
    }
  };

  // Manejador para eliminar comentario
  const handleDeleteComment = async (postId: string, commentId: string) => {
    try {
      await deleteDoc(doc(db, 'post_comments', commentId));
      const targetPost = posts.find((p) => p.id === postId);
      if (targetPost && targetPost.commentsCount > 0) {
        const postRef = doc(db, 'community_posts', postId);
        await updateDoc(postRef, {
          commentsCount: Math.max(0, targetPost.commentsCount - 1),
        });
      }
      showToast('Comentario eliminado.');
    } catch (err) {
      console.error('Error al eliminar comentario:', err);
    }
  };

  // Publicaciones creadas por el usuario autenticado
  const userPosts = useMemo(() => {
    if (!user) return [];
    return posts.filter((p) => p.authorId === user.uid);
  }, [posts, user]);

  // Filtrado de publicaciones visibles en el feed
  const filteredFeedPosts = useMemo(() => {
    return posts.filter((post) => {
      // Si la publicación es privada, solo la ve el autor o el admin
      if (post.visibility === 'private' && post.authorId !== user?.uid && !isAdmin) {
        return false;
      }
      // Si es solo para la comunidad y no ha iniciado sesión
      if (post.visibility === 'community_only' && !user) {
        return false;
      }

      // Filtro por etiqueta
      if (selectedTag) {
        const hasTag = post.tags?.some((t) => t.toLowerCase() === selectedTag.toLowerCase());
        if (!hasTag) return false;
      }

      // Filtro por búsqueda
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchText = post.content.toLowerCase().includes(q);
        const matchAuthor = post.authorName.toLowerCase().includes(q) || (post.authorUsername && post.authorUsername.toLowerCase().includes(q));
        const matchFile = post.attachmentName?.toLowerCase().includes(q);
        return matchText || matchAuthor || matchFile;
      }

      return true;
    });
  }, [posts, user, isAdmin, selectedTag, searchQuery]);

  // Hashtags populares
  const popularTags = useMemo(() => {
    const counts: Record<string, number> = {};
    posts.forEach((p) => {
      p.tags?.forEach((t) => {
        counts[t] = (counts[t] || 0) + 1;
      });
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([tag]) => tag);
  }, [posts]);

  // Si se está visualizando el perfil a pantalla completa de cualquier creador
  if (viewingProfileUserId) {
    return (
      <div className="w-full min-h-screen bg-slate-50/50">
        <CommunityFullProfileView
          userId={viewingProfileUserId}
          onBack={() => {
            setViewingProfileUserId(null);
            setActiveTab('feed');
          }}
          onReportUser={handleReportUser}
          allPosts={posts}
          postComments={postComments}
          onLikePost={handleToggleLike}
          onSharePost={handleShare}
          onDeletePost={handleDeletePost}
          onAddComment={handleAddComment}
          onDeleteComment={handleDeleteComment}
          onOpenLightbox={(url, title, author) =>
            setLightboxData({ isOpen: true, imageUrl: url, title, authorName: author })
          }
          onFilterTag={(tag) => {
            setViewingProfileUserId(null);
            setActiveTab('feed');
            setSelectedTag(tag);
          }}
          onPublishPost={handleCreatePost}
        />

        {/* Modal para Reportar Usuario y Crear Ticket Oficial */}
        <ReportUserModal
          isOpen={!!userToReport}
          onClose={() => setUserToReport(null)}
          reportedUser={userToReport}
        />

        {/* Lightbox para vista en grande de imágenes */}
        <CommunityMediaModal
          isOpen={lightboxData.isOpen}
          onClose={() => setLightboxData({ isOpen: false })}
          imageUrl={lightboxData.imageUrl}
          title={lightboxData.title}
          authorName={lightboxData.authorName}
        />
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-slate-50/50 px-3 sm:px-6 lg:px-10 py-6 text-slate-800 animate-in fade-in duration-300">
      {/* Toast flotante */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-20 right-6 z-50 px-4 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-semibold shadow-xl border border-slate-700 flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Lightbox para vista en grande de imágenes */}
      <CommunityMediaModal
        isOpen={lightboxData.isOpen}
        onClose={() => setLightboxData({ isOpen: false })}
        imageUrl={lightboxData.imageUrl}
        title={lightboxData.title}
        authorName={lightboxData.authorName}
      />

      {/* Barra Superior Completa */}
      <header className="w-full flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 pb-6 mb-6 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <button
            type="button"
            id="btn-back-to-workspace"
            onClick={onBack}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors cursor-pointer min-h-[40px] shadow-xs"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Volver a Inicio</span>
          </button>

          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-indigo-600 animate-pulse" />
              <span>Comunidad NexStudio</span>
            </h1>
            <p className="text-xs text-slate-500 hidden sm:block">
              Espacio social a pantalla completa para compartir archivos reales y conectar con creadores.
            </p>
          </div>
        </div>

        {/* PESTAÑAS PRINCIPALES: EXPLORAR FEED vs MI PERFIL & PUBLICAR */}
        <div className="flex items-center gap-2 bg-slate-200/80 p-1 rounded-2xl">
          <button
            type="button"
            id="tab-comunidad-feed"
            onClick={() => setActiveTab('feed')}
            className={`flex-1 sm:flex-initial px-5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center justify-center gap-2 min-h-[38px] ${
              activeTab === 'feed'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Globe className="w-4 h-4 text-indigo-600" />
            <span>Explorar Feed ({posts.length})</span>
          </button>

          <button
            type="button"
            id="tab-comunidad-profile"
            onClick={() => {
              if (!user) {
                signInWithGoogle();
                return;
              }
              setViewingProfileUserId(user.uid);
            }}
            className="flex-1 sm:flex-initial px-5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center justify-center gap-2 min-h-[38px] text-slate-600 hover:text-slate-900"
          >
            <User className="w-4 h-4 text-indigo-600" />
            <span>Mi Perfil & Repositorios</span>
          </button>
        </div>
      </header>

      {/* CONTENIDO SEGÚN LA PESTAÑA SELECCIONADA */}
      {activeTab === 'profile' ? (
        /* PESTAÑA EXCLUSIVA: PERFIL, BANNER, VISIBILIDAD, PUBLICADOR Y TUS POSTS */
        user ? (
          <div className="w-full">
            <CommunityProfileTab
              userPosts={userPosts}
              onPublishPost={handleCreatePost}
              onLikePost={handleToggleLike}
              onSharePost={handleShare}
              onDeletePost={handleDeletePost}
              onAddComment={handleAddComment}
              onDeleteComment={handleDeleteComment}
              postComments={postComments}
              onOpenLightbox={(url, title, author) =>
                setLightboxData({ isOpen: true, imageUrl: url, title, authorName: author })
              }
              onOpenProfile={handleOpenUserProfile}
            />
          </div>
        ) : (
          /* Invitación a iniciar sesión si no está autenticado */
          <div className="w-full py-20 text-center rounded-3xl bg-white border border-slate-200 p-8 shadow-xs max-w-2xl mx-auto">
            <User className="w-16 h-16 text-indigo-600 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-slate-900 mb-2">
              Inicia sesión para acceder a tu perfil y publicar
            </h3>
            <p className="text-sm text-slate-500 mb-6">
              Personaliza tu banner de creador, gestiona tu visibilidad y comparte archivos directamente desde tu dispositivo.
            </p>
            <button
              type="button"
              id="btn-login-to-profile"
              onClick={signInWithGoogle}
              className="px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-md shadow-indigo-600/20 transition-all cursor-pointer inline-flex items-center gap-2"
            >
              <LogIn className="w-4 h-4" />
              <span>Iniciar Sesión con Google</span>
            </button>
          </div>
        )
      ) : (
        /* PESTAÑA EXPLORAR: FEED GLOBAL ADAPTADO A TODA LA PANTALLA */
        <div className="w-full space-y-6">
          {/* Compositor Rápido para usuarios autenticados (opcional en el feed) */}
          {user ? (
            <div className="w-full p-4 sm:p-6 rounded-2xl bg-white border border-slate-200 shadow-xs text-left">
              <div className="flex items-start gap-3">
                <img
                  src={profile?.photoURL || user.photoURL || `https://api.dicebear.com/7.x/identicon/svg?seed=${user.uid}`}
                  alt={user.displayName || 'Usuario'}
                  className="w-10 h-10 rounded-xl object-cover border border-slate-200 bg-slate-100 shrink-0"
                  referrerPolicy="no-referrer"
                />
                <div className="flex-1 min-w-0">
                  <textarea
                    value={quickPostContent}
                    onChange={(e) => setQuickPostContent(e.target.value)}
                    placeholder="¿Qué estás creando? Comparte una reflexión o sube fotos/archivos de tu dispositivo..."
                    rows={2}
                    maxLength={800}
                    className="w-full text-sm text-slate-800 placeholder-slate-400 bg-transparent border-none focus:outline-none resize-none leading-relaxed"
                  />

                  {/* Previsualización en grande del archivo seleccionado en el compositor rápido */}
                  {quickAttachment && (
                    <div className="mt-3 p-3 rounded-xl bg-slate-50 border border-slate-200">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          {quickAttachment.name} ({formatFileSize(quickAttachment.size)})
                        </span>
                        <button
                          type="button"
                          onClick={() => setQuickAttachment(null)}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors cursor-pointer"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      {quickAttachment.type === 'image' && (
                        <div className="max-h-[300px] overflow-hidden rounded-lg bg-slate-900 flex items-center justify-center">
                          <img
                            src={quickAttachment.dataUrl}
                            alt="Previsualización"
                            className="max-h-[300px] w-auto object-contain"
                          />
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex flex-wrap items-center justify-between gap-3 pt-3 mt-2 border-t border-slate-100">
                    <div className="flex items-center gap-2">
                      <label 
                        className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer min-h-[36px]"
                        title="Subir fotos o archivos exclusivamente desde tu dispositivo"
                      >
                        <FileUp className="w-4 h-4 text-indigo-600" />
                        <span>Subir desde dispositivo</span>
                        <input
                          type="file"
                          className="hidden"
                          onChange={handleQuickFileUpload}
                          disabled={isUploadingQuickFile}
                        />
                      </label>

                      <select
                        value={quickPostVisibility}
                        onChange={(e) => setQuickPostVisibility(e.target.value as any)}
                        className="px-2.5 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 border border-slate-200 rounded-xl focus:outline-none min-h-[36px] cursor-pointer"
                      >
                        <option value="public">🌍 Pública</option>
                        <option value="community_only">👥 Solo Comunidad</option>
                        <option value="private">🔒 Privada</option>
                      </select>
                    </div>

                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setActiveTab('profile')}
                        className="text-xs font-semibold text-indigo-600 hover:underline cursor-pointer hidden sm:inline"
                      >
                        Ir a Personalizar Banner y Perfil →
                      </button>

                      <button
                        type="button"
                        onClick={handleQuickSubmit}
                        disabled={isSubmittingQuick || (!quickPostContent.trim() && !quickAttachment)}
                        className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold transition-all cursor-pointer min-h-[36px] flex items-center gap-1.5 shadow-sm"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>{isSubmittingQuick ? 'Publicando...' : 'Publicar'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Banner invitando a unirse */
            <div className="w-full p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-indigo-50 via-sky-50 to-white border border-indigo-100 flex flex-col sm:flex-row items-center justify-between gap-4 text-left">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  ¿Quieres publicar y subir tus propios archivos y proyectos?
                </h3>
                <p className="text-xs text-slate-600 mt-0.5">
                  Inicia sesión con Google para personalizar tu perfil, cambiar tu banner y compartir en la comunidad.
                </p>
              </div>
              <button
                type="button"
                onClick={signInWithGoogle}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all cursor-pointer min-h-[38px] flex items-center gap-2 shrink-0 shadow-xs"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Iniciar Sesión con Google</span>
              </button>
            </div>
          )}

          {/* Barra de Filtros y Búsqueda */}
          <div className="w-full flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por texto, usuario o archivos..."
                className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm text-slate-800 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {selectedTag && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-indigo-50 border border-indigo-200 text-xs font-bold text-indigo-700">
                <span>Tag: #{selectedTag}</span>
                <button
                  type="button"
                  onClick={() => setSelectedTag(null)}
                  className="hover:text-rose-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          {/* Hashtags Populares */}
          {popularTags.length > 0 && (
            <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
              <span className="text-slate-400 font-bold uppercase text-[10px] shrink-0">
                Tendencias:
              </span>
              {popularTags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => setSelectedTag(tag === selectedTag ? null : tag)}
                  className={`px-3 py-1 rounded-lg font-semibold shrink-0 transition-colors cursor-pointer ${
                    selectedTag === tag
                      ? 'bg-indigo-600 text-white font-bold'
                      : 'bg-white border border-slate-200 text-slate-600 hover:border-slate-300'
                  }`}
                >
                  #{tag}
                </button>
              ))}
            </div>
          )}

          {/* LISTA DE PUBLICACIONES REALES (ADAPTADAS A TODA LA PANTALLA) */}
          <div className="w-full space-y-4">
            {isLoading ? (
              <div className="w-full py-20 text-center">
                <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <p className="text-xs text-slate-500 font-medium">
                  Cargando publicaciones reales de la comunidad...
                </p>
              </div>
            ) : filteredFeedPosts.length === 0 ? (
              /* Estado vacío limpio: SIN publicaciones de mentira */
              <div className="w-full py-20 text-center rounded-3xl bg-white border border-slate-200 p-8 shadow-xs">
                <MessageCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h3 className="text-base font-bold text-slate-800 mb-1">
                  Aún no hay publicaciones en la comunidad
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto mb-6">
                  ¡Sé el primero en compartir un proyecto, capturas o archivos subidos directamente desde tu dispositivo!
                </p>
                {user ? (
                  <button
                    type="button"
                    id="btn-first-publish"
                    onClick={() => setActiveTab('profile')}
                    className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md transition-all cursor-pointer inline-flex items-center gap-2"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Crear Primera Publicación</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={signInWithGoogle}
                    className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-all cursor-pointer inline-flex items-center gap-2"
                  >
                    <LogIn className="w-3.5 h-3.5" />
                    <span>Inicia sesión para publicar</span>
                  </button>
                )}
              </div>
            ) : (
              filteredFeedPosts.map((post) => (
                <CommunityPostCard
                  key={post.id}
                  post={post}
                  onLike={handleToggleLike}
                  onShare={handleShare}
                  onDelete={handleDeletePost}
                  onAddComment={handleAddComment}
                  onDeleteComment={handleDeleteComment}
                  comments={postComments[post.id] || []}
                  onOpenLightbox={(url, title, author) =>
                    setLightboxData({ isOpen: true, imageUrl: url, title, authorName: author })
                  }
                  onFilterTag={(tag) => setSelectedTag(tag)}
                  onOpenProfile={handleOpenUserProfile}
                />
              ))
            )}
          </div>
        </div>
      )}

      {/* Modal para Reportar Usuario y Crear Ticket Oficial */}
      <ReportUserModal
        isOpen={!!userToReport}
        onClose={() => setUserToReport(null)}
        reportedUser={userToReport}
      />
    </div>
  );
};
