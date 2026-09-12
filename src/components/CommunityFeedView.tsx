import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowLeft,
  MessageCircle,
  Heart,
  Share2,
  Send,
  Sparkles,
  FolderKanban,
  CheckCircle,
  ShieldCheck,
  X,
  Trash2,
  Search,
  Filter,
  Flame,
  LogIn,
  Layers,
  Copy,
  ExternalLink,
  ChevronDown
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useAdmin } from '../context/AdminContext';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
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
import { CommunityPost, PostComment, AdminProject } from '../types';
import { ProjectDetailView } from './ProjectDetailView';
import { DownloadModal } from './DownloadModal';

interface CommunityFeedViewProps {
  onBack: () => void;
}

// Semilla de publicaciones iniciales si Firestore está recién inicializado
const SEED_POSTS: CommunityPost[] = [
  {
    id: 'seed-post-1',
    authorId: 'allnexuslzyt_official',
    authorName: 'Nexus Admin',
    authorUsername: 'allnexuslzyt',
    authorPhotoURL: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    authorRole: 'SuperAdmin',
    content: '¡Bienvenidos al nuevo espacio social de NexStudio! 🚀 Aquí puedes compartir el avance de tus proyectos, descubrir creaciones de otros miembros y dejar tus comentarios y sugerencias.',
    projectId: 'p1',
    projectTitle: 'Proyecto 1: Asistente Web En HTML',
    projectCategory: 'Inteligencia Artificial',
    projectTag: 'Oficial',
    likes: ['allnexuslzyt_official'],
    likesCount: 12,
    commentsCount: 2,
    sharesCount: 5,
    createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
    tags: ['nexstudio', 'bienvenida', 'proyectos'],
  },
  {
    id: 'seed-post-2',
    authorId: 'creator_sofia',
    authorName: 'Sofía Martínez',
    authorUsername: 'sofia_code',
    authorPhotoURL: 'https://api.dicebear.com/7.x/identicon/svg?seed=sofia_code',
    authorRole: 'Creador Digital',
    content: 'Acabo de probar el Asistente Web en HTML y las descargas en un clic. La interfaz está súper cuidada y la navegación es instantánea. ¡Deseando ver qué nuevas utilidades se vienen! ✨ #nexstudio #diseño',
    likes: [],
    likesCount: 7,
    commentsCount: 1,
    sharesCount: 2,
    createdAt: new Date(Date.now() - 3600000 * 12).toISOString(),
    tags: ['feedback', 'creadores'],
  }
];

