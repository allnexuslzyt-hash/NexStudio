import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { motion } from 'motion/react';

export const ThemeToggle: React.FC = () => {
  const { theme, toggleTheme, isDark } = useTheme();

  return (
    <button
      type="button"
      id="btn-theme-toggle"
      onClick={toggleTheme}
      className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-all cursor-pointer shadow-xs min-h-[44px] min-w-[44px] flex items-center justify-center group"
      title={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
      aria-label="Alternar tema de interfaz"
    >
      <motion.div
        key={theme}
        initial={{ rotate: -90, scale: 0.8, opacity: 0 }}
        animate={{ rotate: 0, scale: 1, opacity: 1 }}
        exit={{ rotate: 90, scale: 0.8, opacity: 0 }}
        transition={{ duration: 0.2 }}
      >
        {isDark ? (
          <Sun className="w-4 h-4 text-amber-400 group-hover:rotate-45 transition-transform" />
        ) : (
          <Moon className="w-4 h-4 text-indigo-600 group-hover:-rotate-12 transition-transform" />
        )}
      </motion.div>
    </button>
  );
};
