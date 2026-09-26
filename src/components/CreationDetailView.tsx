import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowLeft, 
  ExternalLink, 
  Copy, 
  Check, 
  Gamepad2, 
  FileText, 
  ShieldCheck, 
  Globe, 
  Sparkles, 
  Code2, 
  Share2, 
  Eye, 
  Layers,
  CheckCircle2
} from 'lucide-react';
import { AdminCreation } from '../types';

interface CreationDetailViewProps {
  onBack: () => void;
  creation?: AdminCreation;
}

export const CreationDetailView: React.FC<CreationDetailViewProps> = ({ onBack, creation }) => {
  const [copied, setCopied] = useState(false);
  const [showEmbedPreview, setShowEmbedPreview] = useState(true);

  const documentUrl = creation?.documentUrl || 'https://docs.google.com/document/d/1_FmH3BlSBQI7FGgAQL59-ZPe8eCxs35wel6JUyVaG8Q/edit?tab=t.0';
  const creationTitle = creation?.title || 'Juegos En HTML';
  const creationDesc = creation?.description || 'Colección y compilación oficial de videojuegos desarrollados en código HTML nativo con código fuente, instrucciones interactivas y acceso directo a la documentación completa.';
  const creationTag = creation?.tag || 'Juegos · HTML5';
  const creationCategory = creation?.category || 'Creación Oficial';

  // Google Docs embed preview link
  const embedUrl = documentUrl.includes('/edit')
    ? documentUrl.replace(/\/edit.*$/, '/preview')
    : documentUrl;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(documentUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleOpenDoc = () => {
    window.open(documentUrl, '_blank', 'noopener,noreferrer');
  };

  const specCards = [
    {
      title: 'Tipo de Recurso',
      value: 'Documento Maestro',
      icon: <FileText className="w-5 h-5 text-indigo-600" />,
      desc: 'Documentación oficial estructurada en Google Docs con código, guías y recursos.',
    },
    {
      title: 'Tecnología',
      value: 'HTML5 · Canvas · JS',
      icon: <Code2 className="w-5 h-5 text-violet-600" />,
      desc: 'Juegos y prototipos web interactivos ejecutables en cualquier navegador sin plugins.',
    },
    {
      title: 'Seguridad y Origen',
      value: '100% Verificado',
      icon: <ShieldCheck className="w-5 h-5 text-emerald-600" />,
      desc: 'Contenido oficial verificado por NexStudio, seguro y sin publicidad invasiva.',
    },
    {
      title: 'Disponibilidad',
      value: 'Acceso Público',
      icon: <Globe className="w-5 h-5 text-sky-600" />,
      desc: 'Enlace directo de alta disponibilidad alojado de forma permanente en Google Docs.',
    },
  ];

  return (
    <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12 animate-in fade-in duration-300">
      {/* Top Bar with Back Button */}
      <div className="flex items-center justify-between gap-4 mb-8">
        <button
          type="button"
          id="btn-back-to-creaciones"
          onClick={onBack}
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-all cursor-pointer min-h-[44px]"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Volver a Creaciones</span>
        </button>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-violet-700 px-3 py-1 rounded-full bg-violet-50 border border-violet-200">
            {creationCategory}
          </span>
          <span className="text-xs font-semibold text-slate-500 px-3 py-1 rounded-full bg-slate-100 border border-slate-200">
            {creationTag}
          </span>
        </div>
      </div>

      {/* Main Creation Hero Card */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="p-6 sm:p-10 rounded-3xl bg-gradient-to-br from-white via-violet-50/20 to-indigo-50/30 border border-slate-200 shadow-xl shadow-violet-500/5 mb-8 text-left"
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-100">
          <div className="flex items-start sm:items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-violet-600/30 shrink-0">
              <Gamepad2 className="w-8 h-8" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1.5">
                <h1 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight">
                  {creationTitle}
                </h1>
                <span className="px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider bg-violet-100 text-violet-800 rounded-full border border-violet-200">
                  Google Docs
                </span>
              </div>
              <p className="text-sm sm:text-base text-slate-600 max-w-2xl leading-relaxed">
                {creationDesc}
              </p>
            </div>
          </div>

          {/* Direct Action Buttons */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
            <button
              type="button"
              id="btn-copy-doc-link"
              onClick={handleCopyLink}
              className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs sm:text-sm font-semibold transition-all cursor-pointer min-h-[44px]"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span className="text-emerald-700 font-bold">¡Enlace Copiado!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-slate-500" />
                  <span>Copiar Enlace</span>
                </>
              )}
            </button>

            <button
              type="button"
              id="btn-open-doc-external"
              onClick={handleOpenDoc}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs sm:text-sm font-bold shadow-lg shadow-violet-600/25 hover:shadow-xl hover:shadow-violet-600/35 transition-all cursor-pointer min-h-[44px]"
            >
              <span>Abrir Documento Oficial</span>
              <ExternalLink className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Feature Highlights Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
          {specCards.map((spec, idx) => (
            <div 
              key={idx} 
              className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-1.5"
            >
              <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold">
                {spec.icon}
                <span>{spec.title}</span>
              </div>
              <div className="text-sm font-bold text-slate-900">{spec.value}</div>
              <p className="text-[11px] text-slate-500 leading-normal">{spec.desc}</p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Embedded Preview and Direct Access Panel */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="rounded-3xl bg-white border border-slate-200 shadow-sm overflow-hidden text-left mb-10"
      >
        <div className="p-5 sm:p-6 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-violet-100 text-violet-700">
              <Eye className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                Visualizador de Documento Oficial
              </h2>
              <p className="text-xs text-slate-500">
                Consulta los juegos, código e instrucciones directamente o ábrelo en Google Docs.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowEmbedPreview(!showEmbedPreview)}
              className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 hover:border-slate-300 transition-colors cursor-pointer"
            >
              {showEmbedPreview ? 'Ocultar Visor' : 'Mostrar Visor'}
            </button>
            <button
              type="button"
              onClick={handleOpenDoc}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold text-violet-700 bg-violet-50 hover:bg-violet-100 border border-violet-200 transition-colors cursor-pointer"
            >
              <span>Abrir en Google Docs</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Embedded Iframe or Fallback Card */}
        {showEmbedPreview ? (
          <div className="relative w-full h-[650px] bg-slate-100 flex flex-col">
            <iframe
              src={embedUrl}
              title={creationTitle}
              className="w-full h-full border-0"
              loading="lazy"
              allowFullScreen
            />
            {/* Fallback floating button if the doc has framing restricted by browser policy */}
            <div className="p-3 bg-slate-900/90 text-white backdrop-blur-md flex flex-wrap items-center justify-between gap-3 text-xs">
              <span className="text-slate-300">
                ¿Prefieres editar o ver el documento con todas las herramientas de Google?
              </span>
              <button
                type="button"
                onClick={handleOpenDoc}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition-colors cursor-pointer"
              >
                <span>Ver en Google Docs</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ) : (
          <div className="p-8 text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-violet-50 text-violet-600 flex items-center justify-center mx-auto">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Visor minimizado</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                Haz clic en "Mostrar Visor" para incrustar el documento aquí o ábrelo directamente en Google Docs.
              </p>
            </div>
            <button
              type="button"
              onClick={handleOpenDoc}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold shadow-md transition-all cursor-pointer"
            >
              <span>Abrir Documento Oficial</span>
              <ExternalLink className="w-4 h-4" />
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
};
