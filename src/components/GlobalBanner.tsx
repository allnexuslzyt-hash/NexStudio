import React from 'react';
import { useAdmin } from '../context/AdminContext';
import { AlertCircle, AlertTriangle, CheckCircle, Info, X, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const GlobalBanner: React.FC = () => {
  const { siteSettings, updateGlobalBanner } = useAdmin();
  const banner = siteSettings.banner;

  if (!banner || !banner.enabled) return null;

  const getStyle = () => {
    switch (banner.type) {
      case 'warning':
        return {
          bg: 'bg-amber-500 text-slate-950',
          icon: <AlertTriangle className="w-4 h-4 shrink-0 text-slate-950" />,
          btn: 'bg-slate-950/10 hover:bg-slate-950/20 text-slate-950 border-slate-950/20'
        };
      case 'critical':
        return {
          bg: 'bg-rose-600 text-white',
          icon: <AlertCircle className="w-4 h-4 shrink-0 text-white" />,
          btn: 'bg-white/20 hover:bg-white/30 text-white border-white/20'
        };
      case 'success':
        return {
          bg: 'bg-emerald-600 text-white',
          icon: <CheckCircle className="w-4 h-4 shrink-0 text-white" />,
          btn: 'bg-white/20 hover:bg-white/30 text-white border-white/20'
        };
      case 'info':
      default:
        return {
          bg: 'bg-indigo-600 text-white',
          icon: <Info className="w-4 h-4 shrink-0 text-white" />,
          btn: 'bg-white/20 hover:bg-white/30 text-white border-white/20'
        };
    }
  };

  const style = getStyle();

  return (
    <AnimatePresence>
      <motion.div
        initial={{ height: 0, opacity: 0 }}
        animate={{ height: 'auto', opacity: 1 }}
        exit={{ height: 0, opacity: 0 }}
        className={`w-full ${style.bg} px-4 py-2.5 text-xs sm:text-sm font-medium z-40 transition-colors shadow-xs`}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 overflow-hidden">
            {style.icon}
            <span className="truncate">{banner.message}</span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {banner.actionText && (
              <a
                href={banner.actionLink || '#'}
                target={banner.actionLink?.startsWith('http') ? '_blank' : '_self'}
                rel="noreferrer"
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold border transition-colors ${style.btn}`}
              >
                <span>{banner.actionText}</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}

            {banner.dismissible && (
              <button
                type="button"
                onClick={() => updateGlobalBanner({ enabled: false })}
                className="p-1 rounded-md hover:bg-black/10 transition-colors cursor-pointer"
                title="Cerrar aviso"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
