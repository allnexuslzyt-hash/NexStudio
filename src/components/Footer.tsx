import React from 'react';
import { Boxes, Headphones } from 'lucide-react';
import { useSupport } from '../context/SupportContext';

interface FooterProps {
  onOpenTerms?: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onOpenTerms }) => {
  const { openSupportModal } = useSupport();

  return (
    <footer className="w-full bg-white border-t border-slate-200 px-4 sm:px-6 lg:px-8 py-5">
      <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
        {/* Left: NexStudio © 2026 */}
        <div className="flex items-center gap-2">
          <Boxes className="w-4 h-4 text-indigo-600" />
          <span className="font-semibold text-slate-700">NexStudio</span>
          <span>© 2026</span>
        </div>

        {/* Right: Acciones del pie (Chat de Soporte y Términos y Condiciones) */}
        <div className="flex items-center gap-4">
          <button
            type="button"
            id="btn-footer-support"
            onClick={() => openSupportModal()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold transition-colors focus:outline-none cursor-pointer border border-indigo-200/60 shadow-xs"
          >
            <Headphones className="w-3.5 h-3.5" />
            <span>Chat de Soporte</span>
          </button>

          <button
            type="button"
            id="btn-footer-terms"
            onClick={onOpenTerms}
            className="text-xs text-slate-500 hover:text-indigo-600 hover:underline transition-colors focus:outline-none min-h-[44px] flex items-center justify-center px-2 py-1 cursor-pointer"
          >
            Términos y Condiciones
          </button>
        </div>
      </div>
    </footer>
  );
};
