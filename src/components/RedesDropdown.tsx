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
  MessageSquare,
  BadgeCheck
} from 'lucide-react';

interface RedesDropdownProps {
  className?: string;
}

export const RedesDropdown: React.FC<RedesDropdownProps> = ({ className = '' }) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [isOfficialExpanded, setIsOfficialExpanded] = useState<boolean>(false);
  const [isListExpanded, setIsListExpanded] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setIsOfficialExpanded(false);
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

  const officialNetworks = [
    {
      id: 'youtube-nexstudio',
      name: 'YouTube NexStudio',
      url: 'https://www.youtube.com/@NexStudio-Nexuslz',
      icon: <Youtube className="w-4 h-4 text-rose-600" />,
      badge: 'Oficial'
    },
  ];

  const generalNetworks = [
    {
      id: 'youtube',
      name: 'YouTube (Nexuslz)',
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
          const nextState = !isOpen;
          setIsOpen(nextState);
          if (!nextState) {
            setIsOfficialExpanded(false);
            setIsListExpanded(false);
          }
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
          className="absolute left-0 mt-2 w-72 origin-top-left rounded-xl bg-white border border-slate-200 shadow-xl focus:outline-none z-50 p-2 animate-in fade-in zoom-in-95 duration-150 space-y-1"
        >
          {/* SECCIÓN 1: Redes Oficiales */}
          <div className="rounded-lg bg-slate-50/70 border border-slate-100 p-1">
            <button
              type="button"
              id="toggle-redes-oficiales-btn"
              onClick={() => setIsOfficialExpanded(!isOfficialExpanded)}
              className="w-full text-left px-2.5 py-2 rounded-lg flex items-center justify-between hover:bg-indigo-50/50 transition-colors text-sm font-semibold text-slate-800 group cursor-pointer min-h-[40px]"
            >
              <div className="flex items-center gap-2.5">
                <span className="p-1 rounded-md bg-indigo-50 text-indigo-600 group-hover:bg-indigo-100 transition-colors">
                  <BadgeCheck className="w-4 h-4" />
                </span>
                <span>Redes Oficiales</span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-100/70 text-indigo-700 ml-1">
                  Oficial
                </span>
              </div>
              <ChevronDown
                className={`w-4 h-4 text-slate-400 group-hover:text-indigo-600 transition-transform duration-200 ${
                  isOfficialExpanded ? 'rotate-180 text-indigo-600' : ''
                }`}
              />
            </button>

            {/* Lista de redes oficiales desplegada */}
            {isOfficialExpanded && (
              <div className="mt-1 pt-1 border-t border-slate-200/60 space-y-1 animate-in slide-in-from-top-2 duration-150">
                {officialNetworks.map((net) => (
                  <button
                    key={net.id}
                    type="button"
                    id={`redes-item-${net.id}`}
                    onClick={() => {
                      window.open(net.url, '_blank', 'noopener,noreferrer');
                      setIsOpen(false);
                      setIsOfficialExpanded(false);
                    }}
                    className="w-full text-left px-2.5 py-2 rounded-lg flex items-center justify-between hover:bg-white transition-colors group cursor-pointer min-h-[40px]"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="p-1.5 rounded-md bg-white border border-slate-200/60 shadow-xs group-hover:bg-slate-50 transition-colors">
                        {net.icon}
                      </span>
                      <span className="text-xs font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">
                        {net.name}
                      </span>
                    </div>
                    <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-600" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* SECCIÓN 2: Ver todas las redes */}
          <div className="rounded-lg p-1">
            <button
              type="button"
              id="toggle-redes-list-btn"
              onClick={() => setIsListExpanded(!isListExpanded)}
              className="w-full text-left px-2.5 py-2 rounded-lg flex items-center justify-between hover:bg-slate-50 transition-colors text-sm font-medium text-slate-800 group cursor-pointer min-h-[40px]"
            >
              <div className="flex items-center gap-2.5">
                <span className="p-1 rounded-md bg-slate-100 text-slate-600 group-hover:bg-slate-200/70 transition-colors">
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

            {/* Lista de redes: SOLO aparece si se pulsa "Ver todas las redes" */}
            {isListExpanded && (
              <div className="mt-1 pt-1 border-t border-slate-100 space-y-0.5 animate-in slide-in-from-top-2 duration-150">
                {generalNetworks.map((net) => (
                  <button
                    key={net.id}
                    type="button"
                    id={`redes-item-${net.id}`}
                    onClick={() => {
                      window.open(net.url, '_blank', 'noopener,noreferrer');
                      setIsOpen(false);
                      setIsListExpanded(false);
                    }}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between hover:bg-slate-50 transition-colors text-xs text-slate-700 hover:text-slate-900 group cursor-pointer min-h-[38px]"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="p-1 rounded-md bg-slate-100 group-hover:bg-slate-200/70 transition-colors">
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
        </div>
      )}
    </div>
  );
};
