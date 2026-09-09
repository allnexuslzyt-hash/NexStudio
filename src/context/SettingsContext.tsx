import React, { createContext, useContext, useEffect, useState } from 'react';

export type ThemeMode = 'light' | 'dark' | 'auto';
export type AccentColor = 'indigo' | 'blue' | 'neon' | 'purple' | 'emerald' | 'rose' | 'amber';
export type Density = 'normal' | 'compact';
export type FontSize = 'small' | 'medium' | 'large';

export interface AccentColorConfig {
  id: AccentColor;
  label: string;
  hex: string;
  twBg: string;
  twBorder: string;
  twText: string;
  cssPrimary: string;
  cssHover: string;
  cssLight: string;
}

export const ACCENT_COLORS: AccentColorConfig[] = [
  {
    id: 'blue',
    label: 'Azul Real',
    hex: '#2563eb',
    twBg: 'bg-blue-600',
    twBorder: 'border-blue-600',
    twText: 'text-blue-600',
    cssPrimary: '#2563eb',
    cssHover: '#1d4ed8',
    cssLight: '#eff6ff',
  },
  {
    id: 'neon',
    label: 'Neón Cian',
    hex: '#06b6d4',
    twBg: 'bg-cyan-500',
    twBorder: 'border-cyan-500',
    twText: 'text-cyan-500',
    cssPrimary: '#06b6d4',
    cssHover: '#0891b2',
    cssLight: '#ecfeff',
  },
  {
    id: 'purple',
    label: 'Púrpura Místico',
    hex: '#9333ea',
    twBg: 'bg-purple-600',
    twBorder: 'border-purple-600',
    twText: 'text-purple-600',
    cssPrimary: '#9333ea',
    cssHover: '#7e22ce',
    cssLight: '#faf5ff',
  },
  {
    id: 'emerald',
    label: 'Verde Esmeralda',
    hex: '#10b981',
    twBg: 'bg-emerald-500',
    twBorder: 'border-emerald-500',
    twText: 'text-emerald-500',
    cssPrimary: '#10b981',
    cssHover: '#059669',
    cssLight: '#ecfdf5',
  },
  {
    id: 'rose',
    label: 'Rojo Carmesí',
    hex: '#e11d48',
    twBg: 'bg-rose-600',
    twBorder: 'border-rose-600',
    twText: 'text-rose-600',
    cssPrimary: '#e11d48',
    cssHover: '#be123c',
    cssLight: '#fff1f2',
  },
  {
    id: 'amber',
    label: 'Ámbar Solar',
    hex: '#f59e0b',
    twBg: 'bg-amber-500',
    twBorder: 'border-amber-500',
    twText: 'text-amber-500',
    cssPrimary: '#f59e0b',
    cssHover: '#d97706',
    cssLight: '#fffbeb',
  },
  {
    id: 'indigo',
    label: 'Índigo Clásico',
    hex: '#4f46e5',
    twBg: 'bg-indigo-600',
    twBorder: 'border-indigo-600',
    twText: 'text-indigo-600',
    cssPrimary: '#4f46e5',
    cssHover: '#4338ca',
    cssLight: '#eef2ff',
  },
];

interface SettingsContextType {
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  accentColor: AccentColor;
  setAccentColor: (color: AccentColor) => void;
  density: Density;
  setDensity: (density: Density) => void;
  fontSize: FontSize;
  setFontSize: (size: FontSize) => void;
  emailNotifications: boolean;
  setEmailNotifications: (val: boolean) => void;
  soundAlerts: boolean;
  setSoundAlerts: (val: boolean) => void;
  popupAlerts: boolean;
  setPopupAlerts: (val: boolean) => void;
  isPublicProfile: boolean;
  setIsPublicProfile: (val: boolean) => void;
  isSettingsOpen: boolean;
  settingsTab: 'account' | 'appearance' | 'notifications' | 'privacy' | 'admin';
  setSettingsTab: (tab: 'account' | 'appearance' | 'notifications' | 'privacy' | 'admin') => void;
  openSettings: (tab?: 'account' | 'appearance' | 'notifications' | 'privacy' | 'admin') => void;
  closeSettings: () => void;
  currentAccentConfig: AccentColorConfig;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [settingsTab, setSettingsTab] = useState<'account' | 'appearance' | 'notifications' | 'privacy' | 'admin'>('account');
  const [themeMode, setThemeModeState] = useState<ThemeMode>(() => {
    return (localStorage.getItem('nexstudio_theme_mode') as ThemeMode) || 'light';
  });

  const [accentColor, setAccentColorState] = useState<AccentColor>(() => {
    return (localStorage.getItem('nexstudio_accent_color') as AccentColor) || 'indigo';
  });

  const [density, setDensityState] = useState<Density>(() => {
    return (localStorage.getItem('nexstudio_density') as Density) || 'normal';
  });

