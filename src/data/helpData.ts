export interface HelpCategory {
  id: string;
  name: string;
  description: string;
  iconName: 'Compass' | 'User' | 'AlertTriangle' | 'BookOpen';
  badgeColor: string;
}

export interface FAQItem {
  id: string;
  categoryId: string;
  question: string;
  summary: string;
  answerHtml?: string;
  answerBullets?: string[];
  tips?: string;
}

export interface GuideArticle {
  id: string;
  categoryId: string;
  categoryLabel: string;
  title: string;
  summary: string;
  readTime: string;
  sections: {
    heading?: string;
    paragraphs: string[];
    listItems?: string[];
    note?: string;
  }[];
}

export const HELP_CATEGORIES: HelpCategory[] = [
  {
    id: 'primeros-pasos',
    name: 'Primeros pasos',
    description: 'Introducción básica, navegación y qué puedes hacer en NexStudio.',
    iconName: 'Compass',
    badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  },
  {
    id: 'cuenta-perfil',
    name: 'Cuenta y Perfil',
    description: 'Inicio de sesión con Google, gestión de credenciales y seguridad.',
    iconName: 'User',
    badgeColor: 'bg-violet-50 text-violet-700 border-violet-200',
  },
  {
    id: 'problemas-frecuentes',
    name: 'Problemas frecuentes',
    description: 'Soluciones rápidas a errores comunes de carga, cookies y conexión.',
    iconName: 'AlertTriangle',
    badgeColor: 'bg-amber-50 text-amber-700 border-amber-200',
  },
  {
    id: 'guias-tutoriales',
    name: 'Guías y Tutoriales',
    description: 'Artículos paso a paso sobre herramientas, proyectos y creaciones.',
    iconName: 'BookOpen',
    badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  },
];

