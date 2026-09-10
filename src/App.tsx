import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SettingsProvider } from './context/SettingsContext';
import { AdminProvider, useAdmin } from './context/AdminContext';
import { SupportProvider } from './context/SupportContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { TermsModal } from './components/TermsModal';
import { FirstTimeConsentModal } from './components/FirstTimeConsentModal';
import { SignInPromptBanner } from './components/SignInPromptBanner';
import { CatalogView } from './components/CatalogView';
import { BlankPageView } from './components/BlankPageView';
import { HelpPageView } from './components/HelpPageView';
import { SettingsModal } from './components/SettingsModal';
import { GlobalBanner } from './components/GlobalBanner';
import { MaintenanceScreen } from './components/MaintenanceScreen';
import { BannedScreen } from './components/BannedScreen';
import { AdminCommandCenter } from './components/AdminCommandCenter';
import { UnauthorizedDomainModal } from './components/UnauthorizedDomainModal';
import { OnboardingModal } from './components/OnboardingModal';
import { SupportChatModal } from './components/SupportChatModal';
import { motion } from 'motion/react';
import { Boxes } from 'lucide-react';

const WorkspaceContent: React.FC = () => {
  const { user, isBanned, unauthorizedDomain, setUnauthorizedDomain } = useAuth();
  const { siteSettings, isAdmin } = useAdmin();
  const [activeView, setActiveView] = useState<string>('workspace');
  const [isTermsOpen, setIsTermsOpen] = useState<boolean>(false);

  // Vistas de página blanca requeridas por el usuario hasta que defina contenido
  const isBlankView = ['proyectos', 'creaciones', 'herramientas'].includes(activeView);

  // Si el usuario está baneado o suspendido activamente, bloquear totalmente el acceso a la web y mostrar BannedScreen
  if (isBanned) {
    return (
      <>
        <BannedScreen />
        <UnauthorizedDomainModal
          domain={unauthorizedDomain || ''}
          isOpen={Boolean(unauthorizedDomain)}
          onClose={() => setUnauthorizedDomain(null)}
        />
      </>
    );
  }

  // Si el interruptor de cierre global (Kill Switch) está activo y el usuario no es admin, bloquear inmediatamente
  if (siteSettings.maintenanceMode && !isAdmin) {
    return (
      <>
        <MaintenanceScreen onOpenAdminPanel={() => setActiveView('admin')} />
        <UnauthorizedDomainModal
          domain={unauthorizedDomain || ''}
          isOpen={Boolean(unauthorizedDomain)}
          onClose={() => setUnauthorizedDomain(null)}
        />
      </>
    );
  }

  return (
    <div className="w-full min-h-screen flex flex-col bg-white text-slate-900 selection:bg-indigo-600 selection:text-white">
      {/* Aviso / Banner Global en la parte superior del sitio */}
      <GlobalBanner />

      {/* 100% Viewport Header */}
      <Navbar
        activeView={activeView}
        onSelectView={(view) => setActiveView(view)}
      />

      {/* Floating Animated Slide-down Sign In Prompt Banner */}
      <SignInPromptBanner />

      {/* Main Content Area */}
      <main className="w-full flex-1 flex flex-col items-center justify-center p-4 sm:p-8 relative overflow-hidden bg-white">
        {activeView === 'admin' ? (
          /* Centro de Mando de Administrador (Exclusivo allnexuslzyt@gmail.com / SuperAdmin) */
          <AdminCommandCenter onBack={() => setActiveView('workspace')} />
        ) : activeView === 'ayuda' ? (
          /* Centro de Ayuda completo con buscador en tiempo real, categorías, FAQs, guías y contacto */
          <HelpPageView onBack={() => setActiveView('workspace')} />
        ) : isBlankView ? (
          /* Página completamente blanca para Proyectos, Creaciones y Herramientas */
          <BlankPageView 
            view={activeView} 
            onBack={() => setActiveView('workspace')} 
          />
        ) : activeView === 'redes' ? (
          <CatalogView 
            view="redes" 
            onBack={() => setActiveView('workspace')} 
          />
        ) : (
          /* Página Principal (Workspace) */
          <>
            {/* Subtle Ambient Background Gradients */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-indigo-50/60 blur-[100px]" />
              <div className="absolute -bottom-40 right-1/4 w-[500px] h-[500px] rounded-full bg-amber-50/50 blur-[120px]" />
            </div>

            {/* Main Hero / Title Container */}
            <motion.div 
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="relative z-10 w-full max-w-3xl text-center flex flex-col items-center justify-center py-16 px-4"
            >
              {/* Logo pequeño a la izquierda del título en grande */}
              <div className="flex items-center justify-center gap-3 sm:gap-4 mb-3">
                <div className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 via-violet-600 to-amber-500 shadow-md shadow-indigo-600/20 shrink-0">
                  <Boxes className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight">
                  NexStudio
                </h1>
              </div>

              {/* Subtítulo exacto */}
              <p className="text-base sm:text-lg text-slate-600 font-normal max-w-xl mx-auto leading-relaxed">
                Todos mis proyectos, funciones, archivos y mucho mas.
              </p>

              {user && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.15 }}
                  className="mt-6 px-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 flex items-center gap-2 shadow-xs"
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  <span>Conectado como <strong className="text-slate-900">{user.displayName || user.email}</strong></span>
                </motion.div>
              )}
            </motion.div>
          </>
        )}
      </main>

      {/* Full-width Footer with Términos y Condiciones */}
      <Footer onOpenTerms={() => setIsTermsOpen(true)} />

      {/* Modal de Configuración y Personalización */}
      <SettingsModal onOpenAdminCommandCenter={() => setActiveView('admin')} />

      {/* Modal de Términos y Condiciones bajo demanda */}
      <TermsModal
        isOpen={isTermsOpen}
        onClose={() => setIsTermsOpen(false)}
      />

      {/* Modal Obligatorio de Primera Visita (Cookies, Privacidad y Términos) */}
      <FirstTimeConsentModal />

      {/* Modal de Bienvenida / Onboarding inicial (Nombre visible, @usuario estricto y avatar) */}
      <OnboardingModal />

      {/* Modal de Chat de Soporte Técnico para usuarios */}
      <SupportChatModal />

      {/* Modal Informativo y de Acceso Inmediato por auth/unauthorized-domain */}
      <UnauthorizedDomainModal
        domain={unauthorizedDomain || ''}
        isOpen={Boolean(unauthorizedDomain)}
        onClose={() => setUnauthorizedDomain(null)}
      />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <AdminProvider>
        <SupportProvider>
          <SettingsProvider>
            <WorkspaceContent />
          </SettingsProvider>
        </SupportProvider>
      </AdminProvider>
    </AuthProvider>
  );
}

