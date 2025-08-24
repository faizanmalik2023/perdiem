import { BackendAuthService, UserProfile } from '../../services/BackendAuthService';
import { GoogleAuthService } from '../../services/GoogleAuthService';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// Mock fetch
global.fetch = jest.fn();

describe('BackendAuthService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (fetch as jest.Mock).mockClear();
  });

  describe('Email/Password Authentication', () => {
    test('should sign in with email and password successfully', async () => {
      const mockResponse = { token: 'mock-jwt-token' };
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const credentials = {
        email: 'test@example.com',
        password: 'password123',
      };

      const result = await BackendAuthService.signInWithEmail(credentials);

      expect(fetch).toHaveBeenCalledWith(
        'https://coding-challenge-pd-1a25b1a14f34.herokuapp.com/auth/',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(credentials),
        }
      );
      expect(result).toEqual(mockResponse);
    });

    test('should handle sign in errors', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ message: 'Invalid credentials' }),
      });

      const credentials = {
        email: 'invalid@example.com',
        password: 'wrongpassword',
      };

      await expect(BackendAuthService.signInWithEmail(credentials)).rejects.toThrow('Invalid credentials');
    });

    test('should sign up with email and password', async () => {
      const mockResponse = { token: 'mock-jwt-token' };
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const credentials = {
        email: 'newuser@example.com',
        password: 'password123',
      };

      const result = await BackendAuthService.signUpWithEmail(credentials);

      expect(fetch).toHaveBeenCalledWith(
        'https://coding-challenge-pd-1a25b1a14f34.herokuapp.com/auth/',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(credentials),
        }
      );
      expect(result).toEqual(mockResponse);
    });
  });

  describe('Token Management', () => {
    test('should verify token successfully', async () => {
      const mockUserProfile: UserProfile = {
        email: 'test@example.com',
        name: 'Test User',
        userId: 'user123',
        role: 'user',
        permissions: ['read', 'write'],
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockUserProfile,
      });

      const result = await BackendAuthService.verifyToken('valid-token');

      expect(fetch).toHaveBeenCalledWith(
        'https://coding-challenge-pd-1a25b1a14f34.herokuapp.com/auth/verify',
        {
          method: 'GET',
          headers: {
            'Authorization': 'Bearer valid-token',
            'Content-Type': 'application/json',
          },
        }
      );
      expect(result).toEqual(mockUserProfile);
    });

    test('should handle token verification errors', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ message: 'Invalid token' }),
      });

      await expect(BackendAuthService.verifyToken('invalid-token')).rejects.toThrow('Invalid token');
    });

    test('should store and retrieve token', async () => {
      const token = 'mock-jwt-token';
      
      // Test storing token
      await BackendAuthService['storeToken'](token);
      
      // Test retrieving token
      const storedToken = await BackendAuthService.getStoredToken();
      expect(storedToken).toBe(token);
    });
  });

  describe('User Profile Management', () => {
    test('should fetch and store user profile', async () => {
      const mockUserProfile: UserProfile = {
        email: 'test@example.com',
        name: 'Test User',
        userId: 'user123',
        role: 'user',
        permissions: ['read', 'write'],
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockUserProfile,
      });

      await BackendAuthService['fetchAndStoreUserProfile']('valid-token');
      
      const storedProfile = await BackendAuthService.getStoredUserProfile();
      expect(storedProfile).toEqual(mockUserProfile);
    });

    test('should get current user', async () => {
      const mockUserProfile: UserProfile = {
        email: 'test@example.com',
        name: 'Test User',
        userId: 'user123',
        role: 'user',
        permissions: ['read', 'write'],
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      };

      // Mock stored token
      await BackendAuthService['storeToken']('valid-token');
      
      // Mock stored profile
      await BackendAuthService['fetchAndStoreUserProfile']('valid-token');

      const currentUser = await BackendAuthService.getCurrentUser();
      expect(currentUser).toEqual(mockUserProfile);
    });
  });

  describe('Authentication State', () => {
    test('should check if user is authenticated', async () => {
      const mockUserProfile: UserProfile = {
        email: 'test@example.com',
        name: 'Test User',
        userId: 'user123',
        role: 'user',
        permissions: ['read', 'write'],
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      };

      // Mock successful authentication
      await BackendAuthService['storeToken']('valid-token');
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockUserProfile,
      });

      const isAuthenticated = await BackendAuthService.isAuthenticated();
      expect(isAuthenticated).toBe(true);
    });

    test('should handle authentication check failure', async () => {
      // Mock invalid token
      await BackendAuthService['storeToken']('invalid-token');
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ message: 'Invalid token' }),
      });

      const isAuthenticated = await BackendAuthService.isAuthenticated();
      expect(isAuthenticated).toBe(false);
    });

    test('should sign out and clear data', async () => {
      // Mock stored data
      await BackendAuthService['storeToken']('valid-token');
      await BackendAuthService['fetchAndStoreUserProfile']('valid-token');

      await BackendAuthService.signOut();

      const storedToken = await BackendAuthService.getStoredToken();
      const storedProfile = await BackendAuthService.getStoredUserProfile();

      expect(storedToken).toBeNull();
      expect(storedProfile).toBeNull();
    });
  });
});

