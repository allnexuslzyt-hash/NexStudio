import React, { useState, useRef, useEffect } from 'react';
import { 
  Share2, 
  ChevronDown, 
  Globe, 
  ExternalLink,
  Youtube,
  Twitch,
  Video,
  Twitter,
  MessageSquare
} from 'lucide-react';

interface RedesDropdownProps {
  className?: string;
}

export const RedesDropdown: React.FC<RedesDropdownProps> = ({ className = '' }) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [isListExpanded, setIsListExpanded] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setIsListExpanded(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, []);

  const networks = [
    {
      id: 'youtube',
      name: 'YouTube',
      url: 'https://youtube.com/@Nexuslz_original',
      icon: <Youtube className="w-4 h-4 text-rose-600" />,
    },
    {
      id: 'twitch',
      name: 'Twitch',
      url: 'https://twitch.tv/nexuslz01',
      icon: <Twitch className="w-4 h-4 text-purple-600" />,
    },
    {
      id: 'tiktok',
      name: 'TikTok',
      url: 'https://tiktok.com/@nexuslz',
      icon: <Video className="w-4 h-4 text-teal-600" />,
    },
    {
      id: 'twitter',
      name: 'Twitter / X',
      url: 'https://x.com/NexuslzYoutube',
      icon: <Twitter className="w-4 h-4 text-sky-600" />,
    },
    {
      id: 'discord',
      name: 'Discord',
      url: 'https://discord.gg/qMFcBrHber',
      icon: <MessageSquare className="w-4 h-4 text-indigo-600" />,
    },
  ];

  return (
    <div ref={containerRef} className={`relative inline-block text-left ${className}`}>
      {/* Botón principal Redes */}
      <button
        type="button"
        id="dropdown-btn-redes"
        onClick={() => {
          setIsOpen(!isOpen);
          // Si se cierra el menú, restablecer expansión
          if (isOpen) setIsListExpanded(false);
        }}
        aria-expanded={isOpen}
        className="flex items-center gap-2 px-3.5 py-2 text-sm font-medium text-slate-700 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500/30 min-h-[44px] cursor-pointer"
      >
        <span className="text-indigo-600">
          <Share2 className="w-3.5 h-3.5" />
        </span>
        <span>Redes</span>
        <ChevronDown
          className={`w-4 h-4 text-slate-500 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-indigo-600' : ''
          }`}
        />
      </button>

      {/* Menú desplegable */}
      {isOpen && (
        <div 
          id="redes-dropdown-menu"
          className="absolute left-0 mt-2 w-64 origin-top-left rounded-xl bg-white border border-slate-200 shadow-xl focus:outline-none z-50 p-2 animate-in fade-in zoom-in-95 duration-150"
        >
          {/* Elemento interactivo para desplegar todas las redes */}
          <button
            type="button"
            id="toggle-redes-list-btn"
            onClick={() => setIsListExpanded(!isListExpanded)}
            className="w-full text-left px-3 py-2.5 rounded-lg flex items-center justify-between hover:bg-slate-50 transition-colors text-sm font-medium text-slate-800 group cursor-pointer min-h-[44px]"
          >
            <div className="flex items-center gap-2.5">
              <span className="p-1.5 rounded-md bg-indigo-50 text-indigo-600 group-hover:bg-indigo-100/70 transition-colors">
                <Globe className="w-4 h-4" />
              </span>
              <span>Ver todas las redes</span>
            </div>
            <ChevronDown
              className={`w-4 h-4 text-slate-400 group-hover:text-slate-700 transition-transform duration-200 ${
                isListExpanded ? 'rotate-180 text-indigo-600' : ''
              }`}
            />
          </button>

          {/* Lista de redes: SOLO aparece si se pulsa la flecha/desplegable de "Ver todas las redes" */}
          {isListExpanded && (
            <div className="mt-1 pt-1 border-t border-slate-100 space-y-0.5 animate-in slide-in-from-top-2 duration-150">
              {networks.map((net) => (
                <button
                  key={net.id}
                  type="button"
                  id={`redes-item-${net.id}`}
                  onClick={() => {
                    window.open(net.url, '_blank', 'noopener,noreferrer');
                    setIsOpen(false);
                    setIsListExpanded(false);
                  }}
                  className="w-full text-left px-3 py-2 rounded-lg flex items-center justify-between hover:bg-slate-50 transition-colors text-xs sm:text-sm text-slate-700 hover:text-slate-900 group cursor-pointer min-h-[40px]"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="p-1.5 rounded-md bg-slate-100 group-hover:bg-slate-200/70 transition-colors">
                      {net.icon}
                    </span>
                    <span className="font-semibold text-slate-800">{net.name}</span>
                  </div>
                  <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
