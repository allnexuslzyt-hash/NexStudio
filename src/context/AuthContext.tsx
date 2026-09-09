import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  User, 
  signInWithPopup, 
  signOut as fbSignOut, 
  onAuthStateChanged,
  updateProfile as fbUpdateProfile
} from 'firebase/auth';
import { 
  doc, 
  getDoc, 
  setDoc, 
  deleteDoc,
  serverTimestamp 
} from 'firebase/firestore';
import { auth, db, googleProvider, handleFirestoreError, OperationType, testConnection } from '../lib/firebase';
import { UserProfile } from '../types';

export const ADMIN_EMAILS = ['allnexuslzyt@gmail.com'];

export const isSuperAdminEmail = (email?: string | null): boolean => {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email.toLowerCase().trim());
};

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  isAdmin: boolean;
  loading: boolean;
  authError: string | null;
  unauthorizedDomain: string | null;
  signInWithGoogle: () => Promise<void>;
  signInWithDevAccount: (email?: string, role?: string) => void;
  signOut: () => Promise<void>;
  clearAuthError: () => void;
  setUnauthorizedDomain: (domain: string | null) => void;
  updateBio: (bio: string) => Promise<void>;
  updateProfileData: (data: { displayName?: string; username?: string; photoURL?: string; onboardingCompleted?: boolean; bio?: string }) => Promise<void>;
  deleteAccount: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [unauthorizedDomain, setUnauthorizedDomain] = useState<string | null>(null);

  // Test connection on mount
  useEffect(() => {
    testConnection();
  }, []);

  const syncUserProfile = async (firebaseUser: User) => {
    const isSuperAdmin = isSuperAdminEmail(firebaseUser.email);
    const userDocRef = doc(db, 'users', firebaseUser.uid);
    const localOnboarding = localStorage.getItem(`nexstudio_onboarding_${firebaseUser.uid}`) === 'true';

    try {
      const docSnap = await getDoc(userDocRef);
      if (docSnap.exists()) {
        const data = docSnap.data() as UserProfile;
        if (isSuperAdmin && data.role !== 'SuperAdmin') {
          data.role = 'SuperAdmin';
          await setDoc(userDocRef, { role: 'SuperAdmin' }, { merge: true });
        }
        if (localOnboarding && !data.onboardingCompleted) {
          data.onboardingCompleted = true;
        }
        setProfile(data);
      } else {
        const newProfile: UserProfile = {
          userId: firebaseUser.uid,
          email: firebaseUser.email || '',
          displayName: firebaseUser.displayName || 'Usuario NexStudio',
          photoURL: firebaseUser.photoURL || `https://api.dicebear.com/7.x/identicon/svg?seed=${firebaseUser.uid}`,
          role: isSuperAdmin ? 'SuperAdmin' : 'Creador Digital',
          bio: isSuperAdmin ? 'Super Administrador del Sistema NexStudio.' : 'Diseñador y desarrollador en NexStudio.',
          createdAt: new Date().toISOString(),
          lastLogin: new Date().toISOString(),
          onboardingCompleted: localOnboarding,
        };
        await setDoc(userDocRef, newProfile);
        setProfile(newProfile);
      }
    } catch (err) {
      console.error('Error sincronizando perfil:', err);
      // Fallback local profile if Firestore rule or connection is initialising
      setProfile({
        userId: firebaseUser.uid,
        email: firebaseUser.email || '',
        displayName: firebaseUser.displayName || 'Usuario NexStudio',
        photoURL: firebaseUser.photoURL || `https://api.dicebear.com/7.x/identicon/svg?seed=${firebaseUser.uid}`,
        role: isSuperAdmin ? 'SuperAdmin' : 'Creador Digital',
        bio: isSuperAdmin ? 'Super Administrador del Sistema NexStudio.' : 'Miembro verificado de NexStudio',
        createdAt: new Date().toISOString(),
        onboardingCompleted: localOnboarding,
      });
      handleFirestoreError(err, OperationType.GET, `users/${firebaseUser.uid}`);
    }
  };

  useEffect(() => {
    // Clear any previous dev tokens for security so visitors cannot impersonate admin
    try {
      localStorage.removeItem('nexstudio_dev_user');
      localStorage.removeItem('nexstudio_dev_profile');
    } catch (e) {}

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        await syncUserProfile(currentUser);
        setLoading(false);
      } else {
        setUser(null);
        setProfile(null);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const signInWithDevAccount = (customEmail?: string, customRole?: string) => {
    const email = customEmail || 'allnexuslzyt@gmail.com';
    const isSuperAdmin = isSuperAdminEmail(email);
    const role = customRole || (isSuperAdmin ? 'SuperAdmin' : 'Creador Digital');
    const displayName = email === 'allnexuslzyt@gmail.com' ? 'Nexus Admin' : 'Usuario de Prueba';
    const uid = `dev-${email.replace(/[^a-zA-Z0-9]/g, '_')}`;
    const photoURL = isSuperAdmin 
      ? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
      : `https://api.dicebear.com/7.x/identicon/svg?seed=${uid}`;

    const devUserObj: any = {
      uid,
      email,
      displayName,
      photoURL,
      emailVerified: true,
      delete: async () => {},
    };

    const devProfileObj: UserProfile = {
      userId: uid,
      email,
      displayName,
      photoURL,
      role,
      bio: isSuperAdmin ? 'Super Administrador del Sistema NexStudio (Acceso Directo).' : 'Miembro verificado de NexStudio',
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString(),
      status: 'activo',
    };

    localStorage.setItem('nexstudio_dev_user', JSON.stringify(devUserObj));
    localStorage.setItem('nexstudio_dev_profile', JSON.stringify(devProfileObj));

    setUser(devUserObj as User);
    setProfile(devProfileObj);
    setAuthError(null);
    setUnauthorizedDomain(null);
  };

  const signInWithGoogle = async () => {
    setLoading(true);
    setAuthError(null);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      if (result.user) {
        // Clear dev session when actual Google user connects
        localStorage.removeItem('nexstudio_dev_user');
        localStorage.removeItem('nexstudio_dev_profile');
        await syncUserProfile(result.user);
      }
    } catch (err: any) {
      console.error('Error al iniciar sesión con Google:', err);
      // Si el usuario cerró la ventana emergente voluntariamente, no mostrar mensaje de error
      if (err.code === 'auth/popup-closed-by-user' || err.code === 'auth/cancelled-popup-request') {
        return;
      }
      if (err.code === 'auth/unauthorized-domain') {
        const currentHostname = typeof window !== 'undefined' ? window.location.hostname : '';
        setUnauthorizedDomain(currentHostname);
        setAuthError(`Dominio no autorizado en Firebase ("${currentHostname}"). Abre la guía para autorizarlo en tu consola de Firebase.`);
        return;
      }
      let message = 'No se pudo completar el inicio de sesión con Google.';
      if (err.code === 'auth/popup-blocked') {
        message = 'La ventana emergente de Google fue bloqueada por tu navegador. Permite los popups para continuar.';
      } else if (err.message) {
        message = err.message;
      }
      setAuthError(message);
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    setLoading(true);
    try {
      localStorage.removeItem('nexstudio_dev_user');
      localStorage.removeItem('nexstudio_dev_profile');
      await fbSignOut(auth);
      setUser(null);
      setProfile(null);
    } catch (err) {
      console.error('Error al cerrar sesión:', err);
      setUser(null);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  };

  const updateBio = async (newBio: string) => {
    if (!user) return;
    const userDocRef = doc(db, 'users', user.uid);
    try {
      await setDoc(userDocRef, { bio: newBio }, { merge: true });
      setProfile((prev) => prev ? { ...prev, bio: newBio } : null);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${user.uid}`);
    }
  };

  const updateProfileData = async (data: { 
    displayName?: string; 
    username?: string; 
    photoURL?: string;
    onboardingCompleted?: boolean;
    bio?: string;
  }) => {
    if (!user) return;
    const userDocRef = doc(db, 'users', user.uid);
    try {
      // Update Firebase Auth current user if displayName or photoURL changed
      if (data.displayName || data.photoURL) {
        try {
          await fbUpdateProfile(user, {
            displayName: data.displayName ?? user.displayName,
            photoURL: data.photoURL ?? user.photoURL,
          });
        } catch (e) {
          console.warn('No se pudo actualizar perfil de Firebase Auth directamente:', e);
        }
      }

      // Update Firestore document with all required fields
      const updatePayload: Record<string, any> = {
        userId: user.uid,
        email: user.email || '',
      };
      if (data.displayName !== undefined) updatePayload.displayName = data.displayName;
      if (data.username !== undefined) updatePayload.username = data.username;
      if (data.photoURL !== undefined) updatePayload.photoURL = data.photoURL;
      if (data.onboardingCompleted !== undefined) updatePayload.onboardingCompleted = data.onboardingCompleted;
      if (data.bio !== undefined) updatePayload.bio = data.bio;

      if (data.onboardingCompleted) {
        try {
          localStorage.setItem(`nexstudio_onboarding_${user.uid}`, 'true');
        } catch (e) {}
      }

      try {
        await setDoc(userDocRef, updatePayload, { merge: true });
      } catch (fsErr) {
        console.warn('Firestore setDoc falló o regla pendiente, actualizando estado local:', fsErr);
      }

      // Update local profile state immediately (even if previous state was null)
      const isSuper = isSuperAdminEmail(user.email);
      setProfile((prev) => {
        const base: UserProfile = prev || {
          userId: user.uid,
          email: user.email || '',
          displayName: data.displayName || user.displayName || 'Usuario NexStudio',
          username: data.username || user.email?.split('@')[0] || 'usuario',
          photoURL: data.photoURL || user.photoURL || `https://api.dicebear.com/7.x/identicon/svg?seed=${user.uid}`,
          role: isSuper ? 'SuperAdmin' : 'Creador Digital',
          bio: isSuper ? 'Super Administrador del Sistema NexStudio.' : 'Miembro de NexStudio',
          createdAt: new Date().toISOString(),
          lastLogin: new Date().toISOString(),
          onboardingCompleted: true,
        };
        const updated = {
          ...base,
          ...updatePayload,
        };
        try {
          localStorage.setItem(`nexstudio_profile_${user.uid}`, JSON.stringify(updated));
        } catch (e) {}
        return updated;
      });

      // Also update React user state in memory
      setUser((prevUser) => {
        if (!prevUser) return null;
        return {
          ...prevUser,
          displayName: data.displayName !== undefined ? data.displayName : prevUser.displayName,
          photoURL: data.photoURL !== undefined ? data.photoURL : prevUser.photoURL,
        } as User;
      });
    } catch (err) {
      console.error('Error actualizando perfil:', err);
      // Actualizar estado local para no bloquear la interfaz
      setProfile((prev) => prev ? { ...prev, ...data } : null);
      handleFirestoreError(err, OperationType.UPDATE, `users/${user.uid}`);
      throw err;
    }
  };

  const deleteAccount = async () => {
    if (!user) return;
    try {
      // Delete user document in Firestore
      try {
        const userDocRef = doc(db, 'users', user.uid);
        await deleteDoc(userDocRef);
      } catch (err) {
        console.warn('Could not delete user doc from firestore:', err);
      }
      // Delete user auth account
      try {
        await user.delete();
      } catch (err: any) {
        // If requires-recent-login or similar, sign out
        console.warn('User auth delete error, falling back to signOut:', err);
      }
      await signOut();
    } catch (err) {
      console.error('Error al eliminar cuenta:', err);
      throw err;
    }
  };

  const isAdmin = Boolean(
    isSuperAdminEmail(user?.email) || 
    profile?.role === 'SuperAdmin' || 
    profile?.role === 'Admin'
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        isAdmin,
        loading,
        authError,
        unauthorizedDomain,
        signInWithGoogle,
        signInWithDevAccount,
        signOut,
        clearAuthError: () => setAuthError(null),
        setUnauthorizedDomain,
        updateBio,
        updateProfileData,
        deleteAccount,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser utilizado dentro de un AuthProvider');
  }
  return context;
};
