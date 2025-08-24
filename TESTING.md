# Testing Guide

This document provides comprehensive testing guidelines and test cases for the Perdiem Test App.

## 🧪 Test Structure

```
__tests__/
├── setup.ts                    # Test setup and mocks
├── App.test.tsx               # Main app integration tests
└── services/
    ├── DateTimeService.test.ts # Date/time service tests
    └── AuthServices.test.ts    # Authentication service tests
```

## 🚀 Running Tests

### Basic Test Commands
```bash
# Run all tests
npm test

# Run tests in watch mode (for development)
npm run test:watch

# Run tests with coverage report
npm run test:coverage

# Run tests in CI mode
npm run test:ci
```

### Test Coverage
The test suite aims for 70% code coverage across:
- Branches: 70%
- Functions: 70%
- Lines: 70%
- Statements: 70%

## 📋 Test Categories

### 1. Authentication Flow Tests

#### Email/Password Authentication
- ✅ User can sign in with valid credentials
- ✅ User can sign up with new credentials
- ✅ Error handling for invalid credentials
- ✅ Token storage and retrieval
- ✅ User profile management
- ✅ Authentication state persistence

#### Google Sign-In
- ✅ Google Sign-In initialization
- ✅ Successful Google Sign-In flow
- ✅ Error handling for Google Sign-In failures
- ✅ Google Sign-Out functionality
- ✅ User state management

### 2. Home Screen Functionality Tests

#### UI Components
- ✅ Greeting message display
- ✅ User welcome message
- ✅ Timezone toggle functionality
- ✅ Store status indicator
- ✅ Date picker button
- ✅ Safe area handling

#### Date and Time Selection
- ✅ Date selection functionality
- ✅ Time slot generation (15-minute intervals)
- ✅ Selected date/time display
- ✅ Date picker modal/bottom sheet

### 3. DateTimeService Tests

#### Greeting Messages
- ✅ "Good Morning" (5:00-9:59 AM)
- ✅ "Late Morning Vibes" (10:00-11:59 AM)
- ✅ "Good Afternoon" (12:00-4:59 PM)
- ✅ "Good Evening" (5:00-8:59 PM)
- ✅ "Night Owl" (9:00 PM-4:59 AM)
- ✅ Different city name handling

#### Timezone Management
- ✅ Local vs NYC timezone toggle
- ✅ City name display based on timezone
- ✅ Timezone preference persistence

#### Store Hours
- ✅ Store open/closed status
- ✅ Store overrides (holidays)
- ✅ Store hours retrieval

### 4. Location Services Tests

#### Location Permissions
- ✅ Location permission request
- ✅ Current location retrieval
- ✅ City/region detection
- ✅ Error handling for location failures

### 5. Notification Services Tests

#### Push Notifications
- ✅ Notification permission request
- ✅ Store opening reminder scheduling
- ✅ Notification cancellation
- ✅ Error handling

### 6. Error Handling Tests

#### Authentication Errors
- ✅ Invalid credentials handling
- ✅ Network error handling
- ✅ Token expiration handling
- ✅ Google Sign-In cancellation

#### Service Errors
- ✅ Location service failures
- ✅ Notification service failures
- ✅ API service failures

### 7. UI/UX Tests

#### Styling and Layout
- ✅ Button styling (no grey text on grey background)
- ✅ Safe area handling (no content under notch)
- ✅ Loading states
- ✅ Error states

#### User Interactions
- ✅ Form validation
- ✅ Button press handling
- ✅ Modal interactions
- ✅ Toggle functionality

## 🔧 Test Configuration

### Jest Configuration (`jest.config.js`)
- React Native preset
- TypeScript support
- Coverage thresholds
- Mock configurations
- Transform patterns

### Test Setup (`__tests__/setup.ts`)
- AsyncStorage mocking
- Expo services mocking
- Navigation mocking
- Console error suppression

## 📊 Test Coverage Areas

### High Priority (Critical Paths)
1. **Authentication Flow**
   - Login/Signup success/failure
   - Token management
   - User session persistence

2. **Core App Functionality**
   - Home screen rendering
   - Date/time selection
   - Store status display

3. **Service Integration**
   - Backend API calls
   - Firebase integration
   - Location services

### Medium Priority (Important Features)
1. **User Experience**
   - UI responsiveness
   - Error handling
   - Loading states

2. **Data Persistence**
   - User preferences
   - Selected date/time
   - Timezone settings

### Low Priority (Edge Cases)
1. **Error Scenarios**
   - Network failures
   - Service unavailability
   - Invalid data handling

## 🐛 Common Test Issues & Solutions

### 1. Mock Configuration
```typescript
// If a service is not properly mocked
jest.mock('../services/ServiceName', () => ({
  ServiceName: {
    methodName: jest.fn(),
  },
}));
```

### 2. Async Testing
```typescript
// Always use waitFor for async operations
await waitFor(() => {
  expect(mockFunction).toHaveBeenCalled();
});
```

### 3. Component Rendering
```typescript
// Wrap components with necessary providers
render(
  <AuthProvider>
    <Component />
  </AuthProvider>
);
```

## 📈 Performance Testing

### Memory Usage
- Monitor component re-renders
- Check for memory leaks in long-running tests
- Verify cleanup in useEffect hooks

### Network Performance
- Mock API response times
- Test timeout scenarios
- Verify retry mechanisms

## 🔍 Manual Testing Checklist

### Authentication
- [ ] Email/password login with valid credentials
- [ ] Email/password login with invalid credentials
- [ ] Google Sign-In flow
- [ ] Sign out functionality
- [ ] Session persistence after app restart

### Home Screen
- [ ] Greeting message displays correctly
- [ ] Timezone toggle works
- [ ] Store status indicator shows correct state
- [ ] Date picker opens and functions
- [ ] Selected date/time displays correctly

### Location Services
- [ ] Location permission request appears
- [ ] Current location is detected
- [ ] City name displays correctly
- [ ] Timezone updates based on location

### Notifications
- [ ] Notification permission request appears
- [ ] Store opening reminder can be toggled
- [ ] Notifications are scheduled correctly

### UI/UX
- [ ] All buttons are visible and clickable
- [ ] Text is readable (no grey on grey)
- [ ] Content doesn't hide under notch
- [ ] Loading states display correctly
- [ ] Error messages are clear

## 🚨 Known Test Limitations

1. **Native Modules**: Some native modules may not work in test environment
2. **Platform Differences**: iOS/Android specific features may need separate testing
3. **Real Device Testing**: Some features require testing on actual devices
4. **Network Dependencies**: API tests require proper mocking

## 📝 Adding New Tests

### For New Components
1. Create test file: `__tests__/components/ComponentName.test.tsx`
2. Import necessary mocks
3. Test rendering, interactions, and edge cases
4. Add to coverage configuration

### For New Services
1. Create test file: `__tests__/services/ServiceName.test.ts`
2. Mock dependencies
3. Test all public methods
4. Test error scenarios

### For New Features
1. Add integration tests to `App.test.tsx`
2. Add unit tests for specific functionality
3. Update manual testing checklist
4. Update coverage thresholds if needed

## 🎯 Best Practices

1. **Test Naming**: Use descriptive test names that explain the scenario
2. **Arrange-Act-Assert**: Structure tests with clear sections
3. **Mock Minimally**: Only mock what's necessary
4. **Test Edge Cases**: Include error scenarios and boundary conditions
5. **Keep Tests Fast**: Avoid unnecessary async operations
6. **Maintain Coverage**: Aim for high coverage but focus on critical paths
7. **Document Changes**: Update this guide when adding new test patterns
