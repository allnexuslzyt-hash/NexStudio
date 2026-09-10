import React, { useState, useMemo } from 'react';
import { 
  Search, 
  X, 
  ChevronDown, 
  ArrowLeft, 
  Compass, 
  User, 
  AlertTriangle, 
  BookOpen, 
  Mail, 
  MessageSquare, 
  FileText, 
  ExternalLink,
  HelpCircle,
  Sparkles,
  Layers,
  ArrowRight,
  Headphones
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  HELP_CATEGORIES, 
  GuideArticle 
} from '../data/helpData';
import { useAdmin } from '../context/AdminContext';
import { useSupport } from '../context/SupportContext';
import { HelpArticleModal } from './HelpArticleModal';
import { HelpSupportModal } from './HelpSupportModal';

interface HelpPageViewProps {
  onBack: () => void;
}

export const HelpPageView: React.FC<HelpPageViewProps> = ({ onBack }) => {
  const { dynamicFaqs, dynamicGuides } = useAdmin();
  const { openSupportModal } = useSupport();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [openFaqIds, setOpenFaqIds] = useState<Set<string>>(new Set(['faq-1']));
  const [activeArticle, setActiveArticle] = useState<GuideArticle | null>(null);
  const [isSupportModalOpen, setIsSupportModalOpen] = useState(false);

  // Toggle FAQ accordion item
  const toggleFaq = (id: string) => {
    setOpenFaqIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Helper for Category Icons
  const renderCategoryIcon = (iconName: string, className: string = 'w-5 h-5') => {
    switch (iconName) {
      case 'Compass':
        return <Compass className={className} />;
      case 'User':
        return <User className={className} />;
      case 'AlertTriangle':
        return <AlertTriangle className={className} />;
      case 'BookOpen':
        return <BookOpen className={className} />;
      default:
        return <Layers className={className} />;
    }
  };

  // Dynamic real-time filtering for FAQs
  const filteredFaqs = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return dynamicFaqs.filter((faq) => {
      // Category check
      if (selectedCategory !== 'all' && faq.categoryId !== selectedCategory) {
        return false;
      }
      // Query check
      if (!q) return true;
      const matchQuestion = faq.question.toLowerCase().includes(q);
      const matchSummary = faq.summary.toLowerCase().includes(q);
      const matchTips = faq.tips ? faq.tips.toLowerCase().includes(q) : false;
      const matchBullets = faq.answerBullets 
        ? faq.answerBullets.some((b) => b.toLowerCase().includes(q)) 
        : false;
      return matchQuestion || matchSummary || matchTips || matchBullets;
    });
  }, [searchQuery, selectedCategory, dynamicFaqs]);

  // Dynamic real-time filtering for Guide Articles
  const filteredGuides = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return dynamicGuides.filter((guide) => {
      // Category check
      if (selectedCategory !== 'all' && guide.categoryId !== selectedCategory) {
        return false;
      }
      // Query check
      if (!q) return true;
      const matchTitle = guide.title.toLowerCase().includes(q);
      const matchSummary = guide.summary.toLowerCase().includes(q);
      const matchSections = guide.sections.some(
        (s) => 
          (s.heading && s.heading.toLowerCase().includes(q)) ||
          s.paragraphs.some((p) => p.toLowerCase().includes(q)) ||
          (s.listItems && s.listItems.some((li) => li.toLowerCase().includes(q)))
      );
      return matchTitle || matchSummary || matchSections;
    });
  }, [searchQuery, selectedCategory, dynamicGuides]);

  const hasAnyResults = filteredFaqs.length > 0 || filteredGuides.length > 0;

  return (
    <div className="w-full min-h-[85vh] flex flex-col items-center bg-white text-slate-900 pb-16">
      
      {/* Top back action */}
      <div className="w-full max-w-5xl px-4 pt-4 sm:pt-6 flex items-center justify-between">
        <button
          type="button"
          id="help-view-back-btn"
          onClick={onBack}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-200 hover:border-slate-300 transition-all cursor-pointer shadow-xs min-h-[44px]"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Volver al inicio</span>
        </button>

        <span className="text-xs text-slate-400 font-medium hidden sm:inline">
          Centro de Soporte Oficial NexStudio
        </span>
      </div>

      {/* 1. CABECERA Y BUSCADOR PRINCIPAL */}
      <header className="w-full max-w-4xl px-4 pt-8 pb-10 sm:pt-12 sm:pb-12 text-center space-y-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200/60 text-indigo-700 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Centro de Ayuda & Documentación</span>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900">
            ¿En qué podemos ayudarte?
          </h1>
          <p className="text-sm sm:text-base text-slate-500 max-w-2xl mx-auto leading-relaxed">
            Busca preguntas frecuentes, soluciones a problemas técnicos o consulta nuestras guías completas.
          </p>
        </div>

        {/* Buscador grande en el centro con filtrado dinámico */}
        <div className="relative w-full max-w-2xl mx-auto">
          <div className="relative flex items-center">
            <Search className="absolute left-4 w-5 h-5 text-slate-400 pointer-events-none" />
            <input
              type="text"
              id="help-main-search-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Escribe tu consulta (ej. 'iniciar sesión', 'discord', 'cookies', 'error')..."
              className="w-full pl-12 pr-12 py-3.5 sm:py-4 bg-slate-50 hover:bg-slate-100/60 focus:bg-white border-2 border-slate-200 focus:border-indigo-600 rounded-2xl text-slate-900 placeholder:text-slate-400 text-sm sm:text-base font-medium shadow-xs focus:shadow-lg focus:shadow-indigo-500/10 focus:outline-none transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                id="clear-search-btn"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"
                aria-label="Borrar búsqueda"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {searchQuery && (
            <p className="text-xs text-left text-slate-500 mt-2 pl-2">
              Resultados para: <span className="font-semibold text-slate-800">"{searchQuery}"</span>
            </p>
          )}
        </div>
      </header>

      {/* 2. CATEGORÍAS DE AYUDA (Tarjetas/Grid) */}
      <section className="w-full max-w-5xl px-4 mb-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Categorías de ayuda
          </h2>
          {selectedCategory !== 'all' && (
            <button
              type="button"
              id="reset-category-filter-btn"
              onClick={() => setSelectedCategory('all')}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors cursor-pointer"
            >
              Ver todas las categorías
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {HELP_CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                id={`cat-card-${cat.id}`}
                onClick={() => setSelectedCategory(isSelected ? 'all' : cat.id)}
                className={`flex flex-col text-left p-4 sm:p-5 rounded-2xl border transition-all duration-200 cursor-pointer min-h-[44px] ${
                  isSelected
                    ? 'bg-indigo-50/70 border-indigo-500 shadow-sm ring-2 ring-indigo-500/20'
                    : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/60 shadow-xs'
                }`}
              >
                <div className="flex items-center justify-between mb-2.5">
                  <div className={`p-2 rounded-xl border ${cat.badgeColor}`}>
                    {renderCategoryIcon(cat.iconName, 'w-4 h-4')}
                  </div>
                  {isSelected && (
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-indigo-600 text-white">
                      Activa
                    </span>
                  )}
                </div>
                <h3 className="text-sm font-bold text-slate-900 mb-1">
                  {cat.name}
                </h3>
                <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                  {cat.description}
                </p>
              </button>
            );
          })}
        </div>
      </section>

      {/* RESULTADOS / CONTENIDO */}
      <div className="w-full max-w-5xl px-4 space-y-12">
        
        {/* Si no hay resultados */}
        {!hasAnyResults && (
          <div className="p-8 sm:p-12 text-center rounded-2xl border border-slate-200 bg-slate-50/50 space-y-4">
            <div className="w-12 h-12 mx-auto rounded-full bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-200">
              <HelpCircle className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-900">
                No se han encontrado resultados para tu búsqueda
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
                No hay preguntas o guías que coincidan con <span className="font-semibold text-slate-700">"{searchQuery}"</span> en esta categoría.
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('all');
                }}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-900 text-white hover:bg-slate-800 transition-colors cursor-pointer min-h-[44px]"
              >
                Reiniciar filtros y búsqueda
              </button>
              <button
                type="button"
                onClick={() => setIsSupportModalOpen(true)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 transition-colors cursor-pointer min-h-[44px]"
              >
                Contactar soporte
              </button>
            </div>
          </div>
        )}

        {/* 3. SECCIÓN DE PREGUNTAS FRECUENTES (FAQ / Desplegables) */}
        {filteredFaqs.length > 0 && (
          <section className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-indigo-600" />
                <h2 className="text-base sm:text-lg font-bold text-slate-900">
                  Preguntas Frecuentes (FAQ)
                </h2>
              </div>
              <span className="text-xs font-semibold text-slate-400">
                {filteredFaqs.length} {filteredFaqs.length === 1 ? 'pregunta' : 'preguntas'}
              </span>
            </div>

            <div className="space-y-3">
              {filteredFaqs.map((faq) => {
                const isOpen = openFaqIds.has(faq.id);
                return (
                  <div
                    key={faq.id}
                    id={`faq-item-${faq.id}`}
                    className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
                      isOpen 
                        ? 'bg-slate-50/50 border-indigo-200 shadow-xs' 
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => toggleFaq(faq.id)}
                      aria-expanded={isOpen}
                      className="w-full text-left p-4 sm:p-5 flex items-start justify-between gap-4 cursor-pointer min-h-[44px]"
                    >
                      <span className="text-sm sm:text-base font-semibold text-slate-900 pr-2">
                        {faq.question}
                      </span>
                      <div className="p-1 rounded-lg bg-white border border-slate-200 text-slate-400 shrink-0 mt-0.5">
                        <ChevronDown
                          className={`w-4 h-4 transition-transform duration-200 ${
                            isOpen ? 'rotate-180 text-indigo-600' : ''
                          }`}
                        />
                      </div>
                    </button>

                    <AnimatePresence initial={false}>
                      {isOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <div className="px-4 pb-5 sm:px-5 sm:pb-6 pt-1 text-sm text-slate-600 border-t border-slate-200/60 space-y-3">
                            <p className="font-medium text-slate-700">
                              {faq.summary}
                            </p>

                            {faq.answerBullets && (
                              <ul className="space-y-2 pl-1">
                                {faq.answerBullets.map((bullet, idx) => (
                                  <li key={idx} className="flex items-start gap-2.5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-2 shrink-0" />
                                    <span className="text-slate-600">{bullet}</span>
                                  </li>
                                ))}
                              </ul>
                            )}

                            {faq.tips && (
                              <div className="p-3 rounded-xl bg-indigo-50/60 border border-indigo-100 text-xs text-indigo-900 font-medium">
                                <span className="font-bold">Consejo útil: </span>
                                {faq.tips}
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* 4. SECCIÓN DE EXPLICACIONES Y GUÍAS (Artículos / Modales) */}
        {filteredGuides.length > 0 && (
          <section className="space-y-4 pt-2">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-indigo-600" />
                <h2 className="text-base sm:text-lg font-bold text-slate-900">
                  Guías y Artículos Explicativos
                </h2>
              </div>
              <span className="text-xs font-semibold text-slate-400">
                {filteredGuides.length} {filteredGuides.length === 1 ? 'artículo' : 'artículos'}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredGuides.map((guide) => (
                <div
                  key={guide.id}
                  id={`guide-card-${guide.id}`}
                  onClick={() => setActiveArticle(guide)}
                  className="group flex flex-col justify-between p-5 rounded-2xl bg-white border border-slate-200 hover:border-indigo-300 hover:shadow-lg hover:shadow-indigo-500/5 transition-all duration-200 cursor-pointer"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="px-2.5 py-0.5 text-[11px] font-bold rounded-full bg-slate-100 text-slate-700 group-hover:bg-indigo-50 group-hover:text-indigo-700 transition-colors">
                        {guide.categoryLabel}
                      </span>
                      <span className="text-xs text-slate-400 font-medium">
                        {guide.readTime}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-slate-900 group-hover:text-indigo-600 transition-colors leading-snug">
                      {guide.title}
                    </h3>

                    <p className="text-xs sm:text-sm text-slate-500 line-clamp-2 leading-relaxed">
                      {guide.summary}
                    </p>
                  </div>

                  <div className="pt-4 mt-2 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-xs font-semibold text-indigo-600 flex items-center gap-1.5 group-hover:underline">
                      <FileText className="w-3.5 h-3.5" />
                      <span>Leer guía completa</span>
                    </span>
                    <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" />
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 5. SECCIÓN DE CONTACTO / SOPORTE DIRECTO */}
        <section 
          id="help-support-contact-section"
          className="rounded-3xl border border-slate-200 bg-gradient-to-b from-slate-50 to-white p-6 sm:p-10 text-center space-y-6 shadow-xs"
        >
          <div className="space-y-2 max-w-xl mx-auto">
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900">
              ¿No encontraste lo que buscabas?
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
              Estamos a tu disposición para ayudarte a resolver cualquier duda, incidencia técnica o sugerencia sobre NexStudio.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            {/* Botón correo electrónico oficial */}
            <a
              href="mailto:nexuslzcontact@gmail.com?subject=[Consulta NexStudio] Ayuda con la plataforma"
              id="help-btn-email"
              className="inline-flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 text-xs sm:text-sm font-semibold shadow-xs hover:shadow-sm transition-all cursor-pointer min-h-[44px]"
            >
              <Mail className="w-4 h-4 text-rose-600" />
              <span>nexuslzcontact@gmail.com</span>
            </a>

            {/* Botón Discord oficial */}
            <a
              href="https://discord.gg/qMFcBrHber"
              target="_blank"
              rel="noopener noreferrer"
              id="help-btn-discord"
              className="inline-flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-indigo-50 hover:bg-indigo-100/70 border border-indigo-200 text-indigo-700 text-xs sm:text-sm font-semibold transition-all cursor-pointer min-h-[44px]"
            >
              <MessageSquare className="w-4 h-4 text-indigo-600" />
              <span>Servidor de Discord</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>

            {/* Botón Formulario de Soporte */}
            <button
              type="button"
              id="help-btn-form"
              onClick={() => setIsSupportModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-semibold shadow-xs transition-all cursor-pointer min-h-[44px]"
            >
              <FileText className="w-4 h-4" />
              <span>Formulario de soporte</span>
            </button>

            {/* Botón Soporte desde la web */}
            <button
              type="button"
              id="help-btn-web-support"
              onClick={() => openSupportModal()}
              className="inline-flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-semibold shadow-xs hover:shadow-md transition-all cursor-pointer min-h-[44px]"
            >
              <Headphones className="w-4 h-4 text-indigo-100" />
              <span>Soporte desde la web</span>
            </button>
          </div>
        </section>
      </div>

      {/* Modal de Artículo de Guía Completo */}
      <HelpArticleModal
        article={activeArticle}
        onClose={() => setActiveArticle(null)}
      />

      {/* Modal de Formulario de Soporte Directo */}
      <HelpSupportModal
        isOpen={isSupportModalOpen}
        onClose={() => setIsSupportModalOpen(false)}
      />
    </div>
  );
};
