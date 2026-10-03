import React from 'react';
import { 
  ArrowLeft, 
  Sparkles, 
  CheckCircle2, 
  Calendar,
  Settings,
  ShieldCheck
} from 'lucide-react';
import { motion } from 'motion/react';
import { useAdmin } from '../context/AdminContext';
import { getNewsIcon } from './AdminNewsManager';

interface NewsPageViewProps {
  onBack: () => void;
  onOpenAdminNews?: () => void;
}

export const NewsPageView: React.FC<NewsPageViewProps> = ({ onBack, onOpenAdminNews }) => {
  const { newsList, isAdmin } = useAdmin();

  // Filter only published news for visitors (admins can see drafts marked)
  const visibleNews = (newsList || []).filter((item) => item.isPublished || isAdmin);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="w-full max-w-3xl mx-auto px-4 py-8 sm:py-12"
    >
      {/* Botón Volver y Acceso Rápido para Admin */}
      <div className="flex items-center justify-between mb-6">
        <button
          type="button"
          id="news-back-btn"
          onClick={onBack}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200/80 transition-all cursor-pointer min-h-[40px]"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Volver al inicio</span>
        </button>

        {isAdmin && onOpenAdminNews && (
          <button
            type="button"
            onClick={onOpenAdminNews}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-bold transition-all cursor-pointer shadow-xs"
            title="Abrir editor de noticias en el Centro de Mando"
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Editar Noticias en Admin</span>
          </button>
        )}
      </div>

      {/* Cabecera Principal */}
      <div className="mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200/80 mb-3">
          <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
          <span>Novedades y Registro de Cambios</span>
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          Noticias
        </h1>
        <p className="mt-1 text-slate-600 text-sm">
          Novedades, mejoras y notas de versión oficiales de NexStudio.
        </p>
      </div>

      {/* Lista de Actualizaciones / Noticias Dinámicas */}
      <div className="space-y-8">
        {visibleNews.map((news) => (
          <article
            key={news.id}
            className={`rounded-2xl border bg-white shadow-xs overflow-hidden transition-all ${
              news.isCurrent
                ? 'border-indigo-200 ring-2 ring-indigo-500/10'
                : 'border-slate-200'
            }`}
          >
            {/* Cabecera de la Actualización */}
            <div className="p-6 bg-gradient-to-r from-slate-50 via-indigo-50/20 to-slate-50 border-b border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900">
                    {news.title}
                  </h2>
                  {!news.isPublished && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                      Borrador
                    </span>
                  )}
                </div>
                {news.subtitle && (
                  <p className="text-xs text-slate-500 mt-0.5 font-normal leading-relaxed">
                    {news.subtitle}
                  </p>
                )}
                {news.date && (
                  <div className="flex items-center gap-1 text-[11px] text-slate-400 mt-1">
                    <Calendar className="w-3 h-3 text-slate-400" />
                    <span>{news.date}</span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 self-start sm:self-auto">
                {news.badge && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold bg-indigo-600 text-white shadow-xs">
                    <Sparkles className="w-3 h-3 text-amber-300" />
                    {news.badge}
                  </span>
                )}
              </div>
            </div>

            {/* Secciones y Viñetas de la Actualización */}
            <div className="p-6 sm:p-8 space-y-6">
              {news.categories.map((section, catIdx) => (
                <div key={section.id || catIdx} className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 rounded-md bg-slate-100 text-slate-700">
                      {getNewsIcon(section.iconName)}
                    </span>
                    <h3 className="text-sm font-bold text-slate-900">
                      {section.title}
                    </h3>
                  </div>

                  <ul className="space-y-1.5 pl-7">
                    {section.items.map((item, itemIdx) => (
                      <li
                        key={itemIdx}
                        className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-600"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600 shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </article>
        ))}

        {visibleNews.length === 0 && (
          <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 text-slate-500">
            <p className="text-sm">No hay publicaciones de noticias disponibles en este momento.</p>
          </div>
        )}
      </div>
    </motion.div>
  );
};
