/**
 * Utilidades para procesar y optimizar archivos subidos directamente desde el dispositivo
 */

export interface ProcessedFile {
  dataUrl: string;
  name: string;
  size: number;
  type: 'image' | 'video' | 'audio' | 'document' | 'file';
  mimeType: string;
}

/**
 * Comprime imágenes en el navegador antes de guardarlas para que carguen de inmediato
 * y se puedan almacenar de manera segura y eficiente.
 */
export const processDeviceFile = (file: File): Promise<ProcessedFile> => {
  return new Promise((resolve, reject) => {
    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');
    const isAudio = file.type.startsWith('audio/');
    const isDoc = file.type.includes('pdf') || file.type.includes('text') || file.name.endsWith('.md') || file.name.endsWith('.json');

    let fileType: 'image' | 'video' | 'audio' | 'document' | 'file' = 'file';
    if (isImage) fileType = 'image';
    else if (isVideo) fileType = 'video';
    else if (isAudio) fileType = 'audio';
    else if (isDoc) fileType = 'document';

    // Si es una imagen, redimensionar y optimizar con canvas
    if (isImage) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          // Límite máximo de 1400px en el lado más largo para conservar máxima fidelidad y nitidez
          const MAX_SIDE = 1400;
          if (width > height) {
            if (width > MAX_SIDE) {
              height = Math.round((height * MAX_SIDE) / width);
              width = MAX_SIDE;
            }
          } else {
            if (height > MAX_SIDE) {
              width = Math.round((width * MAX_SIDE) / height);
              height = MAX_SIDE;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve({
              dataUrl: e.target?.result as string,
              name: file.name,
              size: file.size,
              type: 'image',
              mimeType: file.type,
            });
            return;
          }

          // Dibujar en canvas con interpolación suave
          ctx.drawImage(img, 0, 0, width, height);

          // Obtener base64 optimizado (JPEG o PNG)
          const format = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
          const quality = format === 'image/jpeg' ? 0.82 : undefined;
          const compressedDataUrl = canvas.toDataURL(format, quality);

          // Calcular tamaño aproximado del base64
          const approxSize = Math.round((compressedDataUrl.length * 3) / 4);

          resolve({
            dataUrl: compressedDataUrl,
            name: file.name,
            size: approxSize,
            type: 'image',
            mimeType: format,
          });
        };
        img.onerror = () => reject(new Error('No se pudo leer la imagen'));
        img.src = e.target?.result as string;
      };
      reader.onerror = () => reject(new Error('Error leyendo archivo del dispositivo'));
      reader.readAsDataURL(file);
    } else {
      // Para otros archivos, leer como Data URL
      // Límite de seguridad de 800KB para almacenamiento Firestore
      if (file.size > 850 * 1024) {
        reject(new Error(`El archivo supera el límite recomendado de 850 KB (${(file.size / (1024 * 1024)).toFixed(1)} MB). Selecciona un archivo más liviano o una imagen optimizada.`));
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        resolve({
          dataUrl: e.target?.result as string,
          name: file.name,
          size: file.size,
          type: fileType,
          mimeType: file.type || 'application/octet-stream',
        });
      };
      reader.onerror = () => reject(new Error('Error leyendo archivo del dispositivo'));
      reader.readAsDataURL(file);
    }
  });
};

export const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};