describe('GoogleAuthService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Initialization', () => {
    test('should initialize Google Sign-In', async () => {
      const mockConfigure = jest.fn();
      jest.doMock('@react-native-google-signin/google-signin', () => ({
        GoogleSignin: {
          configure: mockConfigure,
        },
      }));

      await GoogleAuthService.initialize();

      expect(mockConfigure).toHaveBeenCalledWith({
        webClientId: expect.any(String),
        iosClientId: expect.any(String),
        offlineAccess: true,
        forceCodeForRefreshToken: true,
      });
    });
  });

  describe('Sign In Process', () => {
    test('should handle Google Sign-In flow', async () => {
      const mockHasPlayServices = jest.fn().mockResolvedValue(true);
      const mockSignIn = jest.fn().mockResolvedValue({
        user: { id: 'google-user-123', email: 'test@gmail.com' },
      });
      const mockGetCurrentUser = jest.fn().mockResolvedValue({
        idToken: 'google-id-token',
      });

      jest.doMock('@react-native-google-signin/google-signin', () => ({
        GoogleSignin: {
          hasPlayServices: mockHasPlayServices,
          signIn: mockSignIn,
          getCurrentUser: mockGetCurrentUser,
        },
      }));

      const mockSignInWithCredential = jest.fn().mockResolvedValue({
        user: { displayName: 'Test User' },
      });

      jest.doMock('firebase/auth', () => ({
        GoogleAuthProvider: {
          credential: jest.fn().mockReturnValue('mock-credential'),
        },
        signInWithCredential: mockSignInWithCredential,
      }));

      const result = await GoogleAuthService.signInWithGoogle();

      expect(mockHasPlayServices).toHaveBeenCalled();
      expect(mockSignIn).toHaveBeenCalled();
      expect(mockGetCurrentUser).toHaveBeenCalled();
      expect(mockSignInWithCredential).toHaveBeenCalled();
      expect(result).toEqual({ displayName: 'Test User' });
    });

    test('should handle Google Sign-In errors', async () => {
      const mockHasPlayServices = jest.fn().mockRejectedValue(new Error('Play Services not available'));

      jest.doMock('@react-native-google-signin/google-signin', () => ({
        GoogleSignin: {
          hasPlayServices: mockHasPlayServices,
        },
      }));

      await expect(GoogleAuthService.signInWithGoogle()).rejects.toThrow('Play Services not available');
    });

    test('should handle missing ID token', async () => {
      const mockHasPlayServices = jest.fn().mockResolvedValue(true);
      const mockSignIn = jest.fn().mockResolvedValue({
        user: { id: 'google-user-123' },
      });
      const mockGetCurrentUser = jest.fn().mockResolvedValue(null);

      jest.doMock('@react-native-google-signin/google-signin', () => ({
        GoogleSignin: {
          hasPlayServices: mockHasPlayServices,
          signIn: mockSignIn,
          getCurrentUser: mockGetCurrentUser,
        },
      }));

      await expect(GoogleAuthService.signInWithGoogle()).rejects.toThrow('Failed to get ID token from Google Sign-In');
    });
  });

  describe('Sign Out Process', () => {
    test('should sign out from Google', async () => {
      const mockSignOut = jest.fn().mockResolvedValue(undefined);

      jest.doMock('@react-native-google-signin/google-signin', () => ({
        GoogleSignin: {
          signOut: mockSignOut,
        },
      }));

      await GoogleAuthService.signOut();

      expect(mockSignOut).toHaveBeenCalled();
    });

    test('should handle sign out errors', async () => {
      const mockSignOut = jest.fn().mockRejectedValue(new Error('Sign out failed'));

      jest.doMock('@react-native-google-signin/google-signin', () => ({
        GoogleSignin: {
          signOut: mockSignOut,
        },
      }));

      await expect(GoogleAuthService.signOut()).rejects.toThrow('Sign out failed');
    });
  });

  describe('User State Management', () => {
    test('should check if user is signed in', async () => {
      const mockGetCurrentUser = jest.fn().mockResolvedValue({
        id: 'google-user-123',
        email: 'test@gmail.com',
      });

      jest.doMock('@react-native-google-signin/google-signin', () => ({
        GoogleSignin: {
          getCurrentUser: mockGetCurrentUser,
        },
      }));

      const isSignedIn = await GoogleAuthService.isSignedIn();
      expect(isSignedIn).toBe(true);
    });

    test('should return false when no user is signed in', async () => {
      const mockGetCurrentUser = jest.fn().mockResolvedValue(null);

      jest.doMock('@react-native-google-signin/google-signin', () => ({
        GoogleSignin: {
          getCurrentUser: mockGetCurrentUser,
        },
      }));

      const isSignedIn = await GoogleAuthService.isSignedIn();
      expect(isSignedIn).toBe(false);
    });

    test('should get current user details', async () => {
      const mockUser = {
        id: 'google-user-123',
        email: 'test@gmail.com',
        displayName: 'Test User',
      };

      const mockGetCurrentUser = jest.fn().mockResolvedValue(mockUser);

      jest.doMock('@react-native-google-signin/google-signin', () => ({
        GoogleSignin: {
          getCurrentUser: mockGetCurrentUser,
        },
      }));

      const currentUser = await GoogleAuthService.getCurrentUser();
      expect(currentUser).toEqual(mockUser);
    });
  });
});
