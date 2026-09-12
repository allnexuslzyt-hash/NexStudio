import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  serverTimestamp,
  increment 
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType, removeUndefinedFields } from './firebase';
import { UserRepository, UserRepoProject } from '../types';
import { ProcessedFile } from './fileUploadHelper';

// Colecciones de Firestore
const REPOS_COLLECTION = 'user_repositories';
const PROJECTS_COLLECTION = 'repo_projects';

/**
 * Escuchar los repositorios de un usuario en tiempo real
 */
export function subscribeUserRepositories(
  userId: string, 
  callback: (repos: UserRepository[]) => void
) {
  const reposRef = collection(db, REPOS_COLLECTION);
  const q = query(
    reposRef, 
    where('ownerId', '==', userId), 
    orderBy('createdAt', 'desc')
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const repos: UserRepository[] = [];
      snapshot.forEach((docSnap) => {
        repos.push({ id: docSnap.id, ...docSnap.data() } as UserRepository);
      });
      callback(repos);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, REPOS_COLLECTION);
      callback([]);
    }
  );
}

/**
 * Escuchar todos los repositorios públicos de la plataforma (para explorar y moderar)
 */
export function subscribeAllRepositories(
  callback: (repos: UserRepository[]) => void
) {
  const reposRef = collection(db, REPOS_COLLECTION);
  const q = query(reposRef, orderBy('createdAt', 'desc'));

  return onSnapshot(
    q,
    (snapshot) => {
      const repos: UserRepository[] = [];
      snapshot.forEach((docSnap) => {
        repos.push({ id: docSnap.id, ...docSnap.data() } as UserRepository);
      });
      callback(repos);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, REPOS_COLLECTION);
      callback([]);
    }
  );
}

/**
 * Escuchar los proyectos de un repositorio específico
 */
export function subscribeRepoProjects(
  repoId: string, 
  callback: (projects: UserRepoProject[]) => void
) {
  const projectsRef = collection(db, PROJECTS_COLLECTION);
  const q = query(
    projectsRef, 
    where('repoId', '==', repoId), 
    orderBy('createdAt', 'desc')
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const projects: UserRepoProject[] = [];
      snapshot.forEach((docSnap) => {
        projects.push({ id: docSnap.id, ...docSnap.data() } as UserRepoProject);
      });
      callback(projects);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, PROJECTS_COLLECTION);
      callback([]);
    }
  );
}

/**
 * Escuchar todos los proyectos de un usuario
 */
export function subscribeUserAllProjects(
  userId: string,
  callback: (projects: UserRepoProject[]) => void
) {
  const projectsRef = collection(db, PROJECTS_COLLECTION);
  const q = query(
    projectsRef, 
    where('ownerId', '==', userId), 
    orderBy('createdAt', 'desc')
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const projects: UserRepoProject[] = [];
      snapshot.forEach((docSnap) => {
        projects.push({ id: docSnap.id, ...docSnap.data() } as UserRepoProject);
      });
      callback(projects);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, PROJECTS_COLLECTION);
      callback([]);
    }
  );
}

/**
 * Crear un nuevo repositorio
 */
export async function createRepository(data: {
  ownerId: string;
  ownerName: string;
  ownerUsername?: string;
  ownerPhotoURL?: string;
  name: string;
  description: string;
  category?: string;
  tags?: string[];
  visibility: 'public' | 'community_only' | 'private';
}): Promise<string> {
  const repoId = `repo_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const repoRef = doc(db, REPOS_COLLECTION, repoId);

  const newRepo: UserRepository = {
    id: repoId,
    ownerId: data.ownerId,
    ownerName: data.ownerName,
    ownerUsername: data.ownerUsername || 'creador',
    ownerPhotoURL: data.ownerPhotoURL || '',
    name: data.name.trim(),
    description: data.description.trim(),
    category: data.category || 'General',
    tags: data.tags || [],
    visibility: data.visibility || 'public',
    projectsCount: 0,
    isFeatured: false,
    isVerified: false,
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const sanitized = removeUndefinedFields(newRepo);

  try {
    await setDoc(repoRef, sanitized);
    return repoId;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `${REPOS_COLLECTION}/${repoId}`);
    throw error;
  }
}

/**
 * Actualizar un repositorio (dueño o admin)
 */
export async function updateRepository(
  repoId: string, 
  data: Partial<UserRepository>
): Promise<void> {
  const repoRef = doc(db, REPOS_COLLECTION, repoId);
  const updateData = removeUndefinedFields({
    ...data,
    updatedAt: new Date().toISOString(),
  });

  try {
    await updateDoc(repoRef, updateData);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${REPOS_COLLECTION}/${repoId}`);
    throw error;
  }
}

