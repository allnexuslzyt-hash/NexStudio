import React, { useState } from 'react';
import { 
  Boxes, 
  FolderKanban, 
  Palette, 
  Wrench, 
  HelpCircle,
  LogOut, 
  Menu, 
  X,
  ChevronDown,
  Globe,
  ExternalLink,
  Youtube,
  Twitch,
  Video,
  Twitter,
  MessageSquare,
  Settings,
  ShieldCheck,
  Sliders
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { useAdmin } from '../context/AdminContext';
import { DropdownMenu } from './DropdownMenu';
import { RedesDropdown } from './RedesDropdown';

interface NavbarProps {
  activeView?: string;
  onSelectView?: (view: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeView = 'workspace',
  onSelectView,
}) => {
  const { user, profile, loading, signInWithGoogle, signOut, authError, isAdmin } = useAuth();
  const { siteSettings } = useAdmin();
  const { openSettings } = useSettings();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [mobileRedesExpanded, setMobileRedesExpanded] = useState(false);

  // Exact items requested: Proyectos, Creaciones, Herramientas
  const menuItems = [
    {
      id: 'proyectos',
      label: 'Proyectos',
      description: 'Explora los proyectos',
      icon: <FolderKanban className="w-4 h-4" />,
      onClick: () => onSelectView?.('proyectos'),
    },
    {
      id: 'creaciones',
      label: 'Creaciones',
      description: 'Galería de creaciones',
      icon: <Palette className="w-4 h-4" />,
      onClick: () => onSelectView?.('creaciones'),
    },
    {
      id: 'herramientas',
      label: 'Herramientas',
      description: 'Colección de utilidades',
      icon: <Wrench className="w-4 h-4" />,
      onClick: () => onSelectView?.('herramientas'),
    },
  ];

  const socialLinks = [
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
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* Logo only (clicking returns to main page) */}
          <div className="flex items-center gap-3 sm:gap-4">
            <button 
              type="button"
              id="brand-logo-btn"
              onClick={() => onSelectView?.('workspace')}
              className="flex items-center group focus:outline-none cursor-pointer"
              aria-label="Ir a Inicio NexStudio"
            >
              <div className="relative flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-violet-600 to-amber-500 shadow-md shadow-indigo-600/20 group-hover:scale-105 transition-transform duration-200">
                <Boxes className="w-5 h-5 text-white" />
              </div>
            </button>

            {/* Desktop Navigation: Menú, Redes y Ayuda */}
            <nav className="hidden md:flex items-center gap-1.5">
              <DropdownMenu label="Menú" items={menuItems} />
              
              {/* Menú desplegable Redes con botón "Ver todas las redes" y sin descripciones */}
              <RedesDropdown />

              {/* Botón Ayuda al lado de Redes */}
              <button
                type="button"
                id="nav-btn-ayuda"
                onClick={() => onSelectView?.('ayuda')}
                className={`flex items-center gap-2 px-3.5 py-2 text-sm font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500/30 min-h-[44px] cursor-pointer ${
                  activeView === 'ayuda'
                    ? 'bg-slate-100 text-slate-900 font-semibold'
                    : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <HelpCircle className="w-3.5 h-3.5 text-indigo-600" />
                <span>Ayuda</span>
              </button>

              {/* Apartado Administrador exclusivo para allnexuslzyt@gmail.com / Administrador */}
              {isAdmin && (
                <button
                  type="button"
                  id="nav-btn-admin"
                  onClick={() => onSelectView?.('admin')}
                  className={`flex items-center gap-2 px-3.5 py-2 text-sm font-semibold rounded-xl transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500/30 min-h-[44px] cursor-pointer ${
                    activeView === 'admin'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200'
                  }`}
                  title="Centro de Mando de Administrador"
                >
                  <Sliders className="w-4 h-4 text-indigo-600 group-hover:rotate-12" />
                  <span>Centro de Mando</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-600" />
                </button>
              )}
            </nav>
          </div>

          {/* Right Action & Authentication Controls */}
          <div className="flex items-center gap-3">
            {/* Indicador de Estado en Tiempo Real en Cabecera: Verde = PÚBLICA, Rojo = CERRADA AL PÚBLICO */}
            <div 
              className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold tracking-wide border select-none transition-colors ${
                siteSettings.maintenanceMode
                  ? 'bg-rose-50 border-rose-200 text-rose-700'
                  : 'bg-emerald-50 border-emerald-200 text-emerald-700'
              }`}
              title={siteSettings.maintenanceMode ? 'La web está en modo mantenimiento (cerrada)' : 'La web está pública y en línea para todos'}
            >
              <span className="relative flex h-2 w-2">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                  siteSettings.maintenanceMode ? 'bg-rose-400' : 'bg-emerald-400'
                }`}></span>
                <span className={`relative inline-flex rounded-full h-2 w-2 ${
                  siteSettings.maintenanceMode ? 'bg-rose-600' : 'bg-emerald-600'
                }`}></span>
              </span>
              <span>{siteSettings.maintenanceMode ? 'CERRADA AL PÚBLICO' : 'PÚBLICA'}</span>
            </div>

            {loading ? (
              <div className="h-9 w-28 bg-slate-100 animate-pulse rounded-lg" />
            ) : user ? (
              <div className="flex items-center gap-2">
                {/* Botón con el icono de configuración SOLO cuando estás registrado (a la izquierda del círculo alargado) */}
                <button
                  type="button"
                  id="nav-btn-settings"
                  onClick={openSettings}
                  className="p-2.5 rounded-full bg-slate-50 border border-slate-200 hover:border-slate-300 hover:bg-slate-100 text-slate-700 transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500/30 min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer shadow-xs group"
                  aria-label="Configuración de la cuenta"
                  title="Configuración"
                >
                  <Settings className="w-4 h-4 text-slate-600 group-hover:rotate-45 transition-transform duration-300" />
                </button>

                {/* El círculo alargado de perfil */}
                <div className="relative">
                  <button
                    type="button"
                    id="user-profile-btn"
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center gap-2.5 p-1.5 pr-3 rounded-full bg-slate-50 border border-slate-200 hover:border-slate-300 hover:bg-slate-100 transition-all focus:outline-none min-h-[44px] cursor-pointer"
                  >
                    <img
                      src={profile?.photoURL || user.photoURL || `https://api.dicebear.com/7.x/identicon/svg?seed=${user.uid}`}
                      alt={user.displayName || 'Usuario'}
                      className="w-7 h-7 rounded-full bg-indigo-100 object-cover border border-indigo-200"
                    />
                    <span className="text-xs font-semibold text-slate-700 max-w-[120px] truncate hidden sm:inline">
                      {profile?.displayName?.split(' ')[0] || user.displayName?.split(' ')[0] || 'Mi Perfil'}
                    </span>
                  </button>

                  {/* Profile Popup */}
                  {userMenuOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-xl shadow-xl z-50 p-2 divide-y divide-slate-100 animate-in fade-in zoom-in-95 duration-150">
                      <div className="px-3 py-2.5">
                        <p className="text-xs font-bold text-slate-900 truncate">
                          {profile?.displayName || user.displayName || 'Usuario Registrado'}
                        </p>
                        <p className="text-xs text-slate-500 truncate mt-0.5">
                          {user.email}
                        </p>
                        <div className="mt-2.5 flex items-center gap-2">
                          <span className="text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Autenticado
                          </span>
                          {isAdmin && (
                            <span className="text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
                              Admin
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="py-1">
                        {isAdmin && (
                          <button
                            type="button"
                            id="user-item-admin"
                            onClick={() => {
                              setUserMenuOpen(false);
                              onSelectView?.('admin');
                            }}
                            className="w-full px-3 py-2 text-left text-sm text-indigo-700 hover:bg-indigo-50 font-semibold rounded-lg flex items-center gap-2.5 transition-colors min-h-[44px] cursor-pointer"
                          >
                            <Sliders className="w-4 h-4 text-indigo-600" />
                            <span>Centro de Mando</span>
                          </button>
                        )}
                        <button
                          type="button"
                          id="user-item-settings"
                          onClick={() => {
                            setUserMenuOpen(false);
                            openSettings();
                          }}
                          className="w-full px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-100 rounded-lg flex items-center gap-2.5 transition-colors min-h-[44px] cursor-pointer"
                        >
                          <Settings className="w-4 h-4 text-slate-500" />
                          <span>Configuración</span>
                        </button>
                        <button
                          type="button"
                          id="user-item-signout"
                          onClick={() => {
                            setUserMenuOpen(false);
                            signOut();
                          }}
                          className="w-full px-3 py-2 text-left text-sm text-rose-600 hover:bg-rose-50 rounded-lg flex items-center gap-2.5 transition-colors min-h-[44px] cursor-pointer"
                        >
                          <LogOut className="w-4 h-4" />
                          <span>Cerrar Sesión</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <button
                type="button"
                id="btn-google-login"
                onClick={signInWithGoogle}
                className="flex items-center gap-2 px-3.5 py-2 text-sm font-semibold text-slate-900 bg-white hover:bg-slate-50 active:scale-98 rounded-xl shadow-xs border border-slate-200 hover:border-slate-300 transition-all focus:outline-none min-h-[44px] cursor-pointer"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.98 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                  />
                </svg>
                <span>Iniciar sesión</span>
              </button>
            )}

            {/* Mobile Hamburger Button */}
            <button
              type="button"
              id="mobile-menu-toggle"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
              aria-label="Abrir menú"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 py-4 space-y-3 animate-in slide-in-from-top-4 duration-200">
          <div className="space-y-1">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-3 py-1">
              Menú
            </p>
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  item.onClick();
                  setMobileMenuOpen(false);
                }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-700 hover:bg-slate-100 transition-colors min-h-[44px] cursor-pointer"
              >
                <span className="text-indigo-600">{item.icon}</span>
                <span>{item.label}</span>
              </button>
            ))}

            {/* Redes desplegable en móvil */}
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-3 pt-3 pb-1">
              Redes
            </p>
            <button
              type="button"
              onClick={() => setMobileRedesExpanded(!mobileRedesExpanded)}
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-100 transition-colors min-h-[44px] cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <span className="text-indigo-600"><Globe className="w-4 h-4" /></span>
                <span>Ver todas las redes</span>
              </div>
              <ChevronDown
                className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
                  mobileRedesExpanded ? 'rotate-180 text-indigo-600' : ''
                }`}
              />
            </button>

            {mobileRedesExpanded && (
              <div className="pl-4 space-y-0.5 pt-1">
                {socialLinks.map((net) => (
                  <button
                    key={net.id}
                    onClick={() => {
                      window.open(net.url, '_blank', 'noopener,noreferrer');
                      setMobileMenuOpen(false);
                    }}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors min-h-[40px] cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      <span>{net.icon}</span>
                      <span>{net.name}</span>
                    </div>
                    <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                  </button>
                ))}
              </div>
            )}

            {/* Opción Ayuda en móvil */}
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-3 pt-3 pb-1">
              Soporte
            </p>
            <button
              type="button"
              onClick={() => {
                onSelectView?.('ayuda');
                setMobileMenuOpen(false);
              }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-700 hover:bg-slate-100 transition-colors min-h-[44px] cursor-pointer"
            >
              <HelpCircle className="w-4 h-4 text-indigo-600" />
              <span>Ayuda</span>
            </button>

            {user && (
              <>
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-3 pt-3 pb-1">
                  Configuración y Cuenta
                </p>
                {isAdmin && (
                  <button
                    type="button"
                    id="mobile-admin-btn"
                    onClick={() => {
                      onSelectView?.('admin');
                      setMobileMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold text-indigo-700 bg-indigo-50/70 hover:bg-indigo-100 transition-colors min-h-[44px] cursor-pointer"
                  >
                    <Sliders className="w-4 h-4 text-indigo-600" />
                    <span>Centro de Mando (Admin)</span>
                  </button>
                )}
                <button
                  type="button"
                  id="mobile-settings-btn"
                  onClick={() => {
                    openSettings();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-700 hover:bg-slate-100 transition-colors min-h-[44px] cursor-pointer"
                >
                  <Settings className="w-4 h-4 text-indigo-600" />
                  <span>Configuración</span>
                </button>
                <button
                  type="button"
                  id="mobile-signout-btn"
                  onClick={() => {
                    signOut();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-rose-600 hover:bg-rose-50 transition-colors min-h-[44px] cursor-pointer"
                >
                  <LogOut className="w-4 h-4 text-rose-600" />
                  <span>Cerrar Sesión</span>
                </button>
              </>
            )}
          </div>

          {!user && (
            <div className="pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  signInWithGoogle();
                  setMobileMenuOpen(false);
                }}
                className="w-full flex items-center justify-center gap-2.5 px-4 py-3 bg-slate-900 text-white font-bold rounded-xl min-h-[44px] cursor-pointer"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.98 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                  />
                </svg>
                <span>Iniciar sesión</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Auth Error Banner */}
      {authError && (
        <div className="w-full bg-rose-50 border-b border-rose-200 px-4 py-2 text-center text-xs text-rose-700 flex items-center justify-center gap-3">
          <span>{authError}</span>
          <button 
            type="button" 
            onClick={() => useAuth().clearAuthError()}
            className="underline hover:text-rose-900 font-medium cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      )}
    </header>
  );
};
