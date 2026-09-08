import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { motion } from 'motion/react';
import { Boxes, Sparkles } from 'lucide-react';

const WorkspaceContent: React.FC = () => {
  const { user } = useAuth();
  const [activeView, setActiveView] = useState('workspace');

  return (
    <div className="w-full min-h-screen flex flex-col bg-slate-950 text-slate-100 selection:bg-indigo-600 selection:text-white">
      {/* 100% Viewport Header */}
      <Navbar
        activeView={activeView}
        onSelectView={(view) => setActiveView(view)}
      />

      {/* Main Full-Bleed Content Container (No artificial side margins / 100% viewport) */}
      <main className="w-full flex-1 flex flex-col items-center justify-center p-6 sm:p-12 relative overflow-hidden">
        {/* Subtle Ambient Background Gradients */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-indigo-600/10 blur-[120px]" />
          <div className="absolute -bottom-40 right-1/4 w-[500px] h-[500px] rounded-full bg-violet-600/10 blur-[140px]" />
        </div>

        {/* Clean Empty State Canvas */}
        <motion.div 
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="relative z-10 w-full max-w-2xl text-center flex flex-col items-center justify-center py-16 px-4"
        >
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 via-violet-600 to-amber-500 flex items-center justify-center shadow-xl shadow-indigo-600/20 mb-6">
            <Boxes className="w-8 h-8 text-white" />
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            NexStudio
          </h1>

          <p className="text-sm sm:text-base text-slate-400 mt-3 max-w-md mx-auto leading-relaxed">
            Lienzo base configurado y listo para tus componentes y módulos.
          </p>

          {user && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="mt-6 px-4 py-2 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-slate-300 flex items-center gap-2"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              <span>Conectado como <strong className="text-white">{user.displayName || user.email}</strong></span>
            </motion.div>
          )}
        </motion.div>
      </main>

      {/* Full-width Footer */}
      <Footer />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <WorkspaceContent />
    </AuthProvider>
  );
}
