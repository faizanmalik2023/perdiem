// Mock user database
const mockUsers = [
  {
    uid: 'user-1',
    email: 'test@example.com',
    password: 'password123',
    displayName: 'Test User',
    photoURL: null,
  },
  {
    uid: 'user-2',
    email: 'demo@example.com',
    password: 'demo123',
    displayName: 'Demo User',
    photoURL: null,
  },
];

// Mock authentication API
export class MockAuthAPI {
  static async login(email: string, password: string) {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    const user = mockUsers.find(u => u.email === email && u.password === password);
    
    if (!user) {
      throw new Error('Invalid credentials');
    }

    return {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
    };
  }

  static async signup(email: string, password: string, displayName: string) {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Check if user already exists
    const existingUser = mockUsers.find(u => u.email === email);
    if (existingUser) {
      throw new Error('User already exists');
    }

    // Create new user
    const newUser = {
      uid: `user-${Date.now()}`,
      email,
      password,
      displayName,
      photoURL: null,
    };

    mockUsers.push(newUser);

    return {
      uid: newUser.uid,
      email: newUser.email,
      displayName: newUser.displayName,
      photoURL: newUser.photoURL,
    };
  }
}
