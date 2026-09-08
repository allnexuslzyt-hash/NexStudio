import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Cookie, 
  FileText, 
  Lock, 
  AlertTriangle, 
  CheckCircle2, 
  ExternalLink 
} from 'lucide-react';

const STORAGE_KEY = 'nexstudio_consent_accepted_v1';

export const FirstTimeConsentModal: React.FC = () => {
  const [isVisible, setIsVisible] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'cookies' | 'privacy' | 'terms'>('overview');
  const [hasRejected, setHasRejected] = useState<boolean>(false);

  useEffect(() => {
    try {
      const alreadyAccepted = localStorage.getItem(STORAGE_KEY) === 'true';
      if (!alreadyAccepted) {
        setIsVisible(true);
        document.body.style.overflow = 'hidden';
      }
    } catch {
      // Fallback if localStorage is restricted
      setIsVisible(true);
    }
  }, []);

  const handleAccept = () => {
    try {
      localStorage.setItem(STORAGE_KEY, 'true');
    } catch {
      // Ignore storage write errors
    }
    setIsVisible(false);
    document.body.style.overflow = '';
  };

  const handleReject = () => {
    setHasRejected(true);
    // Intentar redirigir fuera del sitio web
    setTimeout(() => {
      try {
        window.location.replace('https://www.google.com');
      } catch {
        // En caso de que el navegador bloquee la redirección
      }
    }, 1200);
  };

  if (!isVisible) return null;

  // Pantalla de bloqueo si el usuario rechaza los términos
  if (hasRejected) {
    return (
      <div 
        id="consent-rejected-screen"
        className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950 text-white p-6 text-center animate-in fade-in duration-300"
      >
        <div className="max-w-md p-8 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl flex flex-col items-center">
          <div className="w-14 h-14 rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-500 mb-4">
            <AlertTriangle className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">
            Acceso no autorizado
          </h2>
          <p className="text-sm text-slate-400 mb-6 leading-relaxed">
            Has rechazado los Términos de Uso y la Política de Cookies. El acceso a NexStudio requiere la aceptación íntegra de las condiciones legales. Redirigiendo fuera del sitio...
          </p>
          <div className="flex flex-col sm:flex-row gap-3 w-full">
            <a
              href="https://www.google.com"
              className="flex-1 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-2 transition-colors min-h-[44px]"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Salir a Google</span>
            </a>
            <button
              type="button"
              onClick={() => setHasRejected(false)}
              className="flex-1 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-colors min-h-[44px]"
            >
              Revisar y Aceptar
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      id="first-time-consent-overlay"
      className="fixed inset-0 z-[90] flex items-center justify-center p-3 sm:p-6 bg-slate-950/75 backdrop-blur-md animate-in fade-in duration-300"
    >
      <div 
        id="first-time-consent-modal"
        className="relative w-full max-w-3xl max-h-[90vh] flex flex-col bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-200"
      >
        {/* Modal Top Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-slate-900 to-indigo-950 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-white/10 text-indigo-300 border border-white/10">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white leading-tight">
                Aviso de Privacidad, Cookies y Términos Legales
              </h2>
              <p className="text-xs text-slate-300 mt-0.5">
                Obligatorio en tu primera visita a NexStudio
              </p>
            </div>
          </div>
          <span className="self-start sm:self-auto text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-indigo-500/20 text-indigo-200 border border-indigo-400/30">
            Primer Acceso
          </span>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-4 sm:px-6 overflow-x-auto no-scrollbar gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            className={`flex items-center gap-2 py-3 px-3 border-b-2 text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer min-h-[44px] ${
              activeTab === 'overview'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Resumen</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('cookies')}
            className={`flex items-center gap-2 py-3 px-3 border-b-2 text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer min-h-[44px] ${
              activeTab === 'cookies'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Cookie className="w-3.5 h-3.5" />
            <span>Cookies y Almacenamiento</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('privacy')}
            className={`flex items-center gap-2 py-3 px-3 border-b-2 text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer min-h-[44px] ${
              activeTab === 'privacy'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Privacidad y Datos (RGPD)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('terms')}
            className={`flex items-center gap-2 py-3 px-3 border-b-2 text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer min-h-[44px] ${
              activeTab === 'terms'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Términos y Condiciones (10 Cláusulas)</span>
          </button>
        </div>

        {/* Tab Content Area */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 text-sm text-slate-700 space-y-6 leading-relaxed">
          {activeTab === 'overview' && (
            <div className="space-y-5">
              <div className="p-4 rounded-xl bg-indigo-50/70 border border-indigo-100 text-slate-800 text-xs sm:text-sm">
                <p className="font-semibold text-indigo-950 mb-1">
                  Bienvenido/a a NexStudio
                </p>
                <p className="text-slate-600 leading-relaxed">
                  Para poder navegar y utilizar las herramientas, proyectos y recursos de NexStudio, la legislación europea y española (RGPD, LOPDGDD y LSSI-CE) requiere que confirmes tu consentimiento informado sobre el uso de cookies técnicas, el tratamiento seguro de datos y el cumplimiento íntegro de nuestros Términos y Condiciones.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50">
                  <Cookie className="w-5 h-5 text-indigo-600 mb-2" />
                  <h4 className="font-bold text-slate-900 text-xs mb-1">Cookies Esenciales</h4>
                  <p className="text-xs text-slate-500 leading-normal">
                    Almacenamiento local para recordar tu sesión y guardar tus preferencias sin rastreo comercial.
                  </p>
                </div>

                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50">
                  <Lock className="w-5 h-5 text-indigo-600 mb-2" />
                  <h4 className="font-bold text-slate-900 text-xs mb-1">Privacidad y Seguridad</h4>
                  <p className="text-xs text-slate-500 leading-normal">
                    Tus credenciales y datos de Google Auth se procesan bajo cifrado seguro sin venta a terceros.
                  </p>
                </div>

                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50">
                  <FileText className="w-5 h-5 text-indigo-600 mb-2" />
                  <h4 className="font-bold text-slate-900 text-xs mb-1">Propiedad y Reglas</h4>
                  <p className="text-xs text-slate-500 leading-normal">
                    Protección estricta de propiedad intelectual, prohibición de scraping, plagio y uso malicioso.
                  </p>
                </div>
              </div>

              <p className="text-xs text-slate-500">
                Puedes consultar cada política al detalle utilizando las pestañas superiores. Al hacer clic en <strong>&quot;Aceptar y Entrar&quot;</strong>, este aviso no volverá a mostrarse.
              </p>
            </div>
          )}

          {activeTab === 'cookies' && (
            <div className="space-y-4">
              <h3 className="text-base font-bold text-slate-900">
                Política de Cookies y Almacenamiento Local (LSSI-CE)
              </h3>
              <p>
                En cumplimiento con el artículo 22.2 de la Ley 34/2002 (LSSI-CE), NexStudio te informa sobre el uso de tecnologías de almacenamiento y cookies:
              </p>

              <div className="space-y-3">
                <div className="border border-slate-200 rounded-xl p-3.5 bg-slate-50/50">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800 text-xs">1. Cookies Técnicas y de Autenticación</span>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">Esenciales</span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1">
                    Necesarias para mantener activa la sesión mediante Google Identity Services y Firebase Authentication, protegiendo las peticiones contra falsificación de solicitudes (CSRF).
                  </p>
                </div>

                <div className="border border-slate-200 rounded-xl p-3.5 bg-slate-50/50">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800 text-xs">2. Almacenamiento Local (HTML5 LocalStorage)</span>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">Esenciales</span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1">
                    Se utiliza para registrar que has aceptado este consentimiento inicial y evitar volvértelo a solicitar en futuras visitas, así como guardar preferencias del espacio de trabajo.
                  </p>
                </div>

                <div className="border border-slate-200 rounded-xl p-3.5 bg-slate-50/50">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800 text-xs">3. Rendimiento y Seguridad de Red</span>
                    <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded">Optimización</span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1">
                    Headers y tokens de Cloudflare y CDN para mitigar ataques de denegación de servicio (DDoS) y servir activos estáticos optimizados.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'privacy' && (
            <div className="space-y-4">
              <h3 className="text-base font-bold text-slate-900">
                Política de Protección de Datos Personales (RGPD / LOPDGDD)
              </h3>
              <p>
                NexStudio garantiza la máxima confidencialidad en el tratamiento de tus datos personales conforme al Reglamento (UE) 2016/679 (RGPD) y la Ley Orgánica 3/2018 (LOPDGDD).
              </p>

              <div className="space-y-2 text-xs sm:text-sm text-slate-600">
                <p>
                  <strong className="text-slate-800">Responsable del Tratamiento:</strong> El titular y administrador de NexStudio.
                </p>
                <p>
                  <strong className="text-slate-800">Finalidad:</strong> Permitir el inicio de sesión voluntario, acceso a proyectos, herramientas y personalización de servicios.
                </p>
                <p>
                  <strong className="text-slate-800">Legitimación:</strong> Tu consentimiento expreso otorgado al registrarte o acceder mediante Google.
                </p>
                <p>
                  <strong className="text-slate-800">Destinatarios:</strong> No se cederán datos a terceros salvo imperativo legal o a proveedores de infraestructura esenciales (Google Cloud / Firebase / Cloudflare) bajo acuerdos de procesamiento de datos compatibles con el RGPD.
                </p>
                <p>
                  <strong className="text-slate-800">Tus Derechos:</strong> Tienes derecho a acceder, rectificar o suprimir tus datos, así como solicitar la limitación u oposición a su tratamiento en cualquier momento.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'terms' && (
            <div className="space-y-6">
              <div className="space-y-2">
                <h3 className="text-base font-bold text-slate-900">
                  1. Aceptación y Ámbito de Aplicación
                </h3>
                <p>
                  El acceso y uso de este sitio web (NexStudio) atribuye la condición de usuario e implica la aceptación plena y sin reservas de todas y cada una de las disposiciones incluidas en estos Términos y Condiciones de Uso. Si el usuario no está de acuerdo con alguno de los términos aquí establecidos, deberá abstenerse de acceder y utilizar los servicios, herramientas o contenidos ofrecidos en este sitio.
                </p>
              </div>

              <div className="space-y-2">
                <h3 className="text-base font-bold text-slate-900">
                  2. Propiedad Intelectual e Industrial
                </h3>
                <p>
                  Todos los contenidos presentes en el sitio web, incluyendo a título enunciativo pero no limitativo: textos, artículos, datos, código fuente, scripts, diseños gráficos, interfaces, logotipos, marcas, ilustraciones, imágenes, audios, vídeos, herramientas interactivas y arquitectura del sitio, son propiedad exclusiva del titular de la web o de terceros que han autorizado su uso, y están protegidos por las leyes nacionales e internacionales de Propiedad Intelectual e Industrial.
                </p>
                <ul className="list-disc pl-5 space-y-1 text-slate-600">
                  <li>
                    <strong className="text-slate-800">Prohibición de copia y reproducción:</strong> Queda estrictamente prohibida la reproducción total o parcial, distribución, comunicación pública, transformación, extracción de datos (<em>scraping</em>), descarga no autorizada, venta, alquiler o explotación comercial de cualquier elemento de esta web sin la autorización previa, explícita y por escrito del titular.
                  </li>
                  <li>
                    <strong className="text-slate-800">Uso personal y no comercial:</strong> Se autoriza únicamente la visualización y navegación personal por el sitio web. La descarga o impresión de contenidos sólo estará permitida para un uso estrictamente privado y personal, manteniendo intactos todos los avisos de derechos de autor.
                  </li>
                </ul>
              </div>

              <div className="space-y-2">
                <h3 className="text-base font-bold text-slate-900">
                  3. Incumplimiento y Acciones Legales
                </h3>
                <p>
                  El titular del sitio web persigue con rigor cualquier infracción de sus derechos de propiedad intelectual, uso no autorizado de sus sistemas o vulneración de los presentes Términos y Condiciones.
                </p>
                <ul className="list-disc pl-5 space-y-1 text-slate-600">
                  <li>
                    <strong className="text-slate-800">Reservas de derecho:</strong> Nos reservamos la facultad de presentar las acciones civiles, administrativas o penales que correspondan bajo la legislación aplicable contra cualquier persona física o jurídica que copie, distribuya, plagie o haga un uso indebido de los materiales contenidos en esta web.
                  </li>
                  <li>
                    <strong className="text-slate-800">Denuncias y bloqueos:</strong> Ante el conocimiento de cualquier actividad ilícita o infracción, el propietario del sitio podrá:
                    <ol className="list-decimal pl-5 mt-1 space-y-0.5">
                      <li>Bloquear de forma inmediata la dirección IP o el acceso del usuario infractor.</li>
                      <li>Notificar y presentar denuncias formales ante las autoridades judiciales y policiales competentes.</li>
                      <li>Emitir solicitudes de retirada formal de contenidos (<em>DMCA</em> o equivalentes) a proveedores de hosting, motores de búsqueda o redes sociales donde se haya resubido o compartido material protegido sin autorización.</li>
                    </ol>
                  </li>
                </ul>
              </div>

              <div className="space-y-2">
                <h3 className="text-base font-bold text-slate-900">
                  4. Normas de Conducta y Uso Permitido
                </h3>
                <p>
                  El usuario se compromete a hacer un uso adecuado, diligente y lícito de la web. Queda expresamente prohibido realizar ataques cibernéticos, inyecciones de código, rastreo masivo (scraping), transmitir virus o malware, acceder a áreas restringidas o bases de datos sin autorización, y publicar contenidos ilícitos o difamatorios.
                </p>
              </div>

              <div className="space-y-2">
                <h3 className="text-base font-bold text-slate-900">
                  5. Exclusión de Garantías y Limitación de Responsabilidad
                </h3>
                <p>
                  Este sitio web incluye contenidos, información y herramientas de diversa índole (&quot;todo tipo de cosas&quot;). No se garantiza la disponibilidad ininterrumpida del servicio. Los contenidos se ofrecen con fines puramente informativos o de entretenimiento.
                </p>
              </div>

              <div className="space-y-2">
                <h3 className="text-base font-bold text-slate-900">
                  6 a 10. Enlaces, Cuentas, Modificaciones y Legislación Española
                </h3>
                <p className="text-xs text-slate-600">
                  El registro y las credenciales son de uso personal e intransferible. El titular se reserva el derecho de modificar estos términos en cualquier momento. Los presentes términos se rigen en su totalidad por la legislación española y la competencia de sus juzgados y tribunales.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Modal Bottom Actions */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50/80 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-slate-500 text-center sm:text-left">
            Si rechazas, serás redirigido fuera de la plataforma inmediatamente.
          </p>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              type="button"
              id="consent-reject-btn"
              onClick={handleReject}
              className="flex-1 sm:flex-initial px-4 py-2.5 text-xs font-semibold text-rose-600 hover:text-rose-700 bg-white hover:bg-rose-50 border border-rose-200 rounded-xl transition-colors min-h-[44px] cursor-pointer"
            >
              Rechazar y Salir
            </button>
            <button
              type="button"
              id="consent-accept-btn"
              onClick={handleAccept}
              className="flex-1 sm:flex-initial px-5 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:scale-98 rounded-xl shadow-sm transition-all min-h-[44px] cursor-pointer"
            >
              Aceptar todo y Entrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
