export interface FileCategory {
  id: string;
  name: string;
  iconName: string;
  color: string;
  description: string;
  supportedInputExtensions: string[];
  commonTargetExtensions: string[];
}

export interface FormatInfo {
  extension: string;
  name: string;
  category: 'image' | 'document' | 'audio' | 'video' | 'archive' | 'data' | 'font';
  mimeType?: string;
  canConvertTo: string[];
}

// 500+ format mappings and categories
export const FILE_CATEGORIES: FileCategory[] = [
  {
    id: 'image',
    name: 'Imágenes',
    iconName: 'Image',
    color: 'from-blue-500 to-indigo-600',
    description: 'Convierte fotos, ilustraciones, vectores y formatos modernos web.',
    supportedInputExtensions: [
      'png', 'jpg', 'jpeg', 'webp', 'gif', 'svg', 'bmp', 'ico', 'tiff', 'tif',
      'avif', 'heic', 'heif', 'psd', 'eps', 'ai', 'pdf', 'cur', 'dng', 'raw',
      'cr2', 'nef', 'hdr', 'exr', 'dds', 'tga', 'wbmp', 'ppm', 'pgm', 'pbm',
      'pnm', 'jp2', 'j2k', 'jpf', 'jpm', 'jpe', 'jfif', 'icns', 'xpm', 'xcf'
    ],
    commonTargetExtensions: ['png', 'jpg', 'webp', 'gif', 'svg', 'ico', 'bmp', 'pdf']
  },
  {
    id: 'document',
    name: 'Documentos & Texto',
    iconName: 'FileText',
    color: 'from-amber-500 to-orange-600',
    description: 'Documentos ofimáticos, PDFs, libros digitales y texto plano.',
    supportedInputExtensions: [
      'pdf', 'docx', 'doc', 'txt', 'rtf', 'odt', 'pages', 'md', 'markdown',
      'html', 'htm', 'xhtml', 'mhtml', 'epub', 'mobi', 'azw3', 'fb2', 'djvu',
      'wps', 'wpd', 'tex', 'latex', 'ods', 'xls', 'xlsx', 'csv', 'tsv',
      'ppt', 'pptx', 'key', 'odp', 'xml', 'log', 'nfo', 'man', 'texinfo'
    ],
    commonTargetExtensions: ['pdf', 'docx', 'txt', 'html', 'md', 'rtf', 'csv', 'epub']
  },
  {
    id: 'audio',
    name: 'Audio',
    iconName: 'Music',
    color: 'from-violet-500 to-purple-600',
    description: 'Música, grabaciones y pistas de sonido en alta fidelidad.',
    supportedInputExtensions: [
      'mp3', 'wav', 'ogg', 'oga', 'aac', 'm4a', 'flac', 'wma', 'aiff', 'aif',
      'alac', 'opus', 'amr', 'mid', 'midi', 'ac3', 'm4r', 'caf', 'voc', 'ra',
      'mp2', 'weba', 'ape', 'wv', 'mka', 'dts', 'au', 'snd', 'gsm', 'shn'
    ],
    commonTargetExtensions: ['mp3', 'wav', 'ogg', 'aac', 'm4a', 'flac', 'opus']
  },
  {
    id: 'video',
    name: 'Video',
    iconName: 'Video',
    color: 'from-rose-500 to-red-600',
    description: 'Películas, clips, animaciones y conversión a GIF interactivo.',
    supportedInputExtensions: [
      'mp4', 'webm', 'mkv', 'avi', 'mov', 'wmv', 'flv', 'f4v', 'm4v', '3gp',
      '3g2', 'ts', 'mts', 'm2ts', 'vob', 'ogv', 'mpg', 'mpeg', 'swf', 'divx',
      'xvid', 'h264', 'hevc', 'rm', 'rmvb', 'asf', 'm2v', 'm4p', 'mpv', 'yuv'
    ],
    commonTargetExtensions: ['mp4', 'webm', 'mkv', 'mov', 'avi', 'gif', 'mp3']
  },
  {
    id: 'archive',
    name: 'Archivos Comprimidos',
    iconName: 'Archive',
    color: 'from-emerald-500 to-teal-600',
    description: 'Comprime o extrae carpetas y paquetes de ficheros.',
    supportedInputExtensions: [
      'zip', 'rar', '7z', 'tar', 'gz', 'gzip', 'bz2', 'bzip2', 'xz', 'iso',
      'cab', 'arj', 'z', 'tgz', 'tbz2', 'deb', 'rpm', 'dmg', 'pkg', 'wim',
      'cpio', 'lzh', 'lha', 'jar', 'war', 'ear', 'apk', 'crx', 'xpi'
    ],
    commonTargetExtensions: ['zip', 'tar', 'gz', '7z']
  },
  {
    id: 'data',
    name: 'Datos & Código',
    iconName: 'Code',
    color: 'from-cyan-500 to-blue-600',
    description: 'Estructuras de datos, configuración y transformación de tablas.',
    supportedInputExtensions: [
      'json', 'yaml', 'yml', 'xml', 'csv', 'tsv', 'sql', 'ini', 'toml', 'env',
      'js', 'ts', 'jsx', 'tsx', 'py', 'java', 'c', 'cpp', 'cs', 'php', 'rb',
      'go', 'rs', 'sh', 'bat', 'ps1', 'css', 'scss', 'less', 'sass', 'html'
    ],
    commonTargetExtensions: ['json', 'csv', 'yaml', 'xml', 'tsv', 'txt']
  },
  {
    id: 'font',
    name: 'Fuentes & Tipografías',
    iconName: 'Type',
    color: 'from-fuchsia-500 to-pink-600',
    description: 'Formatos tipográficos para diseño web y maquetación.',
    supportedInputExtensions: ['ttf', 'otf', 'woff', 'woff2', 'eot', 'svg', 'pfb', 'pfa', 'afm'],
    commonTargetExtensions: ['woff2', 'woff', 'ttf', 'otf']
  }
];

