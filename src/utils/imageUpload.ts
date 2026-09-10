/**
 * Helper to process and optimize image files selected from the user's device.
 * Scales the image to an avatar-appropriate resolution (max 320x320) and encodes it
 * as a compressed JPEG Data URL to ensure smooth Firestore storage without document size issues.
 */
export const processDeviceImage = (file: File, maxDimension = 320, quality = 0.88): Promise<string> => {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('El archivo seleccionado no es una imagen válida. Selecciona un archivo JPG, PNG o WebP.'));
      return;
    }

    // Limit original file size to 10MB before processing
    if (file.size > 10 * 1024 * 1024) {
      reject(new Error('La imagen original es demasiado pesada (máximo 10 MB). Elige una imagen más ligera.'));
      return;
    }

    const reader = new FileReader();

    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (!result) {
        reject(new Error('No se pudo leer la imagen del dispositivo.'));
        return;
      }

      const img = new Image();
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          let { width, height } = img;

          if (width > height) {
            if (width > maxDimension) {
              height = Math.round((height * maxDimension) / width);
              width = maxDimension;
            }
          } else {
            if (height > maxDimension) {
              width = Math.round((width * maxDimension) / height);
              height = maxDimension;
            }
          }

          canvas.width = Math.max(width, 1);
          canvas.height = Math.max(height, 1);

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            // Fallback if canvas context is not available
            resolve(result);
            return;
          }

          // Render image onto canvas
          ctx.drawImage(img, 0, 0, width, height);

          // Export as compressed data URL
          const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
          resolve(compressedDataUrl);
        } catch (err) {
          console.warn('Canvas optimization failed, falling back to original data URL:', err);
          resolve(result);
        }
      };

      img.onerror = () => {
        reject(new Error('El formato de imagen no pudo ser decodificado. Prueba con otra imagen.'));
      };

      img.src = result;
    };

    reader.onerror = () => {
      reject(new Error('Error al acceder al archivo en tu dispositivo.'));
    };

    reader.readAsDataURL(file);
  });
};