  const [fontSize, setFontSizeState] = useState<FontSize>(() => {
    return (localStorage.getItem('nexstudio_font_size') as FontSize) || 'medium';
  });

  const [emailNotifications, setEmailNotificationsState] = useState<boolean>(() => {
    const val = localStorage.getItem('nexstudio_notif_email');
    return val !== null ? val === 'true' : true;
  });

  const [soundAlerts, setSoundAlertsState] = useState<boolean>(() => {
    const val = localStorage.getItem('nexstudio_notif_sound');
    return val !== null ? val === 'true' : true;
  });

  const [popupAlerts, setPopupAlertsState] = useState<boolean>(() => {
    const val = localStorage.getItem('nexstudio_notif_popups');
    return val !== null ? val === 'true' : true;
  });

  const [isPublicProfile, setIsPublicProfileState] = useState<boolean>(() => {
    const val = localStorage.getItem('nexstudio_privacy_public');
    return val !== null ? val === 'true' : true;
  });

  // Apply Theme Mode (Claro / Oscuro / Automático)
  useEffect(() => {
    localStorage.setItem('nexstudio_theme_mode', themeMode);
    const root = document.documentElement;

    const applyDark = () => {
      root.classList.add('dark');
      root.style.colorScheme = 'dark';
    };
    const applyLight = () => {
      root.classList.remove('dark');
      root.style.colorScheme = 'light';
    };

    if (themeMode === 'dark') {
      applyDark();
    } else if (themeMode === 'light') {
      applyLight();
    } else {
      // Auto / Sistema
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      if (mediaQuery.matches) {
        applyDark();
      } else {
        applyLight();
      }

      const handler = (e: MediaQueryListEvent) => {
        if (e.matches) applyDark();
        else applyLight();
      };
      mediaQuery.addEventListener('change', handler);
      return () => mediaQuery.removeEventListener('change', handler);
    }
  }, [themeMode]);

  // Apply Accent Color in real-time
  const currentAccentConfig = ACCENT_COLORS.find((c) => c.id === accentColor) || ACCENT_COLORS[6];

  useEffect(() => {
    localStorage.setItem('nexstudio_accent_color', accentColor);
    const root = document.documentElement;
    root.setAttribute('data-accent', accentColor);
    root.style.setProperty('--accent-primary', currentAccentConfig.cssPrimary);
    root.style.setProperty('--accent-primary-hover', currentAccentConfig.cssHover);
    root.style.setProperty('--accent-light', currentAccentConfig.cssLight);
  }, [accentColor, currentAccentConfig]);

  // Apply Density
  useEffect(() => {
    localStorage.setItem('nexstudio_density', density);
    const root = document.documentElement;
    if (density === 'compact') {
      root.setAttribute('data-density', 'compact');
    } else {
      root.removeAttribute('data-density');
    }
  }, [density]);

  // Apply Font Size
  useEffect(() => {
    localStorage.setItem('nexstudio_font_size', fontSize);
    const root = document.documentElement;
    if (fontSize === 'small') {
      root.style.fontSize = '14px';
    } else if (fontSize === 'large') {
      root.style.fontSize = '18px';
    } else {
      root.style.fontSize = '';
    }
  }, [fontSize]);

  const setThemeMode = (mode: ThemeMode) => setThemeModeState(mode);
  const setAccentColor = (color: AccentColor) => setAccentColorState(color);
  const setDensity = (val: Density) => setDensityState(val);
  const setFontSize = (size: FontSize) => setFontSizeState(size);
  const setEmailNotifications = (val: boolean) => {
    setEmailNotificationsState(val);
    localStorage.setItem('nexstudio_notif_email', String(val));
  };
  const setSoundAlerts = (val: boolean) => {
    setSoundAlertsState(val);
    localStorage.setItem('nexstudio_notif_sound', String(val));
  };
  const setPopupAlerts = (val: boolean) => {
    setPopupAlertsState(val);
    localStorage.setItem('nexstudio_notif_popups', String(val));
  };
  const setIsPublicProfile = (val: boolean) => {
    setIsPublicProfileState(val);
    localStorage.setItem('nexstudio_privacy_public', String(val));
  };

  return (
    <SettingsContext.Provider
      value={{
        themeMode,
        setThemeMode,
        accentColor,
        setAccentColor,
        density,
        setDensity,
        fontSize,
        setFontSize,
        emailNotifications,
        setEmailNotifications,
        soundAlerts,
        setSoundAlerts,
        popupAlerts,
        setPopupAlerts,
        isPublicProfile,
        setIsPublicProfile,
        isSettingsOpen,
        settingsTab,
        setSettingsTab,
        openSettings: (tab?: 'account' | 'appearance' | 'notifications' | 'privacy' | 'admin') => {
          if (tab) setSettingsTab(tab);
          setIsSettingsOpen(true);
        },
        closeSettings: () => setIsSettingsOpen(false),
        currentAccentConfig,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings debe usarse dentro de un SettingsProvider');
  }
  return context;
};
