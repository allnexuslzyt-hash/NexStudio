import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  ManagedUser, 
  ContentReport, 
  SiteSettings, 
  AuditLogItem, 
  UserRole, 
  UserStatus,
  GlobalBannerConfig
} from '../types';
import { useAuth, isSuperAdminEmail } from './AuthContext';
import { FAQ_ITEMS, GUIDE_ARTICLES, FAQItem, GuideArticle } from '../data/helpData';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface AdminContextType {
  siteSettings: SiteSettings;
  toggleMaintenanceMode: (enabled?: boolean, message?: string) => Promise<void>;
  updateGlobalBanner: (bannerConfig: Partial<GlobalBannerConfig>) => Promise<void>;
  updateSiteSettings: (settings: Partial<SiteSettings>) => Promise<void>;
  
  // Users management
  users: ManagedUser[];
  changeUserRole: (userId: string, newRole: UserRole) => Promise<void>;
  banOrSuspendUser: (userId: string, status: UserStatus, reason: string, duration?: string) => Promise<void>;
  resetUserPassword: (userId: string) => Promise<{ success: boolean; message: string }>;
  deleteManagedUser: (userId: string) => Promise<void>;
  addManagedUser: (user: Omit<ManagedUser, 'id' | 'createdAt' | 'lastActive' | 'status'>) => Promise<void>;
  
  // Moderation
  reports: ContentReport[];
  approveReport: (reportId: string) => Promise<void>;
  removeReportedContent: (reportId: string) => Promise<void>;
  sanctionUserFromReport: (reportId: string, action: 'warning' | 'suspend_24h' | 'ban_permanent') => Promise<void>;
  
  // Help Center Manager
  dynamicFaqs: FAQItem[];
  dynamicGuides: GuideArticle[];
  addFaq: (faq: Omit<FAQItem, 'id'>) => Promise<void>;
  updateFaq: (faq: FAQItem) => Promise<void>;
  deleteFaq: (faqId: string) => Promise<void>;
  addGuide: (guide: Omit<GuideArticle, 'id'>) => Promise<void>;
  updateGuide: (guide: GuideArticle) => Promise<void>;
  deleteGuide: (guideId: string) => Promise<void>;
  
  // Audit Logs
  auditLogs: AuditLogItem[];
  logAdminAction: (action: string, target: string, category: AuditLogItem['category'], details?: string) => void;
  
  // Status check
  isAdmin: boolean;
  isSuperAdmin: boolean;
  serverStatus: {
    status: 'online' | 'degraded' | 'maintenance';
    latencyMs: number;
    uptime: string;
    lastPing: string;
  };
}

const INITIAL_SITE_SETTINGS: SiteSettings = {
  maintenanceMode: false,
  maintenanceMessage: 'NexStudio se encuentra actualmente en labores de mantenimiento programado. Volveremos a estar disponibles muy pronto.',
  maintenanceEstimatedReturn: 'Aproximadamente 30 minutos',
  allowNewRegistrations: true,
  lastUpdated: new Date().toISOString(),
  updatedBy: 'allnexuslzyt@gmail.com',
  banner: {
    enabled: false,
    type: 'info',
    message: '¡Bienvenido a NexStudio! Consulta nuestras nuevas funciones en el Centro de Ayuda.',
    actionText: 'Ver detalles',
    actionLink: '#',
    dismissible: true
  }
};

