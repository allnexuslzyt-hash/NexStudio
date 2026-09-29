import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  ArrowLeft,
  KeyRound,
  Copy,
  Check,
  RefreshCw,
  ShieldCheck,
  Lock,
  Layers
} from 'lucide-react';

interface PasswordGeneratorViewProps {
  onBack: () => void;
}

type GeneratorMode = 'password' | 'passphrase' | 'token';

const PASSPHRASE_WORDS = [
  'galaxia', 'trueno', 'halcon', 'cosmos', 'oceano', 'cuarzo', 'bosque',
  'delta', 'volcan', 'cometa', 'fuego', 'viento', 'aurora', 'espejo',
  'sombre', 'valle', 'oraculo', 'dragon', 'prisma', 'cristal', 'rayo',
  'arena', 'cielo', 'roca', 'acero', 'lobo', 'jaguar', 'tempestad',
  'neptuno', 'jupiter', 'orion', 'fenix', 'planeta', 'estrella', 'saturno'
];

export const PasswordGeneratorView: React.FC<PasswordGeneratorViewProps> = ({ onBack }) => {
  const [mode, setMode] = useState<GeneratorMode>('password');
  const [length, setLength] = useState<number>(20);
  const [includeUppercase, setIncludeUppercase] = useState<boolean>(true);
  const [includeLowercase, setIncludeLowercase] = useState<boolean>(true);
  const [includeNumbers, setIncludeNumbers] = useState<boolean>(true);
  const [includeSymbols, setIncludeSymbols] = useState<boolean>(true);

  const [currentResult, setCurrentResult] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [batchList, setBatchList] = useState<string[]>([]);

  const generate = () => {
    if (mode === 'passphrase') {
      const wordsCount = 4;
      const picked: string[] = [];
      const array = new Uint32Array(wordsCount);
      window.crypto.getRandomValues(array);
      for (let i = 0; i < wordsCount; i++) {
        picked.push(PASSPHRASE_WORDS[array[i] % PASSPHRASE_WORDS.length]);
      }
      const randomNum = Math.floor(Math.random() * 90 + 10);
      setCurrentResult(`${picked.join('-')}-${randomNum}`);
      return;
    }

    if (mode === 'token') {
      const byteLength = length > 32 ? 32 : 16;
      const bytes = new Uint8Array(byteLength);
      window.crypto.getRandomValues(bytes);
      const hex = Array.from(bytes)
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');
      setCurrentResult(hex);
      return;
    }

    let charset = '';
    if (includeUppercase) charset += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    if (includeLowercase) charset += 'abcdefghijklmnopqrstuvwxyz';
    if (includeNumbers) charset += '0123456789';
    if (includeSymbols) charset += '!@#$%^&*()_+-=[]{}|;:,.<>?';

    if (!charset) charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

    const array = new Uint32Array(length);
    window.crypto.getRandomValues(array);
    let result = '';
    for (let i = 0; i < length; i++) {
      result += charset[array[i] % charset.length];
    }
    setCurrentResult(result);
  };

  useEffect(() => {
    generate();
  }, [length, includeUppercase, includeLowercase, includeNumbers, includeSymbols, mode]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const generateBatch = () => {
    const list: string[] = [];
    for (let k = 0; k < 5; k++) {
      let charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
      const array = new Uint32Array(length);
      window.crypto.getRandomValues(array);
      let r = '';
      for (let i = 0; i < length; i++) {
        r += charset[array[i] % charset.length];
      }
      list.push(r);
    }
    setBatchList(list);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="w-full max-w-4xl mx-auto px-4 py-8"
    >
      <div className="flex items-center justify-between mb-6">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200 shadow-xs transition-all cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Volver a Herramientas</span>
        </button>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>Criptografía Segura WebCrypto</span>
        </div>
      </div>

      <div className="rounded-3xl bg-gradient-to-br from-emerald-950 via-slate-900 to-indigo-950 text-white p-6 sm:p-10 mb-8 border border-emerald-800/40 shadow-xl shadow-emerald-950/20">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-200 text-xs font-semibold mb-3">
            <Lock className="w-3.5 h-3.5 text-emerald-400" />
            <span>Generador Criptográfico de Contraseñas</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight mb-2">
            Generador de Contraseñas & Tokens
          </h1>
          <p className="text-slate-300 text-xs sm:text-sm font-normal leading-relaxed">
            Crea claves ultra-seguras con alta entropía o frases mnemotécnicas fáciles de recordar.
            Generadas mediante la API nativa de criptografía aleatoria del navegador.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs mb-8">
        <div className="relative flex flex-col sm:flex-row items-center justify-between gap-4 p-4 sm:p-6 rounded-2xl bg-slate-50 border border-slate-200/90 shadow-inner mb-6">
          <div className="w-full overflow-x-auto text-left font-mono text-base sm:text-2xl font-bold text-slate-900 tracking-wider break-all select-all">
            {currentResult}
          </div>

          <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={generate}
              title="Regenerar otra clave"
              className="p-3 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 hover:text-slate-900 transition-all cursor-pointer shadow-xs"
            >
              <RefreshCw className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => copyToClipboard(currentResult)}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
            >
              {copied ? <Check className="w-4 h-4 text-white" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? '¡Copiada!' : 'Copiar'}</span>
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-2xl mb-6">
          <button
            type="button"
            onClick={() => setMode('password')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              mode === 'password' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Contraseña Blindada
          </button>
          <button
            type="button"
            onClick={() => setMode('passphrase')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              mode === 'passphrase' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Frase de Paso
          </button>
          <button
            type="button"
            onClick={() => setMode('token')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              mode === 'token' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Token Hex / API
          </button>
        </div>

        {mode === 'password' && (
          <div className="space-y-5">
            <div>
              <div className="flex items-center justify-between text-xs font-semibold text-slate-800 mb-2">
                <span>Longitud de la clave:</span>
                <span className="font-bold text-indigo-600 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-lg">
                  {length} caracteres
                </span>
              </div>
              <input
                type="range"
                min="8"
                max="64"
                value={length}
                onChange={(e) => setLength(parseInt(e.target.value, 10))}
                className="w-full accent-indigo-600 cursor-pointer"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <label className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer hover:bg-slate-100 transition-colors">
                <input
                  type="checkbox"
                  checked={includeUppercase}
                  onChange={(e) => setIncludeUppercase(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                />
                <span className="text-xs font-medium text-slate-800">Mayúsculas (A - Z)</span>
              </label>

              <label className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer hover:bg-slate-100 transition-colors">
                <input
                  type="checkbox"
                  checked={includeLowercase}
                  onChange={(e) => setIncludeLowercase(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                />
                <span className="text-xs font-medium text-slate-800">Minúsculas (a - z)</span>
              </label>

              <label className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer hover:bg-slate-100 transition-colors">
                <input
                  type="checkbox"
                  checked={includeNumbers}
                  onChange={(e) => setIncludeNumbers(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                />
                <span className="text-xs font-medium text-slate-800">Números (0 - 9)</span>
              </label>

              <label className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer hover:bg-slate-100 transition-colors">
                <input
                  type="checkbox"
                  checked={includeSymbols}
                  onChange={(e) => setIncludeSymbols(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                />
                <span className="text-xs font-medium text-slate-800">Símbolos (!@#$%^&*)</span>
              </label>
            </div>
          </div>
        )}

        <div className="mt-8 pt-6 border-t border-slate-100">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-800">¿Necesitas múltiples claves?</span>
            <button
              type="button"
              onClick={generateBatch}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-all cursor-pointer"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Generar lote de 5</span>
            </button>
          </div>

          {batchList.length > 0 && (
            <div className="space-y-2 bg-slate-50 p-3 rounded-2xl border border-slate-200">
              {batchList.map((pwd, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between gap-2 p-2 bg-white rounded-xl border border-slate-200 text-xs font-mono"
                >
                  <span className="truncate">{pwd}</span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(pwd)}
                    className="p-1 hover:text-indigo-600 transition-colors cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};
