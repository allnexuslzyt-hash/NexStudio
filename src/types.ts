export type UserRole = 'SuperAdmin' | 'Admin' | 'Moderador' | 'Creador Digital' | 'Usuario';
export type UserStatus = 'activo' | 'suspendido' | 'baneado';

export interface UserProfile {
  userId: string;
  email: string;
  displayName: string;
  username?: string;
  photoURL?: string;
  bannerUrl?: string;
  role?: string;
  bio?: string;
  description?: string;
  customStatus?: string;
  website?: string;
  visibility?: 'public' | 'community_only' | 'private';
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

export interface LaunchModeConfig {
  enabled: boolean; // Si el modo lanzamiento está activo bloqueando la web
  targetDate: string; // ISO string de la fecha/hora objetivo de lanzamiento
  targetTimestampMs?: number; // Timestamp Unix epoch en milisegundos para sincronización ultraprecisa en todos lados
  durationSeconds?: number; // Duración total en segundos
  title: string; // Título principal (ej. "¡Gran Lanzamiento de NexStudio!")
  subtitle: string; // Subtítulo o mensaje explicativo
  badgeText: string; // Texto del distintivo (ej. "Gran Estreno Oficial 1.0")
  isPaused: boolean; // Si la cuenta atrás ha sido pausada temporalmente por el admin
  pausedRemainingSeconds?: number; // Segundos restantes cuando fue pausada
  allowAdminBypass: boolean; // Permite a allnexuslzyt@gmail.com o administradores entrar a la web y panel
  autoUnlockOnFinish: boolean; // Si se desbloquea automáticamente al llegar a 0
  lastUpdated: string;
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
  launchMode?: LaunchModeConfig; // Modo En Lanzamiento con cuenta atrás sincronizada
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

export interface PostComment {
  id: string;
  postId: string;
  authorId: string;
  authorName: string;
  authorUsername?: string;
  authorPhotoURL?: string;
  content: string;
  createdAt: string;
}

export interface CommunityPost {
  id: string;
  authorId: string;
  authorName: string;
  authorUsername?: string;
  authorPhotoURL?: string;
  authorRole?: string;
  content: string;
  attachmentUrl?: string; // Data URL or storage link from device upload
  attachmentName?: string;
  attachmentType?: 'image' | 'video' | 'audio' | 'document' | 'file';
  attachmentSize?: number;
  visibility?: 'public' | 'community_only' | 'private';
  projectId?: string;
  projectTitle?: string;
  projectCategory?: string;
  projectTag?: string;
  projectLink?: string;
  likes: string[]; // List of user IDs who liked
  likesCount: number;
  commentsCount: number;
  sharesCount: number;
  createdAt: string;
  tags?: string[];
}

export interface UserRepository {
  id: string;
  ownerId: string;
  ownerName: string;
  ownerUsername?: string;
  ownerPhotoURL?: string;
  name: string;
  description: string;
  category?: string;
  tags?: string[];
  visibility: 'public' | 'community_only' | 'private';
  projectsCount: number;
  isFeatured?: boolean;
  isVerified?: boolean;
  status?: 'active' | 'hidden' | 'flagged';
  moderationNotes?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface UserRepoProject {
  id: string;
  repoId: string;
  repoName: string;
  ownerId: string;
  ownerName: string;
  title: string;
  description: string;
  attachmentUrl?: string; // Data URL or device file upload link
  attachmentName?: string;
  attachmentType?: string;
  attachmentSize?: number;
  demoUrl?: string;
  version?: string;
  isPublic?: boolean;
  status?: 'active' | 'hidden' | 'flagged';
  moderationNotes?: string;
  createdAt: string;
  updatedAt?: string;
}

