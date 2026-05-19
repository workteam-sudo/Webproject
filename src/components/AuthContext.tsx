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
  signInWithGoogle: (role?: UserRole) => Promise<void>;
  signInWithEmail: (email: string, pass: string) => Promise<void>;
  signUpWithEmail: (email: string, pass: string, name: string, role: UserRole) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        // Immediate check for super-admin by email
        const isSuperAdmin = user.email === 'workt1282@gmail.com';
        const storedRole = localStorage.getItem('intended_role');
        
        try {
          const docRef = doc(db, 'users', user.uid);
          const docSnap = await getDoc(docRef);
          
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
            localStorage.removeItem('intended_role');
          } else {
            // No profile exists. System Admin bypass logic.
            if (isSuperAdmin || storedRole === 'admin') {
              const newProfile: UserProfile = {
                uid: user.uid,
                email: user.email || '',
                name: localStorage.getItem('intended_name') || user.displayName || (isSuperAdmin ? 'Super Admin' : 'System Administrator'),
                role: 'admin',
                createdAt: serverTimestamp(),
              };
              await setDoc(docRef, newProfile);
              setProfile(newProfile);
              localStorage.removeItem('intended_name');
            } else {
              // Faculty and students are NOT allowed to bypass profile checks.
              // They must be added by an admin first.
              await signOut(auth);
              setProfile(null);
            }
            localStorage.removeItem('intended_role');
          }
        } catch (err) {
          console.error("Auth sync error:", err);
          // If Firestore fails (e.g. permission or quota), but they are super admin, let them in with mock profile
          if (isSuperAdmin) {
            setProfile({
              uid: user.uid,
              email: user.email || '',
              name: 'Super Admin (Emergency)',
              role: 'admin',
              createdAt: new Date()
            });
          } else {
            setProfile(null);
          }
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
    await signInWithEmailAndPassword(auth, email, pass);
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

  return (
    <AuthContext.Provider value={{ user, profile, loading, signInWithGoogle, signInWithEmail, signUpWithEmail, resetPassword, logout }}>
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
