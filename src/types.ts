export type UserRole = 'SuperAdmin' | 'Admin' | 'Moderador' | 'Creador Digital' | 'Usuario';
export type UserStatus = 'activo' | 'suspendido' | 'baneado';

export interface UserProfile {
  userId: string;
  email: string;
  displayName: string;
  username?: string;
  photoURL?: string;
  role?: string;
  bio?: string;
  createdAt?: string;
  lastLogin?: string;
  status?: UserStatus;
  banReason?: string;
  banDuration?: string;
  bannedAt?: string;
  banExpiresAt?: string;
  currentBanId?: string;
  appealTicketId?: string;
  onboardingCompleted?: boolean;
}

export type TicketPriority = 'baja' | 'media' | 'alta' | 'urgente';
export type TicketStatus = 'abierto' | 'en_proceso' | 'cerrado';

export interface TicketMessage {
  id: string;
  senderId: string;
  senderEmail: string;
  senderName: string;
  senderAvatar?: string;
  isAdmin: boolean;
  text: string;
  timestamp: string;
}

export interface SupportTicket {
  id: string;
  subject: string;
  contactEmail: string;
  priority: TicketPriority;
  status: TicketStatus;
  userId?: string;
  userName: string;
  userAvatar?: string;
  createdAt: string;
  updatedAt: string;
  claimedBy?: string | null;
  claimedByName?: string | null;
  claimedByEmail?: string | null;
  messages: TicketMessage[];
  isBanAppeal?: boolean;
  banId?: string;
  banReason?: string;
  banDuration?: string;
}

export interface ManagedUser {
  id: string;
  displayName: string;
  username: string;
  email: string;
  avatarUrl: string;
  role: UserRole;
  createdAt: string;
  lastActive: string;
  status: UserStatus;
  banReason?: string;
  banDuration?: string;
  bannedAt?: string;
  banExpiresAt?: string;
  currentBanId?: string;
  appealTicketId?: string;
  sanctionsCount?: number;
}

export type ReportStatus = 'pending' | 'approved' | 'removed' | 'sanctioned';
export type ReportReason = 'spam' | 'offensive' | 'copyright' | 'harassment' | 'impersonation' | 'other';

export interface ContentReport {
  id: string;
  contentType: 'comentario' | 'proyecto' | 'perfil' | 'archivo';
  contentId: string;
  contentSnippet: string;
  authorName: string;
  authorEmail: string;
  authorAvatar?: string;
  reporterName: string;
  reason: ReportReason;
  reasonText: string;
  reportedAt: string;
  status: ReportStatus;
  resolvedAt?: string;
  resolvedBy?: string;
}

export type BannerType = 'info' | 'warning' | 'critical' | 'success';

export interface GlobalBannerConfig {
  enabled: boolean;
  type: BannerType;
  message: string;
  actionText?: string;
  actionLink?: string;
  dismissible: boolean;
}

export interface SiteSettings {
  maintenanceMode: boolean; // Kill Switch
  maintenanceMessage: string;
  maintenanceEstimatedReturn?: string;
  estimatedTime?: string;
  maintenanceReason?: string;
  banner: GlobalBannerConfig;
  allowNewRegistrations: boolean;
  lastUpdated: string;
  updatedBy: string;
}

export interface AuditLogItem {
  id: string;
  adminEmail: string;
  adminName: string;
  action: string;
  target: string;
  category: 'usuarios' | 'moderacion' | 'seguridad' | 'ajustes' | 'mantenimiento' | 'proyectos';
  timestamp: string;
  details?: string;
}

export interface AdminProject {
  id: string;
  title: string;
  description: string;
  category?: string;
  tag?: string;
  downloadUrl: string;
  linkUrl?: string;
  waitTimeSeconds: number;
  isPublic: boolean; // Visibilidad (visible para visitantes o solo administradores)
  requireAuth: boolean; // Restricción (requiere registro previo para descargar)
  status: 'active' | 'draft' | 'archived';
  createdAt?: string;
  updatedAt?: string;
}
