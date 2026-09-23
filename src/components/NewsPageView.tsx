import React from 'react';
import { 
  ArrowLeft, 
  Sparkles, 
  CheckCircle2, 
  Boxes, 
  FolderKanban, 
  Users, 
  Share2, 
  HelpCircle, 
  UserCheck
} from 'lucide-react';
import { motion } from 'motion/react';

interface NewsPageViewProps {
  onBack: () => void;
}

export const NewsPageView: React.FC<NewsPageViewProps> = ({ onBack }) => {
  const changelogPoints = [
    {
      title: 'Plataforma NexStudio',
      icon: <Boxes className="w-4 h-4 text-indigo-600" />,
      items: [
        'Lanzamiento oficial de la web con diseño moderno, rápido y adaptable a móviles y PC.',
        'Navegación sencilla mediante menú desplegable y accesos rápidos.'
      ]
    },
    {
      title: 'Proyectos y Recursos',
      icon: <FolderKanban className="w-4 h-4 text-violet-600" />,
      items: [
        'Publicación del Asistente Web con demostración interactiva en vivo.',
        'Visor de código integrado (HTML, CSS y JS) con copiado rápido y descarga en ZIP.'
      ]
    },
    {
      title: 'Comunidad',
      icon: <Users className="w-4 h-4 text-sky-600" />,
      items: [
        'Muro social para compartir posts, capturas y novedades.',
        'Sistema de interacciones con Me gusta y comentarios entre usuarios.'
      ]
    },
    {
      title: 'Redes',
      icon: <Share2 className="w-4 h-4 text-emerald-600" />,
      items: [
        'Acceso directo a la red oficial de YouTube NexStudio.',
        'Enlaces a todas las redes: YouTube, Twitch, TikTok, Twitter / X y Discord.'
      ]
    },
    {
      title: 'Cuentas de Usuario',
      icon: <UserCheck className="w-4 h-4 text-indigo-600" />,
      items: [
        'Registro e inicio de sesión rápido con Google o correo electrónico.',
        'Perfil personalizable con avatar, nombre de usuario y biografía.'
      ]
    },
    {
      title: 'Ayuda y Soporte',
      icon: <HelpCircle className="w-4 h-4 text-amber-600" />,
      items: [
        'Centro de ayuda con preguntas frecuentes y guías paso a paso.',
        'Canal de soporte y contacto para resolver dudas y reportes.'
      ]
    }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="w-full max-w-3xl mx-auto px-4 py-8 sm:py-12"
    >
      {/* Botón Volver */}
      <div className="mb-6">
        <button
          type="button"
          id="news-back-btn"
          onClick={onBack}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200/80 transition-all cursor-pointer min-h-[40px]"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Volver al inicio</span>
        </button>
      </div>

      {/* Cabecera Principal */}
      <div className="mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200/80 mb-3">
          <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
          <span>Novedades</span>
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          Noticias
        </h1>
        <p className="mt-1 text-slate-600 text-sm">
          Novedades y notas de versión de NexStudio.
        </p>
      </div>

      {/* Tarjeta de Actualización 1.0 */}
      <article className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        {/* Cabecera */}
        <div className="p-6 bg-gradient-to-r from-slate-50 via-indigo-50/20 to-slate-50 border-b border-slate-200/80 flex items-center justify-between">
          <div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900">
              Actualización 1.0
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Lanzamiento inicial de la plataforma
            </p>
          </div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold bg-indigo-600 text-white shadow-xs">
            <Sparkles className="w-3 h-3" />
            Versión 1.0
          </span>
        </div>

        {/* Lista resumida punto por punto */}
        <div className="p-6 sm:p-8 space-y-6">
          {changelogPoints.map((section) => (
            <div key={section.title} className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-md bg-slate-100 text-slate-700">
                  {section.icon}
                </span>
                <h3 className="text-sm font-bold text-slate-900">
                  {section.title}
                </h3>
              </div>
              <ul className="space-y-1.5 pl-7">
                {section.items.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-600">
                    <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600 shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </article>
    </motion.div>
  );
};
