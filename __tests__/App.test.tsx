import React from 'react';
import { render, fireEvent, waitFor, screen } from '@testing-library/react-native';
import { AuthProvider } from '../contexts/AuthContext';
import HomeScreen from '../app/index';
import LoginScreen from '../app/auth/login';
import SignupScreen from '../app/auth/signup';

// Mock the services
jest.mock('../services/GoogleAuthService', () => ({
  GoogleAuthService: {
    initialize: jest.fn(),
    signInWithGoogle: jest.fn(),
    signOut: jest.fn(),
    isSignedIn: jest.fn(),
    getCurrentUser: jest.fn(),
  },
}));

jest.mock('../services/BackendAuthService', () => ({
  BackendAuthService: {
    signInWithEmail: jest.fn(),
    signUpWithEmail: jest.fn(),
    getCurrentUser: jest.fn(),
    signOut: jest.fn(),
  },
}));

jest.mock('../services/DateTimeService', () => ({
  DateTimeService: {
    initializeWithLocation: jest.fn(),
    getGreetingMessage: jest.fn(() => 'Good Morning, NYC!'),
    getSelectedDate: jest.fn(() => new Date()),
    getSelectedTimeSlot: jest.fn(() => '09:00'),
    isUsingAlternativeTimezone: jest.fn(() => false),
    toggleTimezone: jest.fn(),
    setSelectedDate: jest.fn(),
    setSelectedTimeSlot: jest.fn(),
    isStoreOpen: jest.fn(() => true),
  },
}));

jest.mock('../services/LocationService', () => ({
  LocationService: {
    requestLocationPermission: jest.fn(() => Promise.resolve(true)),
    getCurrentLocation: jest.fn(() => Promise.resolve({
      latitude: 40.7128,
      longitude: -74.0060,
      city: 'New York',
      region: 'NY',
    })),
    getAlternativeCityName: jest.fn(() => 'NYC'),
  },
}));

jest.mock('../services/NotificationService', () => ({
  NotificationService: {
    requestPermissions: jest.fn(() => Promise.resolve(true)),
    scheduleStoreOpeningReminder: jest.fn(() => Promise.resolve(true)),
    cancelStoreOpeningReminder: jest.fn(),
  },
}));

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

