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
                name: oldData.name || localStorage.getItem('intended_name') || user.displayName || 'User',
                role: oldData.role || (storedRole as UserRole) || 'student',
                updatedAt: serverTimestamp()
              };
              
              await setDoc(docRef, unifiedProfilebody);
              if (oldDoc.id !== user.uid) {
                await deleteDoc(doc(db, 'users', oldDoc.id));
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
            localStorage.removeItem('intended_role');
            localStorage.removeItem('intended_name');
          } else {
            // No profile exists at all. Create one.
            const role = (storedRole as UserRole) || (isSuperAdmin ? 'admin' : 'student');
            const name = localStorage.getItem('intended_name') || user.displayName || (isSuperAdmin ? 'Super Admin' : 'User');
            
            const newProfileBody: any = {
              uid: user.uid,
              email: user.email || '',
              name: name,
              role: role,
              createdAt: serverTimestamp(),
            };

            await setDoc(docRef, newProfileBody);
            setProfile({ ...newProfileBody, createdAt: new Date() });
            localStorage.removeItem('intended_role');
            localStorage.removeItem('intended_name');
          }
        } catch (err) {
          console.error("Auth sync error:", err);
          setError("Connection failed. Registry access unreachable.");
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
