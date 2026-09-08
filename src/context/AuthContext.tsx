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
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  clearAuthError: () => void;
  updateBio: (bio: string) => Promise<void>;
  updateProfileData: (data: { displayName?: string; username?: string; photoURL?: string }) => Promise<void>;
  deleteAccount: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  // Test connection on mount
  useEffect(() => {
    testConnection();
  }, []);

  const syncUserProfile = async (firebaseUser: User) => {
    const isSuperAdmin = isSuperAdminEmail(firebaseUser.email);
    const userDocRef = doc(db, 'users', firebaseUser.uid);
    try {
      const docSnap = await getDoc(userDocRef);
      if (docSnap.exists()) {
        const data = docSnap.data() as UserProfile;
        if (isSuperAdmin && data.role !== 'SuperAdmin') {
          data.role = 'SuperAdmin';
          await setDoc(userDocRef, { role: 'SuperAdmin' }, { merge: true });
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
      });
      handleFirestoreError(err, OperationType.GET, `users/${firebaseUser.uid}`);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        await syncUserProfile(currentUser);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    setLoading(true);
    setAuthError(null);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      if (result.user) {
        await syncUserProfile(result.user);
      }
    } catch (err: any) {
      console.error('Error al iniciar sesión con Google:', err);
      // Si el usuario cerró la ventana emergente voluntariamente, no mostrar mensaje de error
      if (err.code === 'auth/popup-closed-by-user' || err.code === 'auth/cancelled-popup-request') {
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
      await fbSignOut(auth);
      setUser(null);
      setProfile(null);
    } catch (err) {
      console.error('Error al cerrar sesión:', err);
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

  const updateProfileData = async (data: { displayName?: string; username?: string; photoURL?: string }) => {
    if (!user) return;
    const userDocRef = doc(db, 'users', user.uid);
    try {
      // Update Firebase Auth current user if displayName or photoURL changed
      if (data.displayName || data.photoURL) {
        await fbUpdateProfile(user, {
          displayName: data.displayName ?? user.displayName,
          photoURL: data.photoURL ?? user.photoURL,
        });
      }

      // Update Firestore document
      const updatePayload: Record<string, any> = {};
      if (data.displayName !== undefined) updatePayload.displayName = data.displayName;
      if (data.username !== undefined) updatePayload.username = data.username;
      if (data.photoURL !== undefined) updatePayload.photoURL = data.photoURL;

      await setDoc(userDocRef, updatePayload, { merge: true });

      // Update local profile state
      setProfile((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          ...updatePayload,
        };
      });
    } catch (err) {
      console.error('Error actualizando perfil:', err);
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
        signInWithGoogle,
        signOut,
        clearAuthError: () => setAuthError(null),
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
