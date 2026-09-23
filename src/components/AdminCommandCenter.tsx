import React, { useState, useMemo, useEffect } from 'react';
import { useAdmin } from '../context/AdminContext';
import { useAuth } from '../context/AuthContext';
import { 
  BarChart3, 
  Users, 
  ShieldAlert, 
  Settings, 
  Power, 
  Search, 
  Filter, 
  UserCheck, 
  UserX, 
  ShieldCheck, 
  Shield, 
  Trash2, 
  KeyRound, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Server, 
  Activity, 
  Bell, 
  FileText, 
  HelpCircle, 
  Plus, 
  Edit3, 
  Eye, 
  RefreshCw, 
  RotateCcw,
  ArrowLeft,
  ChevronRight,
  TrendingUp,
  AlertCircle,
  ExternalLink,
  Lock,
  Radio,
  Sliders,
  Sparkles,
  Info,
  MessageSquare,
  Headphones,
  Send,
  FolderGit2,
  Rocket,
  PlayCircle,
  PauseCircle,
  Timer
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ManagedUser, UserRole, UserStatus, ContentReport, GlobalBannerConfig, BannerType, SupportTicket, LaunchModeConfig } from '../types';
import { FAQItem, GuideArticle } from '../data/helpData';
import { useSupport } from '../context/SupportContext';
import { validateUsername, validateDisplayName } from '../utils/usernameValidation';
import { AdminProjectsManager } from './AdminProjectsManager';
import { LaunchScreen } from './LaunchScreen';

interface AdminCommandCenterProps {
  onBack: () => void;
}

type AdminTab = 'dashboard' | 'users' | 'tickets' | 'projects' | 'moderation' | 'settings' | 'launch';

