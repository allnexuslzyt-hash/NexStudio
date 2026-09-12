import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Download, ZoomIn, ExternalLink } from 'lucide-react';

interface CommunityMediaModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl?: string;
  title?: string;
  authorName?: string;
}

export const CommunityMediaModal: React.FC<CommunityMediaModalProps> = ({
  isOpen,
  onClose,
  imageUrl,
  title,
  authorName,
}) => {
  if (!isOpen || !imageUrl) return null;

  const handleDownload = () => {
    const a = document.createElement('a');
    a.href = imageUrl;
    a.download = `nexstudio_community_${Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <AnimatePresence>
      <div 
        id="community-media-lightbox-overlay"
        className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-2 sm:p-6"
        onClick={onClose}
      >
        {/* Top bar controls */}
        <div 
          className="w-full max-w-6xl flex items-center justify-between px-4 py-3 text-white z-10"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center gap-2 text-left min-w-0">
            <span className="text-xs sm:text-sm font-bold text-white truncate">
              {title || 'Vista Previa en Grande'}
            </span>
            {authorName && (
              <span className="text-xs text-slate-400 hidden sm:inline">
                por {authorName}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              id="btn-download-preview-image"
              onClick={handleDownload}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Descargar imagen"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Descargar</span>
            </button>

            <button
              type="button"
              id="btn-close-lightbox"
              onClick={onClose}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white hover:text-rose-400 transition-colors cursor-pointer"
              title="Cerrar vista previa"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Large Media Content */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          className="relative max-w-6xl max-h-[85vh] w-full flex items-center justify-center p-2"
          onClick={(e) => e.stopPropagation()}
        >
          <img
            src={imageUrl}
            alt={title || 'Vista previa grande'}
            className="max-h-[82vh] max-w-full rounded-2xl object-contain shadow-2xl border border-white/10"
          />
        </motion.div>

        <p className="text-xs text-slate-400 mt-2 select-none">
          Haz clic fuera o presiona cerrar para volver
        </p>
      </div>
    </AnimatePresence>
  );
};