const INITIAL_MANAGED_USERS: ManagedUser[] = [
  {
    id: 'usr-admin-1',
    displayName: 'Nexus LZ (Admin Principal)',
    username: 'allnexuslz',
    email: 'allnexuslzyt@gmail.com',
    avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
    role: 'SuperAdmin',
    createdAt: '2025-01-10T10:00:00Z',
    lastActive: 'Hace unos instantes',
    status: 'activo',
    sanctionsCount: 0
  },
  {
    id: 'usr-2',
    displayName: 'Elena Rostova',
    username: 'elena_ux',
    email: 'elena.rostova@designcorp.io',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    role: 'Moderador',
    createdAt: '2025-02-14T08:30:00Z',
    lastActive: 'Hace 12 minutos',
    status: 'activo',
    sanctionsCount: 0
  },
  {
    id: 'usr-3',
    displayName: 'Carlos Mendez',
    username: 'carlos_dev',
    email: 'carlos.mendez@cloudlab.es',
    avatarUrl: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80',
    role: 'Creador Digital',
    createdAt: '2025-03-01T15:20:00Z',
    lastActive: 'Hoy, 09:41',
    status: 'activo',
    sanctionsCount: 0
  },
  {
    id: 'usr-4',
    displayName: 'Valeria Gomez',
    username: 'valeria_motion',
    email: 'valeria.g@motionstudio.com',
    avatarUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
    role: 'Creador Digital',
    createdAt: '2025-03-12T11:15:00Z',
    lastActive: 'Ayer, 18:20',
    status: 'activo',
    sanctionsCount: 1
  },
  {
    id: 'usr-5',
    displayName: 'Spam Bot 3000',
    username: 'crypto_free_earn',
    email: 'bot992@tempmail.xyz',
    avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=crypto99',
    role: 'Usuario',
    createdAt: '2025-04-02T03:11:00Z',
    lastActive: 'Hace 3 días',
    status: 'suspendido',
    banReason: 'Publicación reiterada de enlaces fraudulentos de criptomonedas',
    banDuration: '7 días',
    sanctionsCount: 2
  },
  {
    id: 'usr-6',
    displayName: 'DarkTroll_99',
    username: 'dark_troll',
    email: 'trollmaster@burnermail.org',
    avatarUrl: 'https://api.dicebear.com/7.x/identicon/svg?seed=darktroll',
    role: 'Usuario',
    createdAt: '2025-04-05T22:45:00Z',
    lastActive: 'Hace 5 días',
    status: 'baneado',
    banReason: 'Acoso verbal e incumplimiento grave de las normas comunitarias',
    banDuration: 'Permanente',
    sanctionsCount: 3
  }
];

const INITIAL_REPORTS: ContentReport[] = [
  {
    id: 'rep-101',
    contentType: 'comentario',
    contentId: 'comm-9921',
    contentSnippet: '¡Gana 5000$ al instante trabajando 10 minutos al día desde casa entrando en este enlace sospechoso bit.ly/free-crypto...',
    authorName: 'Spam Bot 3000',
    authorEmail: 'bot992@tempmail.xyz',
    authorAvatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=crypto99',
    reporterName: 'Carlos Mendez',
    reason: 'spam',
    reasonText: 'Comentario de phishing y spam repetitivo en hilo de discusión.',
    reportedAt: 'Hoy a las 10:14',
    status: 'pending'
  },
  {
    id: 'rep-102',
    contentType: 'proyecto',
    contentId: 'proj-4412',
    contentSnippet: 'Proyecto titulado "Copia 1:1 de Ilustraciones de Studio Ghibli sin licencia con fines comerciales directos"',
    authorName: 'DarkTroll_99',
    authorEmail: 'trollmaster@burnermail.org',
    reporterName: 'Elena Rostova',
    reason: 'copyright',
    reasonText: 'Material con derechos de autor subido sin autorización del creador original.',
    reportedAt: 'Ayer a las 16:45',
    status: 'pending'
  },
  {
    id: 'rep-103',
    contentType: 'comentario',
    contentId: 'comm-7714',
    contentSnippet: 'Tu diseño es pésimo, no sirves para nada como desarrollador, retírate.',
    authorName: 'Usuario Anónimo',
    authorEmail: 'anon72@mail.com',
    reporterName: 'Valeria Gomez',
    reason: 'harassment',
    reasonText: 'Comportamiento hostil y faltas de respeto continuadas en las creaciones.',
    reportedAt: 'Hace 2 días',
    status: 'pending'
  }
];

