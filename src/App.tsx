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
import { LaunchScreen } from './components/LaunchScreen';
import { BannedScreen } from './components/BannedScreen';
import { TorBlockedScreen } from './components/TorBlockedScreen';
import { AdminCommandCenter } from './components/AdminCommandCenter';
import { UnauthorizedDomainModal } from './components/UnauthorizedDomainModal';
import { OnboardingModal } from './components/OnboardingModal';
import { SupportPageView } from './components/SupportPageView';
import { CommunityFeedView } from './components/CommunityFeedView';
import { NewsPageView } from './components/NewsPageView';
import { useSupport } from './context/SupportContext';
import { motion } from 'motion/react';
import { Boxes } from 'lucide-react';

const WorkspaceContent: React.FC = () => {
  const { user, isBanned, unauthorizedDomain, setUnauthorizedDomain } = useAuth();
  const { siteSettings, isAdmin } = useAdmin();
  const { supportPageRequested, clearSupportPageRequest } = useSupport();
  const [activeView, setActiveView] = useState<string>('workspace');
  const [isTermsOpen, setIsTermsOpen] = useState<boolean>(false);
  const [visitorUnlockedLaunch, setVisitorUnlockedLaunch] = useState<boolean>(false);
  const [torCheckResult, setTorCheckResult] = useState<{ isTor: boolean; clientIp: string } | null>(null);

  // Verificación perimetral de seguridad IP (nodos de salida Tor / Proxies de evasión)
  const checkTorSecurity = React.useCallback(async () => {
    try {
      const res = await fetch('/api/security/ip-check');
      if (res.ok) {
        const data = await res.json();
        setTorCheckResult({
          isTor: Boolean(data.isTor),
          clientIp: data.clientIp || ''
        });
      }
    } catch {
      // Si falla la red o el servicio, no bloquear a usuarios legítimos (Fail-open)
      setTorCheckResult({ isTor: false, clientIp: '' });
    }
  }, []);

  React.useEffect(() => {
    checkTorSecurity();
  }, [checkTorSecurity]);

  // Escuchar si se solicitó la página de soporte desde cualquier botón o acción
  React.useEffect(() => {
    if (supportPageRequested) {
      setActiveView('soporte');
      clearSupportPageRequest();
    }
  }, [supportPageRequested, clearSupportPageRequest]);

  // Vistas de página blanca requeridas por el usuario hasta que defina contenido (creaciones y herramientas pendientes)
  const isBlankView = ['creaciones', 'herramientas'].includes(activeView);

  // Si el usuario está navegando a través de la Red Tor y el bloqueo perimetral está activo:
  const securityConfig = siteSettings.securityConfig;
  const isTorBlockingEnabled = securityConfig ? securityConfig.blockTorExitNodes !== false : true;
  const allowAdminTorBypass = securityConfig?.allowAdminBypass ?? true;
  const isBlockedByTor = Boolean(torCheckResult?.isTor) && isTorBlockingEnabled && !(isAdmin && allowAdminTorBypass);

  if (isBlockedByTor) {
    return (
      <>
        <TorBlockedScreen clientIp={torCheckResult?.clientIp} onRetry={checkTorSecurity} />
        <UnauthorizedDomainModal
          domain={unauthorizedDomain || ''}
          isOpen={Boolean(unauthorizedDomain)}
          onClose={() => setUnauthorizedDomain(null)}
        />
      </>
    );
  }

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

  // Si el Modo En Lanzamiento está activo:
  const launchConfig = siteSettings.launchMode;
  const isLaunchActive = Boolean(launchConfig?.enabled);
  const allowAdminBypass = Boolean(launchConfig?.allowAdminBypass ?? true);

  if (isLaunchActive && !(isAdmin && allowAdminBypass)) {
    // Comprobar si la cuenta atrás ya finalizó y se permite entrar
    const isPaused = Boolean(launchConfig?.isPaused);
    const targetMs = Number(launchConfig?.targetTimestampMs) || (launchConfig?.targetDate ? new Date(launchConfig.targetDate).getTime() : 0);
    const isFinished = !isPaused && targetMs > 0 && targetMs <= Date.now();

    // Si ya terminó y el visitante pulsó en entrar: permitir acceso normal
    if (isFinished && visitorUnlockedLaunch && (launchConfig?.autoUnlockOnFinish ?? true)) {
      // Dejar pasar a la web
    } else {
      return (
        <>
          <LaunchScreen 
            onOpenAdminPanel={() => setActiveView('admin')}
            onUnlocked={() => setVisitorUnlockedLaunch(true)}
          />
          <UnauthorizedDomainModal
            domain={unauthorizedDomain || ''}
            isOpen={Boolean(unauthorizedDomain)}
            onClose={() => setUnauthorizedDomain(null)}
          />
        </>
      );
    }
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
      <main className={`w-full flex-1 flex flex-col relative bg-white ${
        activeView === 'comunidad' || activeView === 'soporte' || activeView === 'ayuda' || activeView === 'proyectos' || activeView === 'admin' || activeView === 'noticias'
          ? 'p-0 items-stretch justify-start' 
          : 'items-center justify-center p-4 sm:p-8 overflow-x-hidden'
      }`}>
        {activeView === 'admin' ? (
          /* Centro de Mando de Administrador (Exclusivo allnexuslzyt@gmail.com / SuperAdmin) */
          <AdminCommandCenter onBack={() => setActiveView('workspace')} />
        ) : activeView === 'noticias' ? (
          /* Página oficial de Noticias: Actualización 1.0 */
          <NewsPageView onBack={() => setActiveView('workspace')} />
        ) : activeView === 'soporte' ? (
          /* Página completa de Soporte: Tickets normales prioritarios y Asistencia Rápida IA */
          <SupportPageView onBack={() => setActiveView('workspace')} />
        ) : activeView === 'ayuda' ? (
          /* Centro de Ayuda completo con buscador en tiempo real, categorías, FAQs, guías y contacto */
          <HelpPageView onBack={() => setActiveView('workspace')} />
        ) : activeView === 'proyectos' ? (
          /* Catálogo oficial de Proyectos con Proyecto 1: Asistente Web En HTML */
          <CatalogView 
            view="proyectos" 
            onBack={() => setActiveView('workspace')} 
          />
        ) : activeView === 'comunidad' ? (
          /* Red Social de la Comunidad: feed interactivo estilo X para compartir proyectos, dar likes y comentar */
          <CommunityFeedView onBack={() => setActiveView('workspace')} />
        ) : isBlankView ? (
          /* Página completamente blanca para Creaciones y Herramientas */
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

      {/* Modal Informativo y de Acceso Inmediato por auth/unauthorized-domain */}
      <UnauthorizedDomainModal
        domain={unauthorizedDomain || ''}
        isOpen={Boolean(unauthorizedDomain)}
        onClose={() => setUnauthorizedDomain(null)}
      />

      {/* Indicador flotante cuando el Modo Lanzamiento está activo y el Administrador navega */}
      {isLaunchActive && isAdmin && activeView !== 'admin' && (
        <div className="fixed bottom-5 right-5 z-40 px-4 py-2.5 rounded-2xl bg-slate-900/95 text-white border border-amber-500/40 shadow-2xl backdrop-blur-md flex items-center gap-3 text-xs animate-in fade-in slide-in-from-bottom-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
          </span>
          <span className="font-semibold text-amber-300">Modo Lanzamiento Activo para visitantes</span>
          <button
            type="button"
            onClick={() => setActiveView('admin')}
            className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[11px] transition-colors cursor-pointer"
          >
            Panel
          </button>
        </div>
      )}
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