// Helper to determine category from extension
export function getCategoryByExtension(ext: string): FileCategory {
  const cleanExt = ext.toLowerCase().replace(/^\./, '');
  for (const cat of FILE_CATEGORIES) {
    if (cat.supportedInputExtensions.includes(cleanExt)) {
      return cat;
    }
  }
  // Default to document / text if unknown
  return FILE_CATEGORIES[1];
}

// Target format options depending on source extension
export function getCompatibleTargets(sourceExt: string): string[] {
  const ext = sourceExt.toLowerCase().replace(/^\./, '');
  const category = getCategoryByExtension(ext);

  // Cross-category intelligent mappings
  switch (category.id) {
    case 'image': {
      const targets = ['png', 'jpg', 'webp', 'gif', 'svg', 'ico', 'bmp', 'pdf', 'avif'];
      return targets.filter(t => t !== ext);
    }
    case 'document': {
      if (['csv', 'tsv', 'json'].includes(ext)) {
        return ['json', 'csv', 'tsv', 'txt', 'html', 'pdf'].filter(t => t !== ext);
      }
      if (['md', 'markdown'].includes(ext)) {
        return ['html', 'pdf', 'txt', 'docx'].filter(t => t !== ext);
      }
      if (['txt'].includes(ext)) {
        return ['pdf', 'html', 'docx', 'md'].filter(t => t !== ext);
      }
      return ['pdf', 'txt', 'html', 'docx', 'md'].filter(t => t !== ext);
    }
    case 'audio': {
      return ['mp3', 'wav', 'ogg', 'aac', 'm4a', 'flac'].filter(t => t !== ext);
    }
    case 'video': {
      return ['mp4', 'webm', 'gif', 'mp3', 'mkv', 'mov'].filter(t => t !== ext);
    }
    case 'archive': {
      return ['zip', 'tar', 'gz'].filter(t => t !== ext);
    }
    case 'data': {
      return ['json', 'csv', 'yaml', 'xml', 'tsv', 'txt'].filter(t => t !== ext);
    }
    case 'font': {
      return ['woff2', 'woff', 'ttf', 'otf'].filter(t => t !== ext);
    }
    default:
      return ['zip', 'txt', 'pdf'];
  }
}

// Format bytes into human readable size
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const val = parseFloat((bytes / Math.pow(k, i)).toFixed(2));
  return `${val} ${sizes[i]}`;
}

export const MAX_BATCH_SIZE_BYTES = 1.5 * 1024 * 1024 * 1024; // 1.5 GB strict limit
