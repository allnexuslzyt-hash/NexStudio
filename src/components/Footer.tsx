import React from 'react';
import { Boxes } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full bg-slate-950 border-t border-slate-900 px-4 sm:px-6 lg:px-8 py-6">
      <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
        <div className="flex items-center gap-2">
          <Boxes className="w-4 h-4 text-indigo-400" />
          <span className="font-semibold text-slate-400">NexStudio</span>
          <span>© {new Date().getFullYear()}</span>
        </div>
        <div className="flex items-center gap-4 text-slate-500">
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            Sistema listo
          </span>
          <span>•</span>
          <span>100% Viewport Grid</span>
        </div>
      </div>
    </footer>
  );
};
