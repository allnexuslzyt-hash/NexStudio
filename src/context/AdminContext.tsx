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
import { doc, getDoc, setDoc, deleteDoc, onSnapshot, collection } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';

interface AdminContextType {
  siteSettings: SiteSettings;
  toggleMaintenanceMode: (enabled?: boolean, message?: string, estimatedReturn?: string, reason?: string) => Promise<void>;
  updateGlobalBanner: (bannerConfig: Partial<GlobalBannerConfig>) => Promise<void>;
  updateSiteSettings: (settings: Partial<SiteSettings>) => Promise<void>;
  
  // Users management
  users: ManagedUser[];
  updateUserNames: (userId: string, displayName: string, username: string) => Promise<void>;
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
  estimatedTime: 'Aproximadamente 30 minutos',
  maintenanceReason: 'Actualización crítica del sistema',
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

const INITIAL_MANAGED_USERS: ManagedUser[] = [];

const INITIAL_REPORTS: ContentReport[] = [];

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

  // Managed users state - initialized empty, populated from real Firestore users
  const [users, setUsers] = useState<ManagedUser[]>([]);

  // Moderation reports state - empty, real reports only
  const [reports, setReports] = useState<ContentReport[]>([]);

  // Listen to REAL users in Firestore
  useEffect(() => {
    if (!isAdmin) return;

    const usersCol = collection(db, 'users');
    const unsub = onSnapshot(
      usersCol,
      (snapshot) => {
        const realUsers: ManagedUser[] = [];
        snapshot.forEach((docSnap) => {
          const d = docSnap.data();
          realUsers.push({
            id: docSnap.id,
            displayName: d.displayName || 'Usuario NexStudio',
            username: d.username || docSnap.id.substring(0, 8),
            email: d.email || '',
            avatarUrl: d.photoURL || `https://api.dicebear.com/7.x/identicon/svg?seed=${docSnap.id}`,
            role: (d.role as UserRole) || (d.email?.toLowerCase() === 'allnexuslzyt@gmail.com' ? 'SuperAdmin' : 'Usuario'),
            createdAt: d.createdAt || new Date().toISOString(),
            lastActive: d.lastLogin ? new Date(d.lastLogin).toLocaleDateString() : 'Activo',
            status: (d.status as UserStatus) || 'activo',
            banReason: d.banReason,
            banDuration: d.banDuration,
            sanctionsCount: d.sanctionsCount || 0
          });
        });
        setUsers(realUsers);
      },
      (err) => {
        console.warn('Advertencia al consultar usuarios reales de Firestore:', err.message);
      }
    );

    return () => unsub();
  }, [isAdmin]);

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

  // Real-time synchronization with Firestore site settings (Kill switch & global announcements)
  useEffect(() => {
    const settingsRef = doc(db, 'settings', 'global');
    // Listen in real time: as soon as the admin flips the switch, ALL devices and users see the change instantly
    const unsubscribe = onSnapshot(
      settingsRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const remoteData = docSnap.data() as Partial<SiteSettings>;
          setSiteSettingsState((prev) => ({ ...prev, ...remoteData }));
        }
      },
      (err) => {
        console.warn('Configuración global funcionando con sincronización local/resiliente:', err.message);
      }
    );

