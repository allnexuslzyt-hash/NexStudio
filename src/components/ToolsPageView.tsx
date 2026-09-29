import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  Wrench,
  ArrowLeft,
  ArrowRight,
  RefreshCw,
  Sparkles,
  HardDrive,
  Layers,
  ShieldCheck,
  Zap,
  ImageIcon,
  QrCode,
  Gauge,
  KeyRound,
  SlidersHorizontal
} from 'lucide-react';
import { FileConverterView } from './FileConverterView';
import { ImageCompressorView } from './tools/ImageCompressorView';
import { QrGeneratorView } from './tools/QrGeneratorView';
import { SpeedtestView } from './tools/SpeedtestView';
import { PasswordGeneratorView } from './tools/PasswordGeneratorView';

interface ToolsPageViewProps {
  onBack: () => void;
  onOpenCanvas?: () => void;
}

export const ToolsPageView: React.FC<ToolsPageViewProps> = ({ onBack }) => {
  const [selectedTool, setSelectedTool] = useState<string | null>(null);

  if (selectedTool === 'convertidor') {
    return <FileConverterView onBack={() => setSelectedTool(null)} />;
  }

  if (selectedTool === 'compresor') {
    return <ImageCompressorView onBack={() => setSelectedTool(null)} />;
  }

  if (selectedTool === 'qr') {
    return <QrGeneratorView onBack={() => setSelectedTool(null)} />;
  }

  if (selectedTool === 'speedtest') {
    return <SpeedtestView onBack={() => setSelectedTool(null)} />;
  }

  if (selectedTool === 'password') {
    return <PasswordGeneratorView onBack={() => setSelectedTool(null)} />;
  }

  const TOOLS_LIST = [
    {
      id: 'convertidor',
      title: 'Convertidor de Archivos',
      badge: 'Límite 1.5 GB • +500 Formatos',
      badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      description: 'Convierte fotos, documentos, audio, video, archivos comprimidos y código al instante. Todo en memoria efímera sin ocupar espacio permanente.',
      icon: <RefreshCw className="w-6 h-6 text-indigo-600" />,
      iconBg: 'bg-indigo-50 border-indigo-100',
      btnColor: 'bg-indigo-600 hover:bg-indigo-700 text-white',
      featured: true
    },
    {
      id: 'compresor',
      title: 'Compresor de Imágenes y Miniaturas',
      badge: 'Ahorro hasta 85%',
      badgeColor: 'bg-violet-50 text-violet-700 border-violet-200',
      description: 'Reduce el peso de imágenes PNG, JPG y WebP con control deslizante de calidad. Ideal para miniaturas de YouTube o banners web.',
      icon: <ImageIcon className="w-6 h-6 text-violet-600" />,
      iconBg: 'bg-violet-50 border-violet-100',
      btnColor: 'bg-violet-600 hover:bg-violet-700 text-white',
      featured: false
    },
    {
      id: 'qr',
      title: 'Generador de Códigos QR',
      badge: 'PNG 1024px & SVG',
      badgeColor: 'bg-blue-50 text-blue-700 border-blue-200',
      description: 'Crea códigos QR personalizados para páginas web, canales de YouTube, redes Wi-Fi o texto libre con colores a medida.',
      icon: <QrCode className="w-6 h-6 text-blue-600" />,
      iconBg: 'bg-blue-50 border-blue-100',
      btnColor: 'bg-blue-600 hover:bg-blue-700 text-white',
      featured: false
    },
    {
      id: 'speedtest',
      title: 'Medidor de Velocidad & Ping',
      badge: 'Test en Tiempo Real',
      badgeColor: 'bg-cyan-50 text-cyan-700 border-cyan-200',
      description: 'Analiza tu velocidad de descarga, subida y latencia (Ping / Jitter) en milisegundos con velocímetro animado en vivo.',
      icon: <Gauge className="w-6 h-6 text-cyan-600" />,
      iconBg: 'bg-cyan-50 border-cyan-100',
      btnColor: 'bg-cyan-600 hover:bg-cyan-700 text-white',
      featured: false
    },
    {
      id: 'password',
      title: 'Generador de Contraseñas & Tokens',
      badge: 'Criptografía WebCrypto',
      badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      description: 'Genera claves blindadas de alta entropía (8 a 64 caracteres), frases de paso mnemotécnicas y tokens de seguridad con 1 clic.',
      icon: <KeyRound className="w-6 h-6 text-emerald-600" />,
      iconBg: 'bg-emerald-50 border-emerald-100',
      btnColor: 'bg-emerald-600 hover:bg-emerald-700 text-white',
      featured: false
    }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="w-full max-w-6xl mx-auto px-4 py-8"
    >
      {/* Top Bar */}
      <div className="flex items-center justify-between mb-6">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200 shadow-xs transition-all cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Volver al inicio</span>
        </button>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold">
          <Wrench className="w-3.5 h-3.5 text-amber-600" />
          <span>Colección de Utilidades Activas ({TOOLS_LIST.length})</span>
        </div>
      </div>

      {/* Hero Header */}
      <div className="mb-8 text-center max-w-2xl mx-auto">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-200 text-amber-600 mb-3 shadow-xs">
          <Wrench className="w-6 h-6" />
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mb-2">
          Herramientas de NexStudio
        </h1>
        <p className="text-slate-600 text-sm sm:text-base font-normal leading-relaxed">
          Herramientas web de procesamiento rapido.
        </p>
      </div>

      {/* Grid of Tools */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {TOOLS_LIST.map((tool) => (
          <div
            key={tool.id}
            className={`p-6 rounded-3xl bg-white border transition-all flex flex-col justify-between shadow-xs hover:shadow-md ${
              tool.featured
                ? 'border-indigo-300 ring-2 ring-indigo-500/10 md:col-span-2 lg:col-span-2'
                : 'border-slate-200 hover:border-slate-300'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <div
                  className={`w-12 h-12 rounded-2xl border flex items-center justify-center ${tool.iconBg}`}
                >
                  {tool.icon}
                </div>
                <span
                  className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${tool.badgeColor}`}
                >
                  {tool.badge}
                </span>
              </div>

              <h3 className="text-lg font-bold text-slate-900 mb-2">
                {tool.title}
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 font-normal leading-relaxed mb-6">
                {tool.description}
              </p>
            </div>

            <div className="pt-4 border-t border-slate-100">
              <button
                type="button"
                id={`tool-btn-${tool.id}`}
                onClick={() => setSelectedTool(tool.id)}
                className={`w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-bold text-xs shadow-xs transition-all cursor-pointer ${tool.btnColor}`}
              >
                <span>Abrir {tool.title}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
};
