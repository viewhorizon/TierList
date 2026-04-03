// src/context/AuthContext.tsx
// Firebase Auth — sesión, permisos y token para backend

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { initializeApp, FirebaseApp } from 'firebase/app';
import {
  getAuth, Auth, User as FirebaseUser,
  onAuthStateChanged, signInWithEmailAndPassword,
  createUserWithEmailAndPassword, signOut,
  GoogleAuthProvider, signInWithPopup,
} from 'firebase/auth';

// Config desde variables de entorno — nunca hardcodear
const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID,
};

let app: FirebaseApp | null = null;
let auth: Auth | null = null;

// Firebase sólo se inicializa si las variables están configuradas
const isFirebaseConfigured = Object.values(firebaseConfig).every(Boolean);
if (isFirebaseConfigured) {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
}

interface AuthContextValue {
  user: FirebaseUser | null;
  token: string | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  getToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth) {
      // Modo demo sin Firebase: usuario simulado para desarrollo
      setUser(null);
      setLoading(false);
      return;
    }

    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        const t = await firebaseUser.getIdToken();
        setToken(t);
      } else {
        setToken(null);
      }
      setLoading(false);
    });

    return unsub;
  }, []);

  const getToken = async (): Promise<string | null> => {
    if (!user) return null;
    const t = await user.getIdToken(false);
    setToken(t);
    return t;
  };

  const login = async (email: string, password: string) => {
    if (!auth) throw new Error('Firebase no configurado');
    await signInWithEmailAndPassword(auth, email, password);
  };

  const loginWithGoogle = async () => {
    if (!auth) throw new Error('Firebase no configurado');
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  };

  const register = async (email: string, password: string) => {
    if (!auth) throw new Error('Firebase no configurado');
    await createUserWithEmailAndPassword(auth, email, password);
  };

  const logout = async () => {
    if (auth) await signOut(auth);
    setUser(null);
    setToken(null);
  };

  return (
    <AuthContext.Provider value={{
      user, token, loading,
      isAuthenticated: !!user,
      login, loginWithGoogle, register, logout, getToken,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return ctx;
}