describe('App Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Authentication Flow', () => {
    test('should render login screen when user is not authenticated', () => {
      const { getByText, getByPlaceholderText } = render(
        <AuthProvider>
          <LoginScreen />
        </AuthProvider>
      );

      expect(getByText('Sign In')).toBeTruthy();
      expect(getByPlaceholderText('Email')).toBeTruthy();
      expect(getByPlaceholderText('Password')).toBeTruthy();
      expect(getByText('Sign In with Google')).toBeTruthy();
    });

    test('should handle email/password login successfully', async () => {
      const mockSignIn = require('../services/BackendAuthService').BackendAuthService.signInWithEmail;
      mockSignIn.mockResolvedValueOnce({ token: 'mock-token' });

      const { getByPlaceholderText, getByText } = render(
        <AuthProvider>
          <LoginScreen />
        </AuthProvider>
      );

      const emailInput = getByPlaceholderText('Email');
      const passwordInput = getByPlaceholderText('Password');
      const signInButton = getByText('Sign In');

      fireEvent.changeText(emailInput, 'test@example.com');
      fireEvent.changeText(passwordInput, 'password123');
      fireEvent.press(signInButton);

      await waitFor(() => {
        expect(mockSignIn).toHaveBeenCalledWith({
          email: 'test@example.com',
          password: 'password123',
        });
      });
    });

    test('should handle Google Sign-In successfully', async () => {
      const mockGoogleSignIn = require('../services/GoogleAuthService').GoogleAuthService.signInWithGoogle;
      mockGoogleSignIn.mockResolvedValueOnce({ user: { displayName: 'Test User' } });

      const { getByText } = render(
        <AuthProvider>
          <LoginScreen />
        </AuthProvider>
      );

      const googleSignInButton = getByText('Sign In with Google');
      fireEvent.press(googleSignInButton);

      await waitFor(() => {
        expect(mockGoogleSignIn).toHaveBeenCalled();
      });
    });

    test('should render signup screen with proper fields', () => {
      const { getByText, getByPlaceholderText } = render(
        <AuthProvider>
          <SignupScreen />
        </AuthProvider>
      );

      expect(getByText('Sign Up')).toBeTruthy();
      expect(getByPlaceholderText('Full Name')).toBeTruthy();
      expect(getByPlaceholderText('Email')).toBeTruthy();
      expect(getByPlaceholderText('Password')).toBeTruthy();
      expect(getByText('Sign Up with Google')).toBeTruthy();
    });
  });

  describe('Home Screen Functionality', () => {
    test('should display greeting message', () => {
      const { getByText } = render(
        <AuthProvider>
          <HomeScreen />
        </AuthProvider>
      );

      expect(getByText('Good Morning, NYC!')).toBeTruthy();
    });

    test('should display user welcome message', () => {
      const { getByText } = render(
        <AuthProvider>
          <HomeScreen />
        </AuthProvider>
      );

      expect(getByText(/Welcome,/)).toBeTruthy();
    });

    test('should show timezone toggle', () => {
      const { getByText } = render(
        <AuthProvider>
          <HomeScreen />
        </AuthProvider>
      );

      expect(getByText('NYC')).toBeTruthy();
    });

    test('should display store status indicator', () => {
      const { getByText } = render(
        <AuthProvider>
          <HomeScreen />
        </AuthProvider>
      );

      expect(getByText(/Store Status/)).toBeTruthy();
    });

    test('should show date picker button', () => {
      const { getByText } = render(
        <AuthProvider>
          <HomeScreen />
        </AuthProvider>
      );

      expect(getByText(/Select Date & Time/)).toBeTruthy();
    });
  });

  describe('Date and Time Selection', () => {
    test('should handle date selection', async () => {
      const mockSetSelectedDate = require('../services/DateTimeService').DateTimeService.setSelectedDate;
      
      const { getByText } = render(
        <AuthProvider>
          <HomeScreen />
        </AuthProvider>
      );

      const datePickerButton = getByText(/Select Date & Time/);
      fireEvent.press(datePickerButton);

      await waitFor(() => {
        expect(mockSetSelectedDate).toHaveBeenCalled();
      });
    });

    test('should display selected date and time', () => {
      const { getByText } = render(
        <AuthProvider>
          <HomeScreen />
        </AuthProvider>
      );

      // Should display current date and selected time slot
      expect(getByText(/09:00/)).toBeTruthy();
    });
  });

  describe('Location Services', () => {
    test('should request location permission on app start', async () => {
      const mockRequestPermission = require('../services/LocationService').LocationService.requestLocationPermission;
      
      render(
        <AuthProvider>
          <HomeScreen />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(mockRequestPermission).toHaveBeenCalled();
      });
    });

    test('should get current location', async () => {
      const mockGetLocation = require('../services/LocationService').LocationService.getCurrentLocation;
      
      render(
        <AuthProvider>
          <HomeScreen />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(mockGetLocation).toHaveBeenCalled();
      });
    });
  });

  describe('Notification Services', () => {
    test('should request notification permissions', async () => {
      const mockRequestPermissions = require('../services/NotificationService').NotificationService.requestPermissions;
      
      render(
        <AuthProvider>
          <HomeScreen />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(mockRequestPermissions).toHaveBeenCalled();
      });
    });

    test('should handle store opening reminder toggle', async () => {
      const mockScheduleReminder = require('../services/NotificationService').NotificationService.scheduleStoreOpeningReminder;
      
      const { getByText } = render(
        <AuthProvider>
          <HomeScreen />
        </AuthProvider>
      );

      const reminderButton = getByText(/Store Opening Reminder/);
      fireEvent.press(reminderButton);

      await waitFor(() => {
        expect(mockScheduleReminder).toHaveBeenCalled();
      });
    });
  });

  describe('Error Handling', () => {
    test('should handle login errors gracefully', async () => {
      const mockSignIn = require('../services/BackendAuthService').BackendAuthService.signInWithEmail;
      mockSignIn.mockRejectedValueOnce(new Error('Invalid credentials'));

      const { getByPlaceholderText, getByText } = render(
        <AuthProvider>
          <LoginScreen />
        </AuthProvider>
      );

      const emailInput = getByPlaceholderText('Email');
      const passwordInput = getByPlaceholderText('Password');
      const signInButton = getByText('Sign In');

      fireEvent.changeText(emailInput, 'invalid@example.com');
      fireEvent.changeText(passwordInput, 'wrongpassword');
      fireEvent.press(signInButton);

      await waitFor(() => {
        expect(mockSignIn).toHaveBeenCalledWith({
          email: 'invalid@example.com',
          password: 'wrongpassword',
        });
      });
    });

    test('should handle Google Sign-In errors', async () => {
      const mockGoogleSignIn = require('../services/GoogleAuthService').GoogleAuthService.signInWithGoogle;
      mockGoogleSignIn.mockRejectedValueOnce(new Error('Sign-in cancelled'));

      const { getByText } = render(
        <AuthProvider>
          <LoginScreen />
        </AuthProvider>
      );

      const googleSignInButton = getByText('Sign In with Google');
      fireEvent.press(googleSignInButton);

      await waitFor(() => {
        expect(mockGoogleSignIn).toHaveBeenCalled();
      });
    });
  });

  describe('UI/UX Tests', () => {
    test('should have proper button styling', () => {
      const { getByText } = render(
        <AuthProvider>
          <LoginScreen />
        </AuthProvider>
      );

      const signInButton = getByText('Sign In');
      expect(signInButton).toBeTruthy();
      // Check if button has proper styling (not grey text on grey background)
      expect(signInButton.props.style).toBeDefined();
    });

    test('should handle safe area properly', () => {
      const { getByText } = render(
        <AuthProvider>
          <HomeScreen />
        </AuthProvider>
      );

      // Greeting should be visible and not hidden under notch
      const greeting = getByText('Good Morning, NYC!');
      expect(greeting).toBeTruthy();
    });

    test('should display proper loading states', async () => {
      const mockSignIn = require('../services/BackendAuthService').BackendAuthService.signInWithEmail;
      mockSignIn.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 1000)));

      const { getByText, getByPlaceholderText } = render(
        <AuthProvider>
          <LoginScreen />
        </AuthProvider>
      );

      const emailInput = getByPlaceholderText('Email');
      const passwordInput = getByPlaceholderText('Password');
      const signInButton = getByText('Sign In');

      fireEvent.changeText(emailInput, 'test@example.com');
      fireEvent.changeText(passwordInput, 'password123');
      fireEvent.press(signInButton);

      // Should show loading state
      await waitFor(() => {
        expect(signInButton.props.disabled).toBe(true);
      });
    });
  });
});
