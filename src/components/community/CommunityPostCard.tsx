import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Heart, 
  MessageCircle, 
  Share2, 
  Trash2, 
  Send, 
  X, 
  ShieldCheck, 
  FileText, 
  Download, 
  ZoomIn, 
  Lock, 
  Users, 
  Globe, 
  Archive,
  Film,
  Music,
  File
} from 'lucide-react';
import { CommunityPost, PostComment } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { formatFileSize } from '../../lib/fileUploadHelper';

interface CommunityPostCardProps {
  post: CommunityPost;
  onLike: (postId: string) => void;
  onShare: (post: CommunityPost) => void;
  onDelete: (postId: string) => void;
  onAddComment: (postId: string, text: string) => Promise<void>;
  onDeleteComment: (postId: string, commentId: string) => void;
  comments: PostComment[];
  onOpenLightbox: (imageUrl: string, title?: string, authorName?: string) => void;
  onFilterTag?: (tag: string) => void;
  onOpenProfile?: (authorId: string, authorName?: string, authorUsername?: string, authorPhotoURL?: string) => void;
}

export const CommunityPostCard: React.FC<CommunityPostCardProps> = ({
  post,
  onLike,
  onShare,
  onDelete,
  onAddComment,
  onDeleteComment,
  comments,
  onOpenLightbox,
  onFilterTag,
  onOpenProfile,
}) => {
  const { user, profile, isAdmin, signInWithGoogle } = useAuth();
  const [isCommentsOpen, setIsCommentsOpen] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  const hasLiked = user ? post.likes.includes(user.uid) : false;
  const isAuthor = user ? post.authorId === user.uid : false;
  const canDelete = isAuthor || isAdmin;

  const handleSendComment = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!user) {
      signInWithGoogle();
      return;
    }
    const trimmed = commentText.trim();
    if (!trimmed || isSubmittingComment) return;

    setIsSubmittingComment(true);
    try {
      await onAddComment(post.id, trimmed);
      setCommentText('');
    } finally {
      setIsSubmittingComment(false);
    }
  };

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
    } catch {
      return 'recientemente';
    }
  };

  const getFileIcon = () => {
    if (post.attachmentType === 'video') return <Film className="w-8 h-8 text-amber-500" />;
    if (post.attachmentType === 'audio') return <Music className="w-8 h-8 text-pink-500" />;
    if (post.attachmentName?.endsWith('.zip') || post.attachmentName?.endsWith('.rar')) {
      return <Archive className="w-8 h-8 text-indigo-500" />;
    }
    return <FileText className="w-8 h-8 text-sky-500" />;
  };

  const handleDownloadFile = () => {
    if (!post.attachmentUrl) return;
    const a = document.createElement('a');
    a.href = post.attachmentUrl;
    a.download = post.attachmentName || 'archivo_nexstudio';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <article 
      id={`post-${post.id}`}
      className="w-full p-4 sm:p-6 rounded-2xl bg-white border border-slate-200 hover:border-slate-300 shadow-xs transition-colors text-left"
    >
      {/* Cabecera del Autor */}
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={() => onOpenProfile && onOpenProfile(post.authorId, post.authorName, post.authorUsername, post.authorPhotoURL)}
            className="shrink-0 group/avatar cursor-pointer text-left focus:outline-none"
            title={`Ver perfil de ${post.authorName}`}
          >
            <img
              src={post.authorPhotoURL || `https://api.dicebear.com/7.x/identicon/svg?seed=${post.authorId}`}
              alt={post.authorName}
              className="w-11 h-11 rounded-xl object-cover border border-slate-200 bg-slate-100 group-hover/avatar:ring-2 group-hover/avatar:ring-indigo-500/40 transition-all"
              referrerPolicy="no-referrer"
            />
          </button>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => onOpenProfile && onOpenProfile(post.authorId, post.authorName, post.authorUsername, post.authorPhotoURL)}
                className="text-sm sm:text-base font-bold text-slate-900 truncate hover:text-indigo-600 transition-colors cursor-pointer text-left focus:outline-none inline-flex items-center gap-1"
                title={`Ver perfil de ${post.authorName}`}
              >
                <span>{post.authorName}</span>
              </button>
              {post.authorRole === 'SuperAdmin' && (
                <span className="text-[10px] uppercase tracking-wider font-extrabold px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-700 border border-indigo-200 flex items-center gap-1 shrink-0">
                  <ShieldCheck className="w-3 h-3 text-indigo-600" />
                  Admin
                </span>
              )}
              {post.visibility === 'community_only' && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 flex items-center gap-0.5 shrink-0" title="Visible solo para la comunidad">
                  <Users className="w-3 h-3 text-slate-500" />
                  Comunidad
                </span>
              )}
              {post.visibility === 'private' && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-0.5 shrink-0" title="Publicación privada">
                  <Lock className="w-3 h-3 text-amber-600" />
                  Privado
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <button
                type="button"
                onClick={() => onOpenProfile && onOpenProfile(post.authorId, post.authorName, post.authorUsername, post.authorPhotoURL)}
                className="hover:text-indigo-600 transition-colors cursor-pointer focus:outline-none"
              >
                @{post.authorUsername || 'creador'}
              </button>
              <span>·</span>
              <span>{formatTimeAgo(post.createdAt)}</span>
            </div>
          </div>
        </div>

        {/* Acciones de eliminación */}
        {canDelete && (
          <button
            type="button"
            id={`btn-delete-post-${post.id}`}
            onClick={() => onDelete(post.id)}
            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer shrink-0"
            title="Eliminar publicación"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Contenido de texto adaptado a todo el ancho */}
      <div className="text-sm sm:text-base text-slate-800 leading-relaxed whitespace-pre-line mb-4 break-words">
        {post.content}
      </div>

      {/* Etiquetas / Hashtags */}
      {post.tags && post.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          {post.tags.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => onFilterTag && onFilterTag(t)}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 bg-indigo-50/60 hover:bg-indigo-100 px-2 py-0.5 rounded-md transition-colors cursor-pointer"
            >
              #{t}
            </button>
          ))}
        </div>
      )}

      {/* ARCHIVOS SUBIDOS DESDE EL DISPOSITIVO (VISTA PREVIA EN GRANDE) */}
      {post.attachmentUrl && (
        <div className="mb-5 w-full">
          {post.attachmentType === 'image' ? (
            /* Vista Previa en Grande de Imagen del Dispositivo */
            <div 
              className="relative w-full rounded-2xl overflow-hidden border border-slate-200 bg-slate-950 group cursor-pointer shadow-xs"
              onClick={() => onOpenLightbox(post.attachmentUrl!, post.attachmentName || 'Imagen adjunta', post.authorName)}
            >
              <img
                src={post.attachmentUrl}
                alt={post.attachmentName || 'Vista previa grande'}
                className="w-full max-h-[550px] object-cover sm:object-contain mx-auto bg-slate-900 group-hover:scale-[1.01] transition-transform duration-300"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-between p-4 text-white">
                <span className="text-xs font-semibold truncate max-w-[70%]">
                  {post.attachmentName || 'Imagen del dispositivo'}
                </span>
                <span className="px-3 py-1.5 rounded-xl bg-white/20 backdrop-blur-md text-xs font-bold flex items-center gap-1.5">
                  <ZoomIn className="w-3.5 h-3.5" />
                  Ver en grande
                </span>
              </div>
            </div>
          ) : (
            /* Vista Previa en Grande de Archivo / Documento del Dispositivo */
            <div className="w-full p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-slate-50 to-slate-100/70 border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 flex items-center justify-center shrink-0 shadow-xs">
                  {getFileIcon()}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-slate-900 truncate">
                    {post.attachmentName || 'Archivo adjunto'}
                  </p>
                  <p className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                    <span className="uppercase font-semibold text-[10px] px-1.5 py-0.2 rounded bg-slate-200 text-slate-700">
                      {post.attachmentType || 'Archivo'}
                    </span>
                    {post.attachmentSize ? (
                      <span>{formatFileSize(post.attachmentSize)}</span>
                    ) : null}
                    <span>· Subido del dispositivo</span>
                  </p>
                </div>
              </div>

              <button
                type="button"
                id={`btn-download-attachment-${post.id}`}
                onClick={handleDownloadFile}
                className="w-full sm:w-auto px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer min-h-[38px] shrink-0"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Descargar archivo</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Barra de Acciones del Post */}
      <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-slate-500 text-xs sm:text-sm">
        {/* Toggle Comentarios */}
        <button
          type="button"
          id={`btn-comments-toggle-${post.id}`}
          onClick={() => setIsCommentsOpen(!isCommentsOpen)}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-xl transition-colors cursor-pointer min-h-[36px] ${
            isCommentsOpen ? 'bg-indigo-50 text-indigo-600 font-semibold' : 'hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <MessageCircle className="w-4 h-4" />
          <span>{comments.length || post.commentsCount || 0}</span>
          <span className="hidden sm:inline">comentarios</span>
        </button>

        {/* Me Gusta / Like */}
        <button
          type="button"
          id={`btn-like-${post.id}`}
          onClick={() => onLike(post.id)}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-xl transition-all cursor-pointer min-h-[36px] ${
            hasLiked 
              ? 'text-rose-600 font-bold bg-rose-50' 
              : 'hover:bg-rose-50 hover:text-rose-600'
          }`}
        >
          <Heart className={`w-4 h-4 ${hasLiked ? 'fill-rose-600' : ''}`} />
          <span>{post.likesCount || 0}</span>
          <span className="hidden sm:inline">me gusta</span>
        </button>

        {/* Compartir */}
        <button
          type="button"
          id={`btn-share-${post.id}`}
          onClick={() => onShare(post)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl hover:bg-sky-50 hover:text-sky-600 transition-colors cursor-pointer min-h-[36px]"
        >
          <Share2 className="w-4 h-4" />
          <span>{post.sharesCount || 0}</span>
          <span className="hidden sm:inline">compartir</span>
        </button>
      </div>

      {/* Sección Expandida de Comentarios */}
      <AnimatePresence>
        {isCommentsOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 pt-4 border-t border-slate-100 space-y-3"
          >
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Respuestas ({comments.length})
            </h4>

            {comments.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-2">
                Aún no hay respuestas en esta publicación. ¡Sé el primero en comentar!
              </p>
            ) : (
              <div className="space-y-2">
                {comments.map((c) => {
                  const canDeleteComment = user && (c.authorId === user.uid || isAuthor || isAdmin);
                  return (
                    <div
                      key={c.id}
                      className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-start justify-between gap-3 text-left"
                    >
                      <div className="flex items-start gap-2.5 min-w-0">
                        <img
                          src={c.authorPhotoURL || `https://api.dicebear.com/7.x/identicon/svg?seed=${c.authorId}`}
                          alt={c.authorName}
                          className="w-7 h-7 rounded-lg object-cover bg-white border border-slate-200 shrink-0 mt-0.5"
                          referrerPolicy="no-referrer"
                        />
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-xs font-bold text-slate-900">
                              {c.authorName}
                            </span>
                            <span className="text-[11px] text-slate-400">
                              @{c.authorUsername || 'usuario'}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              · {formatTimeAgo(c.createdAt)}
                            </span>
                          </div>
                          <p className="text-xs sm:text-sm text-slate-700 mt-1 leading-relaxed break-words">
                            {c.content}
                          </p>
                        </div>
                      </div>

                      {canDeleteComment && (
                        <button
                          type="button"
                          onClick={() => onDeleteComment(post.id, c.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors cursor-pointer shrink-0"
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

            {/* Input para responder */}
            {user ? (
              <form onSubmit={handleSendComment} className="flex items-center gap-2 pt-2">
                <input
                  type="text"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Escribe una respuesta a esta publicación..."
                  className="flex-1 px-4 py-2 text-xs sm:text-sm text-slate-800 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 min-h-[40px]"
                />
                <button
                  type="submit"
                  disabled={isSubmittingComment || !commentText.trim()}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold transition-all cursor-pointer min-h-[40px] flex items-center justify-center shrink-0"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>
            ) : (
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center">
                <button
                  type="button"
                  onClick={signInWithGoogle}
                  className="text-xs font-semibold text-indigo-600 hover:underline cursor-pointer"
                >
                  Inicia sesión con Google para responder a esta publicación
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </article>
  );
};
