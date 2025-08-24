# Authentication System

This project implements a comprehensive authentication system with the following features:

## Features

- **Email/Password Authentication**: Using a mocked API endpoint `/auth`
- **Google Sign-In**: Using Firebase Authentication and Expo Auth Session
- **State Persistence**: User authentication state is persisted using AsyncStorage
- **Clean Architecture**: Separation of concerns with services, contexts, and components

## Architecture

### Components

1. **AuthContext** (`contexts/AuthContext.tsx`)
   - Manages authentication state throughout the app
   - Provides authentication methods to components
   - Handles loading states and user persistence

2. **AuthWrapper** (`components/AuthWrapper.tsx`)
   - Protects routes that require authentication
   - Redirects unauthenticated users to login
   - Shows loading indicator during authentication checks

3. **Login Screen** (`app/auth/login.tsx`)
   - Email/password login form
   - Google sign-in button
   - Navigation to signup

4. **Signup Screen** (`app/auth/signup.tsx`)
   - User registration form
   - Google sign-in option
   - Navigation to login

### Services

1. **AuthService** (`config/firebase.ts`)
   - Handles all authentication operations
   - Integrates with Firebase for Google auth
   - Uses mock API for email/password auth
   - Manages AsyncStorage for persistence

2. **GoogleAuthService** (`services/GoogleAuthService.ts`)
   - Handles Google OAuth flow using Expo Auth Session
   - Manages OAuth tokens and credentials

3. **MockAuthAPI** (`utils/mockAuthAPI.ts`)
   - Simulates backend authentication API
   - Provides test users for development

## Setup Instructions

### 1. Firebase Configuration

Update the Firebase configuration in `config/firebase.ts`:

```typescript
const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "your-auth-domain",
  projectId: "your-project-id",
  storageBucket: "your-storage-bucket",
  messagingSenderId: "your-messaging-sender-id",
  appId: "your-app-id"
};
```

### 2. Google OAuth Setup

Update the Google OAuth configuration in `services/GoogleAuthService.ts`:

```typescript
const GOOGLE_CLIENT_ID = 'your-google-client-id.apps.googleusercontent.com';
```

### 3. App Scheme Configuration

Configure your app scheme in `app.json` for Google OAuth redirects.

## Usage

### Testing Email/Password Authentication

Use these test credentials:
- Email: `test@example.com`, Password: `password123`
- Email: `demo@example.com`, Password: `demo123`

### Authentication Flow

1. **App Launch**: AuthWrapper checks for existing user session
2. **Unauthenticated**: Redirects to login screen
3. **Login/Signup**: User authenticates via email/password or Google
4. **Success**: Redirects to main app with user information displayed
5. **Logout**: Clears session and redirects to login

### User Information Display

The home screen displays:
- User's display name in the welcome message
- Email address
- Profile picture availability (if using Google auth)

## Security Features

- **State Persistence**: Secure storage of user session
- **Error Handling**: Comprehensive error handling for all auth operations
- **Loading States**: Proper loading indicators during authentication
- **Input Validation**: Form validation for email/password fields

## Dependencies

- `firebase`: Firebase SDK for authentication
- `@react-native-async-storage/async-storage`: State persistence
- `expo-auth-session`: Google OAuth integration
- `expo-crypto`: Cryptographic functions for OAuth
- `expo-web-browser`: Web browser integration for OAuth

## Future Enhancements

- Password reset functionality
- Email verification
- Multi-factor authentication
- Social login providers (Facebook, Apple, etc.)
- Biometric authentication