export const FAQ_ITEMS: FAQItem[] = [
  {
    id: 'faq-1',
    categoryId: 'primeros-pasos',
    question: '¿Qué es NexStudio y cómo empiezo a utilizarlo?',
    summary: 'NexStudio es una plataforma web creada por Nexuslz para agrupar proyectos, creaciones de software y herramientas.',
    answerBullets: [
      'Puedes explorar el catálogo libremente desde la barra superior de navegación.',
      'El inicio de sesión te permite vincular tu perfil de Google de forma inmediata.',
      'En las secciones de Proyectos y Creaciones encontrarás avances y lanzamientos interactivos.',
    ],
    tips: 'Para volver siempre a la pantalla inicial, pulsa en cualquier momento sobre el logo en la esquina superior izquierda.',
  },
  {
    id: 'faq-2',
    categoryId: 'primeros-pasos',
    question: '¿Es necesario registrarse para acceder a los contenidos?',
    summary: 'No es obligatorio para la navegación básica, pero iniciar sesión ofrece ventajas.',
    answerBullets: [
      'Navegación libre: Puedes acceder a las redes, consultar artículos y explorar la plataforma sin cuenta.',
      'Con inicio de sesión: Guardas tus preferencias, sincronizas tus interacciones y desbloqueas herramientas exclusivas vinculadas a tu cuenta.',
    ],
    tips: 'El acceso se realiza de forma segura a través de autenticación oficial con Google.',
  },
  {
    id: 'faq-3',
    categoryId: 'cuenta-perfil',
    question: '¿Cómo inicio o cierro sesión con mi cuenta de Google?',
    summary: 'El proceso se realiza en un solo clic desde el botón superior derecho.',
    answerBullets: [
      'Para iniciar sesión: Haz clic en el botón blanco "Iniciar sesión" con el icono de Google en la esquina superior derecha.',
      'Para cerrar sesión: Pulsa en tu foto de perfil redonda y selecciona la opción roja "Cerrar Sesión".',
      'Si se abre una ventana emergente de Google, selecciona tu cuenta para continuar.',
    ],
    tips: 'Si utilizas modo incógnito o bloqueadores de ventanas emergentes, asegúrate de permitir las ventanas emergentes del sitio.',
  },
  {
    id: 'faq-4',
    categoryId: 'cuenta-perfil',
    question: '¿Qué datos de mi perfil almacena la aplicación?',
    summary: 'Únicamente la información básica pública autorizada por Google.',
    answerBullets: [
      'Nombre visible y dirección de correo electrónico.',
      'URL de la imagen de avatar o foto de perfil pública.',
      'Identificador único seguro (UID de Firebase Auth).',
    ],
    tips: 'Nunca tenemos acceso a tus contraseñas de Google ni a información privada no autorizada.',
  },
  {
    id: 'faq-5',
    categoryId: 'problemas-frecuentes',
    question: 'No se abre la ventana emergente de Google o se queda cargando, ¿qué hago?',
    summary: 'Suele deberse al bloqueo de popups o cookies de terceros en el navegador.',
    answerBullets: [
      'Comprueba que tu navegador no esté bloqueando ventanas emergentes (mira la barra de direcciones superior del navegador).',
      'Si utilizas navegadores como Brave o extensiones como uBlock Origin, desactiva temporalmente el bloqueo estricto en el dominio.',
      'Recarga la página con Ctrl + F5 (o Cmd + Shift + R en Mac) para limpiar caché estancada.',
    ],
    tips: 'Si el problema persiste, revisa nuestra guía detallada en la sección inferior de Guías y Tutoriales.',
  },
  {
    id: 'faq-6',
    categoryId: 'problemas-frecuentes',
    question: 'Aparecen enlaces que no abren o tardan en responder',
    summary: 'Los enlaces a YouTube, Twitch, TikTok, Twitter/X y Discord abren en pestaña nueva.',
    answerBullets: [
      'Asegúrate de tener conexión a Internet activa.',
      'Si utilizas la versión móvil o tablet, mantén pulsado el enlace si tu navegador tiene deshabilitada la apertura automática.',
      'El servidor de Discord puede requerir que tengas una cuenta de Discord iniciada previamente.',
    ],
    tips: 'Puedes copiar directamente las direcciones desde la sección de redes o consultarnos por email.',
  },
  {
    id: 'faq-7',
    categoryId: 'guias-tutoriales',
    question: '¿Cómo unirse a la comunidad oficial de Discord de Nexuslz?',
    summary: 'El servidor oficial es el punto de encuentro para conversar, debatir y recibir novedades.',
    answerBullets: [
      'Haz clic en el desplegable "Redes" en la cabecera.',
      'Pulsa en "Ver todas las redes" y selecciona "Discord".',
      'Acepta la invitación con enlace permanente discord.gg/qMFcBrHber.',
    ],
    tips: 'En el canal de bienvenida encontrarás las normas del servidor y los roles disponibles.',
  },
  {
    id: 'faq-8',
    categoryId: 'guias-tutoriales',
    question: '¿Dónde puedo proponer sugerencias para nuevas herramientas o funciones?',
    summary: 'Siempre estamos abiertos a ideas de la comunidad.',
    answerBullets: [
      'Envíalas directamente al correo oficial nexuslzcontact@gmail.com con el asunto "[Sugerencia]".',
      'También puedes compartirlas en el canal #sugerencias de nuestro servidor de Discord.',
    ],
    tips: 'Revisamos periódicamente todos los aportes para incluirlos en las próximas actualizaciones.',
  },
];