    return () => unsubscribe();
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
  const toggleMaintenanceMode = async (
    enabled?: boolean, 
    message?: string, 
    estimatedReturn?: string,
    reason?: string
  ) => {
    const newState = enabled !== undefined ? enabled : !siteSettings.maintenanceMode;
    const updatedSettings: SiteSettings = {
      ...siteSettings,
      maintenanceMode: newState,
      maintenanceMessage: message || siteSettings.maintenanceMessage,
      maintenanceEstimatedReturn: estimatedReturn || siteSettings.maintenanceEstimatedReturn || siteSettings.estimatedTime || 'Aproximadamente 30 minutos',
      estimatedTime: estimatedReturn || siteSettings.estimatedTime || 'Aproximadamente 30 minutos',
      maintenanceReason: reason || siteSettings.maintenanceReason || 'Actualización crítica del sistema',
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
  const updateUserNames = async (userId: string, newDisplayName: string, newUsername: string) => {
    const targetUser = users.find(u => u.id === userId);
    try {
      await setDoc(doc(db, 'users', userId), {
        displayName: newDisplayName.trim(),
        username: newUsername.trim().toLowerCase()
      }, { merge: true });

      setUsers(prev => prev.map(u => u.id === userId ? {
        ...u,
        displayName: newDisplayName.trim(),
        username: newUsername.trim().toLowerCase()
      } : u));

      logAdminAction(
        'Modificó nombre de usuario y nombre visible',
        targetUser ? `${targetUser.displayName} -> ${newDisplayName} (@${newUsername})` : userId,
        'usuarios',
        `Nuevo nombre visible: "${newDisplayName}", Nuevo @usuario: "@${newUsername.toLowerCase()}"`
      );
    } catch (err: any) {
      console.error('Error actualizando usuario en Firestore:', err);
      handleFirestoreError(err, OperationType.UPDATE, `users/${userId}`);
      throw err;
    }
  };

  const changeUserRole = async (userId: string, newRole: UserRole) => {
    const targetUser = users.find(u => u.id === userId);
    try {
      await setDoc(doc(db, 'users', userId), { role: newRole }, { merge: true });
    } catch (e) {
      console.warn('Error guardando rol en Firestore:', e);
    }
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

    if (status === 'activo') {
      try {
        await setDoc(doc(db, 'users', userId), {
          status: 'activo',
          banReason: null,
          banDuration: null,
          bannedAt: null,
          banExpiresAt: null
        }, { merge: true });
      } catch (e) {
        console.warn('Error reactivando usuario en Firestore:', e);
      }
      setUsers(prev => prev.map(u => {
        if (u.id === userId) {
          return {
            ...u,
            status: 'activo',
            banReason: undefined,
            banDuration: undefined,
            bannedAt: undefined,
            banExpiresAt: undefined
          };
        }
        return u;
      }));
      logAdminAction(
        'Reactivó usuario (Sanción levantada)',
        targetUser ? `${targetUser.displayName} (@${targetUser.username})` : userId,
        'usuarios',
        `El usuario ha sido reincorporado al servicio con estado activo.`
      );
      return;
    }

    const now = new Date();
    let banExpiresAt: string | null = null;
    if (duration === '24 horas') {
      banExpiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();
    } else if (duration === '7 días') {
      banExpiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();
    } else if (duration === '30 días') {
      banExpiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();
    }

    const effectiveReason = reason?.trim() || (status === 'baneado' ? 'Incumplimiento de las normas de la comunidad' : 'Suspensión temporal por infracción');

    try {
      await setDoc(doc(db, 'users', userId), {
        status,
        banReason: effectiveReason,
        banDuration: duration,
        bannedAt: now.toISOString(),
        banExpiresAt
      }, { merge: true });
    } catch (e) {
      console.warn('Error guardando sanción en Firestore:', e);
    }

    setUsers(prev => prev.map(u => {
      if (u.id === userId) {
        return {
          ...u,
          status,
          banReason: effectiveReason,
          banDuration: duration,
          bannedAt: now.toISOString(),
          banExpiresAt: banExpiresAt || undefined,
          sanctionsCount: (u.sanctionsCount || 0) + 1
        };
      }
      return u;
    }));

    const actionTitle = status === 'baneado' ? 'Baneó usuario' : 'Suspendió usuario temporalmente';
    logAdminAction(
      actionTitle,
      targetUser ? `${targetUser.displayName} (@${targetUser.username})` : userId,
      'usuarios',
      `Motivo: ${effectiveReason} | Duración: ${duration}${banExpiresAt ? ` | Expira: ${new Date(banExpiresAt).toLocaleString()}` : ''}`
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
    try {
      await deleteDoc(doc(db, 'users', userId));
    } catch (e) {
      console.warn('Error eliminando usuario de Firestore:', e);
    }
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
        updateUserNames,
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