/**
 * Eliminar un repositorio y todos sus proyectos asociados (dueño o admin)
 */
export async function deleteRepository(repoId: string): Promise<void> {
  const repoRef = doc(db, REPOS_COLLECTION, repoId);

  try {
    // 1. Eliminar proyectos del repositorio
    const projectsRef = collection(db, PROJECTS_COLLECTION);
    const q = query(projectsRef, where('repoId', '==', repoId));
    const snap = await getDocs(q);
    
    const deletePromises = snap.docs.map((docSnap) => deleteDoc(docSnap.ref));
    await Promise.all(deletePromises);

    // 2. Eliminar el repositorio
    await deleteDoc(repoRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${REPOS_COLLECTION}/${repoId}`);
    throw error;
  }
}

/**
 * Subir / Crear un nuevo proyecto dentro de un repositorio
 */
export async function addProjectToRepository(data: {
  repoId: string;
  repoName: string;
  ownerId: string;
  ownerName: string;
  title: string;
  description: string;
  attachment?: ProcessedFile | null;
  demoUrl?: string;
  version?: string;
  isPublic?: boolean;
}): Promise<string> {
  const projectId = `proj_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const projectRef = doc(db, PROJECTS_COLLECTION, projectId);

  const newProject: UserRepoProject = {
    id: projectId,
    repoId: data.repoId,
    repoName: data.repoName,
    ownerId: data.ownerId,
    ownerName: data.ownerName,
    title: data.title.trim(),
    description: data.description.trim(),
    attachmentUrl: data.attachment?.dataUrl || '',
    attachmentName: data.attachment?.name || '',
    attachmentType: data.attachment?.type || '',
    attachmentSize: data.attachment?.size || 0,
    demoUrl: data.demoUrl ? data.demoUrl.trim() : '',
    version: data.version ? data.version.trim() : 'v1.0',
    isPublic: data.isPublic ?? true,
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const sanitized = removeUndefinedFields(newProject);

  try {
    await setDoc(projectRef, sanitized);

    // Incrementar el contador de proyectos en el repositorio padre
    const repoRef = doc(db, REPOS_COLLECTION, data.repoId);
    await updateDoc(repoRef, {
      projectsCount: increment(1),
      updatedAt: new Date().toISOString(),
    }).catch(() => {
      // Si falla la actualización del contador no es bloqueante
    });

    return projectId;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `${PROJECTS_COLLECTION}/${projectId}`);
    throw error;
  }
}

/**
 * Actualizar proyecto en un repositorio (dueño o admin)
 */
export async function updateRepoProject(
  projectId: string, 
  data: Partial<UserRepoProject>
): Promise<void> {
  const projectRef = doc(db, PROJECTS_COLLECTION, projectId);
  const updateData = removeUndefinedFields({
    ...data,
    updatedAt: new Date().toISOString(),
  });

  try {
    await updateDoc(projectRef, updateData);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${PROJECTS_COLLECTION}/${projectId}`);
    throw error;
  }
}

/**
 * Eliminar un proyecto de un repositorio (dueño o admin)
 */
export async function deleteRepoProject(projectId: string, repoId: string): Promise<void> {
  const projectRef = doc(db, PROJECTS_COLLECTION, projectId);

  try {
    await deleteDoc(projectRef);

    // Decrementar el contador de proyectos en el repositorio padre
    const repoRef = doc(db, REPOS_COLLECTION, repoId);
    await updateDoc(repoRef, {
      projectsCount: increment(-1),
      updatedAt: new Date().toISOString(),
    }).catch(() => {});
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${PROJECTS_COLLECTION}/${projectId}`);
    throw error;
  }
}

/**
 * Moderación de Administrador: cambiar visibilidad, destacar o suspender repositorio
 */
export async function adminModerateRepository(
  repoId: string, 
  action: {
    status?: 'active' | 'hidden' | 'flagged';
    isFeatured?: boolean;
    isVerified?: boolean;
    moderationNotes?: string;
  }
): Promise<void> {
  const repoRef = doc(db, REPOS_COLLECTION, repoId);
  const updateData = removeUndefinedFields({
    ...action,
    updatedAt: new Date().toISOString(),
  });

  try {
    await updateDoc(repoRef, updateData);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${REPOS_COLLECTION}/${repoId}`);
    throw error;
  }
}
