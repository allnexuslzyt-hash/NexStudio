import React from 'react';
import { Boxes } from 'lucide-react';

interface FooterProps {
  onOpenTerms?: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onOpenTerms }) => {
  return (
    <footer className="w-full bg-white border-t border-slate-200 px-4 sm:px-6 lg:px-8 py-5">
      <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
        {/* Left: NexStudio © 2026 */}
        <div className="flex items-center gap-2">
          <Boxes className="w-4 h-4 text-indigo-600" />
          <span className="font-semibold text-slate-700">NexStudio</span>
          <span>© 2026</span>
        </div>

        {/* Right: Términos y Condiciones */}
        <div>
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
