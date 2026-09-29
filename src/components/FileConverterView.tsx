import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowLeft,
  UploadCloud,
  FileText,
  Image as ImageIcon,
  Music,
  Video,
  Archive,
  Code,
  Type,
  FileQuestion,
  AlertCircle,
  Download,
  Trash2,
  RefreshCw,
  Sparkles,
  ShieldCheck,
  HardDrive,
  Layers,
  Zap,
  Info
} from 'lucide-react';
import JSZip from 'jszip';
import {
  getCategoryByExtension,
  getCompatibleTargets,
  formatFileSize,
  MAX_BATCH_SIZE_BYTES
} from '../data/fileFormats';
import {
  ConversionItem,
  convertFileItem,
  revokeUrl,
  purgeAllMemory,
  getFreedBytes
} from '../utils/fileConversionEngine';

interface FileConverterViewProps {
  onBack: () => void;
}

export const FileConverterView: React.FC<FileConverterViewProps> = ({ onBack }) => {
  const [items, setItems] = useState<ConversionItem[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isConvertingAll, setIsConvertingAll] = useState(false);
  const [globalTargetFormat, setGlobalTargetFormat] = useState<string>('');
  const [freedBytesDisplay, setFreedBytesDisplay] = useState<number>(0);
  const [showFaq, setShowFaq] = useState(false);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Total batch size currently loaded
  const totalBatchSize = items.reduce((acc, curr) => acc + curr.originalSize, 0);
  const batchPercentage = Math.min(100, (totalBatchSize / MAX_BATCH_SIZE_BYTES) * 100);

  // Clean memory on unmount
  useEffect(() => {
    return () => {
      purgeAllMemory();
    };
  }, []);

  // Update freed bytes counter
  const refreshFreedMemory = () => {
    setFreedBytesDisplay(getFreedBytes());
  };

  // Handle file uploads (Drop or Input)
  const handleFilesAdded = (fileList: FileList | File[]) => {
    setErrorNotice(null);
    const incoming = Array.from(fileList);
    if (incoming.length === 0) return;

    let incomingSize = 0;
    const newItems: ConversionItem[] = [];

    for (const file of incoming) {
      incomingSize += file.size;
      const parts = file.name.split('.');
      const originalExt = parts.length > 1 ? parts.pop()!.toLowerCase() : 'bin';
      const compatibleTargets = getCompatibleTargets(originalExt);
      const defaultTarget = compatibleTargets[0] || (originalExt === 'pdf' ? 'txt' : 'pdf');

      newItems.push({
        id: `item-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        originalFile: file,
        name: file.name,
        originalSize: file.size,
        originalExt,
        targetExt: defaultTarget,
        status: 'pending',
        progress: 0
      });
    }

    if (totalBatchSize + incomingSize > MAX_BATCH_SIZE_BYTES) {
      setErrorNotice(
        `El lote total supera el límite estricto de 1.5 GB (${formatFileSize(
          totalBatchSize + incomingSize
        )} seleccionados). Por favor reduce los archivos para mantener el rendimiento óptimo.`
      );
      return;
    }

    setItems((prev) => [...prev, ...newItems]);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) {
      handleFilesAdded(e.dataTransfer.files);
    }
  };

  // Change target format for individual item
  const updateTargetExt = (id: string, newExt: string) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          // If already converted, revoke old URL to free memory immediately
          if (item.convertedUrl) {
            revokeUrl(item.convertedUrl, item.convertedSize || 0);
          }
          return {
            ...item,
            targetExt: newExt,
            status: 'pending',
            progress: 0,
            convertedBlob: undefined,
            convertedUrl: undefined,
            convertedSize: undefined
          };
        }
        return item;
      })
    );
    refreshFreedMemory();
  };

  // Apply target format to all compatible items
  const applyGlobalTarget = (ext: string) => {
    setGlobalTargetFormat(ext);
    if (!ext) return;
    setItems((prev) =>
      prev.map((item) => {
        const compatible = getCompatibleTargets(item.originalExt);
        if (compatible.includes(ext) || ext === 'zip') {
          if (item.convertedUrl) {
            revokeUrl(item.convertedUrl, item.convertedSize || 0);
          }
          return {
            ...item,
            targetExt: ext,
            status: 'pending',
            progress: 0,
            convertedBlob: undefined,
            convertedUrl: undefined
          };
        }
        return item;
      })
    );
    refreshFreedMemory();
  };

  // Convert individual item
  const convertSingle = async (id: string) => {
    const item = items.find((i) => i.id === id);
    if (!item || item.status === 'converting') return;

    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, status: 'converting', progress: 10 } : i))
    );

    const startTime = Date.now();
    try {
      const result = await convertFileItem(item, (percent) => {
        setItems((prev) =>
          prev.map((i) => (i.id === id ? { ...i, progress: percent } : i))
        );
      });

      const elapsed = Date.now() - startTime;
      setItems((prev) =>
        prev.map((i) =>
          i.id === id
            ? {
                ...i,
                status: 'completed',
                progress: 100,
                convertedBlob: result.blob,
                convertedUrl: result.url,
                convertedSize: result.size,
                conversionTimeMs: elapsed
              }
            : i
        )
      );
    } catch (err: any) {
      setItems((prev) =>
        prev.map((i) =>
          i.id === id
            ? {
                ...i,
                status: 'error',
                errorMessage: err?.message || 'Error en la conversión',
                progress: 0
              }
            : i
        )
      );
    }
  };

  // Convert all pending files
  const convertAll = async () => {
    if (isConvertingAll) return;
    setIsConvertingAll(true);

    const pendingItems = items.filter((i) => i.status !== 'completed');
    for (const item of pendingItems) {
      await convertSingle(item.id);
    }

    setIsConvertingAll(false);
  };

  // Download converted file
  const downloadItem = (item: ConversionItem) => {
    if (!item.convertedUrl) return;
    const baseName = item.name.replace(/\.[^/.]+$/, '');
    const downloadName = `${baseName}.${item.targetExt}`;

    const link = document.createElement('a');
    link.href = item.convertedUrl;
    link.download = downloadName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Download all completed items in a single ZIP
  const downloadAllZip = async () => {
    const completed = items.filter((i) => i.status === 'completed' && i.convertedBlob);
    if (completed.length === 0) return;

    const zip = new JSZip();
    completed.forEach((item) => {
      const baseName = item.name.replace(/\.[^/.]+$/, '');
      const filename = `${baseName}.${item.targetExt}`;
      zip.file(filename, item.convertedBlob!);
    });

    const zipBlob = await zip.generateAsync({ type: 'blob' });
    const zipUrl = URL.createObjectURL(zipBlob);
    const link = document.createElement('a');
    link.href = zipUrl;
    link.download = `nexstudio_archivos_convertidos_${Date.now()}.zip`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(zipUrl);
  };

  // Remove individual item and immediately reclaim memory
  const removeItem = (id: string) => {
    const item = items.find((i) => i.id === id);
    if (item && item.convertedUrl) {
      revokeUrl(item.convertedUrl, item.convertedSize || 0);
    }
    setItems((prev) => prev.filter((i) => i.id !== id));
    refreshFreedMemory();
  };

  // Clear all items and free 100% allocated RAM
  const clearAllAndFreeMemory = () => {
    let sizeReclaimed = 0;
    items.forEach((item) => {
      if (item.convertedUrl) {
        sizeReclaimed += item.convertedSize || item.originalSize;
        revokeUrl(item.convertedUrl, item.convertedSize || 0);
      }
    });
    purgeAllMemory();
    setItems([]);
    refreshFreedMemory();
  };

  // Render category icon helper
  const renderCategoryIcon = (ext: string) => {
    const cat = getCategoryByExtension(ext);
    switch (cat.id) {
      case 'image':
        return <ImageIcon className="w-4 h-4 text-blue-500" />;
      case 'document':
        return <FileText className="w-4 h-4 text-amber-500" />;
      case 'audio':
        return <Music className="w-4 h-4 text-violet-500" />;
      case 'video':
        return <Video className="w-4 h-4 text-rose-500" />;
      case 'archive':
        return <Archive className="w-4 h-4 text-emerald-500" />;
      case 'data':
        return <Code className="w-4 h-4 text-cyan-500" />;
      case 'font':
        return <Type className="w-4 h-4 text-fuchsia-500" />;
      default:
        return <FileQuestion className="w-4 h-4 text-slate-500" />;
    }
  };

  const completedCount = items.filter((i) => i.status === 'completed').length;
  const pendingCount = items.filter((i) => i.status === 'pending').length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="w-full max-w-6xl mx-auto px-4 py-8"
    >
      {/* Top Breadcrumb & Navigation */}
      <div className="flex items-center justify-between mb-6">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200 shadow-xs transition-all cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Volver a Herramientas</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowFaq(!showFaq)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-slate-600 hover:text-indigo-600 bg-white border border-slate-200 hover:border-indigo-200 transition-all cursor-pointer"
          >
            <Info className="w-3.5 h-3.5 text-indigo-500" />
            <span>¿Cómo funciona el espacio y privacidad?</span>
          </button>
        </div>
      </div>

      {/* Hero Banner Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-900 via-slate-900 to-indigo-950 text-white p-6 sm:p-10 mb-8 shadow-xl shadow-indigo-950/20 border border-indigo-800/40">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-80 h-80 rounded-full bg-gradient-to-br from-indigo-500/20 to-violet-500/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-10 w-60 h-60 rounded-full bg-amber-500/10 blur-2xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-200 text-xs font-semibold mb-4 backdrop-blur-xs">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>Más de 500 formatos compatibles</span>
            <span className="w-1 h-1 rounded-full bg-indigo-300" />
            <span className="text-amber-300">Límite 1.5 GB por lote</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight mb-3">
            Convertidor de Archivos
          </h1>
          <p className="text-slate-300 text-sm sm:text-base leading-relaxed mb-6 font-normal">
            Convierte imágenes, documentos, audio, video y código al instante. Todo se procesa
            mediante <strong className="text-white">memoria efímera de alto rendimiento</strong>:{' '}
            los archivos nunca se almacenan de forma permanente en servidores, garantizando privacidad total y
            recuperación inmediata del espacio en disco al descargarlos o limpiarlos.
          </p>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-3 backdrop-blur-xs">
              <span className="text-slate-400 block mb-1">Capacidad Máxima</span>
              <span className="text-sm font-bold text-white flex items-center gap-1.5">
                <HardDrive className="w-4 h-4 text-indigo-400" /> 1.5 GB
              </span>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-3 backdrop-blur-xs">
              <span className="text-slate-400 block mb-1">Formatos Soportados</span>
              <span className="text-sm font-bold text-white flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-violet-400" /> +500 extensiones
              </span>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-3 backdrop-blur-xs">
              <span className="text-slate-400 block mb-1">Seguridad & Privacidad</span>
              <span className="text-sm font-bold text-emerald-300 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" /> 100% Efímero
              </span>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-3 backdrop-blur-xs">
              <span className="text-slate-400 block mb-1">Memoria Liberada</span>
              <span className="text-sm font-bold text-amber-300 flex items-center gap-1.5">
                <RefreshCw className="w-4 h-4 text-amber-400" />
                {formatFileSize(freedBytesDisplay)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Explanatory FAQ / Architecture Drawer */}
      <AnimatePresence>
        {showFaq && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-8 overflow-hidden rounded-2xl bg-indigo-50/70 border border-indigo-200/80 p-5 text-slate-800"
          >
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-indigo-600 text-white shrink-0 mt-0.5">
                <HardDrive className="w-5 h-5" />
              </div>
              <div className="space-y-2 text-xs sm:text-sm">
                <h3 className="font-bold text-slate-900 text-base">
                  ¿Cómo gestiona NexStudio el espacio para que haya un límite amplio de 1.5 GB?
                </h3>
                <p className="text-slate-600 leading-relaxed">
                  Para no saturar servidores ni obligarte a pagar costosos discos duros, NexStudio utiliza una
                  <strong> arquitectura de flujo en memoria efímera (Zero-Waste Memory Stream)</strong>:
                </p>
                <ul className="list-disc pl-5 space-y-1 text-slate-600">
                  <li>
                    <strong>Procesamiento en RAM Temporal:</strong> El archivo se convierte directamente a través
                    del motor gráfico y de datos de tu navegador o mediante un micro-buffer volátil.
                  </li>
                  <li>
                    <strong>Auto-Limpieza Inmediata:</strong> En cuanto descargas el archivo o pulsas el botón
                    de limpiar, el sistema destruye el puntero de memoria (<code className="text-indigo-700 bg-indigo-100 px-1 rounded">URL.revokeObjectURL</code>)
                    y libera automáticamente los megabytes o gigabytes consumidos de vuelta a tu ordenador.
                  </li>
                  <li>
                    <strong>Privacidad Absoluta:</strong> Ningún documento confidencial, foto personal o video queda
                    almacenado permanentemente en la base de datos de NexStudio.
                  </li>
                </ul>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error / Alert notification */}
      {errorNotice && (
        <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <p className="font-medium">{errorNotice}</p>
        </div>
      )}

      {/* 1.5 GB Live Capacity Gauge */}
      <div className="mb-6 bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            <HardDrive className="w-4 h-4 text-indigo-600" />
            <span className="text-xs font-bold text-slate-800">
              Espacio Ocupado en Lote Actual:
            </span>
            <span className="text-xs font-semibold text-slate-600">
              {formatFileSize(totalBatchSize)} / 1.5 GB ({batchPercentage.toFixed(1)}%)
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs">
            {items.length > 0 && (
              <button
                type="button"
                onClick={clearAllAndFreeMemory}
                className="text-rose-600 hover:text-rose-800 font-semibold inline-flex items-center gap-1 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Vaciar lote y liberar memoria</span>
              </button>
            )}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${
              batchPercentage > 85 ? 'bg-rose-500' : batchPercentage > 50 ? 'bg-amber-500' : 'bg-indigo-600'
            }`}
            style={{ width: `${Math.max(2, batchPercentage)}%` }}
          />
        </div>
      </div>

      {/* Drag & Drop Upload Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative rounded-3xl border-2 border-dashed p-8 sm:p-12 text-center transition-all cursor-pointer mb-8 flex flex-col items-center justify-center ${
          isDragging
            ? 'border-indigo-600 bg-indigo-50/70 scale-[1.01]'
            : 'border-slate-200 hover:border-indigo-400 bg-white hover:bg-slate-50/50 shadow-xs'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files) {
              handleFilesAdded(e.target.files);
              e.target.value = ''; // reset so same file can be re-selected
            }
          }}
        />

        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-50 to-indigo-100 border border-indigo-200 flex items-center justify-center text-indigo-600 mb-4 shadow-xs">
          <UploadCloud className="w-8 h-8" />
        </div>

        <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-1">
          Arrastra y suelta tus archivos aquí, o haz clic para explorar
        </h3>
        <p className="text-xs sm:text-sm text-slate-500 max-w-lg mb-4">
          Soporta hasta 1.5 GB por lote en más de 500 formatos: Imágenes (PNG, JPG, WebP),
          Documentos (PDF, DOCX, TXT), Audio (MP3, WAV), Video (MP4, GIF), Datos (JSON, CSV) y Comprimidos (ZIP).
        </p>

        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-md shadow-indigo-600/20 transition-all">
          <UploadCloud className="w-4 h-4" />
          <span>Seleccionar archivos desde tu PC</span>
        </div>
      </div>

      {/* Main Conversion Table / Active Items */}
      {items.length > 0 && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden mb-12">
          {/* Header Action Bar */}
          <div className="p-4 sm:p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/60">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                <span>Cola de Archivos</span>
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-700">
                  {items.length} {items.length === 1 ? 'archivo' : 'archivos'}
                </span>
              </h2>
              <p className="text-xs text-slate-500 font-normal">
                {completedCount} completados • {pendingCount} pendientes • Tamaño total:{' '}
                {formatFileSize(totalBatchSize)}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Batch Format Selector */}
              <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl px-2.5 py-1 text-xs">
                <span className="text-slate-500">Convertir todos a:</span>
                <select
                  value={globalTargetFormat}
                  onChange={(e) => applyGlobalTarget(e.target.value)}
                  className="bg-transparent font-bold text-indigo-700 outline-none cursor-pointer"
                >
                  <option value="">(Personalizado)</option>
                  <option value="png">PNG</option>
                  <option value="jpg">JPG</option>
                  <option value="webp">WebP</option>
                  <option value="pdf">PDF</option>
                  <option value="txt">TXT</option>
                  <option value="mp3">MP3</option>
                  <option value="wav">WAV</option>
                  <option value="zip">ZIP</option>
                  <option value="json">JSON</option>
                  <option value="csv">CSV</option>
                </select>
              </div>

              {/* Convert All Button */}
              {pendingCount > 0 && (
                <button
                  type="button"
                  disabled={isConvertingAll}
                  onClick={convertAll}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs disabled:opacity-50 transition-all cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isConvertingAll ? 'animate-spin' : ''}`} />
                  <span>{isConvertingAll ? 'Convirtiendo...' : 'Convertir Todos'}</span>
                </button>
              )}

              {/* Download All in ZIP */}
              {completedCount > 1 && (
                <button
                  type="button"
                  onClick={downloadAllZip}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition-all cursor-pointer"
                >
                  <Archive className="w-3.5 h-3.5" />
                  <span>Descargar todo en ZIP</span>
                </button>
              )}
            </div>
          </div>

          {/* Files List */}
          <div className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto">
            {items.map((item) => {
              const compatibleTargets = getCompatibleTargets(item.originalExt);

              return (
                <div
                  key={item.id}
                  className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/50 transition-colors"
                >
                  {/* File Info */}
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0">
                      {renderCategoryIcon(item.originalExt)}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs sm:text-sm font-semibold text-slate-900 truncate">
                          {item.name}
                        </span>
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-100 text-slate-600">
                          {item.originalExt}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                        <span>Original: {formatFileSize(item.originalSize)}</span>
                        {item.convertedSize !== undefined && (
                          <>
                            <span>•</span>
                            <span className="text-indigo-600 font-semibold">
                              Convertido: {formatFileSize(item.convertedSize)}
                            </span>
                          </>
                        )}
                        {item.conversionTimeMs !== undefined && (
                          <>
                            <span>•</span>
                            <span className="text-emerald-600">
                              {(item.conversionTimeMs / 1000).toFixed(1)}s
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Format Selector + Conversion Controls */}
                  <div className="flex flex-wrap items-center gap-3 justify-end shrink-0">
                    {/* Format Target Dropdown */}
                    <div className="flex items-center gap-1.5 bg-slate-100/80 rounded-xl px-2.5 py-1.5 border border-slate-200 text-xs">
                      <span className="text-slate-500 font-medium">a:</span>
                      <select
                        disabled={item.status === 'converting'}
                        value={item.targetExt}
                        onChange={(e) => updateTargetExt(item.id, e.target.value)}
                        className="bg-transparent font-bold text-indigo-700 outline-none cursor-pointer uppercase text-xs"
                      >
                        {compatibleTargets.map((ext) => (
                          <option key={ext} value={ext}>
                            {ext.toUpperCase()}
                          </option>
                        ))}
                        <option value="zip">ZIP (Archivo)</option>
                      </select>
                    </div>

                    {/* Status & Action Buttons */}
                    {item.status === 'pending' && (
                      <button
                        type="button"
                        onClick={() => convertSingle(item.id)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-semibold transition-all cursor-pointer"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>Convertir</span>
                      </button>
                    )}

                    {item.status === 'converting' && (
                      <div className="flex items-center gap-2 min-w-[120px]">
                        <div className="w-20 h-2 bg-slate-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-indigo-600 transition-all duration-200"
                            style={{ width: `${item.progress}%` }}
                          />
                        </div>
                        <span className="text-[11px] font-bold text-indigo-600">
                          {item.progress}%
                        </span>
                      </div>
                    )}

                    {item.status === 'completed' && (
                      <button
                        type="button"
                        onClick={() => downloadItem(item)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition-all cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Descargar</span>
                      </button>
                    )}

                    {item.status === 'error' && (
                      <span className="text-xs text-rose-600 font-semibold flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5" />
                        <span>Error</span>
                      </span>
                    )}

                    {/* Delete Item & Reclaim Memory */}
                    <button
                      type="button"
                      onClick={() => removeItem(item.id)}
                      title="Eliminar y liberar espacio"
                      className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </motion.div>
  );
};
