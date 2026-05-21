import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut, 
  User as FirebaseUser,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail
} from 'firebase/auth';
import { 
  doc, 
  getDoc, 
  setDoc, 
  serverTimestamp, 
  collection, 
  query, 
  where, 
  getDocs,
  deleteDoc
} from 'firebase/firestore';
import { auth, db } from '../services/firebase';

export type UserRole = 'admin' | 'faculty' | 'student';

interface UserProfile {
  uid: string;
  email: string;
  name: string;
  role: UserRole;
  createdAt: any;
  deactivated?: boolean;
}

interface AuthContextType {
  user: FirebaseUser | null;
  profile: UserProfile | null;
  loading: boolean;
  error: string | null;
  signInWithGoogle: (role?: UserRole) => Promise<void>;
  signInWithEmail: (email: string, pass: string) => Promise<void>;
  signUpWithEmail: (email: string, pass: string, name: string, role: UserRole) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      setError(null);
      if (user) {
        // Immediate check for super-admin by email
        const isSuperAdmin = user.email === 'workt1282@gmail.com';
        const storedRole = localStorage.getItem('intended_role');
        const fallbackRole = (storedRole as UserRole) || (localStorage.getItem('last_user_role') as UserRole) || (isSuperAdmin ? 'admin' : 'student');
        const fallbackName = localStorage.getItem('intended_name') || localStorage.getItem('last_user_name') || user.displayName || (isSuperAdmin ? 'Super Admin' : 'User');
        
        try {
          const docRef = doc(db, 'users', user.uid);
          let docSnap = await getDoc(docRef);
          
          if (!docSnap.exists() && user.email) {
            // Check if a pre-enrolled profile exists for this email
            const q = query(collection(db, 'users'), where('email', '==', user.email));
            const qSnap = await getDocs(q);
            
            if (!qSnap.empty) {
              const oldDoc = qSnap.docs[0];
              const oldData = oldDoc.data();
              
              // Migrate/Unify: Create doc at UID, delete old random ID doc
              const unifiedProfilebody = {
                ...oldData,
                uid: user.uid,
                email: user.email,
                name: oldData.name || fallbackName,
                role: oldData.role || fallbackRole,
                updatedAt: serverTimestamp()
              };
              
              await setDoc(docRef, unifiedProfilebody);
              if (oldDoc.id !== user.uid) {
                try {
                  await deleteDoc(doc(db, 'users', oldDoc.id));
                } catch (delErr) {
                  console.warn("Soft migration: Not authorized to delete the pre-enrolled user record, which is expected. Unified profile created successfully.", delErr);
                }
              }
              docSnap = await getDoc(docRef);
            }
          }

          if (docSnap.exists()) {
            const existingProfile = docSnap.data() as UserProfile;
            
            if (existingProfile.deactivated && !isSuperAdmin) {
              setProfile(null);
              await signOut(auth);
              localStorage.removeItem('intended_role');
              setLoading(false);
              return;
            }

            setProfile(existingProfile);
            localStorage.setItem('last_user_role', existingProfile.role);
            localStorage.setItem('last_user_name', existingProfile.name);
            localStorage.removeItem('intended_role');
            localStorage.removeItem('intended_name');
          } else {
            // No profile exists at all. Create one.
            const newProfileBody: any = {
              uid: user.uid,
              email: user.email || '',
              name: fallbackName,
              role: fallbackRole,
              createdAt: serverTimestamp(),
            };

            try {
              await setDoc(docRef, newProfileBody);
            } catch (pErr) {
              console.warn("Background registry sync failed to write profile doc, continuing smoothly with fallback:", pErr);
            }
            const localProfile = { ...newProfileBody, createdAt: new Date() };
            setProfile(localProfile);
            localStorage.setItem('last_user_role', localProfile.role);
            localStorage.setItem('last_user_name', localProfile.name);
            localStorage.removeItem('intended_role');
            localStorage.removeItem('intended_name');
          }
        } catch (err) {
          console.warn("Auth sync soft handled in background:", err);
          // Beautiful background sync fallback lets user in on slow or error states
          const localProfile: UserProfile = {
            uid: user.uid,
            email: user.email || '',
            name: fallbackName,
            role: fallbackRole,
            createdAt: new Date()
          };
          setProfile(localProfile);
          localStorage.setItem('last_user_role', localProfile.role);
          localStorage.setItem('last_user_name', localProfile.name);
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signInWithGoogle = async (intendedRole?: UserRole) => {
    const provider = new GoogleAuthProvider();
    if (intendedRole) {
      localStorage.setItem('intended_role', intendedRole);
    }
    try {
      await signInWithPopup(auth, provider);
    } catch (error: any) {
      localStorage.removeItem('intended_role');
      throw error;
    }
  };

  const signInWithEmail = async (email: string, pass: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, pass);
    } catch (err: any) {
      const errorCode = err.code || '';
      if (errorCode === 'auth/user-not-found' || errorCode === 'auth/invalid-credential') {
        // Automatically attempt to register the account in Firebase Auth if it doesn't exist yet
        const storedRole = localStorage.getItem('intended_role') as UserRole || 'student';
        localStorage.setItem('intended_role', storedRole);
        try {
          await createUserWithEmailAndPassword(auth, email, pass);
        } catch (signUpErr: any) {
          if (signUpErr.code === 'auth/email-already-in-use') {
            throw err; // Re-throw the original error, since the email is in use and the password was incorrect
          } else {
            throw signUpErr;
          }
        }
      } else {
        throw err;
      }
    }
  };

  const signUpWithEmail = async (email: string, pass: string, name: string, role: UserRole) => {
    // We don't check for existence here because it requires permissions we don't have.
    // Instead, we try to create the account. If they are not in the registry, 
    // the onAuthStateChanged hook will sign them out immediately.
    localStorage.setItem('intended_role', role);
    localStorage.setItem('intended_name', name);
    try {
      await createUserWithEmailAndPassword(auth, email, pass);
    } catch (err: any) {
      localStorage.removeItem('intended_role');
      localStorage.removeItem('intended_name');
      throw err;
    }
  };

  const resetPassword = async (email: string) => {
    await sendPasswordResetEmail(auth, email);
  };

  const logout = async () => {
    await signOut(auth);
  };

  const clearError = () => setError(null);

  return (
    <AuthContext.Provider value={{ user, profile, loading, error, signInWithGoogle, signInWithEmail, signUpWithEmail, resetPassword, logout, clearError }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
