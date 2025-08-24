import { AuthService } from '@/config/firebase';
import { User } from 'firebase/auth';
import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { BackendAuthService, UserProfile } from '../services/BackendAuthService';
import { GoogleAuthService } from '../services/GoogleAuthService';

interface AuthContextType {
  user: User | null;
  backendUser: UserProfile | null;
  loading: boolean;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string, displayName: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [backendUser, setBackendUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Initialize auth state
    const initializeAuth = async () => {
      try {
        // Check both Firebase and backend authentication
        const [firebaseUser, backendUser] = await Promise.all([
          AuthService.getCurrentUser().catch(() => null),
          BackendAuthService.getCurrentUser().catch(() => null),
        ]);
        
        setUser(firebaseUser);
        setBackendUser(backendUser);
      } catch (error) {
        console.error('Error initializing auth:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    // Listen to auth state changes (Firebase only)
    const unsubscribe = AuthService.onAuthStateChanged((user) => {
      setUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signInWithEmail = async (email: string, password: string) => {
    try {
      setLoading(true);
      const authResponse = await BackendAuthService.signInWithEmail({ email, password });
      const userProfile = await BackendAuthService.getCurrentUser();
      setBackendUser(userProfile);
      setUser(null); // Clear Firebase user when using backend auth
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signUpWithEmail = async (email: string, password: string, displayName: string) => {
    try {
      setLoading(true);
      const authResponse = await BackendAuthService.signUpWithEmail({ email, password });
      const userProfile = await BackendAuthService.getCurrentUser();
      setBackendUser(userProfile);
      setUser(null); // Clear Firebase user when using backend auth
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signInWithGoogle = async () => {
    try {
      setLoading(true);
      const user = await GoogleAuthService.signInWithGoogle();
      setUser(user);
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      // Sign out from both Firebase and backend
      await Promise.all([
        AuthService.signOut().catch(() => {}),
        BackendAuthService.signOut().catch(() => {}),
      ]);
      setUser(null);
      setBackendUser(null);
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const value: AuthContextType = {
    user,
    backendUser,
    loading,
    signInWithEmail,
    signUpWithEmail,
    signInWithGoogle,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