export const CommunityFeedView: React.FC<CommunityFeedViewProps> = ({ onBack }) => {
  const { user, profile, isAdmin, signInWithGoogle } = useAuth();
  const { projects } = useAdmin();

  // Estados principales
  const [posts, setPosts] = useState<CommunityPost[]>(SEED_POSTS);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'todos' | 'proyectos' | 'mis_posts'>('todos');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  // Estado del creador de publicaciones
  const [newContent, setNewContent] = useState<string>('');
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [projectSelectorOpen, setProjectSelectorOpen] = useState<boolean>(false);

  // Estados para ver detalle de proyecto desde un post
  const [viewingProjectId, setViewingProjectId] = useState<string | null>(null);
  const [downloadTarget, setDownloadTarget] = useState<{
    isOpen: boolean;
    title: string;
    url: string;
    waitTime: number;
  }>({
    isOpen: false,
    title: '',
    url: '',
    waitTime: 3,
  });

  // Estado de comentarios expandidos por post ID
  const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({});
  const [postComments, setPostComments] = useState<Record<string, PostComment[]>>({
    'seed-post-1': [
      {
        id: 'c1',
        postId: 'seed-post-1',
        authorId: 'carlos_m',
        authorName: 'Carlos M.',
        authorUsername: 'carlosm',
        authorPhotoURL: 'https://api.dicebear.com/7.x/identicon/svg?seed=carlosm',
        content: '¡Gran trabajo con esta comunidad! Ya tenía ganas de poder interactuar por aquí.',
        createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
      },
      {
        id: 'c2',
        postId: 'seed-post-1',
        authorId: 'allnexuslzyt_official',
        authorName: 'Nexus Admin',
        authorUsername: 'allnexuslzyt',
        authorPhotoURL: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        content: '¡Gracias a todos por el apoyo constante! Seguiremos mejorando.',
        createdAt: new Date(Date.now() - 3600000 * 1).toISOString(),
      }
    ],
    'seed-post-2': [
      {
        id: 'c3',
        postId: 'seed-post-2',
        authorId: 'laura_dev',
        authorName: 'Laura G.',
        authorUsername: 'lauradev',
        content: '¡Totalmente de acuerdo Sofía! La respuesta táctil se siente genial.',
        createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
      }
    ]
  });
  const [newCommentText, setNewCommentText] = useState<Record<string, string>>({});
  const [submittingComment, setSubmittingComment] = useState<Record<string, boolean>>({});

  // Toast de notificación
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Sincronización en tiempo real de publicaciones desde Firestore
  useEffect(() => {
    let unsubscribe: (() => void) | null = null;
    const postsRef = collection(db, 'community_posts');

    try {
      unsubscribe = onSnapshot(
        postsRef,
        (snapshot) => {
          if (!snapshot.empty) {
            const fetchedPosts = snapshot.docs.map((docSnap) => {
              const data = docSnap.data();
              return {
                id: docSnap.id,
                authorId: data.authorId || '',
                authorName: data.authorName || 'Usuario',
                authorUsername: data.authorUsername || 'usuario',
                authorPhotoURL: data.authorPhotoURL || '',
                authorRole: data.authorRole || '',
                content: data.content || '',
                projectId: data.projectId || '',
                projectTitle: data.projectTitle || '',
                projectCategory: data.projectCategory || '',
                projectTag: data.projectTag || '',
                projectLink: data.projectLink || '',
                likes: Array.isArray(data.likes) ? data.likes : [],
                likesCount: typeof data.likesCount === 'number' ? data.likesCount : (data.likes?.length || 0),
                commentsCount: typeof data.commentsCount === 'number' ? data.commentsCount : 0,
                sharesCount: typeof data.sharesCount === 'number' ? data.sharesCount : 0,
                createdAt: data.createdAt || new Date().toISOString(),
                tags: Array.isArray(data.tags) ? data.tags : [],
              } as CommunityPost;
            });

            // Ordenar por fecha descendente
            fetchedPosts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            setPosts(fetchedPosts);
          } else {
            // Si la colección está vacía en Firestore, guardar las semillas en Firestore
            setPosts(SEED_POSTS);
          }
          setLoading(false);
        },
        (error) => {
          console.warn('Firestore onSnapshot community_posts error (usando fallback local):', error);
          setLoading(false);
        }
      );
    } catch (e) {
      console.warn('Error configurando listener de comunidad:', e);
      setLoading(false);
    }

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  // Escuchar comentarios para un post cuando se expande
  const toggleComments = async (postId: string) => {
    const nextState = !expandedComments[postId];
    setExpandedComments((prev) => ({ ...prev, [postId]: nextState }));

    if (nextState) {
      try {
        const commentsRef = collection(db, 'community_posts', postId, 'comments');
        const snap = await getDocs(commentsRef);
        if (!snap.empty) {
          const list: PostComment[] = snap.docs.map((docSnap) => {
            const data = docSnap.data();
            return {
              id: docSnap.id,
              postId,
              authorId: data.authorId || '',
              authorName: data.authorName || 'Usuario',
              authorUsername: data.authorUsername || 'usuario',
              authorPhotoURL: data.authorPhotoURL || '',
              content: data.content || '',
              createdAt: data.createdAt || new Date().toISOString(),
            };
          });
          list.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
          setPostComments((prev) => ({ ...prev, [postId]: list }));
        }
      } catch (e) {
        console.warn('No se pudieron obtener comentarios de Firestore:', e);
      }
    }
  };

  // Crear una nueva publicación (solo usuarios que han iniciado sesión)
  const handlePublishPost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      showToast('Debes iniciar sesión con Google para publicar.');
      return;
    }

    const trimmed = newContent.trim();
    if (!trimmed) return;

    setIsSubmitting(true);
    const newPostId = `post_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    
    // Si hay un proyecto adjunto seleccionado
    const attachedProject = selectedProjectId 
      ? projects.find((p) => p.id === selectedProjectId)
      : null;

    // Detectar hashtags en el texto
    const hashtags = (trimmed.match(/#[a-zA-Z0-9_]+/g) || []).map((t) => t.substring(1).toLowerCase());

    const postPayload: CommunityPost = {
      id: newPostId,
      authorId: user.uid,
      authorName: profile?.displayName || user.displayName || 'Usuario NexStudio',
      authorUsername: profile?.username || user.email?.split('@')[0] || 'usuario',
      authorPhotoURL: profile?.photoURL || user.photoURL || `https://api.dicebear.com/7.x/identicon/svg?seed=${user.uid}`,
      authorRole: profile?.role || (isAdmin ? 'SuperAdmin' : 'Creador Digital'),
      content: trimmed,
      projectId: attachedProject?.id || '',
      projectTitle: attachedProject?.title || '',
      projectCategory: attachedProject?.category || '',
      projectTag: attachedProject?.tag || '',
      projectLink: attachedProject?.downloadUrl || '',
      likes: [],
      likesCount: 0,
      commentsCount: 0,
      sharesCount: 0,
      createdAt: new Date().toISOString(),
      tags: hashtags,
    };

    // Actualización optimista local
    setPosts((prev) => [postPayload, ...prev]);
    setNewContent('');
    setSelectedProjectId('');
    setProjectSelectorOpen(false);

    try {
      const docRef = doc(db, 'community_posts', newPostId);
      await setDoc(docRef, postPayload);
      showToast('¡Publicación compartida con la comunidad!');
    } catch (err) {
      console.warn('Error guardando publicación en Firestore:', err);
      showToast('Publicado localmente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Acción de Like / Me gusta
  const handleToggleLike = async (postId: string) => {
    if (!user) {
      showToast('Inicia sesión con Google para dar Me Gusta.');
      return;
    }

    const currentPost = posts.find((p) => p.id === postId);
    if (!currentPost) return;

    const hasLiked = currentPost.likes.includes(user.uid);
    const updatedLikes = hasLiked
      ? currentPost.likes.filter((uid) => uid !== user.uid)
      : [...currentPost.likes, user.uid];
    const newCount = updatedLikes.length;

    // Actualización optimista
    setPosts((prev) =>
      prev.map((p) => (p.id === postId ? { ...p, likes: updatedLikes, likesCount: newCount } : p))
    );

    try {
      const postRef = doc(db, 'community_posts', postId);
      await updateDoc(postRef, {
        likes: updatedLikes,
        likesCount: newCount,
      });
    } catch (err) {
      console.warn('Error actualizando like en Firestore:', err);
    }
  };

  // Acción de Compartir / Repost
  const handleSharePost = async (post: CommunityPost) => {
    // Incrementar contador de compartidos
    const updatedShares = (post.sharesCount || 0) + 1;
    setPosts((prev) =>
      prev.map((p) => (p.id === post.id ? { ...p, sharesCount: updatedShares } : p))
    );

    try {
      const postRef = doc(db, 'community_posts', post.id);
      await updateDoc(postRef, {
        sharesCount: updatedShares,
      });
    } catch (err) {
      console.warn('Error actualizando shares en Firestore:', err);
    }

    // Copiar enlace al portapapeles
    const shareUrl = `${window.location.origin}/#comunidad-${post.id}`;
    if (navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(`"${post.content}" - ${post.authorName} en NexStudio: ${shareUrl}`);
        showToast('¡Enlace y cita del post copiados al portapapeles!');
        return;
      } catch (e) {}
    }
    showToast('¡Publicación compartida con éxito!');
  };

  // Publicar un nuevo comentario
  const handleAddComment = async (postId: string) => {
    if (!user) {
      showToast('Debes iniciar sesión con Google para comentar.');
      return;
    }

    const text = (newCommentText[postId] || '').trim();
    if (!text) return;

    setSubmittingComment((prev) => ({ ...prev, [postId]: true }));

    const commentId = `comment_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const commentPayload: PostComment = {
      id: commentId,
      postId,
      authorId: user.uid,
      authorName: profile?.displayName || user.displayName || 'Usuario NexStudio',
      authorUsername: profile?.username || user.email?.split('@')[0] || 'usuario',
      authorPhotoURL: profile?.photoURL || user.photoURL || `https://api.dicebear.com/7.x/identicon/svg?seed=${user.uid}`,
      content: text,
      createdAt: new Date().toISOString(),
    };

    // Optimista
    setPostComments((prev) => ({
      ...prev,
      [postId]: [...(prev[postId] || []), commentPayload],
    }));
    setPosts((prev) =>
      prev.map((p) => (p.id === postId ? { ...p, commentsCount: (p.commentsCount || 0) + 1 } : p))
    );
    setNewCommentText((prev) => ({ ...prev, [postId]: '' }));

    try {
      const commentRef = doc(db, 'community_posts', postId, 'comments', commentId);
      await setDoc(commentRef, commentPayload);

      // Actualizar contador en post
      const postRef = doc(db, 'community_posts', postId);
      const currentPost = posts.find((p) => p.id === postId);
      const nextCount = (currentPost?.commentsCount || 0) + 1;
      await updateDoc(postRef, {
        commentsCount: nextCount,
      });
      showToast('Comentario añadido.');
    } catch (err) {
      console.warn('Error guardando comentario en Firestore:', err);
    } finally {
      setSubmittingComment((prev) => ({ ...prev, [postId]: false }));
    }
  };

  // Eliminar publicación (autor o admin)
  const handleDeletePost = async (postId: string) => {
    if (!confirm('¿Seguro que deseas eliminar esta publicación?')) return;

    // Optimista
    setPosts((prev) => prev.filter((p) => p.id !== postId));

    try {
      const postRef = doc(db, 'community_posts', postId);
      await deleteDoc(postRef);
      showToast('Publicación eliminada.');
    } catch (err) {
      console.warn('Error eliminando publicación de Firestore:', err);
    }
  };

  // Eliminar comentario (autor o admin)
  const handleDeleteComment = async (postId: string, commentId: string) => {
    setPostComments((prev) => ({
      ...prev,
      [postId]: (prev[postId] || []).filter((c) => c.id !== commentId),
    }));
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId ? { ...p, commentsCount: Math.max(0, (p.commentsCount || 1) - 1) } : p
      )
    );

    try {
      const commentRef = doc(db, 'community_posts', postId, 'comments', commentId);
      await deleteDoc(commentRef);
      const postRef = doc(db, 'community_posts', postId);
      const currentPost = posts.find((p) => p.id === postId);
      await updateDoc(postRef, {
        commentsCount: Math.max(0, (currentPost?.commentsCount || 1) - 1),
      });
    } catch (err) {
      console.warn('Error eliminando comentario:', err);
    }
  };

  // Filtrado de publicaciones
  const filteredPosts = useMemo(() => {
    return posts.filter((post) => {
      // Filtro por pestaña
      if (activeTab === 'proyectos' && !post.projectId) return false;
      if (activeTab === 'mis_posts') {
        if (!user) return false;
        if (post.authorId !== user.uid) return false;
      }

      // Filtro por tag seleccionado
      if (selectedTag && (!post.tags || !post.tags.includes(selectedTag))) {
        return false;
      }

      // Filtro por búsqueda de texto
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesContent = post.content.toLowerCase().includes(query);
        const matchesAuthor = post.authorName.toLowerCase().includes(query) || (post.authorUsername && post.authorUsername.toLowerCase().includes(query));
        const matchesProject = post.projectTitle && post.projectTitle.toLowerCase().includes(query);
        const matchesTags = post.tags && post.tags.some((t) => t.toLowerCase().includes(query));
        if (!matchesContent && !matchesAuthor && !matchesProject && !matchesTags) {
          return false;
        }
      }

      return true;
    });
  }, [posts, activeTab, user, selectedTag, searchQuery]);

  // Formateador de tiempo relativo amigable
  const formatTimeAgo = (dateStr: string) => {
    try {
      const past = new Date(dateStr).getTime();
      const now = Date.now();
      const diffSec = Math.max(0, Math.floor((now - past) / 1000));
      if (diffSec < 60) return 'hace unos momentos';
      const diffMin = Math.floor(diffSec / 60);
      if (diffMin < 60) return `hace ${diffMin}m`;
      const diffHours = Math.floor(diffMin / 60);
      if (diffHours < 24) return `hace ${diffHours}h`;
      const diffDays = Math.floor(diffHours / 24);
      if (diffDays < 7) return `hace ${diffDays}d`;
      return new Date(dateStr).toLocaleDateString('es-ES', { month: 'short', day: 'numeric' });
    } catch (e) {
      return 'recientemente';
    }
  };

  // Si se abre el detalle del proyecto desde un post
  if (viewingProjectId) {
    const activeProject = projects.find((p) => p.id === viewingProjectId) || projects[0];
    return (
      <ProjectDetailView
        project={activeProject}
        onBack={() => setViewingProjectId(null)}
      />
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12 animate-in fade-in duration-300">
      {/* Toast Notification Flotante */}
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

      {/* Top Bar with Back Button */}
      <div className="flex items-center justify-between gap-4 mb-6">
        <button
          type="button"
          id="btn-back-from-comunidad"
          onClick={onBack}
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors cursor-pointer min-h-[44px]"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Volver a Inicio</span>
        </button>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 px-3 py-1 rounded-full flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse" />
            <span>Red Social de Creadores</span>
          </span>
        </div>
      </div>

      {/* Header Section */}
      <div className="mb-8 text-left">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 via-violet-600 to-sky-500 flex items-center justify-center text-white shadow-md shadow-indigo-600/20 shrink-0">
            <MessageCircle className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Comunidad NexStudio
            </h1>
            <p className="text-xs sm:text-sm text-slate-600">
              Un espacio al estilo X para compartir proyectos, consultar dudas y reaccionar a creaciones.
            </p>
          </div>
        </div>
      </div>

      {/* Composer Box (Estilo X) */}
      <div className="mb-8 p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
        {user ? (
          <form onSubmit={handlePublishPost} className="space-y-3">
            <div className="flex items-start gap-3">
              {/* Avatar de usuario */}
              <img
                src={profile?.photoURL || user.photoURL || `https://api.dicebear.com/7.x/identicon/svg?seed=${user.uid}`}
                alt={profile?.displayName || user.displayName || 'Usuario'}
                className="w-10 h-10 rounded-xl border border-slate-200 object-cover bg-slate-100 shrink-0 mt-0.5"
                referrerPolicy="no-referrer"
              />

              <div className="flex-1 min-w-0">
                <textarea
                  id="community-composer-textarea"
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  placeholder="¿Qué estás desarrollando o diseñando hoy en NexStudio?"
                  rows={3}
                  maxLength={500}
                  className="w-full text-sm text-slate-800 placeholder-slate-400 bg-transparent border-none focus:outline-none resize-none"
                />

                {/* Vista previa del proyecto adjunto si se ha seleccionado */}
                {selectedProjectId && (
                  <div className="mb-3 p-3 rounded-xl bg-indigo-50/70 border border-indigo-200/80 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="p-1.5 rounded-lg bg-indigo-100 text-indigo-700 shrink-0">
                        <FolderKanban className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-900 truncate">
                          {projects.find((p) => p.id === selectedProjectId)?.title || 'Proyecto Seleccionado'}
                        </p>
                        <p className="text-[10px] text-indigo-700 font-medium">
                          Adjunto a tu publicación
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedProjectId('')}
                      className="p-1 text-slate-400 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
                      title="Quitar proyecto"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Barra de herramientas inferior del compositor */}
            <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
              <div className="relative">
                <button
                  type="button"
                  id="btn-attach-project-toggle"
                  onClick={() => setProjectSelectorOpen(!projectSelectorOpen)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer min-h-[36px] ${
                    selectedProjectId
                      ? 'bg-indigo-100 text-indigo-700 border border-indigo-200'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  <FolderKanban className="w-3.5 h-3.5 text-indigo-600" />
                  <span>{selectedProjectId ? 'Proyecto adjunto' : 'Adjuntar proyecto'}</span>
                  <ChevronDown className="w-3 h-3 text-slate-400" />
                </button>

                {/* Dropdown Selector de Proyectos para adjuntar */}
                {projectSelectorOpen && (
                  <div className="absolute left-0 mt-2 w-72 bg-white border border-slate-200 rounded-xl shadow-xl z-20 p-2 space-y-1 animate-in fade-in zoom-in-95 duration-150">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-2 py-1">
                      Selecciona un proyecto
                    </p>
                    {projects.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => {
                          setSelectedProjectId(p.id);
                          setProjectSelectorOpen(false);
                        }}
                        className={`w-full text-left px-2.5 py-2 rounded-lg text-xs font-medium flex items-center justify-between transition-colors cursor-pointer ${
                          selectedProjectId === p.id
                            ? 'bg-indigo-50 text-indigo-900 font-bold'
                            : 'hover:bg-slate-100 text-slate-800'
                        }`}
                      >
                        <span className="truncate">{p.title}</span>
                        {selectedProjectId === p.id && (
                          <CheckCircle className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3">
                <span className="text-[11px] text-slate-400 font-medium">
                  {500 - newContent.length} caracteres
                </span>

                <button
                  type="submit"
                  id="btn-publish-community-post"
                  disabled={isSubmitting || !newContent.trim()}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs sm:text-sm font-bold shadow-md shadow-indigo-600/20 hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer min-h-[38px]"
                >
                  <span>Publicar</span>
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </form>
        ) : (
          /* Mensaje para usuarios no autenticados */
          <div className="py-4 px-2 text-center flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-left">
              <h3 className="text-sm font-bold text-slate-900">
                Únete a la conversación en NexStudio
              </h3>
              <p className="text-xs text-slate-500">
                Inicia sesión con Google para compartir tus propios proyectos, dar like y comentar.
              </p>
            </div>
            <button
              type="button"
              id="btn-login-for-community"
              onClick={signInWithGoogle}
              className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-sm flex items-center gap-2 cursor-pointer shrink-0 min-h-[40px]"
            >
              <LogIn className="w-3.5 h-3.5 text-amber-400" />
              <span>Iniciar Sesión con Google</span>
            </button>
          </div>
        )}
      </div>

      {/* Barra de Filtros y Búsqueda */}
      <div className="mb-6 space-y-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Pestañas de Feed */}
          <div className="flex items-center p-1 rounded-xl bg-slate-100 border border-slate-200">
            <button
              type="button"
              id="tab-comunidad-todos"
              onClick={() => setActiveTab('todos')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'todos'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Para ti
            </button>
            <button
              type="button"
              id="tab-comunidad-proyectos"
              onClick={() => setActiveTab('proyectos')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'proyectos'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Proyectos Compartidos
            </button>
            {user && (
              <button
                type="button"
                id="tab-comunidad-misposts"
                onClick={() => setActiveTab('mis_posts')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'mis_posts'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Mis Publicaciones
              </button>
            )}
          </div>

          {/* Campo de Búsqueda */}
          <div className="relative flex-1 max-w-xs">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              id="input-search-community"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar posts, proyectos o @usuarios..."
              className="w-full pl-9 pr-3 py-1.5 text-xs text-slate-800 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 min-h-[38px]"
            />
          </div>
        </div>

        {/* Tags de Tendencia */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1 mr-1">
            <Flame className="w-3.5 h-3.5 text-amber-500" />
            Tendencias:
          </span>
          {['nexstudio', 'proyectos', 'diseño', 'bienvenida', 'feedback'].map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
              className={`px-2.5 py-1 rounded-full text-[11px] font-semibold transition-colors cursor-pointer ${
                selectedTag === tag
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              #{tag}
            </button>
          ))}
          {selectedTag && (
            <button
              type="button"
              onClick={() => setSelectedTag(null)}
              className="text-[11px] font-semibold text-rose-600 hover:underline ml-1"
            >
              Limpiar filtro
            </button>
          )}
        </div>
      </div>

      {/* Lista del Feed de Publicaciones */}
      <div className="space-y-4">
        {loading ? (
          <div className="py-12 text-center text-slate-500 text-sm">
            <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            Cargando la comunidad...
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="py-16 text-center rounded-2xl bg-slate-50 border border-slate-200 p-8">
            <MessageCircle className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-800 mb-1">
              No hay publicaciones disponibles
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
              {activeTab === 'mis_posts'
                ? 'Aún no has compartido ninguna publicación. ¡Sé el primero en publicar tu proyecto!'
                : 'No se encontraron publicaciones con los filtros aplicados.'}
            </p>
            {user && (
              <button
                type="button"
                onClick={() => {
                  setActiveTab('todos');
                  setSelectedTag(null);
                  setSearchQuery('');
                }}
                className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-500 transition-colors"
              >
                Ver todo el feed
              </button>
            )}
          </div>
        ) : (
          filteredPosts.map((post) => {
            const hasLiked = user ? post.likes.includes(user.uid) : false;
            const isAuthor = user ? post.authorId === user.uid : false;
            const commentsList = postComments[post.id] || [];
            const isExpanded = Boolean(expandedComments[post.id]);

            return (
              <motion.article
                key={post.id}
                id={`community-post-${post.id}`}
                layout
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 hover:border-slate-300 shadow-xs transition-colors text-left"
              >
                {/* Cabecera del Post: Autor, @username, Badge, Fecha */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={post.authorPhotoURL || `https://api.dicebear.com/7.x/identicon/svg?seed=${post.authorId}`}
                      alt={post.authorName}
                      className="w-10 h-10 rounded-xl object-cover border border-slate-200 bg-slate-100 shrink-0"
                      referrerPolicy="no-referrer"
                    />
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-sm font-bold text-slate-900">
                          {post.authorName}
                        </span>
                        {post.authorRole === 'SuperAdmin' && (
                          <span className="text-[10px] uppercase tracking-wider font-extrabold px-1.5 py-0.2 rounded bg-indigo-100 text-indigo-700 border border-indigo-200 flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3 text-indigo-600" />
                            Admin
                          </span>
                        )}
                        <span className="text-xs text-slate-500">
                          @{post.authorUsername || 'creador'}
                        </span>
                        <span className="text-xs text-slate-400">·</span>
                        <span className="text-xs text-slate-500">
                          {formatTimeAgo(post.createdAt)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Acciones de Autor / Administrador */}
                  {(isAuthor || isAdmin) && (
                    <button
                      type="button"
                      id={`btn-delete-post-${post.id}`}
                      onClick={() => handleDeletePost(post.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                      title="Eliminar publicación"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Contenido del Post */}
                <p className="text-sm text-slate-800 leading-relaxed whitespace-pre-line mb-3">
                  {post.content}
                </p>

                {/* Tags si existen */}
                {post.tags && post.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {post.tags.map((t) => (
                      <span
                        key={t}
                        onClick={() => setSelectedTag(t)}
                        className="text-xs font-semibold text-indigo-600 hover:underline cursor-pointer"
                      >
                        #{t}
                      </span>
                    ))}
                  </div>
                )}

                {/* Tarjeta de Proyecto Adjunto (si existe) */}
                {post.projectId && (
                  <div className="mb-4 p-3.5 rounded-xl bg-slate-50 border border-slate-200 hover:border-indigo-300 transition-colors flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
                        <FolderKanban className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">
                            Proyecto Compartido
                          </span>
                          {post.projectTag && (
                            <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-slate-200 text-slate-700">
                              {post.projectTag}
                            </span>
                          )}
                        </div>
                        <h4 className="text-sm font-bold text-slate-900">
                          {post.projectTitle || 'Proyecto de NexStudio'}
                        </h4>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <button
                        type="button"
                        id={`btn-view-attached-project-${post.projectId}`}
                        onClick={() => setViewingProjectId(post.projectId!)}
                        className="flex-1 sm:flex-initial px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5 min-h-[36px]"
                      >
                        <span>Ver Proyecto</span>
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                )}

                {/* Barra de Acciones: Like, Comentarios, Compartir */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-slate-500 text-xs">
                  {/* Comentarios */}
                  <button
                    type="button"
                    id={`btn-comment-toggle-${post.id}`}
                    onClick={() => toggleComments(post.id)}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg hover:bg-indigo-50 hover:text-indigo-600 transition-colors cursor-pointer min-h-[36px]"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>{post.commentsCount || 0}</span>
                  </button>

                  {/* Me gusta / Like */}
                  <button
                    type="button"
                    id={`btn-like-${post.id}`}
                    onClick={() => handleToggleLike(post.id)}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-all cursor-pointer min-h-[36px] ${
                      hasLiked
                        ? 'text-rose-600 font-bold hover:bg-rose-50'
                        : 'hover:bg-rose-50 hover:text-rose-600'
                    }`}
                  >
                    <Heart className={`w-4 h-4 ${hasLiked ? 'fill-rose-600' : ''}`} />
                    <span>{post.likesCount || 0}</span>
                  </button>

                  {/* Compartir / Repost */}
                  <button
                    type="button"
                    id={`btn-share-${post.id}`}
                    onClick={() => handleSharePost(post)}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg hover:bg-sky-50 hover:text-sky-600 transition-colors cursor-pointer min-h-[36px]"
                  >
                    <Share2 className="w-4 h-4" />
                    <span>{post.sharesCount || 0}</span>
                  </button>
                </div>

                {/* Sección Expandible de Comentarios */}
                {isExpanded && (
                  <div className="mt-4 pt-4 border-t border-slate-100 space-y-3">
                    <p className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Respuestas ({commentsList.length})
                    </p>

                    {/* Lista de comentarios existentes */}
                    {commentsList.length === 0 ? (
                      <p className="text-xs text-slate-400 italic">
                        Sé el primero en responder a esta publicación.
                      </p>
                    ) : (
                      <div className="space-y-2.5">
                        {commentsList.map((comm) => {
                          const canDeleteComm = user && (comm.authorId === user.uid || isAdmin || isAuthor);
                          return (
                            <div
                              key={comm.id}
                              className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-start justify-between gap-2"
                            >
                              <div className="flex items-start gap-2.5">
                                <img
                                  src={comm.authorPhotoURL || `https://api.dicebear.com/7.x/identicon/svg?seed=${comm.authorId}`}
                                  alt={comm.authorName}
                                  className="w-7 h-7 rounded-lg object-cover bg-white border border-slate-200 shrink-0 mt-0.5"
                                  referrerPolicy="no-referrer"
                                />
                                <div>
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-xs font-bold text-slate-900">
                                      {comm.authorName}
                                    </span>
                                    <span className="text-[11px] text-slate-400">
                                      @{comm.authorUsername || 'creador'}
                                    </span>
                                    <span className="text-[10px] text-slate-400">
                                      · {formatTimeAgo(comm.createdAt)}
                                    </span>
                                  </div>
                                  <p className="text-xs text-slate-700 mt-0.5 leading-relaxed">
                                    {comm.content}
                                  </p>
                                </div>
                              </div>

                              {canDeleteComm && (
                                <button
                                  type="button"
                                  onClick={() => handleDeleteComment(post.id, comm.id)}
                                  className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors cursor-pointer"
                                  title="Eliminar respuesta"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Mini Formulario de Respuesta para usuarios logueados */}
                    {user ? (
                      <div className="flex items-center gap-2 pt-2">
                        <input
                          type="text"
                          id={`input-comment-${post.id}`}
                          value={newCommentText[post.id] || ''}
                          onChange={(e) =>
                            setNewCommentText((prev) => ({ ...prev, [post.id]: e.target.value }))
                          }
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddComment(post.id);
                            }
                          }}
                          placeholder="Escribe tu respuesta..."
                          className="flex-1 px-3 py-2 text-xs text-slate-800 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 min-h-[38px]"
                        />
                        <button
                          type="button"
                          id={`btn-send-comment-${post.id}`}
                          onClick={() => handleAddComment(post.id)}
                          disabled={submittingComment[post.id] || !(newCommentText[post.id] || '').trim()}
                          className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold transition-all cursor-pointer min-h-[38px] flex items-center justify-center shrink-0"
                        >
                          <Send className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-center">
                        <button
                          type="button"
                          onClick={signInWithGoogle}
                          className="text-xs font-semibold text-indigo-600 hover:underline cursor-pointer"
                        >
                          Inicia sesión con Google para responder a esta publicación
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </motion.article>
            );
          })
        )}
      </div>

      {/* Modal de Descarga de Proyecto si se ejecuta desde aquí */}
      <DownloadModal
        isOpen={downloadTarget.isOpen}
        onClose={() => setDownloadTarget((prev) => ({ ...prev, isOpen: false }))}
        projectTitle={downloadTarget.title}
        downloadUrl={downloadTarget.url}
        waitTimeSeconds={downloadTarget.waitTime}
      />
    </div>
  );
};
