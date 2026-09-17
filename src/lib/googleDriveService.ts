/**
 * Servicio de integración con la API de Google Drive
 * Permite a los creadores conectar su cuenta y seleccionar archivos de cualquier tamaño (incluso muchos GBs)
 * para compartirlos en publicaciones y repositorios de NexStudio.
 */

export interface GoogleDriveFile {
  id: string;
  name: string;
  mimeType: string;
  size?: number;
  webViewLink?: string;
  webContentLink?: string;
  iconLink?: string;
  thumbnailLink?: string;
  modifiedTime?: string;
}

export interface DriveListResponse {
  files: GoogleDriveFile[];
  nextPageToken?: string;
}

/**
 * Mapea el tipo MIME de Google Drive a una categoría amigable para la interfaz
 */
export function getDriveFileTypeCategory(mimeType: string, fileName?: string): 'image' | 'video' | 'audio' | 'document' | 'archive' | 'code' | 'folder' | 'file' {
  if (mimeType === 'application/vnd.google-apps.folder') return 'folder';
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType.startsWith('audio/')) return 'audio';
  if (
    mimeType.includes('pdf') || 
    mimeType.includes('document') || 
    mimeType.includes('presentation') || 
    mimeType.includes('spreadsheet') ||
    mimeType.includes('text/plain')
  ) {
    return 'document';
  }
  if (
    mimeType.includes('zip') || 
    mimeType.includes('rar') || 
    mimeType.includes('tar') || 
    mimeType.includes('7z') || 
    mimeType.includes('compressed') ||
    (fileName && /\.(zip|rar|7z|tar|gz)$/i.test(fileName))
  ) {
    return 'archive';
  }
  if (
    mimeType.includes('javascript') || 
    mimeType.includes('typescript') || 
    mimeType.includes('json') || 
    mimeType.includes('html') || 
    mimeType.includes('css') ||
    (fileName && /\.(js|ts|jsx|tsx|json|html|css|py|rs|go|cpp|c|java|cs|sql)$/i.test(fileName))
  ) {
    return 'code';
  }
  return 'file';
}

/**
 * Formatea bytes en formato legible (B, KB, MB, GB, TB)
 */
export function formatDriveFileSize(bytes?: number): string {
  if (bytes === undefined || bytes === null || isNaN(bytes)) return 'Tamaño desconocido';
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

/**
 * Extrae el ID de un archivo o carpeta a partir de un enlace de Google Drive
 */
export function extractDriveFileId(url: string): string | null {
  if (!url) return null;
  const patterns = [
    /\/file\/d\/([a-zA-Z0-9_-]+)/,
    /\/drive\/folders\/([a-zA-Z0-9_-]+)/,
    /id=([a-zA-Z0-9_-]+)/,
    /\/open\?id=([a-zA-Z0-9_-]+)/,
    /\/d\/([a-zA-Z0-9_-]+)/,
  ];

  for (const regex of patterns) {
    const match = url.match(regex);
    if (match && match[1]) {
      return match[1];
    }
  }
  return null;
}

/**
 * Consulta archivos reales desde la API de Google Drive v3
 */
export async function listGoogleDriveFiles(
  accessToken: string,
  options: {
    queryText?: string;
    folderId?: string;
    pageToken?: string;
    pageSize?: number;
  } = {}
): Promise<DriveListResponse> {
  const { queryText = '', folderId, pageToken, pageSize = 30 } = options;

  let q = 'trashed = false';

  if (folderId) {
    q += ` and '${folderId}' in parents`;
  }

  if (queryText.trim()) {
    const sanitized = queryText.trim().replace(/'/g, "\\'");
    q += ` and name contains '${sanitized}'`;
  }

  const params = new URLSearchParams({
    pageSize: String(pageSize),
    fields: 'nextPageToken,files(id,name,mimeType,size,webContentLink,webViewLink,iconLink,thumbnailLink,modifiedTime)',
    orderBy: 'folder,modifiedTime desc',
    q,
  });

  if (pageToken) {
    params.set('pageToken', pageToken);
  }

  const response = await fetch(`https://www.googleapis.com/drive/v3/files?${params.toString()}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    const errBody = await response.json().catch(() => ({}));
    const message = errBody?.error?.message || `Error de Google Drive (${response.status})`;
    throw new Error(message);
  }

  const data = await response.json();
  const rawFiles = data.files || [];

  const files: GoogleDriveFile[] = rawFiles.map((item: any) => ({
    id: item.id,
    name: item.name,
    mimeType: item.mimeType,
    size: item.size ? parseInt(item.size, 10) : undefined,
    webViewLink: item.webViewLink || `https://drive.google.com/file/d/${item.id}/view`,
    webContentLink: item.webContentLink,
    iconLink: item.iconLink,
    thumbnailLink: item.thumbnailLink,
    modifiedTime: item.modifiedTime,
  }));

  return {
    files,
    nextPageToken: data.nextPageToken,
  };
}

/**
 * Obtiene los metadatos de un archivo específico por su ID
 */
export async function getGoogleDriveFileMetadata(
  accessToken: string,
  fileId: string
): Promise<GoogleDriveFile> {
  const params = new URLSearchParams({
    fields: 'id,name,mimeType,size,webContentLink,webViewLink,iconLink,thumbnailLink,modifiedTime',
  });

  const response = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?${params.toString()}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    const errBody = await response.json().catch(() => ({}));
    throw new Error(errBody?.error?.message || 'No se pudo obtener la información del archivo de Google Drive.');
  }

  const item = await response.json();
  return {
    id: item.id,
    name: item.name,
    mimeType: item.mimeType,
    size: item.size ? parseInt(item.size, 10) : undefined,
    webViewLink: item.webViewLink || `https://drive.google.com/file/d/${item.id}/view`,
    webContentLink: item.webContentLink,
    iconLink: item.iconLink,
    thumbnailLink: item.thumbnailLink,
    modifiedTime: item.modifiedTime,
  };
}