export const GUIDE_ARTICLES: GuideArticle[] = [
  {
    id: 'guia-solucion-autenticacion',
    categoryId: 'problemas-frecuentes',
    categoryLabel: 'Problemas frecuentes',
    title: 'Cómo solucionar problemas de inicio de sesión y ventanas bloqueadas',
    summary: 'Guía paso a paso para resolver bloqueos de popups de Google, problemas con cookies de terceros y errores de autenticación.',
    readTime: '3 min de lectura',
    sections: [
      {
        heading: '1. Verificación de ventanas emergentes (Pop-ups)',
        paragraphs: [
          'La autenticación de NexStudio utiliza el flujo estándar y seguro de Google Identity mediante un popup emergente. Si al hacer clic en "Iniciar sesión" nada parece ocurrir, el navegador suele tener activada la política de bloqueo estricto.',
        ],
        listItems: [
          'Fíjate en el extremo derecho de la barra de direcciones de Chrome / Edge / Firefox.',
          'Si ves un icono con una cruz roja indicando "Ventanas emergentes bloqueadas", haz clic en él.',
          'Selecciona "Permitir siempre ventanas emergentes y redirecciones de este sitio" y pulsa Listo.',
        ],
      },
      {
        heading: '2. Ajustes de cookies de terceros',
        paragraphs: [
          'Firebase Authentication necesita verificar la sesión segura mediante cookies temporales de autenticación de Google. Si estás usando modo incógnito estricto, habilita temporalmente las cookies para cuentas de Google.',
        ],
        listItems: [
          'Ve a Configuración > Privacidad y seguridad > Cookies de terceros.',
          'Asegúrate de permitir cookies para accounts.google.com.',
        ],
        note: 'NexStudio no almacena ningún rastreador publicitario ni vende datos a terceros.',
      },
      {
        heading: '3. Limpieza de caché local',
        paragraphs: [
          'Si realizaste un cambio reciente de cuenta o cambiaste tu avatar en Google y no se refleja, fuerza un refresco de datos en tu navegador.',
        ],
        listItems: [
          'En Windows / Linux: Presiona Ctrl + F5.',
          'En macOS: Presiona Cmd + Shift + R.',
        ],
      },
    ],
  },
  {
    id: 'guia-primeros-pasos-nexstudio',
    categoryId: 'primeros-pasos',
    categoryLabel: 'Primeros pasos',
    title: 'Guía de inicio rápido: Navegación y estructura de NexStudio',
    summary: 'Descubre cómo moverte por las diferentes áreas, acceder a las redes oficiales y aprovechar al máximo la plataforma.',
    readTime: '2 min de lectura',
    sections: [
      {
        heading: 'La barra de navegación inteligente',
        paragraphs: [
          'En la parte superior dispones de un menú compacto y accesible adaptado tanto a pantallas móviles como a ordenadores de escritorio.',
        ],
        listItems: [
          'Logo de NexStudio: Te devuelve instantáneamente a la página principal estés donde estés.',
          'Menú desplegable: Acceso directo a Proyectos, Creaciones y Herramientas.',
          'Redes sociales: Menú desplegable minimalista para saltar a YouTube, Twitch, TikTok, Twitter/X y Discord sin rodeos.',
          'Botón de Ayuda: Tu centro de soporte integrado con buscador en tiempo real.',
        ],
      },
      {
        heading: 'Conectando con la comunidad',
        paragraphs: [
          'NexStudio está estrechamente ligado a los canales de contenido de Nexuslz. Puedes participar en los directos de Twitch, comentar en YouTube y charlar en tiempo real en Discord.',
        ],
        note: 'Todos los enlaces oficiales están verificados para garantizar tu seguridad frente a perfiles falsificados.',
      },
    ],
  },
  {
    id: 'guia-perfil-google',
    categoryId: 'cuenta-perfil',
    categoryLabel: 'Cuenta y Perfil',
    title: 'Gestión de tu perfil y privacidad de usuario',
    summary: 'Cómo funciona la sincronización con Google, qué información se muestra y cómo cerrar tu sesión de forma segura.',
    readTime: '2 min de lectura',
    sections: [
      {
        heading: 'Sincronización instantánea con tu avatar de Google',
        paragraphs: [
          'Al iniciar sesión, la aplicación lee tu nombre público y la foto de perfil asociada a tu cuenta de Google. Tu foto aparecerá en la esquina superior derecha.',
          'Si cambias tu foto en tu cuenta general de Google, se actualizará en tu próximo inicio de sesión en NexStudio.',
        ],
      },
      {
        heading: 'Cierre seguro de sesión',
        paragraphs: [
          'Si compartes tu equipo o estás en un ordenador público:',
        ],
        listItems: [
          'Haz clic sobre tu foto de avatar.',
          'Se abrirá tu tarjeta de usuario con tu correo electrónico verificado.',
          'Haz clic en el botón rojo "Cerrar Sesión". Tu sesión local quedará borrada de inmediato.',
        ],
        note: 'Recuerda no dejar tu sesión abierta en dispositivos compartidos.',
      },
    ],
  },
  {
    id: 'guia-contacto-comunidad',
    categoryId: 'guias-tutoriales',
    categoryLabel: 'Guías y Tutoriales',
    title: 'Canales oficiales y cómo solicitar soporte prioritario',
    summary: 'Información de contacto oficial, correo directo para incidencias y soporte comunitario.',
    readTime: '2 min de lectura',
    sections: [
      {
        heading: 'Canal de correo directo',
        paragraphs: [
          'Para consultas formales, propuestas de colaboración o reporte de fallos que requieran atención privada, disponemos del correo oficial:',
          'nexuslzcontact@gmail.com',
        ],
        listItems: [
          'Asunto claro (ejemplo: "[Error] Problema al acceder a X sección").',
          'Descripción del fallo y dispositivo o navegador empleado.',
          'Tiempo de respuesta estimado: entre 24 y 48 horas hábiles.',
        ],
      },
      {
        heading: 'Soporte rápido en Discord',
        paragraphs: [
          'Para dudas rápidas, la forma más ágil es ingresar en nuestro servidor de Discord (discord.gg/qMFcBrHber) y escribir en la sección de ayuda.',
        ],
      },
    ],
  },
];
