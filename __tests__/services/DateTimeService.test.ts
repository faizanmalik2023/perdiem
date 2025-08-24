import { DateTimeService } from '../../services/DateTimeService';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

describe('DateTimeService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Greeting Messages', () => {
    test('should return "Good Morning" for 5:00-9:59 AM', () => {
      const morningTime = new Date('2024-01-01T07:30:00');
      const greeting = DateTimeService.getGreetingMessage(morningTime, 'NYC');
      expect(greeting).toBe('Good Morning, NYC!');
    });

    test('should return "Late Morning Vibes" for 10:00-11:59 AM', () => {
      const lateMorningTime = new Date('2024-01-01T10:30:00');
      const greeting = DateTimeService.getGreetingMessage(lateMorningTime, 'NYC');
      expect(greeting).toBe('Late Morning Vibes! NYC');
    });

    test('should return "Good Afternoon" for 12:00-4:59 PM', () => {
      const afternoonTime = new Date('2024-01-01T14:30:00');
      const greeting = DateTimeService.getGreetingMessage(afternoonTime, 'NYC');
      expect(greeting).toBe('Good Afternoon, NYC!');
    });

    test('should return "Good Evening" for 5:00-8:59 PM', () => {
      const eveningTime = new Date('2024-01-01T18:30:00');
      const greeting = DateTimeService.getGreetingMessage(eveningTime, 'NYC');
      expect(greeting).toBe('Good Evening, NYC!');
    });

    test('should return "Night Owl" for 9:00 PM-4:59 AM', () => {
      const nightTime = new Date('2024-01-01T23:30:00');
      const greeting = DateTimeService.getGreetingMessage(nightTime, 'NYC');
      expect(greeting).toBe('Night Owl in NYC!');
    });

    test('should handle different city names', () => {
      const morningTime = new Date('2024-01-01T07:30:00');
      const greeting = DateTimeService.getGreetingMessage(morningTime, 'Los Angeles');
      expect(greeting).toBe('Good Morning, Los Angeles!');
    });
  });

  describe('Timezone Management', () => {
    test('should initialize with location data', async () => {
      const mockLocation = {
        latitude: 40.7128,
        longitude: -74.0060,
        city: 'New York',
        region: 'NY',
      };

      await DateTimeService.initializeWithLocation(mockLocation);
      expect(DateTimeService.getActiveCityName()).toBe('New York');
    });

    test('should toggle between local and NYC timezone', () => {
      DateTimeService.toggleTimezone();
      expect(DateTimeService.isUsingAlternativeTimezone()).toBe(true);

      DateTimeService.toggleTimezone();
      expect(DateTimeService.isUsingAlternativeTimezone()).toBe(false);
    });

    test('should get correct city name based on timezone', () => {
      expect(DateTimeService.getActiveCityName()).toBe('New York');
      
      DateTimeService.toggleTimezone();
      expect(DateTimeService.getActiveCityName()).toBe('NYC');
    });
  });

  describe('Date and Time Selection', () => {
    test('should set and get selected date', () => {
      const testDate = new Date('2024-01-15');
      DateTimeService.setSelectedDate(testDate);
      expect(DateTimeService.getSelectedDate()).toEqual(testDate);
    });

    test('should set and get selected time slot', () => {
      const timeSlot = '14:30';
      DateTimeService.setSelectedTimeSlot(timeSlot);
      expect(DateTimeService.getSelectedTimeSlot()).toBe(timeSlot);
    });

    test('should generate time slots for a given date', () => {
      const testDate = new Date('2024-01-15');
      const timeSlots = DateTimeService.generateTimeSlots(testDate);
      
      expect(timeSlots).toBeInstanceOf(Array);
      expect(timeSlots.length).toBeGreaterThan(0);
      expect(timeSlots[0]).toMatch(/^\d{2}:\d{2}$/); // HH:MM format
    });

    test('should generate 15-minute intervals', () => {
      const testDate = new Date('2024-01-15');
      const timeSlots = DateTimeService.generateTimeSlots(testDate);
      
      // Check that slots are 15 minutes apart
      for (let i = 1; i < timeSlots.length; i++) {
        const prevTime = new Date(`2024-01-15T${timeSlots[i-1]}:00`);
        const currTime = new Date(`2024-01-15T${timeSlots[i]}:00`);
        const diffMinutes = (currTime.getTime() - prevTime.getTime()) / (1000 * 60);
        expect(diffMinutes).toBe(15);
      }
    });
  });

  describe('Store Hours', () => {
    test('should check if store is open', async () => {
      const isOpen = await DateTimeService.isStoreOpen();
      expect(typeof isOpen).toBe('boolean');
    });

    test('should handle store overrides', async () => {
      const testDate = new Date('2024-12-25'); // Christmas
      const isOpen = await DateTimeService.isStoreOpen(testDate);
      expect(typeof isOpen).toBe('boolean');
    });

    test('should get store hours for a specific day', async () => {
      const storeHours = await DateTimeService.getStoreHours();
      expect(storeHours).toBeInstanceOf(Array);
    });
  });

  describe('Persistence', () => {
    test('should persist timezone preference', async () => {
      DateTimeService.toggleTimezone();
      await DateTimeService.persistTimezonePreference();
      
      // Simulate app restart
      await DateTimeService.loadPersistedState();
      expect(DateTimeService.isUsingAlternativeTimezone()).toBe(true);
    });

    test('should persist selected date', async () => {
      const testDate = new Date('2024-01-15');
      DateTimeService.setSelectedDate(testDate);
      await DateTimeService.persistSelectedDate();
      
      // Simulate app restart
      await DateTimeService.loadPersistedState();
      expect(DateTimeService.getSelectedDate()).toEqual(testDate);
    });

    test('should persist selected time slot', async () => {
      const timeSlot = '14:30';
      DateTimeService.setSelectedTimeSlot(timeSlot);
      await DateTimeService.persistSelectedTimeSlot();
      
      // Simulate app restart
      await DateTimeService.loadPersistedState();
      expect(DateTimeService.getSelectedTimeSlot()).toBe(timeSlot);
    });

    test('should clear persisted state', async () => {
      await DateTimeService.clearPersistedState();
      
      // After clearing, should have default values
      expect(DateTimeService.isUsingAlternativeTimezone()).toBe(false);
    });
  });
});
