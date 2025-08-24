# PerDiem Test App

A React Native/Expo application with comprehensive authentication, location services, store management, and appointment scheduling capabilities.

## 🚀 Features

- **🔐 Dual Authentication**: Firebase Google Sign-In + Backend Email/Password
- **📍 Location Services**: Dynamic timezone management (Local vs NYC/LA)
- **🏪 Store Management**: Real-time store status with API integration
- **📅 Appointment Scheduling**: Date/time picker with 15-minute intervals
- **🔔 Push Notifications**: Store opening reminders
- **💾 State Persistence**: AsyncStorage for user preferences
- **🌙 Dark/Light Mode**: Full theme support
- **📱 Responsive UI**: Optimized for mobile devices

## 📋 Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Expo CLI (`npm install -g @expo/cli`)
- iOS Simulator (for iOS testing) or Android Emulator
- Expo Go app (for device testing)

## 🛠️ Setup Instructions

### 1. Clone and Install Dependencies

```bash
# Clone the repository
git clone <repository-url>
cd test-app

# Install dependencies
npm install
```

### 2. Environment Configuration

#### Firebase Setup (for Google Sign-In)
1. Create a Firebase project at [Firebase Console](https://console.firebase.google.com/)
2. Enable Authentication with Google Sign-In
3. Add your app to Firebase project
4. Update `services/GoogleAuthService.ts` with your Firebase configuration:
   ```typescript
   const GOOGLE_CLIENT_ID = 'your-google-client-id';
   ```

#### Backend API Configuration
The app is configured to use the deployed backend at:
```
https://coding-challenge-pd-1a25b1a14f34.herokuapp.com
```

**API Endpoints:**
- `POST /auth/` - Email/password authentication
- `GET /auth/verify` - Token verification
- `GET /store-times/` - Store opening hours
- `GET /store-overrides/` - Store exceptions/holidays

### 3. Run the Application

```bash
# Start the development server
npx expo start

# For iOS Simulator
npx expo run:ios

# For Android Emulator
npx expo run:android

# For web development
npx expo start --web
```

### 4. Testing

1. **Open Expo Go** on your device or use simulator
2. **Scan QR code** from terminal or enter URL manually
3. **Test Authentication**:
   - Email/password sign up/sign in
   - Google Sign-In
4. **Test Features**:
   - Location access
   - Timezone toggle
   - Date/time selection
   - Store status
   - Push notifications

## 🏗️ Project Structure

```
test-app/
├── app/                    # Expo Router pages
│   ├── auth/              # Authentication screens
│   │   ├── login.tsx      # Login screen
│   │   └── signup.tsx     # Signup screen
│   ├── _layout.tsx        # Root layout
│   └── index.tsx          # Home screen
├── components/            # Reusable components
│   ├── AuthWrapper.tsx    # Authentication wrapper
│   ├── DatePicker.tsx     # Date/time picker
│   └── ui/               # UI components
├── contexts/             # React Context providers
│   └── AuthContext.tsx   # Authentication context
├── services/             # Business logic services
│   ├── APIService.ts     # Backend API integration
│   ├── BackendAuthService.ts # Backend authentication
│   ├── DateTimeService.ts    # Date/time management
│   ├── GoogleAuthService.ts  # Google Sign-In
│   ├── LocationService.ts    # Location services
│   └── NotificationService.ts # Push notifications
├── constants/            # App constants
│   └── Colors.ts         # Theme colors
└── hooks/               # Custom React hooks
    └── useColorScheme.ts # Theme management
```

## 🔧 Technical Approach

### Architecture Decisions

1. **Service-Oriented Architecture**: Separated business logic into dedicated services
2. **Context API**: Used React Context for global state management
3. **AsyncStorage**: Persistent state management for user preferences
4. **Expo Router**: File-based routing for navigation
5. **TypeScript**: Full type safety throughout the application

### Authentication Strategy

- **Dual Authentication**: Firebase for Google Sign-In, Backend API for email/password
- **Token Management**: JWT tokens stored securely in AsyncStorage
- **Session Persistence**: Automatic token verification and user profile caching
- **Graceful Fallbacks**: Handles authentication failures gracefully

### State Management

- **Local State**: React hooks for component-specific state
- **Global State**: Context API for authentication and theme
- **Persistent State**: AsyncStorage for user preferences and selections
- **Real-time Updates**: Automatic store status and greeting updates

### Location & Timezone Management

- **Dynamic Detection**: Automatic user location detection
- **Timezone Toggle**: Switch between local and alternative timezone (NYC/LA)
- **Greeting Messages**: Time-based greetings with city names
- **Store Hours**: Timezone-aware store status calculation

## ⚠️ Assumptions & Limitations

### Assumptions

1. **Backend API**: Assumes backend is always available and returns expected data formats
2. **Location Services**: Assumes user grants location permissions
3. **Notification Permissions**: Assumes user grants notification permissions
4. **Network Connectivity**: Assumes stable internet connection for API calls
5. **Device Capabilities**: Assumes device supports location and notification services

### Limitations

1. **Expo Go Restrictions**: Some native features may be limited in Expo Go
2. **Google Sign-In**: Requires proper Firebase configuration and Google Cloud Console setup
3. **Location Accuracy**: Depends on device GPS and network location services
4. **Notification Timing**: Push notifications may be delayed on some devices
5. **Offline Mode**: No offline functionality - requires internet connection
6. **Browser Limitations**: Some features may not work in web browser

### Known Issues

1. **iOS Simulator**: Google Sign-In may not work in iOS Simulator
2. **Expo Go**: Some native modules may have limitations
3. **Development Build**: Requires development build for full native functionality

## 🎥 Demo Video

**Loom Video Link**: [Add your Loom video link here]

*Note: Replace the placeholder with your actual Loom video URL once recorded.*

## 🧪 Testing Checklist

### Authentication
- [ ] Email/password sign up
- [ ] Email/password sign in
- [ ] Google Sign-In
- [ ] Logout functionality
- [ ] Session persistence

### Location & Timezone
- [ ] Location permission request
- [ ] Timezone toggle functionality
- [ ] Greeting message updates
- [ ] City name display

### Store Management
- [ ] Store status display
- [ ] Real-time status updates
- [ ] API integration
- [ ] Error handling

### Appointment Scheduling
- [ ] Date picker functionality
- [ ] Time slot selection
- [ ] Bottom sheet mode
- [ ] Full screen mode
- [ ] Selection persistence

### Notifications
- [ ] Permission requests
- [ ] Notification scheduling
- [ ] Toggle functionality
- [ ] Next notification display

## 🚀 Deployment

### Expo Build

```bash
# Build for iOS
eas build --platform ios

# Build for Android
eas build --platform android

# Submit to stores
eas submit --platform ios
eas submit --platform android
```

### Environment Variables

Create `.env` file for production:
```env
EXPO_PUBLIC_FIREBASE_CLIENT_ID=your-firebase-client-id
EXPO_PUBLIC_BACKEND_URL=https://your-backend-url.com
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the troubleshooting section below
- Review the Expo documentation

## 🔧 Troubleshooting

### Common Issues

1. **Google Sign-In Not Working**
   - Verify Firebase configuration
   - Check Google Cloud Console settings
   - Ensure redirect URIs are correct

2. **Location Not Working**
   - Check device location permissions
   - Verify location services are enabled
   - Test on physical device vs simulator

3. **Notifications Not Working**
   - Check notification permissions
   - Verify device notification settings
   - Test on physical device

4. **API Errors**
   - Check network connectivity
   - Verify backend URL is correct
   - Check API response format

### Development Tips

- Use `console.log` for debugging
- Check Expo logs in terminal
- Test on physical device for full functionality
- Use Expo DevTools for debugging

---

**Built with ❤️ using React Native, Expo, and TypeScript**
