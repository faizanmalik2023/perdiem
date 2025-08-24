import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { GoogleAuthProvider, signInWithCredential } from 'firebase/auth';
import { auth } from '../config/firebase';

export class GoogleAuthService {
  static async initialize(): Promise<void> {
    try {
      console.log('Initializing Google Sign-In...');
      
      GoogleSignin.configure({
        webClientId: process.env.GOOGLE_WEB_CLIENT_ID || '569189944977-o91447el70onqoc62jktt4vpt05nu3e7.apps.googleusercontent.com',
        // For iOS development, you might need to create a separate iOS client ID
        // in Google Cloud Console under APIs & Services > Credentials
        iosClientId: process.env.GOOGLE_IOS_CLIENT_ID || '569189944977-fcjp8imqc5qntf6n30v26883ftftetb7.apps.googleusercontent.com',
        offlineAccess: true,
        forceCodeForRefreshToken: true,
      });
    
      console.log('Google Sign-In configured successfully');
    } catch (error) {
      console.error('Error configuring Google Sign-In:', error);
      throw error;
    }
  }

  static async signInWithGoogle(): Promise<any> {
    try {
      console.log('Starting Google Sign-In...');
      
      // Check if your device supports Google Play
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      console.log('Google Play Services check passed');
      
      // Check if user is already signed in
      const existingUser = await GoogleSignin.getCurrentUser();
      if (existingUser) {
        console.log('User is already signed in, signing out first...');
        await GoogleSignin.signOut();
      }
      
      // Sign in
      const userInfo = await GoogleSignin.signIn();
      console.log('Google Sign-In successful:', userInfo);
      
      // Get the users ID token
      const currentUser = await GoogleSignin.getCurrentUser();
      console.log('Current user after sign in:', currentUser);
      
      if (!currentUser || !currentUser.idToken) {
        throw new Error('Failed to get ID token from Google Sign-In');
      }
      
      const { idToken } = currentUser;
      console.log('Got ID token successfully');
      
      // Create a Google credential with the token
      const credential = GoogleAuthProvider.credential(idToken);
      
      // Sign-in the user with the credential
      const result = await signInWithCredential(auth, credential);
      
      console.log('Firebase authentication successful:', result.user);
      return result.user;
    } catch (error: any) {
      console.error('Google Sign-In error:', error);
      
      // Provide more specific error messages
      if (error.code === 'SIGN_IN_CANCELLED') {
        throw new Error('Sign-in was cancelled by the user');
      } else if (error.code === 'PLAY_SERVICES_NOT_AVAILABLE') {
        throw new Error('Google Play Services is not available');
      } else if (error.code === 'SIGN_IN_REQUIRED') {
        throw new Error('Sign-in is required');
      } else if (error.code === 'INVALID_ACCOUNT') {
        throw new Error('Invalid account selected');
      } else if (error.code === 'SIGN_IN_FAILED') {
        throw new Error('Sign-in failed. Please check your Google account settings.');
      }
      
      throw error;
    }
  }

  static async signOut(): Promise<void> {
    try {
      await GoogleSignin.signOut();
      console.log('Google Sign-Out successful');
    } catch (error) {
      console.error('Google Sign-Out error:', error);
      throw error;
    }
  }

  static async isSignedIn(): Promise<boolean> {
    try {
      const currentUser = await GoogleSignin.getCurrentUser();
      return currentUser !== null;
    } catch (error) {
      console.error('Error checking sign-in status:', error);
      return false;
    }
  }

  static async getCurrentUser(): Promise<any> {
    try {
      return await GoogleSignin.getCurrentUser();
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  }
}
