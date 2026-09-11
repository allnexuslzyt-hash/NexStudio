import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  ArrowLeft, 
  ArrowRight,
  FolderKanban, 
  Palette, 
  Wrench, 
  Share2, 
  ExternalLink, 
  Sparkles, 
  Layers, 
  Code2, 
  Terminal, 
  Cpu, 
  Flame, 
  Compass, 
  Globe, 
  Github, 
  Twitter, 
  Youtube, 
  MessageSquare,
  Twitch,
  Video,
  Download,
  Clock,
  ShieldCheck
} from 'lucide-react';
import { DownloadModal } from './DownloadModal';
import { ProjectDetailView } from './ProjectDetailView';
import { useAdmin } from '../context/AdminContext';

interface CatalogViewProps {
  view: 'proyectos' | 'creaciones' | 'herramientas' | 'redes';
  onBack: () => void;
}

interface CardItem {
  id: string;
  title: string;
  category: string;
  description: string;
  tag?: string;
  icon: React.ReactNode;
  accentColor: string;
  linkText?: string;
  linkUrl?: string;
  downloadUrl?: string;
  downloadSeconds?: number;
}

export const CatalogView: React.FC<CatalogViewProps> = ({ view, onBack }) => {
  const { projects, isAdmin } = useAdmin();

  const getHeaderInfo = () => {
    switch (view) {
      case 'proyectos':
        return {
          title: 'Proyectos',
          subtitle: 'Desarrollos, aplicaciones y soluciones construidas en NexStudio.',
          icon: <FolderKanban className="w-6 h-6 text-indigo-600" />,
          badge: 'Portafolio de Proyectos',
        };
      case 'creaciones':
        return {
          title: 'Creaciones',
          subtitle: 'Galería de experimentos visuales, interfaces y diseño interactivo.',
          icon: <Palette className="w-6 h-6 text-violet-600" />,
          badge: 'Diseño y Experiencias',
        };
      case 'herramientas':
        return {
          title: 'Herramientas',
          subtitle: 'Utilidades, motores de cálculo y módulos de productividad.',
          icon: <Wrench className="w-6 h-6 text-amber-600" />,
          badge: 'Utilidades Activas',
        };
      case 'redes':
        return {
          title: 'Redes Sociales',
          subtitle: 'Canales oficiales y perfiles de comunidad de NexStudio.',
          icon: <Share2 className="w-6 h-6 text-sky-600" />,
          badge: 'Comunidad y Enlaces',
        };
    }
  };

  const getCards = (): CardItem[] => {
    switch (view) {
      case 'proyectos': {
        const visibleProjects = isAdmin ? projects : projects.filter(p => p.isPublic);
        return visibleProjects.map((p, idx) => ({
          id: p.id,
          title: p.title,
          category: p.category || `Proyecto ${idx + 1}`,
          description: '',
          tag: p.tag || `Proyecto ${idx + 1}`,
          icon: <Code2 className="w-5 h-5 text-indigo-600" />,
          accentColor: 'from-indigo-500/10 to-blue-500/10 border-indigo-200',
          linkText: 'Ver',
          downloadUrl: p.downloadUrl,
          downloadSeconds: p.waitTimeSeconds ?? 3
        }));
      }

      case 'creaciones':
        return [
          {
            id: 'crea-1',
            title: 'Lienzo Minimalista en Blanco',
            category: 'Diseño de Interfaz',
            description: 'Composición tipográfica en alto contraste con retícula matemática pura y equilibrio visual.',
            tag: 'Diseño UI',
            icon: <Palette className="w-5 h-5 text-violet-600" />,
            accentColor: 'from-violet-500/10 to-fuchsia-500/10 border-violet-200',
            linkText: 'Ver Muestra',
          },
          {
            id: 'crea-2',
            title: 'Microinteracciones Fluidas',
            category: 'Animación Web',
            description: 'Efectos cinéticos con curvas de bezier calibradas y zoom óptico suave para respuesta táctil y de ratón.',
            tag: 'Motion',
            icon: <Sparkles className="w-5 h-5 text-indigo-600" />,
            accentColor: 'from-indigo-500/10 to-pink-500/10 border-indigo-200',
            linkText: 'Interactuar',
          },
          {
            id: 'crea-3',
            title: 'Paleta Solar & Neutra',
            category: 'Estética Visual',
            description: 'Gradientes de baja saturación combinando tonos lavanda, ámbar y pizarra con contraste accesible WCAG AA.',
            tag: 'Estilo',
            icon: <Flame className="w-5 h-5 text-amber-600" />,
            accentColor: 'from-amber-500/10 to-orange-500/10 border-amber-200',
            linkText: 'Ver Guía',
          },
          {
            id: 'crea-4',
            title: 'Componentes de Navegación Dinámica',
            category: 'UI Kit',
            description: 'Menús emergentes inteligentes, selectores flotantes y paneles de consentimiento accesibles por teclado.',
            tag: 'Componente',
            icon: <Compass className="w-5 h-5 text-cyan-600" />,
            accentColor: 'from-cyan-500/10 to-blue-500/10 border-cyan-200',
            linkText: 'Inspeccionar',
          },
        ];

      case 'herramientas':
        return [
          {
            id: 'tool-1',
            title: 'Generador de Identidad y Paletas',
            category: 'Utilidad Visual',
            description: 'Configura esquemas de color contrastados con valores HEX automáticos y exportación de tokens CSS.',
            tag: 'Herramienta',
            icon: <Wrench className="w-5 h-5 text-amber-600" />,
            accentColor: 'from-amber-500/10 to-yellow-500/10 border-amber-200',
            linkText: 'Lanzar',
          },
          {
            id: 'tool-2',
            title: 'Inspector de Rendimiento Web',
            category: 'Diagnóstico',
            description: 'Auditoría instantánea de tiempos de carga, tamaño de paquete JS y verificación de reglas de CDN.',
            tag: 'Utilidad',
            icon: <Cpu className="w-5 h-5 text-emerald-600" />,
            accentColor: 'from-emerald-500/10 to-green-500/10 border-emerald-200',
            linkText: 'Analizar',
          },
          {
            id: 'tool-3',
            title: 'Gestor de Términos y Cumplimiento',
            category: 'Legal Tech',
            description: 'Estructuración modular de cláusulas legales, cookies LSSI y avisos de privacidad conformes al RGPD.',
            tag: 'Cumplimiento',
            icon: <Code2 className="w-5 h-5 text-blue-600" />,
            accentColor: 'from-blue-500/10 to-indigo-500/10 border-blue-200',
            linkText: 'Abrir Gestor',
          },
          {
            id: 'tool-4',
            title: 'Validador de Respuestas y Redirecciones',
            category: 'Infraestructura',
            description: 'Detección automática de bucles infinitos en reglas de enrutamiento y verificación de cabeceras de servidor.',
            tag: 'Diagnóstico',
            icon: <Terminal className="w-5 h-5 text-purple-600" />,
            accentColor: 'from-purple-500/10 to-violet-500/10 border-purple-200',
            linkText: 'Ejecutar Test',
          },
        ];

      case 'redes':
        return [
          {
            id: 'net-youtube',
            title: 'YouTube',
            category: 'Canal Oficial',
            description: 'youtube.com/@Nexuslz_original',
            tag: '@Nexuslz_original',
            icon: <Youtube className="w-5 h-5 text-rose-600" />,
            accentColor: 'from-rose-500/10 to-red-500/10 border-rose-200',
            linkText: 'Abrir canal en YouTube',
            linkUrl: 'https://youtube.com/@Nexuslz_original',
          },
          {
            id: 'net-twitch',
            title: 'Twitch',
            category: 'Streaming en Directo',
            description: 'twitch.tv/nexuslz01',
            tag: 'nexuslz01',
            icon: <Twitch className="w-5 h-5 text-purple-600" />,
            accentColor: 'from-purple-500/10 to-violet-500/10 border-purple-200',
            linkText: 'Ver directos en Twitch',
            linkUrl: 'https://twitch.tv/nexuslz01',
          },
          {
            id: 'net-tiktok',
            title: 'TikTok',
            category: 'Vídeos Cortos',
            description: 'tiktok.com/@nexuslz',
            tag: '@nexuslz',
            icon: <Video className="w-5 h-5 text-teal-600" />,
            accentColor: 'from-teal-500/10 to-pink-500/10 border-teal-200',
            linkText: 'Ver perfil en TikTok',
            linkUrl: 'https://tiktok.com/@nexuslz',
          },
          {
            id: 'net-twitter',
            title: 'Twitter / X',
            category: 'Novedades y Anuncios',
            description: 'x.com/NexuslzYoutube',
            tag: '@NexuslzYoutube',
            icon: <Twitter className="w-5 h-5 text-sky-600" />,
            accentColor: 'from-sky-500/10 to-blue-500/10 border-sky-200',
            linkText: 'Seguir en X (Twitter)',
            linkUrl: 'https://x.com/NexuslzYoutube',
          },
          {
            id: 'net-discord',
            title: 'Discord',
            category: 'Servidor Oficial',
            description: 'discord.gg/qMFcBrHber',
            tag: 'Servidor Oficial',
            icon: <MessageSquare className="w-5 h-5 text-indigo-600" />,
            accentColor: 'from-indigo-500/10 to-violet-500/10 border-indigo-200',
            linkText: 'Unirse al servidor de Discord',
            linkUrl: 'https://discord.gg/qMFcBrHber',
          },
        ];
    }
  };

  const header = getHeaderInfo();
  const cards = getCards();
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

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

  // Si se selecciona un proyecto en la vista de proyectos, renderizar la página dedicada con animaciones
  if (view === 'proyectos' && selectedProjectId) {
    const activeProject = projects.find(p => p.id === selectedProjectId) || projects[0];
    return <ProjectDetailView project={activeProject} onBack={() => setSelectedProjectId(null)} />;
  }

  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-14 animate-in fade-in duration-300">
      {/* Top Bar with Back Button */}
      <div className="flex items-center justify-between gap-4 mb-8">
        <button
          type="button"
          id={`btn-back-from-${view}`}
          onClick={onBack}
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors cursor-pointer min-h-[44px]"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Volver a Inicio</span>
        </button>

        <span className="text-xs font-medium text-slate-500 px-3 py-1 rounded-full bg-slate-100 border border-slate-200">
          {header.badge}
        </span>
      </div>

      {/* Header Section */}
      <div className="mb-10 text-left">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2.5 rounded-xl bg-slate-100 border border-slate-200/80">
            {header.icon}
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {header.title}
          </h2>
        </div>
        <p className="text-sm sm:text-base text-slate-600 max-w-2xl">
          {header.subtitle}
        </p>
      </div>

      {/* Renderizado de Proyectos (Solo muestra el nombre y botón Ver) o Catálogo Regular */}
      {view === 'proyectos' ? (
        <div className="w-full max-w-2xl mx-auto space-y-4">
          {cards.map((card, idx) => (
            <motion.div
              key={card.id}
              id={`project-card-${card.id}`}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: idx * 0.08, ease: [0.16, 1, 0.3, 1] }}
              onClick={() => setSelectedProjectId(card.id)}
              className="group p-6 sm:p-7 rounded-2xl bg-white border border-slate-200 hover:border-indigo-300 shadow-xs hover:shadow-xl hover:shadow-indigo-500/10 transform transition-all duration-300 ease-out hover:scale-[1.01] cursor-pointer flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 text-left"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-200/80 flex items-center justify-center text-indigo-600 shadow-xs group-hover:scale-105 transition-transform shrink-0">
                  {card.icon}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900 group-hover:text-indigo-950 transition-colors">
                    {card.title}
                  </h3>
                </div>
              </div>

              <button
                type="button"
                id={`btn-ver-proyecto-${card.id}`}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedProjectId(card.id);
                }}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white text-xs sm:text-sm font-bold shadow-md shadow-indigo-600/20 hover:shadow-lg hover:shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer min-h-[44px]"
              >
                <span>Ver</span>
                <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
              </button>
            </motion.div>
          ))}
        </div>
      ) : (
        /* Cards Grid with Smooth Zoom Hover Effect for Redes and others */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
          {cards.map((card, idx) => (
            <motion.div
              key={card.id}
              id={`card-${card.id}`}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: idx * 0.08, ease: [0.16, 1, 0.3, 1] }}
              onClick={() => {
                if (card.downloadUrl) {
                  setDownloadTarget({
                    isOpen: true,
                    title: card.title,
                    url: card.downloadUrl,
                    waitTime: card.downloadSeconds || 3,
                  });
                } else if (card.linkUrl) {
                  window.open(card.linkUrl, '_blank', 'noopener,noreferrer');
                }
              }}
              className="group relative flex flex-col justify-between p-6 rounded-2xl bg-white border border-slate-200 hover:border-indigo-300/80 shadow-xs hover:shadow-xl hover:shadow-indigo-500/10 transform transition-all duration-300 ease-out hover:scale-[1.03] cursor-pointer overflow-hidden"
            >
              {/* Background subtle hover glow */}
              <div className={`absolute inset-0 bg-gradient-to-br ${card.accentColor} opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none`} />

              <div className="relative z-10">
                <div className="flex items-center justify-between gap-2 mb-4">
                  <div className="p-2.5 rounded-xl bg-slate-50 group-hover:bg-white border border-slate-200 group-hover:border-indigo-200 shadow-xs transform transition-transform duration-500 ease-out group-hover:scale-110">
                    {card.icon}
                  </div>
                  {card.tag && (
                    <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border transition-colors ${
                      card.downloadUrl
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-slate-100 group-hover:bg-indigo-50 text-slate-700 group-hover:text-indigo-700 border-slate-200 group-hover:border-indigo-200'
                    }`}>
                      {card.tag}
                    </span>
                  )}
                </div>

                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 block mb-1">
                  {card.category}
                </span>
                <h3 className="text-lg font-bold text-slate-900 group-hover:text-indigo-950 transition-colors mb-2">
                  {card.title}
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  {card.description}
                </p>
              </div>

              {/* Bottom Action Footer */}
              {card.downloadUrl ? (
                <div className="relative z-10 mt-6 pt-4 border-t border-slate-100 group-hover:border-slate-200/80 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700">
                    <Clock className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Espera de {card.downloadSeconds || 3} seg para descargar</span>
                  </div>
                  <button
                    type="button"
                    id={`btn-download-${card.id}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setDownloadTarget({
                        isOpen: true,
                        title: card.title,
                        url: card.downloadUrl!,
                        waitTime: card.downloadSeconds || 3,
                      });
                    }}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20 hover:shadow-lg hover:shadow-emerald-600/30 transition-all flex items-center justify-center gap-1.5 cursor-pointer min-h-[38px]"
                  >
                    <Download className="w-4 h-4" />
                    <span>Descargar</span>
                  </button>
                </div>
              ) : (
                <div className="relative z-10 mt-6 pt-4 border-t border-slate-100 group-hover:border-slate-200/80 flex items-center justify-between text-xs font-semibold text-indigo-600 group-hover:text-indigo-700 transition-colors">
                  <span>{card.linkText || 'Ver más'}</span>
                  <ExternalLink className="w-3.5 h-3.5 transform transition-transform duration-300 group-hover:translate-x-1" />
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}

      {/* Download Countdown Modal */}
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
