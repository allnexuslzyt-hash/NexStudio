import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { User, AtSign, Check, AlertCircle, Sparkles, Image, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { validateUsername, validateDisplayName } from '../utils/usernameValidation';

const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'
];

export const OnboardingModal: React.FC = () => {
  const { user, profile, updateProfileData } = useAuth();

  const isSuperAdmin = user?.email?.toLowerCase() === 'allnexuslzyt@gmail.com';

  const [displayName, setDisplayName] = useState(() => {
    return profile?.displayName || user?.displayName || '';
  });

  const [username, setUsername] = useState(() => {
    return profile?.username || '';
  });

  const [selectedAvatar, setSelectedAvatar] = useState<string>(() => {
    return profile?.photoURL || user?.photoURL || PRESET_AVATARS[0];
  });

  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Validate in real time
  const usernameValidation = useMemo(() => {
    if (!username) return { isValid: false, error: 'Ingresa tu nombre de usuario' };
    return validateUsername(username, isSuperAdmin);
  }, [username, isSuperAdmin]);

  const displayNameValidation = useMemo(() => {
    if (!displayName) return { isValid: false, error: 'Ingresa tu nombre visible' };
    return validateDisplayName(displayName, isSuperAdmin);
  }, [displayName, isSuperAdmin]);

  const isFormValid = usernameValidation.isValid && displayNameValidation.isValid;

  // If user is not logged in or already completed onboarding, do not render
  if (!user || !profile || profile.onboardingCompleted) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const validUser = validateUsername(username, isSuperAdmin);
    if (!validUser.isValid) {
      setErrorMessage(validUser.error || 'Nombre de usuario no válido.');
      return;
    }

    const validName = validateDisplayName(displayName, isSuperAdmin);
    if (!validName.isValid) {
      setErrorMessage(validName.error || 'Nombre visible no válido.');
      return;
    }

    setIsSaving(true);
    try {
      await updateProfileData({
        displayName: displayName.trim(),
        username: username.trim().toLowerCase(),
        photoURL: selectedAvatar,
      });

      // Also mark onboardingCompleted flag in Firestore
      // updateProfileData updates the firestore doc with provided fields
      await updateProfileData({
        displayName: displayName.trim(),
        username: username.trim().toLowerCase(),
        photoURL: selectedAvatar,
        // @ts-ignore - added to profile
        onboardingCompleted: true
      });
    } catch (err: any) {
      console.error('Error guardando configuración inicial:', err);
      setErrorMessage(err.message || 'No se pudo guardar la configuración. Intenta nuevamente.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="px-6 sm:px-8 pt-8 pb-4 bg-gradient-to-b from-indigo-50/70 to-white border-b border-slate-100 text-center">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center mx-auto mb-3 shadow-lg shadow-indigo-600/20">
            <Sparkles className="w-6 h-6" />
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Configura tu Perfil
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-sm mx-auto">
            Elige tu nombre visible, tu nombre de usuario único y tu foto de perfil para unirte a NexStudio.
          </p>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6 overflow-y-auto">
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Profile Card Preview */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center gap-4">
            <img
              src={selectedAvatar}
              alt="Vista previa de avatar"
              referrerPolicy="no-referrer"
              className="w-14 h-14 rounded-full object-cover border-2 border-indigo-500 shadow-sm shrink-0"
            />
            <div className="overflow-hidden">
              <div className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                Vista previa
              </div>
              <h3 className="text-sm font-bold text-slate-900 truncate">
                {displayName || 'Tu Nombre Visible'}
              </h3>
              <p className="text-xs text-indigo-600 font-medium truncate">
                @{username ? username.toLowerCase() : 'tuusuario'}
              </p>
            </div>
          </div>

          {/* Avatar Picker */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2 flex items-center gap-1.5">
              <Image className="w-3.5 h-3.5 text-slate-400" />
              <span>Elige tu Foto de Perfil</span>
            </label>
            <div className="flex items-center gap-2.5 overflow-x-auto py-1">
              {PRESET_AVATARS.map((avatar, idx) => {
                const isSelected = selectedAvatar === avatar;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedAvatar(avatar)}
                    className={`relative w-11 h-11 rounded-full overflow-hidden border-2 transition-all shrink-0 cursor-pointer ${
                      isSelected ? 'border-indigo-600 ring-2 ring-indigo-600/30 scale-105' : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <img
                      src={avatar}
                      alt={`Avatar opción ${idx + 1}`}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                    {isSelected && (
                      <span className="absolute inset-0 bg-indigo-600/40 flex items-center justify-center text-white">
                        <Check className="w-4 h-4 stroke-[3]" />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Nombre Visible */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-slate-400" />
                <span>Nombre Visible</span>
              </span>
              <span className="text-[11px] text-slate-400">Solo letras y espacios</span>
            </label>
            <input
              type="text"
              id="input-onboarding-displayname"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Ej. Sofia Ramos"
              className={`w-full px-3.5 py-2.5 rounded-xl border text-sm transition-all focus:outline-none ${
                displayName && !displayNameValidation.isValid
                  ? 'border-rose-300 bg-rose-50/30 text-rose-900 focus:border-rose-500'
                  : 'border-slate-200 focus:border-indigo-600 bg-white'
              }`}
            />
            {displayName && !displayNameValidation.isValid && (
              <p className="text-[11px] text-rose-600 mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {displayNameValidation.error}
              </p>
            )}
          </div>

          {/* Nombre de Usuario (@username) */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <AtSign className="w-3.5 h-3.5 text-slate-400" />
                <span>Nombre de Usuario (@usuario)</span>
              </span>
              <span className="text-[11px] text-slate-400">Solo letras, sin números ni símbolos</span>
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 text-sm font-semibold pointer-events-none">
                @
              </span>
              <input
                type="text"
                id="input-onboarding-username"
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s/g, ''))}
                placeholder="sofiaramos"
                className={`w-full pl-8 pr-3.5 py-2.5 rounded-xl border text-sm transition-all focus:outline-none ${
                  username && !usernameValidation.isValid
                    ? 'border-rose-300 bg-rose-50/30 text-rose-900 focus:border-rose-500'
                    : 'border-slate-200 focus:border-indigo-600 bg-white'
                }`}
              />
            </div>
            {username && !usernameValidation.isValid ? (
              <p className="text-[11px] text-rose-600 mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {usernameValidation.error}
              </p>
            ) : (
              <div className="mt-1 flex items-center gap-1.5 text-[11px] text-slate-400">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                <span>Prohibido el uso de símbolos, números o términos de administración.</span>
              </div>
            )}
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              id="btn-onboarding-submit"
              disabled={!isFormValid || isSaving}
              className={`w-full py-3 px-4 rounded-xl text-sm font-bold transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer ${
                isFormValid && !isSaving
                  ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/20'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
              }`}
            >
              {isSaving ? (
                <span>Guardando perfil...</span>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Completar y Entrar a NexStudio</span>
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};
