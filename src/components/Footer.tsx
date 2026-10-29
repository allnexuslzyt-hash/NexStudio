import React from 'react';
import { Boxes, HelpCircle } from 'lucide-react';

interface FooterProps {
  onOpenTerms?: () => void;
  onOpenHelp?: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onOpenTerms, onOpenHelp }) => {
  return (
    <footer className="w-full bg-white dark:bg-[#0c121e] border-t border-slate-200 dark:border-slate-800 px-4 sm:px-6 lg:px-8 py-5 transition-colors">
      <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-400">
        {/* Left: NexStudio © 2026 */}
        <div className="flex items-center gap-2">
          <Boxes className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          <span className="font-semibold text-slate-700 dark:text-slate-300">NexStudio</span>
          <span>© 2026</span>
        </div>

        {/* Right: Términos y Condiciones & Centro de Ayuda */}
        <div className="flex items-center gap-3 sm:gap-4 flex-wrap justify-center sm:justify-end">
          <button
            type="button"
            id="btn-footer-terms"
            onClick={onOpenTerms}
            className="text-xs text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:underline transition-colors focus:outline-none min-h-[44px] flex items-center justify-center px-2 py-1 cursor-pointer"
          >
            Términos y Condiciones
          </button>

          <span className="text-slate-300 dark:text-slate-700 hidden sm:inline">•</span>

          <button
            type="button"
            id="btn-footer-help"
            onClick={onOpenHelp}
            className="text-xs text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:underline transition-colors focus:outline-none min-h-[44px] flex items-center gap-1.5 px-2 py-1 cursor-pointer font-medium"
          >
            <HelpCircle className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            <span>Centro de Ayuda</span>
          </button>
        </div>
      </div>
    </footer>
  );
};
