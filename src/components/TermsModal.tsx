import React, { useEffect } from 'react';
import { X, Shield } from 'lucide-react';

interface TermsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TermsModal: React.FC<TermsModalProps> = ({ isOpen, onClose }) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div 
      id="terms-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        id="terms-modal-card"
        className="relative w-full max-w-3xl max-h-[85vh] flex flex-col bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
              <Shield className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-bold text-slate-900">
              Términos y Condiciones de Uso
            </h2>
          </div>
          <button
            type="button"
            id="terms-modal-close-btn"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors min-w-[36px] min-h-[36px] flex items-center justify-center"
            aria-label="Cerrar términos y condiciones"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 text-sm text-slate-700 space-y-6 leading-relaxed">
          <div className="space-y-3">
            <h3 className="text-base font-bold text-slate-900">
              1. Aceptación y Ámbito de Aplicación
            </h3>
            <p>
              El acceso y uso de este sitio web (NexStudio) atribuye la condición de usuario e implica la aceptación plena y sin reservas de todas y cada una de las disposiciones incluidas en estos Términos y Condiciones de Uso. Si el usuario no está de acuerdo con alguno de los términos aquí establecidos, deberá abstenerse de acceder y utilizar los servicios, herramientas o contenidos ofrecidos en este sitio.
            </p>
          </div>

          <div className="space-y-3">
            <h3 className="text-base font-bold text-slate-900">
              2. Propiedad Intelectual e Industrial
            </h3>
            <p>
              Todos los contenidos presentes en el sitio web, incluyendo a título enunciativo pero no limitativo: textos, artículos, datos, código fuente, scripts, diseños gráficos, interfaces, logotipos, marcas, ilustraciones, imágenes, audios, vídeos, herramientas interactivas y arquitectura del sitio, son propiedad exclusiva del titular de la web o de terceros que han autorizado su uso, y están protegidos por las leyes nacionales e internacionales de Propiedad Intelectual e Industrial.
            </p>
            <ul className="list-disc pl-5 space-y-2 text-slate-600">
              <li>
                <strong className="text-slate-800">Prohibición de copia y reproducción:</strong> Queda estrictamente prohibida la reproducción total o parcial, distribución, comunicación pública, transformación, extracción de datos (<em>scraping</em>), descarga no autorizada, venta, alquiler o explotación comercial de cualquier elemento de esta web sin la autorización previa, explícita y por escrito del titular.
              </li>
              <li>
                <strong className="text-slate-800">Uso personal y no comercial:</strong> Se autoriza únicamente la visualización y navegación personal por el sitio web. La descarga o impresión de contenidos sólo estará permitida para un uso estrictamente privado y personal, manteniendo intactos todos los avisos de derechos de autor.
              </li>
            </ul>
          </div>

          <div className="space-y-3">
            <h3 className="text-base font-bold text-slate-900">
              3. Incumplimiento y Acciones Legales
            </h3>
            <p>
              El titular del sitio web persigue con rigor cualquier infracción de sus derechos de propiedad intelectual, uso no autorizado de sus sistemas o vulneración de los presentes Términos y Condiciones.
            </p>
            <ul className="list-disc pl-5 space-y-2 text-slate-600">
              <li>
                <strong className="text-slate-800">Reservas de derecho:</strong> Nos reservamos la facultad de presentar las acciones civiles, administrativas o penales que correspondan bajo la legislación aplicable contra cualquier persona física o jurídica que copie, distribuya, plagie o haga un uso indebido de los materiales contenidos en esta web.
              </li>
              <li>
                <strong className="text-slate-800">Denuncias y bloqueos:</strong> Ante el conocimiento de cualquier actividad ilícita o infracción, el propietario del sitio podrá:
                <ol className="list-decimal pl-5 mt-1.5 space-y-1">
                  <li>Bloquear de forma inmediata la dirección IP o el acceso del usuario infractor.</li>
                  <li>Notificar y presentar denuncias formales ante las autoridades judiciales y policiales competentes.</li>
                  <li>Emitir solicitudes de retirada formal de contenidos (<em>DMCA</em> o equivalentes) a proveedores de hosting, motores de búsqueda o redes sociales donde se haya resubido o compartido material protegido sin autorización.</li>
                </ol>
              </li>
            </ul>
          </div>

          <div className="space-y-3">
            <h3 className="text-base font-bold text-slate-900">
              4. Normas de Conducta y Uso Permitido
            </h3>
            <p>
              El usuario se compromete a hacer un uso adecuado, diligente y lícito de la web. Queda expresamente prohibido:
            </p>
            <ol className="list-decimal pl-5 space-y-1.5 text-slate-600">
              <li>Realizar ataques cibernéticos, inyecciones de código, rastreo masivo (<em>web scraping</em>), o acciones que puedan saturar, dañar o inutilizar los servidores e infraestructura.</li>
              <li>Utilizar el sitio web para transmitir, almacenar o difundir virus, malware o cualquier software nocivo.</li>
              <li>Intentar acceder a áreas restringidas de la web, servidores o bases de datos sin autorización explícita.</li>
              <li>Publicar en las secciones interactivas o comentarios (si los hubiera) contenidos difamatorios, xenófobos, de odio, spam, engañosos o que vulneren derechos de terceros.</li>
            </ol>
          </div>

          <div className="space-y-3">
            <h3 className="text-base font-bold text-slate-900">
              5. Exclusión de Garantías y Limitación de Responsabilidad
            </h3>
            <p>
              Este sitio web incluye contenidos, información y herramientas de diversa índole (&quot;todo tipo de cosas&quot;). Aunque el titular trabaja para mantener la información actualizada y el sitio en funcionamiento continuo:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-slate-600">
              <li>
                <strong className="text-slate-800">Disponibilidad:</strong> No se garantiza el acceso ininterrumpido o la ausencia de errores en el sitio web. El servicio puede suspenderse temporalmente por labores de mantenimiento o causas de fuerza mayor.
              </li>
              <li>
                <strong className="text-slate-800">Veracidad del contenido:</strong> Los contenidos se ofrecen con fines puramente informativos o de entretenimiento. El titular no se hace responsable de las decisiones tomadas por el usuario basándose en la información facilitada en la web.
              </li>
              <li>
                <strong className="text-slate-800">Daños informáticos:</strong> El titular no se responsabiliza de los daños o perjuicios que puedan causar interferencias, averías o virus informáticos en el equipo del usuario derivados de la navegación.
              </li>
            </ul>
          </div>

          <div className="space-y-3">
            <h3 className="text-base font-bold text-slate-900">
              6. Enlaces a Terceros
            </h3>
            <p>
              Este sitio web puede contener enlaces o hipervínculos hacia páginas web gestionadas por terceros. El titular no ejerce ningún tipo de control sobre dichos sitios ni sobre sus contenidos, por lo que no asume responsabilidad alguna por la información, políticas de privacidad o prácticas de páginas externas.
            </p>
          </div>

          <div className="space-y-3">
            <h3 className="text-base font-bold text-slate-900">
              7. Cuentas de Usuario y Registro
            </h3>
            <p>
              En caso de que determinadas secciones de la web requieran el registro de una cuenta de usuario:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-slate-600">
              <li>El usuario es el único responsable de mantener la confidencialidad de sus credenciales de acceso (nombre de usuario y contraseña).</li>
              <li>Todas las actividades realizadas desde la cuenta registrada serán responsabilidad exclusiva del usuario titular de dicha cuenta.</li>
              <li>El propietario se reserva el derecho de cancelar o suspender cuentas que violen estas normas sin previo aviso.</li>
            </ul>
          </div>

          <div className="space-y-3">
            <h3 className="text-base font-bold text-slate-900">
              8. Protección de Datos y Privacidad
            </h3>
            <p>
              El tratamiento de los datos personales recopilados a través de la web (formularios de contacto, suscripciones, analítica) se rige por lo dispuesto en nuestra Política de Privacidad, cumpliendo estrictamente con la normativa vigente en materia de protección de datos personales.
            </p>
          </div>

          <div className="space-y-3">
            <h3 className="text-base font-bold text-slate-900">
              9. Modificaciones de los Términos
            </h3>
            <p>
              El propietario de la web se reserva el derecho de modificar o actualizar el presente documento en cualquier momento y sin previo aviso para adaptarlo a novedades legislativas, cambios en la web o nuevas funciones. Se recomienda a los usuarios consultar esta página de manera periódica.
            </p>
          </div>

          <div className="space-y-3">
            <h3 className="text-base font-bold text-slate-900">
              10. Legislación Aplicable y Jurisdicción
            </h3>
            <p>
              Los presentes Términos y Condiciones se rigen en todos y cada uno de sus extremos por la legislación española. Para la resolución de cualquier conflicto o controversia derivada del uso de este sitio web, las partes se someten a la jurisdicción de los juzgados y tribunales del domicilio del titular del sitio web, salvo que la ley disponga imperativamente lo contrario.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50/70 flex justify-end">
          <button
            type="button"
            id="terms-modal-accept-btn"
            onClick={onClose}
            className="px-5 py-2 text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-colors min-h-[44px]"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
};
