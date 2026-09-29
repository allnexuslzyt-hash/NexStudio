import React, { useState, useRef } from 'react';
import { motion } from 'motion/react';
import {
  ArrowLeft,
  UploadCloud,
  ImageIcon,
  Download,
  Trash2,
  RefreshCw,
  Sparkles,
  Sliders,
  CheckCircle2,
  Zap,
  Archive,
  Maximize2
} from 'lucide-react';
import JSZip from 'jszip';
import { formatFileSize } from '../../data/fileFormats';

interface ImageCompressorViewProps {
  onBack: () => void;
}

interface CompressedImageItem {
  id: string;
  file: File;
  name: string;
  originalSize: number;
  originalWidth: number;
  originalHeight: number;
  previewUrl: string;
  compressedBlob?: Blob;
  compressedUrl?: string;
  compressedSize?: number;
  savingsPercent?: number;
  isProcessing: boolean;
}

export const ImageCompressorView: React.FC<ImageCompressorViewProps> = ({ onBack }) => {
  const [items, setItems] = useState<CompressedImageItem[]>([]);
  const [quality, setQuality] = useState<number>(80);
  const [targetFormat, setTargetFormat] = useState<'original' | 'webp' | 'jpeg' | 'png'>('webp');
  const [scale, setScale] = useState<number>(100);
  const [isProcessingAll, setIsProcessingAll] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFilesAdded = async (fileList: FileList | File[]) => {
    const files = Array.from(fileList).filter((f) => f.type.startsWith('image/'));
    if (files.length === 0) return;

    const newItems: CompressedImageItem[] = [];

    for (const file of files) {
      const previewUrl = URL.createObjectURL(file);
      const dimensions = await getImageDimensions(previewUrl);

      newItems.push({
        id: `img-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        file,
        name: file.name,
        originalSize: file.size,
        originalWidth: dimensions.width,
        originalHeight: dimensions.height,
        previewUrl,
        isProcessing: false
      });
    }

    setItems((prev) => [...prev, ...newItems]);
    // Auto-compress newly added files with current settings
    newItems.forEach((it) => compressSingleItem(it, quality, targetFormat, scale));
  };

  const getImageDimensions = (url: string): Promise<{ width: number; height: number }> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
      img.onerror = () => resolve({ width: 0, height: 0 });
      img.src = url;
    });
  };

  const compressSingleItem = async (
    item: CompressedImageItem,
    qual: number,
    format: string,
    scalePercent: number
  ) => {
    setItems((prev) =>
      prev.map((i) => (i.id === item.id ? { ...i, isProcessing: true } : i))
    );

    try {
      const blob = await compressImageBlob(item.file, qual / 100, format, scalePercent / 100);
      const compressedUrl = URL.createObjectURL(blob);
      const savings = Math.max(0, Math.round(((item.originalSize - blob.size) / item.originalSize) * 100));

      setItems((prev) =>
        prev.map((i) => {
          if (i.id === item.id) {
            if (i.compressedUrl) URL.revokeObjectURL(i.compressedUrl);
            return {
              ...i,
              compressedBlob: blob,
              compressedUrl,
              compressedSize: blob.size,
              savingsPercent: savings,
              isProcessing: false
            };
          }
          return i;
        })
      );
    } catch {
      setItems((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, isProcessing: false } : i))
      );
    }
  };

  const compressImageBlob = (
    file: File,
    qualityRatio: number,
    formatChoice: string,
    scaleFactor: number
  ): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const objectUrl = URL.createObjectURL(file);

      img.onload = () => {
        const canvas = document.createElement('canvas');
        const targetWidth = Math.max(10, Math.round(img.naturalWidth * scaleFactor));
        const targetHeight = Math.max(10, Math.round(img.naturalHeight * scaleFactor));

        canvas.width = targetWidth;
        canvas.height = targetHeight;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          URL.revokeObjectURL(objectUrl);
          return reject(new Error('Canvas context failed'));
        }

        let mimeType = 'image/webp';
        if (formatChoice === 'jpeg') mimeType = 'image/jpeg';
        else if (formatChoice === 'png') mimeType = 'image/png';
        else if (formatChoice === 'original') {
          mimeType = file.type || 'image/jpeg';
        }

        if (mimeType === 'image/jpeg') {
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, targetWidth, targetHeight);
        }

        ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

        canvas.toBlob(
          (blob) => {
            URL.revokeObjectURL(objectUrl);
            if (blob) resolve(blob);
            else reject(new Error('Compression error'));
          },
          mimeType,
          mimeType === 'image/png' ? undefined : qualityRatio
        );
      };

      img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        reject(new Error('Image decode error'));
      };

      img.src = objectUrl;
    });
  };

  const recompressAll = (newQual: number, newFormat: 'original' | 'webp' | 'jpeg' | 'png', newScale: number) => {
    items.forEach((it) => compressSingleItem(it, newQual, newFormat, newScale));
  };

  const downloadSingle = (item: CompressedImageItem) => {
    if (!item.compressedUrl) return;
    const ext = targetFormat === 'original' ? item.name.split('.').pop() || 'webp' : targetFormat;
    const baseName = item.name.replace(/\.[^/.]+$/, '');
    const filename = `${baseName}_comprimido.${ext}`;

    const link = document.createElement('a');
    link.href = item.compressedUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadAllInZip = async () => {
    const readyItems = items.filter((i) => i.compressedBlob);
    if (readyItems.length === 0) return;

    const zip = new JSZip();
    readyItems.forEach((item) => {
      const ext = targetFormat === 'original' ? item.name.split('.').pop() || 'webp' : targetFormat;
      const baseName = item.name.replace(/\.[^/.]+$/, '');
      zip.file(`${baseName}_comprimido.${ext}`, item.compressedBlob!);
    });

    const zipBlob = await zip.generateAsync({ type: 'blob' });
    const zipUrl = URL.createObjectURL(zipBlob);
    const link = document.createElement('a');
    link.href = zipUrl;
    link.download = `nexstudio_imagenes_optimizadas_${Date.now()}.zip`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(zipUrl);
  };

  const removeItem = (id: string) => {
    const it = items.find((i) => i.id === id);
    if (it) {
      URL.revokeObjectURL(it.previewUrl);
      if (it.compressedUrl) URL.revokeObjectURL(it.compressedUrl);
    }
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const clearAll = () => {
    items.forEach((it) => {
      URL.revokeObjectURL(it.previewUrl);
      if (it.compressedUrl) URL.revokeObjectURL(it.compressedUrl);
    });
    setItems([]);
  };

  const totalOriginal = items.reduce((acc, curr) => acc + curr.originalSize, 0);
  const totalCompressed = items.reduce((acc, curr) => acc + (curr.compressedSize || curr.originalSize), 0);
  const totalSaved = Math.max(0, totalOriginal - totalCompressed);
  const totalPercent = totalOriginal > 0 ? Math.round((totalSaved / totalOriginal) * 100) : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="w-full max-w-5xl mx-auto px-4 py-8"
    >
      {/* Top Breadcrumb */}
      <div className="flex items-center justify-between mb-6">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200 shadow-xs transition-all cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Volver a Herramientas</span>
        </button>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-50 border border-violet-200 text-violet-800 text-xs font-semibold">
          <Zap className="w-3.5 h-3.5 text-violet-600" />
          <span>Compresión en Navegador</span>
        </div>
      </div>

      {/* Hero Header */}
      <div className="rounded-3xl bg-gradient-to-br from-violet-900 via-slate-900 to-indigo-950 text-white p-6 sm:p-10 mb-8 border border-violet-800/40 shadow-xl shadow-violet-950/20">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/20 border border-violet-400/30 text-violet-200 text-xs font-semibold mb-3">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Ahorra hasta un 85% de espacio</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight mb-2">
            Compresor de Imágenes y Miniaturas
          </h1>
          <p className="text-slate-300 text-xs sm:text-sm font-normal leading-relaxed">
            Reduce el peso de tus fotos PNG, JPG y WebP al instante sin pérdida visible de nitidez.
            Ideal para miniaturas de YouTube, banners o contenido para redes sociales.
          </p>
        </div>
      </div>

      {/* Upload Zone */}
      <div
        onClick={() => fileInputRef.current?.click()}
        className="rounded-3xl border-2 border-dashed border-slate-200 hover:border-violet-400 bg-white hover:bg-violet-50/30 p-8 sm:p-10 text-center transition-all cursor-pointer mb-8 shadow-xs flex flex-col items-center justify-center"
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files) {
              handleFilesAdded(e.target.files);
              e.target.value = '';
            }
          }}
        />

        <div className="w-14 h-14 rounded-2xl bg-violet-50 border border-violet-100 flex items-center justify-center text-violet-600 mb-3 shadow-xs">
          <UploadCloud className="w-7 h-7" />
        </div>
        <h3 className="text-base font-bold text-slate-900 mb-1">
          Haz clic o arrastra tus imágenes aquí
        </h3>
        <p className="text-xs text-slate-500 max-w-md">
          Soporta PNG, JPG, WebP, GIF y BMP. Puedes comprimir múltiples imágenes simultáneamente.
        </p>
      </div>

      {/* Control Panel (Sliders & Options) */}
      {items.length > 0 && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs mb-8">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            {/* Quality Slider */}
            <div className="flex-1 w-full">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-800 mb-2">
                <span className="flex items-center gap-1.5">
                  <Sliders className="w-4 h-4 text-violet-600" />
                  Calidad de Compresión:
                </span>
                <span className="text-violet-700 font-bold bg-violet-50 px-2 py-0.5 rounded-lg border border-violet-200">
                  {quality}%
                </span>
              </div>
              <input
                type="range"
                min="10"
                max="100"
                value={quality}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10);
                  setQuality(val);
                  recompressAll(val, targetFormat, scale);
                }}
                className="w-full accent-violet-600 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                <span>Máximo ahorro (10%)</span>
                <span>Equilibrado (80%)</span>
                <span>Máxima calidad (100%)</span>
              </div>
            </div>

            {/* Target Format */}
            <div className="shrink-0 flex flex-col gap-1 text-xs">
              <span className="font-semibold text-slate-700">Formato de salida:</span>
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                {(['webp', 'jpeg', 'png', 'original'] as const).map((fmt) => (
                  <button
                    key={fmt}
                    type="button"
                    onClick={() => {
                      setTargetFormat(fmt);
                      recompressAll(quality, fmt, scale);
                    }}
                    className={`px-3 py-1.5 rounded-lg font-bold text-xs uppercase transition-all cursor-pointer ${
                      targetFormat === fmt
                        ? 'bg-white text-violet-700 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {fmt}
                  </button>
                ))}
              </div>
            </div>

            {/* Resizing Scale */}
            <div className="shrink-0 flex flex-col gap-1 text-xs">
              <span className="font-semibold text-slate-700">Escala de tamaño:</span>
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                {[100, 75, 50].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => {
                      setScale(s);
                      recompressAll(quality, targetFormat, s);
                    }}
                    className={`px-2.5 py-1.5 rounded-lg font-bold text-xs transition-all cursor-pointer ${
                      scale === s
                        ? 'bg-white text-violet-700 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {s}%
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Savings Summary Banner */}
          <div className="mt-6 pt-5 border-t border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 shrink-0">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-slate-500 font-normal">Ahorro total estimado:</p>
                <p className="text-sm font-bold text-slate-900">
                  {formatFileSize(totalOriginal)} →{' '}
                  <span className="text-emerald-600">{formatFileSize(totalCompressed)}</span>{' '}
                  <span className="text-emerald-700 bg-emerald-50 border border-emerald-200 text-xs px-2 py-0.5 rounded-full ml-1">
                    -{totalPercent}%
                  </span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={clearAll}
                className="px-3 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 transition-all cursor-pointer"
              >
                Limpiar todo
              </button>
              {items.length > 1 && (
                <button
                  type="button"
                  onClick={downloadAllInZip}
                  className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition-all cursor-pointer"
                >
                  <Archive className="w-3.5 h-3.5" />
                  <span>Descargar todo en ZIP</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Items List */}
      {items.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {items.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex items-center gap-4"
            >
              <div className="w-20 h-20 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 shrink-0 flex items-center justify-center">
                <img
                  src={item.previewUrl}
                  alt={item.name}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="min-w-0 flex-1">
                <h4 className="text-xs font-bold text-slate-900 truncate mb-1">
                  {item.name}
                </h4>
                <div className="text-[11px] text-slate-500 space-y-0.5">
                  <p>
                    Original: <span className="font-semibold text-slate-700">{formatFileSize(item.originalSize)}</span>
                  </p>
                  <p>
                    Optimizado:{' '}
                    <span className="font-bold text-emerald-600">
                      {item.compressedSize ? formatFileSize(item.compressedSize) : 'Calculando...'}
                    </span>
                    {item.savingsPercent !== undefined && (
                      <span className="ml-1 text-emerald-700 font-bold bg-emerald-50 px-1 rounded">
                        -{item.savingsPercent}%
                      </span>
                    )}
                  </p>
                </div>

                <div className="mt-2 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => downloadSingle(item)}
                    disabled={!item.compressedUrl}
                    className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold transition-all cursor-pointer disabled:opacity-50"
                  >
                    <Download className="w-3 h-3" />
                    <span>Descargar</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => removeItem(item.id)}
                    className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
};
