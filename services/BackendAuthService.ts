import AsyncStorage from '@react-native-async-storage/async-storage';

export interface AuthResponse {
  token: string;
}

export interface UserProfile {
  email: string;
  name: string;
  userId: string;
  role: string;
  permissions: string[];
  createdAt: string;
  updatedAt: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export class BackendAuthService {
  private static readonly BASE_URL = 'https://coding-challenge-pd-1a25b1a14f34.herokuapp.com';
  private static readonly STORAGE_KEY = '@auth_token';
  private static readonly USER_PROFILE_KEY = '@user_profile';

  /**
   * Sign in with email and password
   */
  static async signInWithEmail(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      console.log('Signing in with backend API...');
      
      const response = await fetch(`${this.BASE_URL}/auth/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const authData: AuthResponse = await response.json();
      
      // Store the token
      await this.storeToken(authData.token);
      
      // Fetch and store user profile
      await this.fetchAndStoreUserProfile(authData.token);
      
      console.log('Backend sign in successful');
      return authData;
    } catch (error) {
      console.error('Backend sign in error:', error);
      throw error;
    }
  }

  /**
   * Sign up with email and password (uses same endpoint as sign in)
   */
  static async signUpWithEmail(credentials: LoginCredentials): Promise<AuthResponse> {
    // For now, using the same endpoint for both sign up and sign in
    // The backend should handle user creation if the user doesn't exist
    return this.signInWithEmail(credentials);
  }

  /**
   * Verify token and get user profile
   */
  static async verifyToken(token: string): Promise<UserProfile> {
    try {
      console.log('Verifying token with backend...');
      
      const response = await fetch(`${this.BASE_URL}/auth/verify`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const userProfile: UserProfile = await response.json();
      console.log('Token verification successful:', userProfile);
      return userProfile;
    } catch (error) {
      console.error('Token verification error:', error);
      throw error;
    }
  }

  /**
   * Get stored token
   */
  static async getStoredToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(this.STORAGE_KEY);
    } catch (error) {
      console.error('Error getting stored token:', error);
      return null;
    }
  }

  /**
   * Store token
   */
  private static async storeToken(token: string): Promise<void> {
    try {
      await AsyncStorage.setItem(this.STORAGE_KEY, token);
      console.log('Token stored successfully');
    } catch (error) {
      console.error('Error storing token:', error);
      throw error;
    }
  }

  /**
   * Fetch and store user profile
   */
  private static async fetchAndStoreUserProfile(token: string): Promise<void> {
    try {
      const userProfile = await this.verifyToken(token);
      await AsyncStorage.setItem(this.USER_PROFILE_KEY, JSON.stringify(userProfile));
      console.log('User profile stored successfully');
    } catch (error) {
      console.error('Error fetching and storing user profile:', error);
      throw error;
    }
  }

  /**
   * Get stored user profile
   */
  static async getStoredUserProfile(): Promise<UserProfile | null> {
    try {
      const profileString = await AsyncStorage.getItem(this.USER_PROFILE_KEY);
      if (profileString) {
        return JSON.parse(profileString);
      }
      return null;
    } catch (error) {
      console.error('Error getting stored user profile:', error);
      return null;
    }
  }

  /**
   * Check if user is authenticated
   */
  static async isAuthenticated(): Promise<boolean> {
    try {
      const token = await this.getStoredToken();
      if (!token) {
        return false;
      }

      // Verify token is still valid
      await this.verifyToken(token);
      return true;
    } catch (error) {
      console.error('Authentication check failed:', error);
      // If verification fails, clear stored data
      await this.signOut();
      return false;
    }
  }

  /**
   * Sign out
   */
  static async signOut(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([this.STORAGE_KEY, this.USER_PROFILE_KEY]);
      console.log('Sign out successful - cleared stored data');
    } catch (error) {
      console.error('Error during sign out:', error);
    }
  }

  /**
   * Get current user profile (from storage or API)
   */
  static async getCurrentUser(): Promise<UserProfile | null> {
    try {
      const token = await this.getStoredToken();
      if (!token) {
        return null;
      }

      // Try to get from storage first
      let userProfile = await this.getStoredUserProfile();
      
      // If not in storage or token might be stale, fetch from API
      if (!userProfile) {
        userProfile = await this.verifyToken(token);
        await AsyncStorage.setItem(this.USER_PROFILE_KEY, JSON.stringify(userProfile));
      }

      return userProfile;
    } catch (error) {
      console.error('Error getting current user:', error);
      await this.signOut(); // Clear invalid data
      return null;
    }
  }
}
