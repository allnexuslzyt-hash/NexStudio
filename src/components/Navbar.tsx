import React, { useState } from 'react';
import { 
  Boxes, 
  Sparkles, 
  Layers, 
  LogOut, 
  Menu, 
  X, 
  Sliders,
  CheckCircle2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { DropdownMenu } from './DropdownMenu';

interface NavbarProps {
  activeView?: string;
  onSelectView?: (view: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeView = 'workspace',
  onSelectView,
}) => {
  const { user, profile, loading, signInWithGoogle, signOut, authError } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const menuItems = [
    {
      id: 'workspace',
      label: 'Espacio de Trabajo',
      description: 'Lienzo principal de NexStudio',
      icon: <Layers className="w-4 h-4" />,
      onClick: () => onSelectView?.('workspace'),
    },
    {
      id: 'settings',
      label: 'Configuración',
      description: 'Preferencias del entorno',
      icon: <Sliders className="w-4 h-4" />,
      onClick: () => onSelectView?.('settings'),
    },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/85 backdrop-blur-xl">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* Logo & Brand Identity */}
          <div className="flex items-center gap-6">
            <a 
              href="#" 
              id="brand-logo"
              className="flex items-center gap-3 group focus:outline-none"
            >
              <div className="relative flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-violet-600 to-amber-500 shadow-md shadow-indigo-600/30 group-hover:scale-105 transition-transform duration-200">
                <Boxes className="w-5 h-5 text-white" />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold tracking-tight text-white group-hover:text-indigo-300 transition-colors">
                  NexStudio
                </span>
                <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  Online
                </span>
              </div>
            </a>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1">
              <DropdownMenu label="Menú" items={menuItems} />
            </nav>
          </div>

          {/* Right Action & Authentication Controls */}
          <div className="flex items-center gap-3">
            {loading ? (
              <div className="h-9 w-28 bg-slate-800/60 animate-pulse rounded-lg" />
            ) : user ? (
              <div className="relative">
                <button
                  type="button"
                  id="user-profile-btn"
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2.5 p-1.5 pr-3 rounded-full bg-slate-900 border border-slate-800 hover:border-slate-700 hover:bg-slate-800/80 transition-all focus:outline-none min-h-[44px]"
                >
                  <img
                    src={profile?.photoURL || user.photoURL || `https://api.dicebear.com/7.x/identicon/svg?seed=${user.uid}`}
                    alt={user.displayName || 'Usuario'}
                    referrerPolicy="no-referrer"
                    className="w-8 h-8 rounded-full object-cover border border-indigo-500/40"
                  />
                  <div className="hidden sm:flex flex-col text-left">
                    <span className="text-xs font-semibold text-white truncate max-w-[140px]">
                      {user.displayName?.split(' ')[0] || 'Usuario'}
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium leading-none">
                      {user.email}
                    </span>
                  </div>
                </button>

                {/* User Dropdown Menu */}
                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-72 rounded-xl bg-slate-900 border border-slate-800 shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95">
                    <div className="p-3 border-b border-slate-800/80">
                      <p className="text-sm font-semibold text-white truncate">
                        {user.displayName || 'Usuario'}
                      </p>
                      <p className="text-xs text-slate-400 truncate mt-0.5">
                        {user.email}
                      </p>
                      <div className="mt-2.5 flex items-center gap-2">
                        <span className="text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          Autenticado
                        </span>
                      </div>
                    </div>

                    <div className="py-1">
                      <button
                        type="button"
                        id="user-item-signout"
                        onClick={() => {
                          setUserMenuOpen(false);
                          signOut();
                        }}
                        className="w-full px-3 py-2 text-left text-sm text-rose-400 hover:bg-rose-500/10 rounded-lg flex items-center gap-2.5 transition-colors min-h-[44px]"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Cerrar Sesión</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <button
                type="button"
                id="btn-google-login"
                onClick={signInWithGoogle}
                className="flex items-center gap-2.5 px-4 py-2 text-sm font-semibold text-slate-900 bg-white hover:bg-slate-100 active:scale-98 rounded-xl shadow-sm hover:shadow-md transition-all focus:outline-none focus:ring-2 focus:ring-white/40 min-h-[44px]"
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
                <span className="hidden sm:inline">Iniciar sesión con Google</span>
                <span className="sm:hidden">Acceder</span>
              </button>
            )}

            {/* Mobile Hamburger Button */}
            <button
              type="button"
              id="mobile-menu-toggle"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
              aria-label="Abrir menú"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-800 bg-slate-950 px-4 py-4 space-y-3 animate-in slide-in-from-top-4 duration-200">
          <div className="space-y-1">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  item.onClick();
                  setMobileMenuOpen(false);
                }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-200 hover:bg-slate-800 transition-colors min-h-[44px]"
              >
                <span className="text-indigo-400">{item.icon}</span>
                <span>{item.label}</span>
              </button>
            ))}
          </div>

          {!user && (
            <div className="pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => {
                  signInWithGoogle();
                  setMobileMenuOpen(false);
                }}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white text-slate-950 font-bold rounded-xl min-h-[44px]"
              >
                <span>Acceder con Google</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Auth Error Banner */}
      {authError && (
        <div className="w-full bg-rose-950/80 border-b border-rose-800/80 px-4 py-2 text-center text-xs text-rose-200 flex items-center justify-center gap-3">
          <span>{authError}</span>
          <button 
            type="button" 
            onClick={() => useAuth().clearAuthError()}
            className="underline hover:text-white font-medium"
          >
            Cerrar
          </button>
        </div>
      )}
    </header>
  );
};