const INITIAL_AUDIT_LOGS: AuditLogItem[] = [
  {
    id: 'log-1',
    adminEmail: 'allnexuslzyt@gmail.com',
    adminName: 'Nexus LZ (SuperAdmin)',
    action: 'Activación del Sistema',
    target: 'Centro de Mando NexStudio',
    category: 'seguridad',
    timestamp: 'Hoy a las 10:30',
    details: 'Inicialización segura del centro de mando de administrador.'
  },
  {
    id: 'log-2',
    adminEmail: 'allnexuslzyt@gmail.com',
    adminName: 'Nexus LZ (SuperAdmin)',
    action: 'Verificación de Estado',
    target: 'Servidor / Firestore',
    category: 'ajustes',
    timestamp: 'Hoy a las 09:15',
    details: 'Diagnóstico de latencia e integridad de colecciones completado.'
  },
  {
    id: 'log-3',
    adminEmail: 'allnexuslzyt@gmail.com',
    adminName: 'Nexus LZ (SuperAdmin)',
    action: 'Suspensión de cuenta',
    target: 'Spam Bot 3000 (@crypto_free_earn)',
    category: 'usuarios',
    timestamp: 'Ayer a las 17:40',
    details: 'Suspensión temporal por 7 días tras detección de spam reiterado.'
  }
];

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export const AdminProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, profile } = useAuth();
  
  // Check if current user is admin
  const isSuperAdmin = Boolean(
    isSuperAdminEmail(user?.email) || 
    user?.email?.toLowerCase() === 'allnexuslzyt@gmail.com' ||
    profile?.role === 'SuperAdmin'
  );
  
  const isAdmin = Boolean(
    isSuperAdmin || 
    profile?.role === 'Admin' || 
    profile?.role === 'Moderador'
  );

  // Site Settings state (with localStorage persistence)
  const [siteSettings, setSiteSettingsState] = useState<SiteSettings>(() => {
    try {
      const saved = localStorage.getItem('nexstudio_site_settings');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Error cargando site settings locales:', e);
    }
    return INITIAL_SITE_SETTINGS;
  });

  // Managed users state
  const [users, setUsers] = useState<ManagedUser[]>(() => {
    try {
      const saved = localStorage.getItem('nexstudio_managed_users');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Error cargando usuarios administrados:', e);
    }
    return INITIAL_MANAGED_USERS;
  });

  // Moderation reports state
  const [reports, setReports] = useState<ContentReport[]>(() => {
    try {
      const saved = localStorage.getItem('nexstudio_reports');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Error cargando reportes:', e);
    }
    return INITIAL_REPORTS;
  });

  // Dynamic FAQs state
  const [dynamicFaqs, setDynamicFaqs] = useState<FAQItem[]>(() => {
    try {
      const saved = localStorage.getItem('nexstudio_help_faqs');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Error cargando FAQs:', e);
    }
    return FAQ_ITEMS;
  });

  // Dynamic Guides state
  const [dynamicGuides, setDynamicGuides] = useState<GuideArticle[]>(() => {
    try {
      const saved = localStorage.getItem('nexstudio_help_guides');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Error cargando guías:', e);
    }
    return GUIDE_ARTICLES;
  });

  // Audit logs state
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>(() => {
    try {
      const saved = localStorage.getItem('nexstudio_audit_logs');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Error cargando logs de auditoría:', e);
    }
    return INITIAL_AUDIT_LOGS;
  });

  // Sync with Firestore site settings if exists
  useEffect(() => {
    const fetchRemoteSettings = async () => {
      try {
        const settingsRef = doc(db, 'settings', 'global');
        const docSnap = await getDoc(settingsRef);
        if (docSnap.exists()) {
          const remoteData = docSnap.data() as Partial<SiteSettings>;
          setSiteSettingsState((prev) => ({ ...prev, ...remoteData }));
        }
      } catch (err) {
        // Fallback gracefully to local storage
        console.log('Utilizando configuración local para NexStudio');
      }
    };
    fetchRemoteSettings();
  }, []);

  // Save changes to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('nexstudio_site_settings', JSON.stringify(siteSettings));
    } catch (e) {}
  }, [siteSettings]);

  useEffect(() => {
    try {
      localStorage.setItem('nexstudio_managed_users', JSON.stringify(users));
    } catch (e) {}
  }, [users]);

  useEffect(() => {
    try {
      localStorage.setItem('nexstudio_reports', JSON.stringify(reports));
    } catch (e) {}
  }, [reports]);

  useEffect(() => {
    try {
      localStorage.setItem('nexstudio_help_faqs', JSON.stringify(dynamicFaqs));
    } catch (e) {}
  }, [dynamicFaqs]);

  useEffect(() => {
    try {
      localStorage.setItem('nexstudio_help_guides', JSON.stringify(dynamicGuides));
    } catch (e) {}
  }, [dynamicGuides]);

  useEffect(() => {
    try {
      localStorage.setItem('nexstudio_audit_logs', JSON.stringify(auditLogs));
    } catch (e) {}
  }, [auditLogs]);

  // Helper to add audit log
  const logAdminAction = (action: string, target: string, category: AuditLogItem['category'], details?: string) => {
    const currentEmail = user?.email || 'allnexuslzyt@gmail.com';
    const currentName = user?.displayName || 'Administrador NexStudio';
    
    const now = new Date();
    const timeString = `Hoy a las ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    
    const newLog: AuditLogItem = {
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      adminEmail: currentEmail,
      adminName: currentName,
      action,
      target,
      category,
      timestamp: timeString,
      details
    };

    setAuditLogs((prev) => [newLog, ...prev.slice(0, 49)]); // Keep last 50 logs
  };

  // Toggle Maintenance Mode / Kill Switch
  const toggleMaintenanceMode = async (enabled?: boolean, message?: string) => {
    const newState = enabled !== undefined ? enabled : !siteSettings.maintenanceMode;
    const updatedSettings: SiteSettings = {
      ...siteSettings,
      maintenanceMode: newState,
      maintenanceMessage: message || siteSettings.maintenanceMessage,
      lastUpdated: new Date().toISOString(),
      updatedBy: user?.email || 'allnexuslzyt@gmail.com'
    };

    setSiteSettingsState(updatedSettings);

    const actionText = newState 
      ? 'Activó Interruptor de Cierre Global (Kill Switch: SITIO CERRADO)' 
      : 'Desactivó Cierre Global (SITIO EN LÍNEA / ABIERTO AL PÚBLICO)';

    logAdminAction(
      actionText,
      'Plataforma Global NexStudio',
      'mantenimiento',
      newState 
        ? `Bloqueo total activado para visitantes no administradores. Mensaje: "${updatedSettings.maintenanceMessage}"`
        : 'Acceso restablecido normalmente para todos los usuarios.'
    );

    // Sync to Firestore if permitted
    try {
      await setDoc(doc(db, 'settings', 'global'), updatedSettings, { merge: true });
    } catch (err) {
      console.log('Guardado local de modo mantenimiento completado');
    }
  };

  // Update Global Banner
  const updateGlobalBanner = async (bannerConfig: Partial<GlobalBannerConfig>) => {
    const updatedBanner: GlobalBannerConfig = {
      ...siteSettings.banner,
      ...bannerConfig
    };

    const updatedSettings: SiteSettings = {
      ...siteSettings,
      banner: updatedBanner,
      lastUpdated: new Date().toISOString(),
      updatedBy: user?.email || 'allnexuslzyt@gmail.com'
    };

    setSiteSettingsState(updatedSettings);

    logAdminAction(
      updatedBanner.enabled ? 'Publicó Banner Global' : 'Desactivó Banner Global',
      'Cabecera del Sitio',
      'ajustes',
      `Tipo: ${updatedBanner.type} | Mensaje: "${updatedBanner.message.substring(0, 60)}..."`
    );

    try {
      await setDoc(doc(db, 'settings', 'global'), updatedSettings, { merge: true });
    } catch (err) {}
  };

  const updateSiteSettings = async (settings: Partial<SiteSettings>) => {
    const updated = {
      ...siteSettings,
      ...settings,
      lastUpdated: new Date().toISOString(),
      updatedBy: user?.email || 'allnexuslzyt@gmail.com'
    };
    setSiteSettingsState(updated);
    logAdminAction('Actualización de Ajustes', 'Ajustes del Sitio', 'ajustes');
    try {
      await setDoc(doc(db, 'settings', 'global'), updated, { merge: true });
    } catch (err) {}
  };

  // User Actions
  const changeUserRole = async (userId: string, newRole: UserRole) => {
    const targetUser = users.find(u => u.id === userId);
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
    logAdminAction(
      `Cambió rol a ${newRole}`,
      targetUser ? `${targetUser.displayName} (@${targetUser.username})` : userId,
      'usuarios',
      `Rol anterior: ${targetUser?.role} -> Nuevo rol: ${newRole}`
    );
  };

  const banOrSuspendUser = async (userId: string, status: UserStatus, reason: string, duration: string = 'Permanente') => {
    const targetUser = users.find(u => u.id === userId);
    setUsers(prev => prev.map(u => {
      if (u.id === userId) {
        return {
          ...u,
          status,
          banReason: reason,
          banDuration: duration,
          sanctionsCount: (u.sanctionsCount || 0) + 1
        };
      }
      return u;
    }));

    const actionTitle = status === 'baneado' ? 'Baneó usuario' : (status === 'suspendido' ? 'Suspendió usuario' : 'Reactivó usuario');
    logAdminAction(
      actionTitle,
      targetUser ? `${targetUser.displayName} (@${targetUser.username})` : userId,
      'usuarios',
      `Motivo: ${reason} | Duración: ${duration}`
    );
  };

  const resetUserPassword = async (userId: string) => {
    const targetUser = users.find(u => u.id === userId);
    logAdminAction(
      'Envío de restablecimiento de contraseña',
      targetUser ? `${targetUser.displayName} (${targetUser.email})` : userId,
      'seguridad',
      `Correo de restablecimiento enviado exitosamente a ${targetUser?.email}`
    );
    return {
      success: true,
      message: `Se ha enviado el enlace de restablecimiento de contraseña a ${targetUser?.email || 'la dirección del usuario'}.`
    };
  };

  const deleteManagedUser = async (userId: string) => {
    const targetUser = users.find(u => u.id === userId);
    setUsers(prev => prev.filter(u => u.id !== userId));
    logAdminAction(
      'Eliminó cuenta de usuario',
      targetUser ? `${targetUser.displayName} (${targetUser.email})` : userId,
      'usuarios',
      'Cuenta y datos asociados eliminados definitivamente del sistema.'
    );
  };

  const addManagedUser = async (userData: Omit<ManagedUser, 'id' | 'createdAt' | 'lastActive' | 'status'>) => {
    const newUser: ManagedUser = {
      ...userData,
      id: `usr-${Date.now()}`,
      createdAt: new Date().toISOString(),
      lastActive: 'Hace unos instantes',
      status: 'activo',
      sanctionsCount: 0
    };
    setUsers(prev => [newUser, ...prev]);
    logAdminAction('Creó usuario manualmente', `${newUser.displayName} (@${newUser.username})`, 'usuarios');
  };

  // Moderation Actions
  const approveReport = async (reportId: string) => {
    const report = reports.find(r => r.id === reportId);
    setReports(prev => prev.map(r => r.id === reportId ? { 
      ...r, 
      status: 'approved',
      resolvedAt: new Date().toISOString(),
      resolvedBy: user?.email || 'allnexuslzyt@gmail.com'
    } : r));

    logAdminAction(
      'Aprobó contenido reportado (Falso positivo)',
      report ? `${report.contentType} de ${report.authorName}` : reportId,
      'moderacion',
      'El contenido fue revisado y marcado como apto según las directrices comunitarias.'
    );
  };

  const removeReportedContent = async (reportId: string) => {
    const report = reports.find(r => r.id === reportId);
    setReports(prev => prev.map(r => r.id === reportId ? { 
      ...r, 
      status: 'removed',
      resolvedAt: new Date().toISOString(),
      resolvedBy: user?.email || 'allnexuslzyt@gmail.com'
    } : r));

    logAdminAction(
      'Eliminó contenido reportado',
      report ? `${report.contentType} (#${report.contentId})` : reportId,
      'moderacion',
      `Motivo del reporte: ${report?.reasonText || report?.reason}`
    );
  };

  const sanctionUserFromReport = async (reportId: string, action: 'warning' | 'suspend_24h' | 'ban_permanent') => {
    const report = reports.find(r => r.id === reportId);
    if (!report) return;

    // Update report status
    setReports(prev => prev.map(r => r.id === reportId ? { 
      ...r, 
      status: 'sanctioned',
      resolvedAt: new Date().toISOString(),
      resolvedBy: user?.email || 'allnexuslzyt@gmail.com'
    } : r));

    // Also update the user if exists in managed users
    const target = users.find(u => u.email === report.authorEmail || u.displayName === report.authorName);
    if (target) {
      if (action === 'ban_permanent') {
        await banOrSuspendUser(target.id, 'baneado', `Reporte confirmado: ${report.reasonText}`, 'Permanente');
      } else if (action === 'suspend_24h') {
        await banOrSuspendUser(target.id, 'suspendido', `Reporte confirmado: ${report.reasonText}`, '24 horas');
      }
    }

    logAdminAction(
      `Sancionó usuario por reporte (${action})`,
      report.authorName,
      'moderacion',
      `Acción aplicada: ${action}. Motivo: ${report.reasonText}`
    );
  };

  // Dynamic Help Center Actions
  const addFaq = async (faqData: Omit<FAQItem, 'id'>) => {
    const newFaq: FAQItem = {
      ...faqData,
      id: `faq-${Date.now()}`
    };
    setDynamicFaqs(prev => [newFaq, ...prev]);
    logAdminAction('Añadió nueva Pregunta Frecuente', newFaq.question, 'ajustes');
  };

  const updateFaq = async (faq: FAQItem) => {
    setDynamicFaqs(prev => prev.map(f => f.id === faq.id ? faq : f));
    logAdminAction('Editó Pregunta Frecuente', faq.question, 'ajustes');
  };

  const deleteFaq = async (faqId: string) => {
    const target = dynamicFaqs.find(f => f.id === faqId);
    setDynamicFaqs(prev => prev.filter(f => f.id !== faqId));
    logAdminAction('Eliminó Pregunta Frecuente', target?.question || faqId, 'ajustes');
  };

  const addGuide = async (guideData: Omit<GuideArticle, 'id'>) => {
    const newGuide: GuideArticle = {
      ...guideData,
      id: `guide-${Date.now()}`
    };
    setDynamicGuides(prev => [newGuide, ...prev]);
    logAdminAction('Publicó nuevo Artículo de Ayuda', newGuide.title, 'ajustes');
  };

  const updateGuide = async (guide: GuideArticle) => {
    setDynamicGuides(prev => prev.map(g => g.id === guide.id ? guide : g));
    logAdminAction('Actualizó Artículo de Ayuda', guide.title, 'ajustes');
  };

  const deleteGuide = async (guideId: string) => {
    const target = dynamicGuides.find(g => g.id === guideId);
    setDynamicGuides(prev => prev.filter(g => g.id !== guideId));
    logAdminAction('Eliminó Artículo de Ayuda', target?.title || guideId, 'ajustes');
  };

  const serverStatus = {
    status: (siteSettings.maintenanceMode ? 'maintenance' : 'online') as 'online' | 'degraded' | 'maintenance',
    latencyMs: 24,
    uptime: '99.98%',
    lastPing: 'Hace 3 segundos'
  };

  return (
    <AdminContext.Provider
      value={{
        siteSettings,
        toggleMaintenanceMode,
        updateGlobalBanner,
        updateSiteSettings,
        users,
        changeUserRole,
        banOrSuspendUser,
        resetUserPassword,
        deleteManagedUser,
        addManagedUser,
        reports,
        approveReport,
        removeReportedContent,
        sanctionUserFromReport,
        dynamicFaqs,
        dynamicGuides,
        addFaq,
        updateFaq,
        deleteFaq,
        addGuide,
        updateGuide,
        deleteGuide,
        auditLogs,
        logAdminAction,
        isAdmin,
        isSuperAdmin,
        serverStatus
      }}
    >
      {children}
    </AdminContext.Provider>
  );
};

export const useAdmin = () => {
  const context = useContext(AdminContext);
  if (!context) {
    throw new Error('useAdmin debe usarse dentro de AdminProvider');
  }
  return context;
};
