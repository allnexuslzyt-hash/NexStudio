import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import {
  ArrowLeft,
  QrCode,
  Download,
  Copy,
  Check,
  Globe,
  Wifi,
  Type,
  Sparkles,
  Palette,
  Share2,
  ExternalLink,
  ShieldCheck
} from 'lucide-react';
import QRCode from 'qrcode';

interface QrGeneratorViewProps {
  onBack: () => void;
}

type QrType = 'url' | 'text' | 'wifi' | 'social';

export const QrGeneratorView: React.FC<QrGeneratorViewProps> = ({ onBack }) => {
  const [qrType, setQrType] = useState<QrType>('url');
  const [urlValue, setUrlValue] = useState<string>('https://');
  const [textValue, setTextValue] = useState<string>('');
  
  // Wi-Fi fields
  const [wifiSsid, setWifiSsid] = useState<string>('');
  const [wifiPassword, setWifiPassword] = useState<string>('');
  const [wifiEncryption, setWifiEncryption] = useState<'WPA' | 'WEP' | 'nopass'>('WPA');

  // Styling options
  const [fgColor, setFgColor] = useState<string>('#4F46E5'); // NexStudio Indigo
  const [bgColor, setBgColor] = useState<string>('#FFFFFF');
  const [errorCorrection, setErrorCorrection] = useState<'L' | 'M' | 'Q' | 'H'>('M');
  const [copied, setCopied] = useState<boolean>(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Compute raw payload based on type
  const getPayload = (): string => {
    switch (qrType) {
      case 'url':
        return urlValue.trim() || 'https://';
      case 'text':
        return textValue.trim() || 'NexStudio';
      case 'wifi':
        return `WIFI:T:${wifiEncryption};S:${wifiSsid};P:${wifiPassword};;`;
      case 'social':
        return urlValue.trim() || 'https://youtube.com/@NexStudio-Nexuslz';
      default:
        return 'https://';
    }
  };

  const payload = getPayload();

  // Generate QR on canvas whenever options or payload change
  useEffect(() => {
    if (!canvasRef.current) return;
    try {
      QRCode.toCanvas(
        canvasRef.current,
        payload,
        {
          width: 320,
          margin: 2,
          color: {
            dark: fgColor,
            light: bgColor
          },
          errorCorrectionLevel: errorCorrection
        },
        (error) => {
          if (error) console.error('QR generation error', error);
        }
      );
    } catch (err) {
      console.error(err);
    }
  }, [payload, fgColor, bgColor, errorCorrection]);

  const downloadPng = () => {
    // Render high resolution version (1024x1024)
    const exportCanvas = document.createElement('canvas');
    QRCode.toCanvas(
      exportCanvas,
      payload,
      {
        width: 1024,
        margin: 2,
        color: { dark: fgColor, light: bgColor },
        errorCorrectionLevel: errorCorrection
      },
      () => {
        const link = document.createElement('a');
        link.download = `codigo_qr_nexstudio_${Date.now()}.png`;
        link.href = exportCanvas.toDataURL('image/png');
        link.click();
      }
    );
  };

  const downloadSvg = async () => {
    try {
      const svgString = await QRCode.toString(payload, {
        type: 'svg',
        color: { dark: fgColor, light: bgColor },
        errorCorrectionLevel: errorCorrection
      });
      const blob = new Blob([svgString], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.download = `codigo_qr_nexstudio_${Date.now()}.svg`;
      link.href = url;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
    }
  };

  const copyPayload = () => {
    navigator.clipboard.writeText(payload);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const COLOR_PRESETS = [
    { name: 'Indigo NexStudio', hex: '#4F46E5' },
    { name: 'Negro Clásico', hex: '#0F172A' },
    { name: 'Violeta Deep', hex: '#7C3AED' },
    { name: 'Esmeralda', hex: '#059669' },
    { name: 'Azul Eléctrico', hex: '#0284C7' },
    { name: 'Rojo Carmesí', hex: '#E11D48' }
  ];

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

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-800 text-xs font-semibold">
          <QrCode className="w-3.5 h-3.5 text-indigo-600" />
          <span>Vectorial & Alta Resolución</span>
        </div>
      </div>

      {/* Header Banner */}
      <div className="rounded-3xl bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-950 text-white p-6 sm:p-10 mb-8 border border-indigo-800/40 shadow-xl shadow-indigo-950/20">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-200 text-xs font-semibold mb-3">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Generador Ilimitado y Gratuito</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight mb-2">
            Generador de Códigos QR
          </h1>
          <p className="text-slate-300 text-xs sm:text-sm font-normal leading-relaxed">
            Crea códigos QR personalizados para enlaces web, redes sociales, redes Wi-Fi o texto libre.
            Descárgalos en PNG en ultra-alta resolución (1024px) o en formato vectorial SVG.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Config Panel */}
        <div className="lg:col-span-7 space-y-6">
          {/* Type Selector Tabs */}
          <div className="bg-white rounded-2xl border border-slate-200 p-2 flex flex-wrap gap-1 shadow-xs">
            <button
              type="button"
              onClick={() => {
                setQrType('url');
                if (urlValue === '') setUrlValue('https://');
              }}
              className={`flex-1 min-w-[100px] inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                qrType === 'url'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>Enlace Web</span>
            </button>

            <button
              type="button"
              onClick={() => setQrType('text')}
              className={`flex-1 min-w-[100px] inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                qrType === 'text'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Type className="w-3.5 h-3.5" />
              <span>Texto Libre</span>
            </button>

            <button
              type="button"
              onClick={() => setQrType('wifi')}
              className={`flex-1 min-w-[100px] inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                qrType === 'wifi'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Wifi className="w-3.5 h-3.5" />
              <span>Red Wi-Fi</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setQrType('social');
                setUrlValue('https://youtube.com/@NexStudio-Nexuslz');
              }}
              className={`flex-1 min-w-[100px] inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                qrType === 'social'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Canal / Redes</span>
            </button>
          </div>

          {/* Dynamic Inputs according to Type */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
            {qrType === 'url' && (
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5">
                  Dirección URL del sitio web:
                </label>
                <input
                  type="url"
                  value={urlValue}
                  onChange={(e) => setUrlValue(e.target.value)}
                  placeholder="https://tudominio.com"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20 outline-none transition-all"
                />
              </div>
            )}

            {qrType === 'text' && (
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5">
                  Contenido de texto o mensaje:
                </label>
                <textarea
                  rows={4}
                  value={textValue}
                  onChange={(e) => setTextValue(e.target.value)}
                  placeholder="Escribe aquí notas, contraseñas temporales, avisos..."
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20 outline-none transition-all resize-none"
                />
              </div>
            )}

            {qrType === 'wifi' && (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Nombre de la red Wi-Fi (SSID):
                  </label>
                  <input
                    type="text"
                    value={wifiSsid}
                    onChange={(e) => setWifiSsid(e.target.value)}
                    placeholder="Ej. MiCasa_5G"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm outline-none focus:border-indigo-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Contraseña:
                  </label>
                  <input
                    type="text"
                    value={wifiPassword}
                    onChange={(e) => setWifiPassword(e.target.value)}
                    placeholder="Contraseña de la red"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm outline-none focus:border-indigo-600 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Tipo de seguridad:
                  </label>
                  <select
                    value={wifiEncryption}
                    onChange={(e) => setWifiEncryption(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm outline-none focus:border-indigo-600 bg-white"
                  >
                    <option value="WPA">WPA / WPA2 / WPA3 (Estándar)</option>
                    <option value="WEP">WEP (Antiguo)</option>
                    <option value="nopass">Sin Contraseña (Abierta)</option>
                  </select>
                </div>
              </div>
            )}

            {qrType === 'social' && (
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5">
                  Enlace directo a tu canal de YouTube o perfil:
                </label>
                <input
                  type="url"
                  value={urlValue}
                  onChange={(e) => setUrlValue(e.target.value)}
                  placeholder="https://youtube.com/@NexStudio-Nexuslz"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-indigo-600 outline-none"
                />
              </div>
            )}

            {/* Customization: Colors & Presets */}
            <div className="pt-4 border-t border-slate-100">
              <label className="block text-xs font-bold text-slate-800 mb-2 flex items-center gap-1.5">
                <Palette className="w-4 h-4 text-indigo-600" />
                <span>Color del Código QR:</span>
              </label>

              <div className="flex flex-wrap items-center gap-2 mb-3">
                {COLOR_PRESETS.map((color) => (
                  <button
                    key={color.hex}
                    type="button"
                    onClick={() => setFgColor(color.hex)}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border transition-all cursor-pointer ${
                      fgColor === color.hex
                        ? 'border-indigo-600 bg-indigo-50 font-bold text-indigo-900'
                        : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <span
                      className="w-3 h-3 rounded-full shrink-0 shadow-2xs"
                      style={{ backgroundColor: color.hex }}
                    />
                    <span>{color.name}</span>
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-4 text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-slate-500">Color personalizado:</span>
                  <input
                    type="color"
                    value={fgColor}
                    onChange={(e) => setFgColor(e.target.value)}
                    className="w-8 h-8 rounded-lg border border-slate-300 cursor-pointer"
                  />
                  <span className="font-mono text-[11px] text-slate-600 uppercase">{fgColor}</span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-slate-500">Fondo:</span>
                  <input
                    type="color"
                    value={bgColor}
                    onChange={(e) => setBgColor(e.target.value)}
                    className="w-8 h-8 rounded-lg border border-slate-300 cursor-pointer"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Preview & Action Panel */}
        <div className="lg:col-span-5 flex flex-col items-center">
          <div className="w-full bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs text-center flex flex-col items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">
              Vista Previa en Tiempo Real
            </span>

            {/* QR Canvas Box */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 shadow-inner flex items-center justify-center mb-6">
              <canvas
                ref={canvasRef}
                className="max-w-full rounded-lg shadow-xs"
                style={{ imageRendering: 'pixelated' }}
              />
            </div>

            <p className="text-[11px] text-slate-500 max-w-xs break-all font-mono mb-6 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
              {payload.length > 50 ? `${payload.substring(0, 50)}...` : payload}
            </p>

            {/* Actions */}
            <div className="w-full space-y-2.5">
              <button
                type="button"
                onClick={downloadPng}
                className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Descargar en PNG (1024px Alta Calidad)</span>
              </button>

              <button
                type="button"
                onClick={downloadSvg}
                className="w-full inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition-all cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-slate-500" />
                <span>Descargar en Vectorial SVG</span>
              </button>

              <button
                type="button"
                onClick={copyPayload}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-slate-500 hover:text-slate-800 text-xs font-semibold transition-colors cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? '¡Texto del QR copiado!' : 'Copiar contenido en texto'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
