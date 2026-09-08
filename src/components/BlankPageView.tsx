import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { motion } from 'motion/react';

interface BlankPageViewProps {
  view: string;
  onBack: () => void;
}

export const BlankPageView: React.FC<BlankPageViewProps> = ({ onBack }) => {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
      className="w-full flex-1 min-h-[60vh] flex flex-col items-center justify-center p-6 bg-white"
    >
      <div className="flex flex-col items-center justify-center gap-4">
        <button
          type="button"
          id="blank-view-back-btn"
          onClick={onBack}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-200 hover:border-slate-300 transition-all cursor-pointer shadow-xs min-h-[44px]"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Volver al inicio</span>
        </button>
      </div>
    </motion.div>
  );
};
