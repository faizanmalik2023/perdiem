import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApp, initializeApp } from 'firebase/app';
import { createUserWithEmailAndPassword, getAuth, GoogleAuthProvider, onAuthStateChanged, signInWithCredential, signInWithEmailAndPassword, signOut, updateProfile, User } from 'firebase/auth';

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY || "AIzaSyDd9jmHfcPU-KJctFe61S8DLNsqzm35OoI",
  authDomain: process.env.FIREBASE_AUTH_DOMAIN || "perdiem-745d2.firebaseapp.com",
  projectId: process.env.FIREBASE_PROJECT_ID || "perdiem-745d2",
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET || "perdiem-745d2.firebasestorage.app",
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || "569189944977",
  appId: process.env.FIREBASE_APP_ID || "1:569189944977:web:8afbf73e58f49edcd73930",
  measurementId: process.env.FIREBASE_MEASUREMENT_ID || "G-E30F397PBE"
};

// Initialize Firebase
let app;
try {
  app = initializeApp(firebaseConfig);
} catch (error) {
  // If app already exists, get the existing one
  app = getApp();
}

export const auth = getAuth(app);

// Google Auth Provider
const googleProvider = new GoogleAuthProvider();

// Storage keys
const USER_STORAGE_KEY = '@auth_user';

// Authentication service
export class AuthService {
  // Sign in with email and password (real Firebase)
  static async signInWithEmail(email: string, password: string): Promise<User> {
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      
      // Store user in AsyncStorage
      await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(result.user));
      
      return result.user;
    } catch (error) {
      throw error;
    }
  }

  // Sign up with email and password (real Firebase)
  static async signUpWithEmail(email: string, password: string, displayName: string): Promise<User> {
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      
      // Update the user's display name
      if (result.user) {
        await updateProfile(result.user, {
          displayName: displayName
        });
      }
      
      // Store user in AsyncStorage
      await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(result.user));
      
      return result.user;
    } catch (error) {
      throw error;
    }
  }

  // Sign in with Google
  static async signInWithGoogle(idToken: string): Promise<User> {
    try {
      const credential = GoogleAuthProvider.credential(idToken);
      const result = await signInWithCredential(auth, credential);
      
      // Store user in AsyncStorage
      await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(result.user));
      
      return result.user;
    } catch (error) {
      throw new Error('Google sign-in failed');
    }
  }

  // Sign out
  static async signOut(): Promise<void> {
    try {
      await signOut(auth);
      await AsyncStorage.removeItem(USER_STORAGE_KEY);
    } catch (error) {
      throw new Error('Sign out failed');
    }
  }

  // Get current user
  static async getCurrentUser(): Promise<User | null> {
    try {
      const userJson = await AsyncStorage.getItem(USER_STORAGE_KEY);
      if (userJson) {
        return JSON.parse(userJson);
      }
      return null;
    } catch (error) {
      return null;
    }
  }

  // Listen to auth state changes
  static onAuthStateChanged(callback: (user: User | null) => void): () => void {
    return onAuthStateChanged(auth, callback);
  }
}

export { googleProvider };