export const AdminCommandCenter: React.FC<AdminCommandCenterProps> = ({ onBack }) => {
  const { 
    siteSettings, 
    toggleMaintenanceMode, 
    updateGlobalBanner, 
    updateSiteSettings,
    updateLaunchMode,
    toggleLaunchMode,
    pauseResumeCountdown,
    resetCountdown,
    setCountdownTarget,
    setCustomCountdownDuration,
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
    projects,
    auditLogs, 
    serverStatus,
    isAdmin 
  } = useAdmin();

  const {
    tickets,
    claimTicket,
    closeTicket,
    reopenTicket,
    deleteTicket,
    addMessageToTicket
  } = useSupport();

  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
  const [notificationToast, setNotificationToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setNotificationToast(msg);
    setTimeout(() => setNotificationToast(null), 3500);
  };

  // User Management filters
  const [searchUserQuery, setSearchUserQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // User Name / Display Name Edit Modal
  const [selectedUserForEdit, setSelectedUserForEdit] = useState<ManagedUser | null>(null);
  const [editDisplayName, setEditDisplayName] = useState('');
  const [editUsername, setEditUsername] = useState('');
  const [editUserError, setEditUserError] = useState<string | null>(null);
  const [isSavingUserNames, setIsSavingUserNames] = useState(false);

  // Tickets state
  const [ticketStatusFilter, setTicketStatusFilter] = useState<'all' | 'abierto' | 'en_proceso' | 'cerrado'>('all');
  const [ticketSearch, setTicketSearch] = useState('');
  const [activeAdminChatTicketId, setActiveAdminChatTicketId] = useState<string | null>(null);
  const [adminChatReply, setAdminChatReply] = useState('');

  const activeAdminChatTicket = useMemo(() => {
    if (!activeAdminChatTicketId) return null;
    return tickets.find(t => t.id === activeAdminChatTicketId) || null;
  }, [tickets, activeAdminChatTicketId]);

  // Modals state
  const [selectedUserForRole, setSelectedUserForRole] = useState<ManagedUser | null>(null);
  const [selectedUserForBan, setSelectedUserForBan] = useState<ManagedUser | null>(null);
  const [selectedUserForDelete, setSelectedUserForDelete] = useState<ManagedUser | null>(null);
  const [selectedTicketForDelete, setSelectedTicketForDelete] = useState<SupportTicket | null>(null);
  const [isDeletingTicket, setIsDeletingTicket] = useState<boolean>(false);
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);

  // Ban modal fields
  const [banReasonInput, setBanReasonInput] = useState('');
  const [banDurationInput, setBanDurationInput] = useState('7 días');

  // FAQ & Guide Modals
  const [editingFaq, setEditingFaq] = useState<FAQItem | null>(null);
  const [isNewFaqModalOpen, setIsNewFaqModalOpen] = useState(false);
  const [newFaqQuestion, setNewFaqQuestion] = useState('');
  const [newFaqCategory, setNewFaqCategory] = useState('primeros-pasos');
  const [newFaqSummary, setNewFaqSummary] = useState('');

  // Global Banner editing state
  const [bannerEnabled, setBannerEnabled] = useState(siteSettings.banner?.enabled || false);
  const [bannerType, setBannerType] = useState<BannerType>(siteSettings.banner?.type || 'info');
  const [bannerMessage, setBannerMessage] = useState(siteSettings.banner?.message || '');
  const [bannerActionText, setBannerActionText] = useState(siteSettings.banner?.actionText || '');
  const [bannerActionLink, setBannerActionLink] = useState(siteSettings.banner?.actionLink || '');

  // Kill Switch state
  const [maintenanceInputMessage, setMaintenanceInputMessage] = useState(siteSettings.maintenanceMessage);
  const [maintenanceInputEstimatedTime, setMaintenanceInputEstimatedTime] = useState(
    siteSettings.maintenanceEstimatedReturn || siteSettings.estimatedTime || 'Aproximadamente 30 minutos'
  );
  const [maintenanceInputReason, setMaintenanceInputReason] = useState(
    siteSettings.maintenanceReason || 'Actualización crítica del sistema'
  );

  // Modo En Lanzamiento Form State
  const formatDatetimeForInput = (isoString?: string) => {
    try {
      const d = isoString ? new Date(isoString) : new Date(Date.now() + 24 * 3600 * 1000);
      const pad = (n: number) => n.toString().padStart(2, '0');
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    } catch {
      return '';
    }
  };

  // Helper for computing Days, Hours, Minutes, Seconds from launch config
  const getDHMSFromLaunch = (launchConfig?: LaunchModeConfig) => {
    let sec = 24 * 3600;
    if (launchConfig?.isPaused && typeof launchConfig.pausedRemainingSeconds === 'number') {
      sec = launchConfig.pausedRemainingSeconds;
    } else if (launchConfig?.targetTimestampMs) {
      sec = Math.max(0, Math.floor((launchConfig.targetTimestampMs - Date.now()) / 1000));
    } else if (launchConfig?.targetDate) {
      const ms = new Date(launchConfig.targetDate).getTime();
      sec = Math.max(0, Math.floor((ms - Date.now()) / 1000));
    }
    return {
      d: Math.floor(sec / 86400),
      h: Math.floor((sec % 86400) / 3600),
      m: Math.floor((sec % 3600) / 60),
      s: sec % 60
    };
  };

  const initialDHMS = getDHMSFromLaunch(siteSettings.launchMode);
  const [launchDays, setLaunchDays] = useState<number>(initialDHMS.d);
  const [launchHours, setLaunchHours] = useState<number>(initialDHMS.h);
  const [launchMinutes, setLaunchMinutes] = useState<number>(initialDHMS.m);
  const [launchSeconds, setLaunchSeconds] = useState<number>(initialDHMS.s);

  // Live real-time remaining seconds ticker inside Admin Command Center
  const [adminLiveRemaining, setAdminLiveRemaining] = useState<number>(() => {
    const launchConfig = siteSettings.launchMode;
    if (launchConfig?.isPaused) return launchConfig.pausedRemainingSeconds ?? 0;
    const targetMs = Number(launchConfig?.targetTimestampMs) || (launchConfig?.targetDate ? new Date(launchConfig.targetDate).getTime() : Date.now() + 86400000);
    return Math.max(0, Math.floor((targetMs - Date.now()) / 1000));
  });

  useEffect(() => {
    const launchConfig = siteSettings.launchMode;
    if (!launchConfig) return;

    const updateLive = () => {
      if (launchConfig.isPaused) {
        setAdminLiveRemaining(launchConfig.pausedRemainingSeconds ?? 0);
        return;
      }
      const targetMs = Number(launchConfig.targetTimestampMs) || (launchConfig.targetDate ? new Date(launchConfig.targetDate).getTime() : Date.now() + 86400000);
      setAdminLiveRemaining(Math.max(0, Math.floor((targetMs - Date.now()) / 1000)));
    };

    updateLive();
    const interval = setInterval(updateLive, 250);
    return () => clearInterval(interval);
  }, [
    siteSettings.launchMode?.isPaused,
    siteSettings.launchMode?.targetTimestampMs,
    siteSettings.launchMode?.targetDate,
    siteSettings.launchMode?.pausedRemainingSeconds
  ]);

  // Handler for custom duration fields (Days, Hours, Minutes, Seconds)
  const handleDurationChange = (d: number, h: number, m: number, s: number) => {
    const safeD = Math.max(0, isNaN(d) ? 0 : d);
    const safeH = Math.max(0, Math.min(23, isNaN(h) ? 0 : h));
    const safeM = Math.max(0, Math.min(59, isNaN(m) ? 0 : m));
    const safeS = Math.max(0, Math.min(59, isNaN(s) ? 0 : s));

    setLaunchDays(safeD);
    setLaunchHours(safeH);
    setLaunchMinutes(safeM);
    setLaunchSeconds(safeS);

    const totalSec = (safeD * 86400) + (safeH * 3600) + (safeM * 60) + safeS;
    const computedTarget = new Date(Date.now() + totalSec * 1000);
    setLaunchTargetInput(formatDatetimeForInput(computedTarget.toISOString()));
  };

  // Handler for exact datetime picker
  const handleDatetimeChange = (val: string) => {
    setLaunchTargetInput(val);
    if (!val) return;
    const targetMs = new Date(val).getTime();
    const totalSec = Math.max(0, Math.floor((targetMs - Date.now()) / 1000));
    setLaunchDays(Math.floor(totalSec / 86400));
    setLaunchHours(Math.floor((totalSec % 86400) / 3600));
    setLaunchMinutes(Math.floor((totalSec % 3600) / 60));
    setLaunchSeconds(totalSec % 60);
  };

  const [launchTitle, setLaunchTitle] = useState(siteSettings.launchMode?.title || '¡El Gran Lanzamiento de NexStudio está cerca!');
  const [launchSubtitle, setLaunchSubtitle] = useState(siteSettings.launchMode?.subtitle || 'Estamos preparando todos los proyectos, herramientas y la comunidad. ¡Muy pronto abriremos las puertas para todos!');
  const [launchBadgeText, setLaunchBadgeText] = useState(siteSettings.launchMode?.badgeText || 'Gran Estreno Oficial 1.0');
  const [launchTargetInput, setLaunchTargetInput] = useState(() => formatDatetimeForInput(siteSettings.launchMode?.targetDate));
  const [launchAutoUnlock, setLaunchAutoUnlock] = useState(siteSettings.launchMode?.autoUnlockOnFinish ?? true);
  const [launchAdminBypass, setLaunchAdminBypass] = useState(siteSettings.launchMode?.allowAdminBypass ?? true);
  const [isSavingLaunch, setIsSavingLaunch] = useState(false);
  const [isResettingCountdown, setIsResettingCountdown] = useState(false);
  const [showResetCountdownConfirm, setShowResetCountdownConfirm] = useState(false);
  const [previewLaunchModalOpen, setPreviewLaunchModalOpen] = useState(false);

  // Restablecer por completo toda la cuenta atrás
  const handleResetEntireCountdown = async () => {
    setIsResettingCountdown(true);
    try {
      await resetCountdown(24);
      setLaunchDays(1);
      setLaunchHours(0);
      setLaunchMinutes(0);
      setLaunchSeconds(0);
      const computedTarget = new Date(Date.now() + 86400 * 1000);
      setLaunchTargetInput(formatDatetimeForInput(computedTarget.toISOString()));
      showToast('🔄 ¡Toda la cuenta atrás ha sido restablecida a 24 horas y sincronizada!');
      setShowResetCountdownConfirm(false);
    } catch (err) {
      showToast('Error al restablecer la cuenta atrás');
    } finally {
      setIsResettingCountdown(false);
    }
  };

  // Sync launch settings when siteSettings update
  useEffect(() => {
    if (siteSettings?.launchMode) {
      setLaunchTitle(siteSettings.launchMode.title || '¡El Gran Lanzamiento de NexStudio está cerca!');
      setLaunchSubtitle(siteSettings.launchMode.subtitle || '');
      setLaunchBadgeText(siteSettings.launchMode.badgeText || 'Gran Estreno Oficial 1.0');
      if (siteSettings.launchMode.targetDate) {
        setLaunchTargetInput(formatDatetimeForInput(siteSettings.launchMode.targetDate));
        const dhms = getDHMSFromLaunch(siteSettings.launchMode);
        setLaunchDays(dhms.d);
        setLaunchHours(dhms.h);
        setLaunchMinutes(dhms.m);
        setLaunchSeconds(dhms.s);
      }
      setLaunchAutoUnlock(siteSettings.launchMode.autoUnlockOnFinish ?? true);
      setLaunchAdminBypass(siteSettings.launchMode.allowAdminBypass ?? true);
    }
  }, [siteSettings?.launchMode]);

  // Sync maintenance settings when siteSettings update
  useEffect(() => {
    if (siteSettings) {
      if (siteSettings.maintenanceMessage) {
        setMaintenanceInputMessage(siteSettings.maintenanceMessage);
      }
      if (siteSettings.maintenanceEstimatedReturn || siteSettings.estimatedTime) {
        setMaintenanceInputEstimatedTime(siteSettings.maintenanceEstimatedReturn || siteSettings.estimatedTime || 'Aproximadamente 30 minutos');
      }
      if (siteSettings.maintenanceReason) {
        setMaintenanceInputReason(siteSettings.maintenanceReason);
      }
    }
  }, [siteSettings.maintenanceMessage, siteSettings.maintenanceEstimatedReturn, siteSettings.estimatedTime, siteSettings.maintenanceReason]);

  // Filtered Users
  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      const q = searchUserQuery.toLowerCase().trim();
      const matchSearch = !q || 
        u.displayName.toLowerCase().includes(q) || 
        u.email.toLowerCase().includes(q) || 
        u.username.toLowerCase().includes(q);
      
      const matchRole = roleFilter === 'all' || u.role === roleFilter;
      const matchStatus = statusFilter === 'all' || u.status === statusFilter;

      return matchSearch && matchRole && matchStatus;
    });
  }, [users, searchUserQuery, roleFilter, statusFilter]);

  // Filtered tickets
  const filteredTickets = useMemo(() => {
    return tickets.filter((t) => {
      const q = ticketSearch.toLowerCase().trim();
      const matchSearch = 
        !q ||
        t.subject.toLowerCase().includes(q) ||
        t.contactEmail.toLowerCase().includes(q) ||
        t.userName.toLowerCase().includes(q);

      const matchStatus = ticketStatusFilter === 'all' || t.status === ticketStatusFilter;
      return matchSearch && matchStatus;
    });
  }, [tickets, ticketSearch, ticketStatusFilter]);

  // Activity stats calculation
  const stats = useMemo(() => {
    const totalUsers = users.length;
    const activeToday = users.filter(u => u.status === 'activo').length;
    const pendingReports = reports.filter(r => r.status === 'pending').length;
    const openTickets = tickets.filter(t => t.status === 'abierto').length;
    return {
      totalUsers,
      activeToday,
      pendingReports,
      openTickets,
      onlineStatus: siteSettings.maintenanceMode ? 'Cerrado' : 'En Línea'
    };
  }, [users, reports, tickets, siteSettings.maintenanceMode]);

  return (
    <div className="w-full max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 space-y-6">
      {/* Toast Alert */}
      <AnimatePresence>
        {notificationToast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-20 right-6 z-50 px-4 py-3 rounded-xl bg-slate-900 text-white text-xs font-medium border border-slate-700 shadow-xl flex items-center gap-2.5"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{notificationToast}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header Bar with Back and Global Status Indicator */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="p-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer"
            title="Volver al espacio de trabajo"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-xs">
                <Sliders className="w-4 h-4" />
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                Centro de Mando
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                SuperAdmin
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Administración centralizada de NexStudio &bull; Conectado como <strong className="text-slate-700">{user?.email || 'allnexuslzyt@gmail.com'}</strong>
            </p>
          </div>
        </div>

        {/* Global Web State Indicator & Kill Switch Shortcut */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Launch Mode status badge */}
          {siteSettings.launchMode?.enabled && (
            <button
              type="button"
              onClick={() => setActiveTab('launch')}
              className="px-3 py-1.5 rounded-xl border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-800 flex items-center gap-2 text-xs font-bold transition-all cursor-pointer shadow-xs"
            >
              <Rocket className="w-3.5 h-3.5 text-amber-600 animate-bounce" />
              <span>EN LANZAMIENTO (BLOQUEADA)</span>
            </button>
          )}

          <div className={`px-3 py-1.5 rounded-xl border flex items-center gap-2 text-xs font-semibold ${
            siteSettings.maintenanceMode 
              ? 'bg-rose-50 border-rose-200 text-rose-700' 
              : 'bg-emerald-50 border-emerald-200 text-emerald-700'
          }`}>
            <span className="relative flex h-2 w-2">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                siteSettings.maintenanceMode ? 'bg-rose-400' : 'bg-emerald-400'
              }`}></span>
              <span className={`relative inline-flex rounded-full h-2 w-2 ${
                siteSettings.maintenanceMode ? 'bg-rose-600' : 'bg-emerald-600'
              }`}></span>
            </span>
            <span>{siteSettings.maintenanceMode ? 'CERRADA AL PÚBLICO' : 'PÚBLICA (EN LÍNEA)'}</span>
          </div>

          <button
            type="button"
            onClick={() => {
              const newState = !siteSettings.maintenanceMode;
              toggleMaintenanceMode(
                newState,
                maintenanceInputMessage,
                maintenanceInputEstimatedTime,
                maintenanceInputReason
              );
              showToast(siteSettings.maintenanceMode ? 'Sitio reabierto al público' : 'Sitio cerrado al público');
            }}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer ${
              siteSettings.maintenanceMode
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                : 'bg-rose-600 hover:bg-rose-500 text-white'
            }`}
          >
            <Power className="w-3.5 h-3.5" />
            <span>{siteSettings.maintenanceMode ? 'ABRIR SITIO' : 'CERRAR SITIO'}</span>
          </button>
        </div>
      </div>

      {/* Main Tabs Navigation */}
      <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl max-w-fit overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab('dashboard')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'dashboard' 
              ? 'bg-white text-slate-900 shadow-xs' 
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Dashboard y Métricas</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('users')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'users' 
              ? 'bg-white text-slate-900 shadow-xs' 
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Gestión de Usuarios</span>
          <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-slate-200 text-slate-700">
            {users.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('tickets')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'tickets' 
              ? 'bg-white text-slate-900 shadow-xs' 
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Headphones className="w-4 h-4" />
          <span>Tickets de Soporte</span>
          {tickets.filter(t => t.status === 'abierto').length > 0 && (
            <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-rose-500 text-white font-bold animate-pulse">
              {tickets.filter(t => t.status === 'abierto').length}
            </span>
          )}
        </button>

        <button
          type="button"
          id="btn-admin-tab-projects"
          onClick={() => setActiveTab('projects')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'projects' 
              ? 'bg-white text-slate-900 shadow-xs' 
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <FolderGit2 className="w-4 h-4" />
          <span>Gestión de Proyectos</span>
          <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-slate-200 text-slate-700 font-semibold">
            {projects.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('moderation')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'moderation' 
              ? 'bg-white text-slate-900 shadow-xs' 
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <ShieldAlert className="w-4 h-4" />
          <span>Moderación y Contenido</span>
          {stats.pendingReports > 0 && (
            <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-amber-500 text-white font-bold">
              {stats.pendingReports}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('settings')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'settings' 
              ? 'bg-white text-slate-900 shadow-xs' 
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Settings className="w-4 h-4" />
          <span>Ajustes y Kill Switch</span>
        </button>

        <button
          type="button"
          id="btn-admin-tab-launch"
          onClick={() => setActiveTab('launch')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'launch' 
              ? 'bg-gradient-to-r from-amber-500 via-indigo-600 to-indigo-700 text-white shadow-xs font-bold' 
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Rocket className={`w-4 h-4 ${activeTab === 'launch' ? 'text-amber-200' : 'text-amber-500'}`} />
          <span>Modo En Lanzamiento</span>
          {siteSettings.launchMode?.enabled && (
            <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-amber-400 text-slate-950 font-extrabold animate-pulse">
              ACTIVO
            </span>
          )}
        </button>
      </div>

      {/* TAB A: DASHBOARD Y ESTADÍSTICAS GENERALES */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          {/* Quick Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Metric 1 */}
            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-xs font-medium text-slate-500">Usuarios Registrados</span>
                <p className="text-2xl font-extrabold text-slate-900 mt-1">{stats.totalUsers}</p>
                <span className="text-[11px] text-emerald-600 flex items-center gap-1 mt-0.5 font-medium">
                  <TrendingUp className="w-3 h-3" /> +14% este mes
                </span>
              </div>
              <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                <Users className="w-6 h-6" />
              </div>
            </div>

            {/* Metric 2 */}
            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-xs font-medium text-slate-500">Usuarios Activos Hoy</span>
                <p className="text-2xl font-extrabold text-slate-900 mt-1">{stats.activeToday}</p>
                <span className="text-[11px] text-slate-500 block mt-0.5">85% del censo total</span>
              </div>
              <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
                <Activity className="w-6 h-6" />
              </div>
            </div>

            {/* Metric 3 */}
            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-xs font-medium text-slate-500">Reportes Pendientes</span>
                <p className="text-2xl font-extrabold text-amber-600 mt-1">{stats.pendingReports}</p>
                <span className="text-[11px] text-slate-500 block mt-0.5">Requieren revisión</span>
              </div>
              <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600">
                <ShieldAlert className="w-6 h-6" />
              </div>
            </div>

            {/* Metric 4 */}
            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-xs font-medium text-slate-500">Estado del Servidor</span>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                  </span>
                  <p className="text-lg font-extrabold text-slate-900">En Línea</p>
                </div>
                <span className="text-[11px] text-slate-500 block mt-0.5">Latencia: ~24ms &bull; 99.98%</span>
              </div>
              <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-700">
                <Server className="w-6 h-6" />
              </div>
            </div>
          </div>

          {/* Kill Switch Big Banner Card */}
          <div className={`p-6 rounded-2xl border transition-all ${
            siteSettings.maintenanceMode
              ? 'bg-rose-50/70 border-rose-200'
              : 'bg-white border-slate-200'
          }`}>
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
              <div className="space-y-1.5 max-w-xl">
                <div className="flex items-center gap-2">
                  <Power className={`w-5 h-5 ${siteSettings.maintenanceMode ? 'text-rose-600' : 'text-slate-700'}`} />
                  <h2 className="text-base font-bold text-slate-900">
                    Interruptor de Cierre Global (Kill Switch)
                  </h2>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Permite bloquear de forma inmediata todo el acceso a la plataforma para los visitantes normales en caso de mantenimiento técnico o emergencia. Los administradores mantienen acceso exclusivo en todo momento.
                </p>
                <div className="pt-1 flex items-center gap-3 text-xs">
                  <span className="text-slate-500 font-medium">Estado actual:</span>
                  <span className={`font-bold px-2.5 py-0.5 rounded-md ${
                    siteSettings.maintenanceMode 
                      ? 'bg-rose-600 text-white' 
                      : 'bg-emerald-600 text-white'
                  }`}>
                    {siteSettings.maintenanceMode ? 'SITIO CERRADO (MANTENIMIENTO)' : 'SITIO EN LÍNEA (ABIERTO)'}
                  </span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
                <button
                  type="button"
                  onClick={() => {
                    toggleMaintenanceMode(!siteSettings.maintenanceMode);
                    showToast(siteSettings.maintenanceMode ? 'Sitio reabierto al público' : 'Sitio cerrado');
                  }}
                  className={`px-5 py-3 rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer ${
                    siteSettings.maintenanceMode
                      ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                      : 'bg-rose-600 hover:bg-rose-500 text-white'
                  }`}
                >
                  <Power className="w-4 h-4" />
                  <span>{siteSettings.maintenanceMode ? 'ABRIR SITIO AHORA (EN LÍNEA)' : 'ACTIVAR CIERRE GLOBAL (KILL SWITCH)'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Activity Bar Chart Visualization */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Actividad Reciente del Sistema</h3>
                <p className="text-xs text-slate-500">Peticiones, inicios de sesión y registros durante los últimos 7 días</p>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700">
                Últimos 7 días
              </span>
            </div>

            {/* Visual Bar Chart */}
            <div className="grid grid-cols-7 gap-2 sm:gap-4 pt-4 items-end h-44 border-b border-slate-100 pb-2">
              {[
                { day: 'Lun', height: '45%', requests: '1,240', visits: '410' },
                { day: 'Mar', height: '60%', requests: '1,890', visits: '620' },
                { day: 'Mié', height: '80%', requests: '2,450', visits: '810' },
                { day: 'Jue', height: '70%', requests: '2,100', visits: '730' },
                { day: 'Vie', height: '95%', requests: '3,150', visits: '1,050' },
                { day: 'Sáb', height: '50%', requests: '1,420', visits: '490' },
                { day: 'Dom (Hoy)', height: '75%', requests: '2,240', visits: '780' },
              ].map((bar, i) => (
                <div key={bar.day} className="flex flex-col items-center gap-2 h-full justify-end group relative">
                  {/* Tooltip */}
                  <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 text-white text-[10px] rounded-md px-2 py-1 pointer-events-none whitespace-nowrap z-10">
                    {bar.requests} reqs &bull; {bar.visits} visitas
                  </div>
                  <div 
                    className="w-full max-w-[40px] rounded-t-lg bg-indigo-600 group-hover:bg-indigo-500 transition-all shadow-xs"
                    style={{ height: bar.height }}
                  />
                  <span className="text-[11px] font-medium text-slate-500 text-center truncate">
                    {bar.day}
                  </span>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-indigo-600"></span> Tráfico de peticiones
              </span>
              <span>Total semanal: <strong>14,490 peticiones</strong></span>
            </div>
          </div>
        </div>
      )}

      {/* TAB B: GESTIÓN AVANZADA DE USUARIOS */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          {/* Controls Bar */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            <div className="flex flex-1 items-center gap-2">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchUserQuery}
                  onChange={(e) => setSearchUserQuery(e.target.value)}
                  placeholder="Buscar usuario por nombre, email o @alias..."
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              {/* Role filter */}
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 focus:outline-none"
              >
                <option value="all">Todos los Roles</option>
                <option value="SuperAdmin">SuperAdmin</option>
                <option value="Moderador">Moderador</option>
                <option value="Creador Digital">Creador Digital</option>
                <option value="Usuario">Usuario</option>
              </select>

              {/* Status filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 focus:outline-none"
              >
                <option value="all">Todos los Estados</option>
                <option value="activo">Activo</option>
                <option value="suspendido">Suspendido</option>
                <option value="baneado">Baneado</option>
              </select>
            </div>

            <button
              type="button"
              onClick={() => setIsAddUserModalOpen(true)}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Registrar Usuario</span>
            </button>
          </div>

          {/* Interactive Users Table */}
          <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-xs">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Usuario</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">Rol</th>
                  <th className="py-3 px-4">Registro</th>
                  <th className="py-3 px-4">Estado</th>
                  <th className="py-3 px-4 text-right">Acciones Rápidas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      No se encontraron usuarios con los filtros especificados.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((u) => {
                    const isProtectedAdmin = u.email === 'allnexuslzyt@gmail.com';
                    return (
                      <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                        {/* Avatar & Name */}
                        <td className="py-3 px-4 flex items-center gap-2.5">
                          <img
                            src={u.avatarUrl}
                            alt={u.displayName}
                            className="w-8 h-8 rounded-full object-cover border border-slate-200 shrink-0"
                          />
                          <div>
                            <span className="font-bold text-slate-900 block truncate max-w-[150px]">
                              {u.displayName}
                            </span>
                            <span className="text-[11px] text-slate-400 block">@{u.username}</span>
                          </div>
                        </td>

                        {/* Email */}
                        <td className="py-3 px-4 font-mono text-slate-700 truncate max-w-[180px]">
                          {u.email}
                        </td>

                        {/* Role */}
                        <td className="py-3 px-4">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-semibold text-[11px] ${
                            u.role === 'SuperAdmin'
                              ? 'bg-purple-50 text-purple-700 border border-purple-200'
                              : u.role === 'Moderador'
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : u.role === 'Creador Digital'
                              ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                              : 'bg-slate-100 text-slate-700'
                          }`}>
                            {u.role}
                          </span>
                        </td>

                        {/* Date */}
                        <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                          {new Date(u.createdAt).toLocaleDateString()}
                        </td>

                        {/* Status Badge */}
                        <td className="py-3 px-4">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-bold text-[10px] uppercase ${
                            u.status === 'activo'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : u.status === 'suspendido'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${
                              u.status === 'activo' ? 'bg-emerald-500' : u.status === 'suspendido' ? 'bg-amber-500' : 'bg-rose-500'
                            }`} />
                            {u.status}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-4 text-right space-x-1 whitespace-nowrap">
                          {/* Editar Nombre Visible y Usuario */}
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedUserForEdit(u);
                              setEditDisplayName(u.displayName);
                              setEditUsername(u.username);
                              setEditUserError(null);
                            }}
                            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 hover:text-indigo-600 transition-colors cursor-pointer"
                            title="Editar Nombre Visible y Nombre de Usuario"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          {/* Cambiar Rol */}
                          <button
                            type="button"
                            onClick={() => setSelectedUserForRole(u)}
                            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
                            title="Cambiar Rol"
                          >
                            <Shield className="w-3.5 h-3.5" />
                          </button>

                          {/* Ban / Suspend */}
                          <button
                            type="button"
                            disabled={isProtectedAdmin}
                            onClick={() => {
                              setSelectedUserForBan(u);
                              setBanReasonInput(u.banReason || '');
                            }}
                            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                              isProtectedAdmin 
                                ? 'opacity-30 cursor-not-allowed text-slate-400' 
                                : 'hover:bg-amber-50 text-amber-600 hover:text-amber-700'
                            }`}
                            title={isProtectedAdmin ? 'Administrador principal protegido' : 'Banear / Suspender'}
                          >
                            <UserX className="w-3.5 h-3.5" />
                          </button>

                          {/* Reset Password */}
                          <button
                            type="button"
                            onClick={async () => {
                              const res = await resetUserPassword(u.id);
                              showToast(res.message);
                            }}
                            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 hover:text-indigo-600 transition-colors cursor-pointer"
                            title="Restablecer Contraseña (Simulado)"
                          >
                            <KeyRound className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete Account */}
                          <button
                            type="button"
                            disabled={isProtectedAdmin}
                            onClick={() => setSelectedUserForDelete(u)}
                            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                              isProtectedAdmin 
                                ? 'opacity-30 cursor-not-allowed text-slate-400' 
                                : 'hover:bg-rose-50 text-rose-600 hover:text-rose-700'
                            }`}
                            title={isProtectedAdmin ? 'Administrador principal protegido' : 'Eliminar Cuenta Definitivamente'}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB: GESTIÓN DE TICKETS DE SOPORTE */}
      {activeTab === 'tickets' && (
        <div className="space-y-6">
          {/* Header & Metric Counters */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
              <span className="text-xs font-medium text-slate-500 block">Total Tickets</span>
              <span className="text-2xl font-bold text-slate-900 mt-1 block">{tickets.length}</span>
              <span className="text-[11px] text-slate-400 mt-1 block">Histórico en plataforma</span>
            </div>

            <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200/80 shadow-xs">
              <span className="text-xs font-semibold text-amber-700 block">Abiertos / Sin Reclamar</span>
              <span className="text-2xl font-bold text-amber-900 mt-1 block">
                {tickets.filter(t => t.status === 'abierto').length}
              </span>
              <span className="text-[11px] text-amber-600 mt-1 block">Esperando que un admin los reclame</span>
            </div>

            <div className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-200/80 shadow-xs">
              <span className="text-xs font-semibold text-indigo-700 block">En Proceso / Atendiendo</span>
              <span className="text-2xl font-bold text-indigo-900 mt-1 block">
                {tickets.filter(t => t.status === 'en_proceso').length}
              </span>
              <span className="text-[11px] text-indigo-600 mt-1 block">En conversación con el usuario</span>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200/80 shadow-xs">
              <span className="text-xs font-semibold text-emerald-700 block">Cerrados / Resueltos</span>
              <span className="text-2xl font-bold text-emerald-900 mt-1 block">
                {tickets.filter(t => t.status === 'cerrado').length}
              </span>
              <span className="text-[11px] text-emerald-600 mt-1 block">Casos finalizados</span>
            </div>
          </div>

          {/* Filter and Search Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
            <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl w-full sm:w-auto overflow-x-auto">
              {(['all', 'abierto', 'en_proceso', 'cerrado'] as const).map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setTicketStatusFilter(st)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                    ticketStatusFilter === st
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {st === 'all' && 'Todos los Tickets'}
                  {st === 'abierto' && 'Abiertos'}
                  {st === 'en_proceso' && 'En Proceso'}
                  {st === 'cerrado' && 'Cerrados'}
                </button>
              ))}
            </div>

            <div className="relative w-full sm:w-72">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar por motivo, email o usuario..."
                value={ticketSearch}
                onChange={(e) => setTicketSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Tickets List */}
          <div className="space-y-3">
            {filteredTickets.length === 0 ? (
              <div className="py-12 px-4 rounded-2xl bg-white border border-slate-200 text-center shadow-xs">
                <Headphones className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <h4 className="text-sm font-bold text-slate-700">No hay tickets de soporte</h4>
                <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                  {tickets.length === 0
                    ? 'No se ha abierto ningún ticket de soporte aún. Los usuarios pueden abrirlos desde el enlace del pie de página.'
                    : 'Ningún ticket coincide con los filtros aplicados.'}
                </p>
              </div>
            ) : (
              filteredTickets.map((t) => {
                const isUnclaimed = !t.claimedBy;
                return (
                  <div
                    key={t.id}
                    className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs hover:border-slate-300 transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
                  >
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-sm text-slate-900 truncate">
                          {t.subject}
                        </span>

                        {/* Ban Appeal Badge */}
                        {t.isBanAppeal && (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-1">
                            <ShieldAlert className="w-3 h-3 text-rose-600" />
                            <span>Reclamación de Baneo</span>
                          </span>
                        )}

                        {/* Priority Badge */}
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                          t.priority === 'urgente'
                            ? 'bg-rose-100 text-rose-700 border border-rose-200'
                            : t.priority === 'alta'
                            ? 'bg-amber-100 text-amber-700 border border-amber-200'
                            : t.priority === 'media'
                            ? 'bg-blue-100 text-blue-700 border border-blue-200'
                            : 'bg-slate-100 text-slate-600 border border-slate-200'
                        }`}>
                          {t.priority}
                        </span>

                        {/* Status Badge */}
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                          t.status === 'abierto'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : t.status === 'en_proceso'
                            ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                            : 'bg-slate-100 text-slate-600 border border-slate-200'
                        }`}>
                          {t.status === 'abierto' ? 'Esperando Reclamo' : t.status === 'en_proceso' ? 'En Proceso' : 'Cerrado'}
                        </span>
                      </div>

                      {/* Details row */}
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                        <span>
                          De: <strong className="text-slate-700 font-semibold">{t.userName}</strong> ({t.contactEmail})
                        </span>
                        <span>•</span>
                        <span>Creado: {new Date(t.createdAt).toLocaleString()}</span>
                        <span>•</span>
                        <span>
                          {t.claimedByName ? (
                            <span className="text-indigo-600 font-medium">Reclamado por: {t.claimedByName}</span>
                          ) : (
                            <span className="text-amber-600 font-medium">Sin reclamar</span>
                          )}
                        </span>
                        <span>•</span>
                        <span>{t.messages.length} mensaje(s)</span>
                      </div>

                      {/* Latest message preview */}
                      {t.messages.length > 0 && (
                        <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100 line-clamp-2">
                          <strong className="text-slate-800 font-semibold">
                            {t.messages[t.messages.length - 1].senderRole === 'staff' ? 'Soporte' : t.userName}:
                          </strong>{' '}
                          {t.messages[t.messages.length - 1].text}
                        </p>
                      )}
                    </div>

                    {/* Actions buttons */}
                    <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                      {isUnclaimed && t.status !== 'cerrado' && (
                        <button
                          type="button"
                          onClick={async () => {
                            try {
                              await claimTicket(t.id);
                              showToast('Ticket reclamado exitosamente. Abriendo chat...');
                              setActiveAdminChatTicketId(t.id);
                            } catch (e) {
                              showToast('Error al reclamar el ticket');
                            }
                          }}
                          className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition-colors cursor-pointer shadow-xs"
                        >
                          Reclamar Ticket
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => setActiveAdminChatTicketId(t.id)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-colors cursor-pointer shadow-xs"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>Abrir Chat</span>
                      </button>

                      {t.status !== 'cerrado' ? (
                        <button
                          type="button"
                          onClick={async () => {
                            await closeTicket(t.id);
                            showToast('Ticket marcado como cerrado');
                          }}
                          className="px-3 py-1.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-medium transition-colors cursor-pointer"
                        >
                          Cerrar Ticket
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={async () => {
                            await reopenTicket(t.id);
                            showToast('Ticket reabierto');
                          }}
                          className="px-3 py-1.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-medium transition-colors cursor-pointer"
                        >
                          Reabrir
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => setSelectedTicketForDelete(t)}
                        className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                        title="Eliminar Ticket Definitivamente"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* TAB C: MODERACIÓN Y GESTIÓN DE CONTENIDO */}
      {activeTab === 'moderation' && (
        <div className="space-y-6">
          {/* Subheader: Reports Queue */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-amber-500" />
                  <span>Cola de Moderación de Contenidos</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Comentarios, proyectos o mensajes marcados por la comunidad
                </p>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-amber-50 text-amber-700 border border-amber-200">
                {reports.filter(r => r.status === 'pending').length} pendientes
              </span>
            </div>

            <div className="space-y-3">
              {reports.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-400">
                  No hay contenidos pendientes de moderación en este momento.
                </div>
              ) : (
                reports.map((rep) => (
                  <div 
                    key={rep.id} 
                    className={`p-4 rounded-xl border transition-all ${
                      rep.status === 'pending'
                        ? 'bg-slate-50/60 border-slate-200'
                        : 'bg-slate-50/20 border-slate-200 opacity-60'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div className="space-y-1.5 max-w-2xl">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-200 text-slate-800">
                            {rep.contentType}
                          </span>
                          <span className="text-xs font-semibold text-slate-900">
                            Autor: {rep.authorName}
                          </span>
                          <span className="text-[11px] text-slate-400">&bull; {rep.reportedAt}</span>
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                            rep.status === 'pending' ? 'bg-amber-100 text-amber-800' :
                            rep.status === 'approved' ? 'bg-emerald-100 text-emerald-800' :
                            rep.status === 'removed' ? 'bg-rose-100 text-rose-800' : 'bg-purple-100 text-purple-800'
                          }`}>
                            {rep.status.toUpperCase()}
                          </span>
                        </div>

                        <div className="p-2.5 rounded-lg bg-white border border-slate-200 text-xs text-slate-700 italic">
                          "{rep.contentSnippet}"
                        </div>

                        <p className="text-xs text-rose-600 font-medium">
                          <strong>Motivo del reporte:</strong> {rep.reasonText} (Por: {rep.reporterName})
                        </p>
                      </div>

                      {/* Quick Action Buttons */}
                      {rep.status === 'pending' && (
                        <div className="flex sm:flex-col items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => {
                              approveReport(rep.id);
                              showToast('Contenido aprobado y verificado');
                            }}
                            className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold cursor-pointer"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Aprobar</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              removeReportedContent(rep.id);
                              showToast('Contenido eliminado');
                            }}
                            className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Eliminar</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              sanctionUserFromReport(rep.id, 'suspend_24h');
                              showToast(`Usuario ${rep.authorName} sancionado`);
                            }}
                            className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold cursor-pointer"
                          >
                            <UserX className="w-3.5 h-3.5" />
                            <span>Sancionar</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Section: Help Center Real-Time CMS */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-indigo-600" />
                  <span>Gestor de Artículos y Preguntas Frecuentes (FAQs)</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Edita, agrega o elimina información del Centro de Ayuda en tiempo real
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsNewFaqModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Nueva Pregunta</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {dynamicFaqs.map((faq) => (
                <div key={faq.id} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase font-bold text-indigo-600">
                      {faq.categoryId}
                    </span>
                    <h4 className="text-xs font-bold text-slate-900">{faq.question}</h4>
                    <p className="text-xs text-slate-500 line-clamp-2">{faq.summary}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      deleteFaq(faq.id);
                      showToast('Pregunta frecuente eliminada');
                    }}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                    title="Eliminar pregunta"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB D: AJUSTES GLOBALES DEL SITIO (CONTROLES DE MANDO) */}
      {activeTab === 'settings' && (
        <div className="space-y-6">
          {/* Sub-block 1: Kill Switch Config */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Power className="w-4 h-4 text-rose-600" />
                  <span>Control Maestro del Modo Mantenimiento</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Configura el mensaje que verán los usuarios al cerrar el sitio
                </p>
              </div>
              <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                siteSettings.maintenanceMode ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'
              }`}>
                {siteSettings.maintenanceMode ? 'ACTIVADO' : 'DESACTIVADO'}
              </span>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Tiempo estimado de reapertura:
                  </label>
                  <input
                    type="text"
                    value={maintenanceInputEstimatedTime}
                    onChange={(e) => setMaintenanceInputEstimatedTime(e.target.value)}
                    placeholder="ej. Aproximadamente 30 minutos, 1 hora, 15:00 UTC..."
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-indigo-500"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Se mostrará en el cuadro informativo de la pantalla de bloqueo.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Motivo de cierre:
                  </label>
                  <input
                    type="text"
                    value={maintenanceInputReason}
                    onChange={(e) => setMaintenanceInputReason(e.target.value)}
                    placeholder="ej. Actualización crítica del sistema, Migración de servidores..."
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-indigo-500"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Indica el motivo técnico o administrativo de la desconexión temporal.
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Mensaje personalizado para la pantalla de cierre:
                </label>
                <textarea
                  rows={2}
                  value={maintenanceInputMessage}
                  onChange={(e) => setMaintenanceInputMessage(e.target.value)}
                  placeholder="Escribe el mensaje explicativo para los usuarios..."
                  className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    updateSiteSettings({ 
                      maintenanceMessage: maintenanceInputMessage,
                      maintenanceEstimatedReturn: maintenanceInputEstimatedTime,
                      estimatedTime: maintenanceInputEstimatedTime,
                      maintenanceReason: maintenanceInputReason
                    });
                    showToast('Ajustes de mantenimiento guardados y sincronizados');
                  }}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold cursor-pointer shadow-xs transition-colors"
                >
                  Guardar Ajustes de Mantenimiento
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const newState = !siteSettings.maintenanceMode;
                    toggleMaintenanceMode(
                      newState, 
                      maintenanceInputMessage, 
                      maintenanceInputEstimatedTime, 
                      maintenanceInputReason
                    );
                    showToast(newState ? 'Sitio cerrado al público (Modo Mantenimiento)' : 'Sitio reabierto al público');
                  }}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5 ${
                    siteSettings.maintenanceMode
                      ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                      : 'bg-rose-600 hover:bg-rose-500 text-white'
                  }`}
                >
                  <Power className="w-3.5 h-3.5" />
                  <span>{siteSettings.maintenanceMode ? 'REABRIR SITIO AHORA' : 'ACTIVAR CIERRE DE SITIO'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Sub-block 2: Creador de Banner Global */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Bell className="w-4 h-4 text-indigo-600" />
                  <span>Creador de Aviso / Banner Global</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Publica un comunicado o alerta urgente en la parte superior de toda la web
                </p>
              </div>

              {/* Toggle switch */}
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={bannerEnabled}
                  onChange={(e) => setBannerEnabled(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-10 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                <span className="ml-2 text-xs font-semibold text-slate-700">
                  {bannerEnabled ? 'Activo' : 'Inactivo'}
                </span>
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tipo de Alerta:
                </label>
                <select
                  value={bannerType}
                  onChange={(e) => setBannerType(e.target.value as BannerType)}
                  className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none"
                >
                  <option value="info">Informativo (Azul Índigo)</option>
                  <option value="warning">Advertencia (Ámbar)</option>
                  <option value="critical">Crítico / Urgente (Rojo)</option>
                  <option value="success">Éxito (Verde)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Texto del Botón (Opcional):
                </label>
                <input
                  type="text"
                  value={bannerActionText}
                  onChange={(e) => setBannerActionText(e.target.value)}
                  placeholder="ej. Saber más, Ver detalles..."
                  className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Mensaje del Banner:
                </label>
                <input
                  type="text"
                  value={bannerMessage}
                  onChange={(e) => setBannerMessage(e.target.value)}
                  placeholder="Escribe el texto de aviso global que se mostrará arriba..."
                  className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none"
                />
              </div>
            </div>

            {/* Live Preview */}
            <div className="p-3 rounded-xl bg-slate-100 border border-slate-200 text-xs">
              <span className="font-semibold text-slate-600 block mb-1.5">Vista previa en directo:</span>
              <div className={`p-2.5 rounded-lg font-medium text-xs flex items-center justify-between ${
                bannerType === 'warning' ? 'bg-amber-500 text-slate-950' :
                bannerType === 'critical' ? 'bg-rose-600 text-white' :
                bannerType === 'success' ? 'bg-emerald-600 text-white' : 'bg-indigo-600 text-white'
              }`}>
                <span>{bannerMessage || 'Texto de ejemplo para el banner global'}</span>
                {bannerActionText && (
                  <span className="px-2 py-0.5 rounded bg-black/15 text-[11px] font-bold">
                    {bannerActionText}
                  </span>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                updateGlobalBanner({
                  enabled: bannerEnabled,
                  type: bannerType,
                  message: bannerMessage,
                  actionText: bannerActionText,
                  actionLink: bannerActionLink
                });
                showToast(bannerEnabled ? 'Banner global publicado con éxito' : 'Banner global desactivado');
              }}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
            >
              Aplicar y Publicar Banner
            </button>
          </div>

          {/* Sub-block 3: Registro de Auditoría / Logs de Seguridad */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-slate-700" />
                  <span>Registro de Auditoría y Logs de Seguridad</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Historial inmutable de las últimas acciones administrativas efectuadas en el sistema
                </p>
              </div>
              <span className="text-xs font-semibold px-2 py-1 rounded-lg bg-slate-100 text-slate-700">
                {auditLogs.length} eventos registrados
              </span>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">Fecha / Hora</th>
                    <th className="py-2.5 px-3">Administrador</th>
                    <th className="py-2.5 px-3">Acción</th>
                    <th className="py-2.5 px-3">Objetivo / Afectado</th>
                    <th className="py-2.5 px-3">Detalles</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-2.5 px-3 font-mono text-slate-500 whitespace-nowrap">
                        {log.timestamp}
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-slate-900">
                        {log.adminName}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          log.category === 'mantenimiento' ? 'bg-rose-100 text-rose-800' :
                          log.category === 'usuarios' ? 'bg-purple-100 text-purple-800' :
                          log.category === 'moderacion' ? 'bg-amber-100 text-amber-800' :
                          'bg-indigo-100 text-indigo-800'
                        }`}>
                          {log.action}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-medium text-slate-800">
                        {log.target}
                      </td>
                      <td className="py-2.5 px-3 text-slate-500 text-[11px] truncate max-w-xs">
                        {log.details || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB E: MODO EN LANZAMIENTO (LAUNCH MODE) */}
      {activeTab === 'launch' && (
        <div className="space-y-6">
          {/* Main Activation Card */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <Rocket className="w-5 h-5 text-indigo-600" />
                  <span>Modo En Lanzamiento (Pantalla de Estreno Bloqueada)</span>
                </h3>
                <p className="text-xs text-slate-500 mt-1 max-w-xl">
                  Activa este modo exclusivamente cuando vayas a lanzar la web. Los usuarios verán una pantalla de lanzamiento con una cuenta atrás sincronizada en tiempo real.
                </p>
              </div>

              {/* Master Toggle */}
              <div className="flex items-center gap-3">
                <span className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 ${
                  siteSettings.launchMode?.enabled 
                    ? 'bg-amber-100 text-amber-800 border border-amber-300' 
                    : 'bg-slate-100 text-slate-600 border border-slate-200'
                }`}>
                  <span className={`h-2 w-2 rounded-full ${siteSettings.launchMode?.enabled ? 'bg-amber-500 animate-ping' : 'bg-slate-400'}`} />
                  {siteSettings.launchMode?.enabled ? 'MODO LANZAMIENTO ACTIVO' : 'MODO LANZAMIENTO INACTIVO'}
                </span>

                <button
                  type="button"
                  id="btn-toggle-launch-mode"
                  onClick={async () => {
                    const newState = !siteSettings.launchMode?.enabled;
                    await toggleLaunchMode(newState);
                    showToast(newState ? '🚀 Modo En Lanzamiento ACTIVADO' : 'Modo En Lanzamiento DESACTIVADO');
                  }}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-2 cursor-pointer ${
                    siteSettings.launchMode?.enabled
                      ? 'bg-rose-600 hover:bg-rose-500 text-white'
                      : 'bg-gradient-to-r from-amber-500 via-indigo-600 to-indigo-700 hover:from-amber-600 hover:to-indigo-800 text-white shadow-indigo-600/20'
                  }`}
                >
                  <Rocket className="w-4 h-4" />
                  <span>{siteSettings.launchMode?.enabled ? 'DESACTIVAR LANZAMIENTO' : 'ACTIVAR MODO LANZAMIENTO'}</span>
                </button>
              </div>
            </div>

            {/* Quick Live Status Card with Live Ticking Countdown */}
            <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white border border-indigo-900/60 shadow-xl flex flex-col lg:flex-row items-center justify-between gap-6">
              <div className="space-y-2 text-center lg:text-left">
                <div className="flex items-center justify-center lg:justify-start gap-2">
                  <Timer className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                    Cuenta Atrás Sincronizada en Tiempo Real
                  </span>
                  {siteSettings.launchMode?.isPaused ? (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      PAUSADA
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      CONTANDO EN VIVO
                    </span>
                  )}
                </div>
                <h4 className="text-lg font-bold text-white">
                  {siteSettings.launchMode?.title || 'Gran Lanzamiento de NexStudio'}
                </h4>
                <p className="text-xs text-slate-300">
                  Fecha Objetivo Global: <strong>{siteSettings.launchMode?.targetDate ? new Date(siteSettings.launchMode.targetDate).toLocaleString() : 'No fijada'}</strong>
                </p>

                {/* Live Real-time Clock (Days, Hours, Minutes, Seconds) */}
                <div className="flex items-center justify-center lg:justify-start gap-2 pt-1 font-mono text-center">
                  <div className="px-3 py-1.5 rounded-xl bg-slate-950/80 border border-slate-800 shadow-inner flex flex-col items-center min-w-[55px]">
                    <span className="text-xl font-extrabold text-white">
                      {String(Math.floor(adminLiveRemaining / 86400)).padStart(2, '0')}
                    </span>
                    <span className="text-[9px] uppercase font-bold text-slate-400">Días</span>
                  </div>
                  <span className="text-slate-500 font-bold">:</span>
                  <div className="px-3 py-1.5 rounded-xl bg-slate-950/80 border border-slate-800 shadow-inner flex flex-col items-center min-w-[55px]">
                    <span className="text-xl font-extrabold text-white">
                      {String(Math.floor((adminLiveRemaining % 86400) / 3600)).padStart(2, '0')}
                    </span>
                    <span className="text-[9px] uppercase font-bold text-slate-400">Horas</span>
                  </div>
                  <span className="text-slate-500 font-bold">:</span>
                  <div className="px-3 py-1.5 rounded-xl bg-slate-950/80 border border-slate-800 shadow-inner flex flex-col items-center min-w-[55px]">
                    <span className="text-xl font-extrabold text-indigo-300">
                      {String(Math.floor((adminLiveRemaining % 3600) / 60)).padStart(2, '0')}
                    </span>
                    <span className="text-[9px] uppercase font-bold text-indigo-400">Min</span>
                  </div>
                  <span className="text-slate-500 font-bold">:</span>
                  <div className="px-3 py-1.5 rounded-xl bg-slate-950/80 border border-slate-800 shadow-inner flex flex-col items-center min-w-[55px]">
                    <span className="text-xl font-extrabold text-amber-400">
                      {String(adminLiveRemaining % 60).padStart(2, '0')}
                    </span>
                    <span className="text-[9px] uppercase font-bold text-amber-400">Seg</span>
                  </div>
                </div>
              </div>

              {/* Countdown Actions: Pause / Resume & Live Preview */}
              <div className="flex flex-wrap items-center justify-center gap-2.5">
                <button
                  type="button"
                  id="btn-pause-resume-countdown"
                  onClick={async () => {
                    const isCurrentlyPaused = Boolean(siteSettings.launchMode?.isPaused);
                    const currentInputSeconds = (launchDays * 86400) + (launchHours * 3600) + (launchMinutes * 60) + launchSeconds;
                    await pauseResumeCountdown(isCurrentlyPaused && currentInputSeconds > 0 ? currentInputSeconds : undefined);
                    showToast(isCurrentlyPaused ? '▶️ Cuenta atrás REANUDADA' : '⏸️ Cuenta atrás PAUSADA');
                  }}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-2 cursor-pointer ${
                    siteSettings.launchMode?.isPaused
                      ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                      : 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                  }`}
                >
                  {siteSettings.launchMode?.isPaused ? (
                    <>
                      <PlayCircle className="w-4 h-4" />
                      <span>REANUDAR CUENTA ATRÁS</span>
                    </>
                  ) : (
                    <>
                      <PauseCircle className="w-4 h-4" />
                      <span>DETENER / PAUSAR CUENTA</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  id="btn-reset-countdown"
                  onClick={() => setShowResetCountdownConfirm(true)}
                  disabled={isResettingCountdown}
                  className="px-3.5 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 hover:text-rose-200 border border-rose-500/30 text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  title="Restablecer completamente toda la cuenta atrás a sus valores originales (24 horas)"
                >
                  <RotateCcw className={`w-4 h-4 text-rose-400 ${isResettingCountdown ? 'animate-spin' : ''}`} />
                  <span>RESTABLECER CUENTA ATRÁS</span>
                </button>

                <button
                  type="button"
                  id="btn-preview-launch-screen"
                  onClick={() => setPreviewLaunchModalOpen(true)}
                  className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer border border-slate-700"
                >
                  <Eye className="w-4 h-4 text-indigo-400" />
                  <span>Previsualizar Pantalla</span>
                </button>
              </div>
            </div>

            {/* Configuration Form */}
            <div className="space-y-5 pt-2">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Personalización Completa del Tiempo de Cuenta Atrás
                </h4>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Puedes escribir o cambiar libremente cualquier cantidad de días, horas, minutos y segundos. La cuenta atrás estará sincronizada a la perfección en todos los ordenadores y teléfonos del mundo.
                </p>
              </div>

              {/* 100% Fully Customizable Time Inputs (Días, Horas, Minutos, Segundos) */}
              <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200/90 shadow-2xs space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                  {/* DÍAS */}
                  <div className="p-3.5 rounded-xl bg-white border border-slate-200/80 shadow-xs flex flex-col">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center justify-between">
                      <span>Días</span>
                      <span className="text-[10px] font-normal text-slate-400 lowercase">enteros</span>
                    </label>
                    <div className="flex items-center gap-1.5 mt-1">
                      <button
                        type="button"
                        onClick={() => handleDurationChange(Math.max(0, launchDays - 1), launchHours, launchMinutes, launchSeconds)}
                        className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold flex items-center justify-center transition-colors cursor-pointer text-sm"
                        title="Restar 1 día"
                      >
                        -
                      </button>
                      <input
                        type="number"
                        min="0"
                        value={launchDays}
                        onChange={(e) => handleDurationChange(parseInt(e.target.value) || 0, launchHours, launchMinutes, launchSeconds)}
                        className="w-full text-center py-1.5 px-1 rounded-lg bg-slate-50 border border-slate-300 text-sm sm:text-base font-mono font-bold text-slate-900 focus:outline-none focus:border-indigo-500"
                        placeholder="0"
                      />
                      <button
                        type="button"
                        onClick={() => handleDurationChange(launchDays + 1, launchHours, launchMinutes, launchSeconds)}
                        className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold flex items-center justify-center transition-colors cursor-pointer text-sm"
                        title="Sumar 1 día"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* HORAS */}
                  <div className="p-3.5 rounded-xl bg-white border border-slate-200/80 shadow-xs flex flex-col">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center justify-between">
                      <span>Horas</span>
                      <span className="text-[10px] font-normal text-slate-400">0 - 23</span>
                    </label>
                    <div className="flex items-center gap-1.5 mt-1">
                      <button
                        type="button"
                        onClick={() => handleDurationChange(launchDays, Math.max(0, launchHours - 1), launchMinutes, launchSeconds)}
                        className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold flex items-center justify-center transition-colors cursor-pointer text-sm"
                        title="Restar 1 hora"
                      >
                        -
                      </button>
                      <input
                        type="number"
                        min="0"
                        max="23"
                        value={launchHours}
                        onChange={(e) => handleDurationChange(launchDays, parseInt(e.target.value) || 0, launchMinutes, launchSeconds)}
                        className="w-full text-center py-1.5 px-1 rounded-lg bg-slate-50 border border-slate-300 text-sm sm:text-base font-mono font-bold text-slate-900 focus:outline-none focus:border-indigo-500"
                        placeholder="0"
                      />
                      <button
                        type="button"
                        onClick={() => handleDurationChange(launchDays, Math.min(23, launchHours + 1), launchMinutes, launchSeconds)}
                        className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold flex items-center justify-center transition-colors cursor-pointer text-sm"
                        title="Sumar 1 hora"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* MINUTOS */}
                  <div className="p-3.5 rounded-xl bg-white border border-slate-200/80 shadow-xs flex flex-col">
                    <label className="text-xs font-bold text-indigo-700 uppercase tracking-wider mb-1 flex items-center justify-between">
                      <span>Minutos</span>
                      <span className="text-[10px] font-normal text-indigo-400">0 - 59</span>
                    </label>
                    <div className="flex items-center gap-1.5 mt-1">
                      <button
                        type="button"
                        onClick={() => handleDurationChange(launchDays, launchHours, Math.max(0, launchMinutes - 1), launchSeconds)}
                        className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold flex items-center justify-center transition-colors cursor-pointer text-sm"
                        title="Restar 1 minuto"
                      >
                        -
                      </button>
                      <input
                        type="number"
                        min="0"
                        max="59"
                        value={launchMinutes}
                        onChange={(e) => handleDurationChange(launchDays, launchHours, parseInt(e.target.value) || 0, launchSeconds)}
                        className="w-full text-center py-1.5 px-1 rounded-lg bg-indigo-50/50 border border-indigo-200 text-sm sm:text-base font-mono font-bold text-indigo-950 focus:outline-none focus:border-indigo-500"
                        placeholder="0"
                      />
                      <button
                        type="button"
                        onClick={() => handleDurationChange(launchDays, launchHours, Math.min(59, launchMinutes + 1), launchSeconds)}
                        className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold flex items-center justify-center transition-colors cursor-pointer text-sm"
                        title="Sumar 1 minuto"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* SEGUNDOS */}
                  <div className="p-3.5 rounded-xl bg-white border border-slate-200/80 shadow-xs flex flex-col">
                    <label className="text-xs font-bold text-amber-700 uppercase tracking-wider mb-1 flex items-center justify-between">
                      <span>Segundos</span>
                      <span className="text-[10px] font-normal text-amber-500">0 - 59</span>
                    </label>
                    <div className="flex items-center gap-1.5 mt-1">
                      <button
                        type="button"
                        onClick={() => handleDurationChange(launchDays, launchHours, launchMinutes, Math.max(0, launchSeconds - 1))}
                        className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold flex items-center justify-center transition-colors cursor-pointer text-sm"
                        title="Restar 1 segundo"
                      >
                        -
                      </button>
                      <input
                        type="number"
                        min="0"
                        max="59"
                        value={launchSeconds}
                        onChange={(e) => handleDurationChange(launchDays, launchHours, launchMinutes, parseInt(e.target.value) || 0)}
                        className="w-full text-center py-1.5 px-1 rounded-lg bg-amber-50/50 border border-amber-200 text-sm sm:text-base font-mono font-bold text-amber-950 focus:outline-none focus:border-amber-500"
                        placeholder="0"
                      />
                      <button
                        type="button"
                        onClick={() => handleDurationChange(launchDays, launchHours, launchMinutes, Math.min(59, launchSeconds + 1))}
                        className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold flex items-center justify-center transition-colors cursor-pointer text-sm"
                        title="Sumar 1 segundo"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>

                {/* Sincronización bidireccional con Selector de Fecha y Hora Exacta */}
                <div className="pt-2 border-t border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-0.5">
                      O selecciona directamente la Fecha y Hora exacta en el calendario:
                    </label>
                    <p className="text-[11px] text-slate-500">
                      Cualquier fecha que selecciones actualizará automáticamente los días, horas, minutos y segundos de arriba.
                    </p>
                  </div>
                  <input
                    type="datetime-local"
                    value={launchTargetInput}
                    onChange={(e) => handleDatetimeChange(e.target.value)}
                    className="px-3.5 py-2 rounded-xl bg-white border border-slate-300 text-xs text-slate-900 font-mono font-medium focus:outline-none focus:border-indigo-500 shadow-2xs"
                  />
                </div>

                {/* Resumen Informativo de Sincronización en Directo */}
                <div className="p-3 rounded-xl bg-indigo-50/80 border border-indigo-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2 text-indigo-900">
                    <Clock className="w-4 h-4 text-indigo-600 shrink-0" />
                    <span>
                      Duración personalizada: <strong>{launchDays} días, {launchHours} horas, {launchMinutes} minutos y {launchSeconds} segundos</strong>
                    </span>
                  </div>
                  <div className="text-[11px] font-medium text-indigo-700 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse inline-block" />
                    <span>Sincronizado a través de Firestore</span>
                  </div>
                </div>

                {/* Atajos Rápidos y Restablecimiento */}
                <div className="flex flex-wrap items-center justify-between gap-2.5 pt-3 border-t border-slate-200/80">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mr-1">Atajos rápidos:</span>
                    <button
                      type="button"
                      onClick={() => handleDurationChange(1, 0, 0, 0)}
                      className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold transition-colors cursor-pointer shadow-2xs"
                    >
                      24 Horas (1 Día)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDurationChange(3, 0, 0, 0)}
                      className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold transition-colors cursor-pointer shadow-2xs"
                    >
                      3 Días
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDurationChange(7, 0, 0, 0)}
                      className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold transition-colors cursor-pointer shadow-2xs"
                    >
                      7 Días
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDurationChange(0, 1, 0, 0)}
                      className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold transition-colors cursor-pointer shadow-2xs"
                    >
                      1 Hora
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowResetCountdownConfirm(true)}
                    className="px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer ml-auto shadow-2xs"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-rose-600" />
                    <span>Restablecer Toda la Cuenta</span>
                  </button>
                </div>
              </div>

              {/* Text Customization */}
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 pt-2">
                Personalización de Textos de la Pantalla
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Título Principal de Lanzamiento:
                  </label>
                  <input
                    type="text"
                    value={launchTitle}
                    onChange={(e) => setLaunchTitle(e.target.value)}
                    placeholder="ej. ¡El Gran Lanzamiento de NexStudio está cerca!"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Texto del Distintivo / Badge:
                  </label>
                  <input
                    type="text"
                    value={launchBadgeText}
                    onChange={(e) => setLaunchBadgeText(e.target.value)}
                    placeholder="ej. Gran Estreno Oficial 1.0"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Descripción o Mensaje Informativo:
                </label>
                <textarea
                  rows={3}
                  value={launchSubtitle}
                  onChange={(e) => setLaunchSubtitle(e.target.value)}
                  placeholder="Escribe el mensaje motivador o explicativo que verán los visitantes mientras esperan..."
                  className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-indigo-500 leading-relaxed"
                />
              </div>

              {/* Advanced Options */}
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 pt-2">
                Comportamiento de Acceso
              </h4>

              <div className="space-y-3 p-4 rounded-xl bg-slate-50 border border-slate-200/80">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={launchAutoUnlock}
                    onChange={(e) => setLaunchAutoUnlock(e.target.checked)}
                    className="w-4 h-4 mt-0.5 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
                  />
                  <div>
                    <span className="text-xs font-bold text-slate-800 block">
                      Desbloquear automáticamente al finalizar la cuenta atrás (Llegar a 0)
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Cuando el cronómetro llegue a 0, la web se abrirá automáticamente para todos los visitantes sin necesidad de que intervengas manualmente.
                    </span>
                  </div>
                </label>

                <label className="flex items-start gap-3 cursor-pointer border-t border-slate-200/60 pt-3">
                  <input
                    type="checkbox"
                    checked={launchAdminBypass}
                    onChange={(e) => setLaunchAdminBypass(e.target.checked)}
                    className="w-4 h-4 mt-0.5 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
                  />
                  <div>
                    <span className="text-xs font-bold text-slate-800 block">
                      Permitir a los administradores navegar por la web normalmente durante el lanzamiento
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Te permite comprobar proyectos, funciones y la web antes de la apertura oficial mientras los visitantes ven la pantalla de lanzamiento.
                    </span>
                  </div>
                </label>
              </div>

              {/* Save & Apply Button */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  id="btn-save-launch-config"
                  disabled={isSavingLaunch}
                  onClick={async () => {
                    setIsSavingLaunch(true);
                    try {
                      const totalSeconds = (launchDays * 86400) + (launchHours * 3600) + (launchMinutes * 60) + launchSeconds;
                      const targetTimestampMs = Date.now() + (totalSeconds * 1000);
                      const isoDate = new Date(targetTimestampMs).toISOString();

                      await updateLaunchMode({
                        title: launchTitle.trim() || '¡El Gran Lanzamiento de NexStudio está cerca!',
                        subtitle: launchSubtitle.trim() || 'Estamos preparando todos los proyectos, herramientas y la comunidad. ¡Muy pronto abriremos las puertas para todos!',
                        badgeText: launchBadgeText.trim() || 'Gran Estreno Oficial 1.0',
                        targetDate: isoDate,
                        targetTimestampMs,
                        durationSeconds: totalSeconds,
                        pausedRemainingSeconds: siteSettings.launchMode?.isPaused ? totalSeconds : 0,
                        autoUnlockOnFinish: launchAutoUnlock,
                        allowAdminBypass: launchAdminBypass
                      });
                      showToast('⏱️ Cuenta atrás y configuración guardadas y sincronizadas globalmente');
                    } catch (e) {
                      showToast('Error al guardar la configuración');
                    } finally {
                      setIsSavingLaunch(false);
                    }
                  }}
                  className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-md shadow-indigo-600/20 cursor-pointer disabled:opacity-50 flex items-center gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{isSavingLaunch ? 'Sincronizando...' : 'Guardar y Sincronizar Cambios'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB PROYECTOS: GESTIÓN DE PROYECTOS, ENLACES, VISIBILIDAD Y RESTRICCIONES */}
      {activeTab === 'projects' && (
        <AdminProjectsManager onShowToast={showToast} />
      )}

      {/* MODAL 1: Cambiar Rol */}
      <AnimatePresence>
        {selectedUserForRole && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md bg-white rounded-2xl p-6 shadow-2xl border border-slate-200 space-y-4"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-indigo-600" />
                  <span>Cambiar Rol de Usuario</span>
                </h3>
                <button
                  type="button"
                  onClick={() => setSelectedUserForRole(null)}
                  className="text-slate-400 hover:text-slate-600 text-xs"
                >
                  Cerrar
                </button>
              </div>

              <p className="text-xs text-slate-600">
                Selecciona el nuevo nivel de acceso para <strong>{selectedUserForRole.displayName}</strong>:
              </p>

              <div className="space-y-2">
                {(['SuperAdmin', 'Moderador', 'Creador Digital', 'Usuario'] as UserRole[]).map((role) => (
                  <button
                    key={role}
                    type="button"
                    onClick={() => {
                      changeUserRole(selectedUserForRole.id, role);
                      showToast(`Rol actualizado a ${role}`);
                      setSelectedUserForRole(null);
                    }}
                    className={`w-full p-3 rounded-xl border text-left text-xs font-semibold flex items-center justify-between transition-all cursor-pointer ${
                      selectedUserForRole.role === role
                        ? 'bg-indigo-50 border-indigo-300 text-indigo-900'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span>{role}</span>
                    {selectedUserForRole.role === role && (
                      <CheckCircle2 className="w-4 h-4 text-indigo-600" />
                    )}
                  </button>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 2: Banear / Suspender */}
      <AnimatePresence>
        {selectedUserForBan && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md bg-white rounded-2xl p-6 shadow-2xl border border-slate-200 space-y-4"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-amber-700 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  <span>Suspender o Banear Usuario</span>
                </h3>
                <button
                  type="button"
                  onClick={() => setSelectedUserForBan(null)}
                  className="text-slate-400 hover:text-slate-600 text-xs"
                >
                  Cerrar
                </button>
              </div>

              <p className="text-xs text-slate-600">
                Aplicar restricción de acceso para <strong>{selectedUserForBan.displayName}</strong> ({selectedUserForBan.email}):
              </p>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Motivo de la sanción:
                </label>
                <input
                  type="text"
                  value={banReasonInput}
                  onChange={(e) => setBanReasonInput(e.target.value)}
                  placeholder="ej. Infracción de directrices, lenguaje ofensivo..."
                  className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Duración:
                </label>
                <select
                  value={banDurationInput}
                  onChange={(e) => setBanDurationInput(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none"
                >
                  <option value="24 horas">24 Horas</option>
                  <option value="7 días">7 Días</option>
                  <option value="30 días">30 Días</option>
                  <option value="Permanente">Permanente (Baneo)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    banOrSuspendUser(selectedUserForBan.id, 'activo', 'Sanción levantada');
                    showToast('Usuario reactivado con normalidad');
                    setSelectedUserForBan(null);
                  }}
                  className="px-3.5 py-2 rounded-xl border border-slate-200 text-xs text-slate-700 font-semibold hover:bg-slate-50 cursor-pointer"
                >
                  Reactivar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const status: UserStatus = banDurationInput === 'Permanente' ? 'baneado' : 'suspendido';
                    banOrSuspendUser(selectedUserForBan.id, status, banReasonInput || 'Incumplimiento de normas', banDurationInput);
                    showToast(`Sanción aplicada: ${status}`);
                    setSelectedUserForBan(null);
                  }}
                  className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold transition-colors cursor-pointer"
                >
                  Confirmar Sanción
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 3: Eliminar Cuenta (High-Risk Red Confirmation) */}
      <AnimatePresence>
        {selectedUserForDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md bg-white rounded-2xl p-6 shadow-2xl border-2 border-rose-500 space-y-4"
            >
              <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 mx-auto">
                <AlertTriangle className="w-6 h-6" />
              </div>

              <div className="text-center space-y-1">
                <h3 className="text-base font-extrabold text-slate-900">
                  ¿Eliminar cuenta definitivamente?
                </h3>
                <p className="text-xs text-slate-500">
                  Esta acción es destructiva e irreversible. Se eliminarán permanentemente el perfil y todos los datos asociados de:
                </p>
                <p className="text-xs font-bold text-rose-600 font-mono pt-1">
                  {selectedUserForDelete.displayName} ({selectedUserForDelete.email})
                </p>
              </div>

              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-[11px] text-rose-700 leading-relaxed">
                Advertencia: Se borrarán sus credenciales, proyectos, configuraciones y registros de actividad.
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedUserForDelete(null)}
                  className="w-1/2 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    deleteManagedUser(selectedUserForDelete.id);
                    showToast('Cuenta de usuario eliminada definitivamente');
                    setSelectedUserForDelete(null);
                  }}
                  className="w-1/2 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-colors shadow-xs cursor-pointer"
                >
                  Eliminar Cuenta
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 3.5: Eliminar Ticket de Soporte Definitivamente */}
      <AnimatePresence>
        {selectedTicketForDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md bg-white rounded-2xl p-6 shadow-2xl border-2 border-rose-500 space-y-4"
            >
              <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 mx-auto">
                <Trash2 className="w-6 h-6" />
              </div>

              <div className="text-center space-y-1">
                <h3 className="text-base font-extrabold text-slate-900">
                  ¿Eliminar ticket de soporte definitivamente?
                </h3>
                <p className="text-xs text-slate-500">
                  Esta acción es destructiva e irreversible. Se borrará el ticket y todo su historial de mensajes de la base de datos.
                </p>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-left mt-2">
                  <p className="text-xs font-bold text-slate-800 line-clamp-1">
                    {selectedTicketForDelete.subject}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    ID: #{selectedTicketForDelete.id.slice(-8)} &bull; De: {selectedTicketForDelete.userName} ({selectedTicketForDelete.contactEmail})
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  disabled={isDeletingTicket}
                  onClick={() => setSelectedTicketForDelete(null)}
                  className="w-1/2 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 cursor-pointer disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  disabled={isDeletingTicket}
                  onClick={async () => {
                    try {
                      setIsDeletingTicket(true);
                      const id = selectedTicketForDelete.id;
                      if (activeAdminChatTicketId === id) {
                        setActiveAdminChatTicketId(null);
                      }
                      await deleteTicket(id);
                      showToast('Ticket eliminado exitosamente');
                      setSelectedTicketForDelete(null);
                    } catch (err: any) {
                      console.error('Error al eliminar ticket:', err);
                      showToast('Error al eliminar: ' + (err?.message || 'Error de base de datos'));
                    } finally {
                      setIsDeletingTicket(false);
                    }
                  }}
                  className="w-1/2 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-colors shadow-xs cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  {isDeletingTicket ? (
                    <>
                      <RotateCcw className="w-3.5 h-3.5 animate-spin" />
                      <span>Eliminando...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Eliminar Ticket</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 4: Agregar FAQ */}
      <AnimatePresence>
        {isNewFaqModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md bg-white rounded-2xl p-6 shadow-2xl border border-slate-200 space-y-4"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-indigo-600" />
                  <span>Añadir Pregunta Frecuente (FAQ)</span>
                </h3>
                <button
                  type="button"
                  onClick={() => setIsNewFaqModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 text-xs"
                >
                  Cerrar
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Pregunta:
                  </label>
                  <input
                    type="text"
                    value={newFaqQuestion}
                    onChange={(e) => setNewFaqQuestion(e.target.value)}
                    placeholder="¿Cómo puedo...?"
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Categoría:
                  </label>
                  <select
                    value={newFaqCategory}
                    onChange={(e) => setNewFaqCategory(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none"
                  >
                    <option value="primeros-pasos">Primeros pasos</option>
                    <option value="cuenta-perfil">Cuenta y Perfil</option>
                    <option value="problemas-frecuentes">Problemas frecuentes</option>
                    <option value="guias-tutoriales">Guías y Tutoriales</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Respuesta / Resumen:
                  </label>
                  <textarea
                    rows={3}
                    value={newFaqSummary}
                    onChange={(e) => setNewFaqSummary(e.target.value)}
                    placeholder="Explica la respuesta paso a paso..."
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsNewFaqModalOpen(false)}
                  className="px-3.5 py-2 rounded-xl border border-slate-200 text-xs text-slate-700 hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  disabled={!newFaqQuestion.trim() || !newFaqSummary.trim()}
                  onClick={() => {
                    addFaq({
                      categoryId: newFaqCategory,
                      question: newFaqQuestion,
                      summary: newFaqSummary
                    });
                    showToast('Nueva FAQ agregada al Centro de Ayuda');
                    setIsNewFaqModalOpen(false);
                    setNewFaqQuestion('');
                    setNewFaqSummary('');
                  }}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold disabled:opacity-50"
                >
                  Guardar FAQ
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 5: Registrar Usuario Manualmente */}
      <AnimatePresence>
        {isAddUserModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md bg-white rounded-2xl p-6 shadow-2xl border border-slate-200 space-y-4"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Users className="w-4 h-4 text-indigo-600" />
                  <span>Registrar Nuevo Usuario</span>
                </h3>
                <button
                  type="button"
                  onClick={() => setIsAddUserModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 text-xs"
                >
                  Cerrar
                </button>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const form = e.target as HTMLFormElement;
                  const displayName = (form.elements.namedItem('name') as HTMLInputElement).value;
                  const username = (form.elements.namedItem('username') as HTMLInputElement).value;
                  const email = (form.elements.namedItem('email') as HTMLInputElement).value;
                  const role = (form.elements.namedItem('role') as HTMLSelectElement).value as UserRole;

                  addManagedUser({
                    displayName,
                    username,
                    email,
                    role,
                    avatarUrl: `https://api.dicebear.com/7.x/identicon/svg?seed=${username || email}`
                  });

                  showToast(`Usuario ${displayName} registrado exitosamente`);
                  setIsAddUserModalOpen(false);
                }}
                className="space-y-3"
              >
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Nombre Completo:</label>
                  <input
                    required
                    name="name"
                    type="text"
                    placeholder="ej. Mateo Fernandez"
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Nombre de usuario (@alias):</label>
                  <input
                    required
                    name="username"
                    type="text"
                    placeholder="ej. mateo_dev"
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Email:</label>
                  <input
                    required
                    name="email"
                    type="email"
                    placeholder="ej. mateo@nexstudio.io"
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Rol Inicial:</label>
                  <select
                    name="role"
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none"
                  >
                    <option value="Creador Digital">Creador Digital</option>
                    <option value="Usuario">Usuario</option>
                    <option value="Moderador">Moderador</option>
                    <option value="Admin">Admin</option>
                  </select>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsAddUserModalOpen(false)}
                    className="px-3.5 py-2 rounded-xl border border-slate-200 text-xs text-slate-700 hover:bg-slate-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold"
                  >
                    Registrar
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {/* MODAL: EDITAR NOMBRE DE USUARIO Y NOMBRE VISIBLE */}
        {selectedUserForEdit && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
                    <Edit3 className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      Editar Identidad de Usuario
                    </h3>
                    <p className="text-[11px] text-slate-500">{selectedUserForEdit.email}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedUserForEdit(null)}
                  className="text-slate-400 hover:text-slate-600 text-xs cursor-pointer"
                >
                  Cerrar
                </button>
              </div>

              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  setEditUserError(null);

                  const isTargetSuperAdmin = selectedUserForEdit.email === 'allnexuslzyt@gmail.com';
                  const nameValidation = validateDisplayName(editDisplayName, isTargetSuperAdmin);
                  if (!nameValidation.isValid) {
                    setEditUserError(nameValidation.error || 'Nombre visible inválido');
                    return;
                  }

                  const usernameValidation = validateUsername(editUsername, isTargetSuperAdmin);
                  if (!usernameValidation.isValid) {
                    setEditUserError(usernameValidation.error || 'Nombre de usuario inválido');
                    return;
                  }

                  setIsSavingUserNames(true);
                  try {
                    await updateUserNames(selectedUserForEdit.id, editDisplayName, editUsername);
                    showToast(`Identidad de ${editDisplayName} actualizada exitosamente`);
                    setSelectedUserForEdit(null);
                  } catch (err: any) {
                    setEditUserError(err?.message || 'Error al guardar cambios');
                  } finally {
                    setIsSavingUserNames(false);
                  }
                }}
                className="space-y-4 pt-4"
              >
                {editUserError && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{editUserError}</span>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nombre Visible:
                  </label>
                  <input
                    type="text"
                    required
                    value={editDisplayName}
                    onChange={(e) => setEditDisplayName(e.target.value)}
                    placeholder="ej. Mateo Fernandez"
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-indigo-500"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    Solo letras y espacios (sin números, símbolos ni términos reservados).
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nombre de Usuario (@alias):
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-semibold">@</span>
                    <input
                      type="text"
                      required
                      value={editUsername}
                      onChange={(e) => setEditUsername(e.target.value.toLowerCase().replace(/\s+/g, ''))}
                      placeholder="mateodev"
                      className="w-full pl-7 pr-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 font-medium focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">
                    Solo letras sin espacios, números ni símbolos. No se permite contenido alusivo a marcas reservadas.
                  </p>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setSelectedUserForEdit(null)}
                    className="px-3.5 py-2 rounded-xl border border-slate-200 text-xs text-slate-700 hover:bg-slate-50 cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingUserNames}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {isSavingUserNames ? 'Guardando...' : 'Guardar Cambios'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {/* MODAL: CHAT EN VIVO DE ATENCIÓN DE TICKET DE SOPORTE */}
        {activeAdminChatTicket && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl max-w-2xl w-full h-[600px] max-h-[90vh] shadow-2xl border border-slate-200 flex flex-col overflow-hidden"
            >
              {/* Header */}
              <div className="p-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <Headphones className="w-4 h-4 text-indigo-400" />
                    <h3 className="text-sm font-bold text-white truncate max-w-[280px] sm:max-w-md">
                      {activeAdminChatTicket.subject}
                    </h3>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      activeAdminChatTicket.priority === 'urgente'
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        : activeAdminChatTicket.priority === 'alta'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                    }`}>
                      {activeAdminChatTicket.priority}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300">
                    Usuario: <strong>{activeAdminChatTicket.userName}</strong> ({activeAdminChatTicket.contactEmail})
                  </p>
                </div>

                <div className="flex items-center gap-1.5">
                  {!activeAdminChatTicket.claimedBy && (
                    <button
                      type="button"
                      onClick={async () => {
                        await claimTicket(activeAdminChatTicket.id);
                        showToast('Has reclamado este ticket');
                      }}
                      className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-[11px] font-bold cursor-pointer"
                    >
                      Reclamar
                    </button>
                  )}

                  {activeAdminChatTicket.status !== 'cerrado' ? (
                    <button
                      type="button"
                      onClick={async () => {
                        await closeTicket(activeAdminChatTicket.id);
                        showToast('Ticket cerrado');
                      }}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-medium cursor-pointer"
                    >
                      Cerrar Caso
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={async () => {
                        await reopenTicket(activeAdminChatTicket.id);
                        showToast('Ticket reabierto');
                      }}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-medium cursor-pointer"
                    >
                      Reabrir Caso
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      if (activeAdminChatTicket) {
                        setSelectedTicketForDelete(activeAdminChatTicket);
                      }
                    }}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 cursor-pointer"
                    title="Eliminar Ticket"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveAdminChatTicketId(null)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer ml-1"
                    title="Cerrar Ventana"
                  >
                    <XCircle className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Status Banner */}
              <div className="px-4 py-2 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-[11px] text-slate-500">
                <span>
                  Estado:{' '}
                  <strong className="text-slate-800 uppercase">
                    {activeAdminChatTicket.status === 'abierto'
                      ? 'Abierto (Esperando atención)'
                      : activeAdminChatTicket.status === 'en_proceso'
                      ? 'En Proceso'
                      : 'Cerrado'}
                  </strong>
                </span>
                <span>
                  {activeAdminChatTicket.claimedByName ? (
                    <span>Reclamado por: <strong className="text-indigo-600">{activeAdminChatTicket.claimedByName}</strong></span>
                  ) : (
                    <span className="text-amber-600 font-medium">Disponible para cualquier moderador/admin</span>
                  )}
                </span>
              </div>

              {/* Ban Appeal Resolution Bar if isBanAppeal */}
              {activeAdminChatTicket.isBanAppeal && (
                <div className="px-4 py-3 bg-rose-50/90 border-b border-rose-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0" />
                    <div>
                      <span className="text-xs font-bold text-rose-900 block">
                        Reclamación Oficial de Sanción / Baneo
                      </span>
                      <span className="text-[11px] text-rose-700">
                        Motivo: <strong>{activeAdminChatTicket.banReason || 'No especificado'}</strong> &bull; Duración: <strong>{activeAdminChatTicket.banDuration || 'Permanente'}</strong>
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {activeAdminChatTicket.userId && (
                      <button
                        type="button"
                        onClick={async () => {
                          await banOrSuspendUser(activeAdminChatTicket.userId!, 'activo', 'Sanción levantada tras revisión de apelación');
                          await addMessageToTicket(
                            activeAdminChatTicket.id,
                            '✅ Tu reclamación ha sido aceptada por la administración. La sanción ha sido levantada y tu cuenta ha sido reactivada con normalidad.'
                          );
                          await closeTicket(activeAdminChatTicket.id);
                          showToast('Sanción levantada y usuario reactivado');
                        }}
                        className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-xs cursor-pointer"
                      >
                        Levantar Baneo y Reactivar
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={async () => {
                        await addMessageToTicket(
                          activeAdminChatTicket.id,
                          '❌ Tu reclamación ha sido examinada minuciosamente y el equipo de administración ha determinado mantener la sanción.'
                        );
                        await closeTicket(activeAdminChatTicket.id);
                        showToast('Reclamación rechazada y caso cerrado');
                      }}
                      className="px-3 py-1.5 rounded-xl bg-white border border-rose-300 text-rose-700 hover:bg-rose-100 text-xs font-semibold cursor-pointer"
                    >
                      Mantener Sanción
                    </button>
                  </div>
                </div>
              )}

              {/* Chat messages */}
              <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50/50">
                {activeAdminChatTicket.messages.map((m) => {
                  const isStaff = m.senderRole === 'staff';
                  return (
                    <div
                      key={m.id}
                      className={`flex flex-col ${isStaff ? 'items-end' : 'items-start'}`}
                    >
                      <div className="flex items-center gap-1.5 mb-1 text-[10px] text-slate-400">
                        <span className="font-semibold text-slate-600">
                          {isStaff ? 'Soporte NexStudio' : m.senderName}
                        </span>
                        <span>•</span>
                        <span>{new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <div
                        className={`p-3 rounded-2xl max-w-[82%] text-xs ${
                          isStaff
                            ? 'bg-indigo-600 text-white rounded-tr-xs'
                            : 'bg-white text-slate-800 border border-slate-200 rounded-tl-xs shadow-2xs'
                        }`}
                      >
                        <p className="whitespace-pre-wrap leading-relaxed">{m.text}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Chat Input */}
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (!adminChatReply.trim()) return;
                  const text = adminChatReply;
                  setAdminChatReply('');
                  try {
                    await addMessageToTicket(activeAdminChatTicket.id, text);
                  } catch (err) {
                    showToast('Error al enviar mensaje');
                  }
                }}
                className="p-3 bg-white border-t border-slate-200 flex items-center gap-2"
              >
                <input
                  type="text"
                  value={adminChatReply}
                  onChange={(e) => setAdminChatReply(e.target.value)}
                  placeholder="Escribe una respuesta como soporte oficial..."
                  className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-indigo-500"
                />
                <button
                  type="submit"
                  disabled={!adminChatReply.trim()}
                  className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-40"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Responder</span>
                </button>
              </form>
            </motion.div>
          </div>
        )}

        {/* MODAL: PREVISUALIZACIÓN DE PANTALLA DE LANZAMIENTO */}
        {previewLaunchModalOpen && (
          <div className="fixed inset-0 z-50 flex flex-col bg-slate-950">
            {/* Top Toolbar */}
            <div className="p-3 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 text-white flex items-center justify-between z-50">
              <div className="flex items-center gap-2">
                <Rocket className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-bold text-white">
                  Vista Previa: Pantalla de Lanzamiento que verán los usuarios
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-semibold">
                  Modo Simulación
                </span>
              </div>
              <button
                type="button"
                id="btn-close-launch-preview"
                onClick={() => setPreviewLaunchModalOpen(false)}
                className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-colors cursor-pointer border border-slate-700"
              >
                Volver al Panel
              </button>
            </div>

            {/* Launch Screen Preview */}
            <div className="relative flex-1 overflow-hidden">
              <LaunchScreen onUnlocked={() => setPreviewLaunchModalOpen(false)} />
            </div>
          </div>
        )}

        {/* MODAL: CONFIRMACIÓN PARA RESTABLECER TODA LA CUENTA ATRÁS */}
        {showResetCountdownConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-white rounded-2xl p-6 shadow-2xl border border-slate-200 space-y-4"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600">
                  <RotateCcw className="w-5 h-5 text-rose-600" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">¿Restablecer toda la cuenta atrás?</h3>
                  <p className="text-xs text-slate-500">Se reiniciará a 24 horas por defecto (1 día).</p>
                </div>
              </div>
              <p className="text-sm text-slate-600 leading-relaxed">
                Esta acción cancelará cualquier pausa activa, pondrá el temporizador en <strong>24 horas iniciales</strong> y sincronizará de inmediato el nuevo objetivo en todos los usuarios y dispositivos en directo a través de la base de datos.
              </p>
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  id="btn-cancel-reset-countdown"
                  onClick={() => setShowResetCountdownConfirm(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  id="btn-confirm-reset-countdown"
                  disabled={isResettingCountdown}
                  onClick={handleResetEntireCountdown}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-colors shadow-sm flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isResettingCountdown ? <RefreshCw className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4" />}
                  <span>{isResettingCountdown ? 'Restableciendo...' : 'Sí, Restablecer Toda la Cuenta'}</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
