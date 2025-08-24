
import AsyncStorage from '@react-native-async-storage/async-storage';
import { APIService, StoreOverride } from './APIService';
import { LocationData, LocationService } from './LocationService';
import { NotificationService } from './NotificationService';

export interface TimeSlot {
  id: string;
  time: string;
  displayTime: string;
  isAvailable: boolean;
  isSelected: boolean;
}

export interface StoreHours {
  dayOfWeek: number; // 0-6 (Sunday-Saturday)
  openTime: string; // "09:00"
  closeTime: string; // "17:00"
}

export interface StoreOverride {
  date: string; // "2025-04-16"
  isOpen: boolean;
  openTime?: string;
  closeTime?: string;
  reason?: string;
}

export interface StoreConfig {
  timezone: string;
  hours: StoreHours[];
  overrides: StoreOverride[];
}

// Store configuration from API
let STORE_CONFIG: StoreConfig = {
  timezone: 'America/New_York',
  hours: [],
  overrides: [],
};

export class DateTimeService {
  private static selectedDate: Date | null = null;
  private static selectedTimeSlot: TimeSlot | null = null;
  private static useAlternativeTimezone: boolean = false;
  private static userLocation: LocationData | null = null;
  private static _isInitialized: boolean = false;
  
  // Storage keys
  private static readonly STORAGE_KEYS = {
    USE_ALTERNATIVE_TIMEZONE: '@use_alternative_timezone',
    SELECTED_DATE: '@selected_date',
    SELECTED_TIME_SLOT: '@selected_time_slot',
  };

  // Initialize with location data and store configuration
  static async initializeWithLocation(): Promise<void> {
    try {
      // Load persisted state first
      await this.loadPersistedState();
      
      // Initialize location
      this.userLocation = await LocationService.getCachedLocation();
      if (!this.userLocation) {
        this.userLocation = await LocationService.getLocationWithPermission();
      }

      // Initialize store configuration from API
      await this.initializeStoreConfig();

      // Initialize notifications
      await NotificationService.initialize();
      await NotificationService.scheduleStoreOpeningReminder();
    } catch (error) {
      console.error('Error initializing location:', error);
    }
  }

  // Initialize store configuration from API
  static async initializeStoreConfig(): Promise<void> {
    try {
      console.log('Initializing store configuration from API...');
      
      const { storeTimes, storeOverrides, error } = await APIService.getStoreConfig();
      
      if (error) {
        console.warn('API error, using fallback configuration:', error);
        // Use fallback configuration if API fails
        STORE_CONFIG = {
          timezone: 'America/New_York',
          hours: [
            { dayOfWeek: 0, openTime: '10:00', closeTime: '18:00' }, // Sunday
            { dayOfWeek: 1, openTime: '09:00', closeTime: '17:00' }, // Monday
            { dayOfWeek: 2, openTime: '09:00', closeTime: '17:00' }, // Tuesday
            { dayOfWeek: 3, openTime: '09:00', closeTime: '17:00' }, // Wednesday
            { dayOfWeek: 4, openTime: '09:00', closeTime: '17:00' }, // Thursday
            { dayOfWeek: 5, openTime: '09:00', closeTime: '17:00' }, // Friday
            { dayOfWeek: 6, openTime: '10:00', closeTime: '16:00' }, // Saturday
          ],
          overrides: [],
        };
      } else {
        // Convert API data to internal format
        const hours = storeTimes
          .filter(time => time.is_open)
          .map(apiTime => APIService.convertStoreTime(apiTime));
        
        const overrides = storeOverrides.map(apiOverride => 
          APIService.convertStoreOverride(apiOverride)
        );

        STORE_CONFIG = {
          timezone: 'America/New_York',
          hours,
          overrides,
        };

        console.log('Store configuration loaded from API:', {
          hoursCount: hours.length,
          overridesCount: overrides.length,
        });
      }

      this._isInitialized = true;
      
      // Schedule notification after store config is loaded
      await NotificationService.scheduleStoreOpeningReminder();
    } catch (error) {
      console.error('Error initializing store config:', error);
      // Use fallback configuration
      STORE_CONFIG = {
        timezone: 'America/New_York',
        hours: [
          { dayOfWeek: 0, openTime: '10:00', closeTime: '18:00' },
          { dayOfWeek: 1, openTime: '09:00', closeTime: '17:00' },
          { dayOfWeek: 2, openTime: '09:00', closeTime: '17:00' },
          { dayOfWeek: 3, openTime: '09:00', closeTime: '17:00' },
          { dayOfWeek: 4, openTime: '09:00', closeTime: '17:00' },
          { dayOfWeek: 5, openTime: '09:00', closeTime: '17:00' },
          { dayOfWeek: 6, openTime: '10:00', closeTime: '16:00' },
        ],
        overrides: [],
      };
      this._isInitialized = true;
      
      // Schedule notification with fallback config
      await NotificationService.scheduleStoreOpeningReminder();
    }
  }

  // Set user location
  static setUserLocation(location: LocationData | null): void {
    this.userLocation = location;
  }

  // Get user location
  static getUserLocation(): LocationData | null {
    return this.userLocation;
  }

  // Get user timezone
  static getUserTimezone(): string {
    return this.userLocation?.timezone || this.getCurrentTimezone();
  }

  // Get current device timezone
  static getCurrentTimezone(): string {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  }

  // Get alternative timezone (NYC or LA based on user location)
  static getAlternativeTimezone(): string {
    return LocationService.getAlternativeTimezone(this.userLocation);
  }

  // Toggle timezone preference
  static async toggleTimezone(): Promise<void> {
    this.useAlternativeTimezone = !this.useAlternativeTimezone;
    await this.persistTimezonePreference();
  }

  // Get current timezone preference
  static isUsingAlternativeTimezone(): boolean {
    return this.useAlternativeTimezone;
  }

  // Get active timezone
  static getActiveTimezone(): string {
    return this.useAlternativeTimezone ? this.getAlternativeTimezone() : this.getUserTimezone();
  }

  // Get active city name for display
  static getActiveCityName(): string {
    if (this.useAlternativeTimezone) {
      return LocationService.getAlternativeCityName(this.userLocation);
    } else {
      if (this.userLocation) {
        // Return just the city name for cleaner greeting
        return this.userLocation.city || LocationService.formatLocationForDisplay(this.userLocation);
      }
      return 'Your Area';
    }
  }

  // Get current time in specified timezone
  static getCurrentTimeInTimezone(timezone: string): Date {
    const now = new Date();
    return new Date(now.toLocaleString('en-US', { timeZone: timezone }));
  }

  // Generate next 30 days
  static generateNext30Days(): Date[] {
    const dates: Date[] = [];
    const today = new Date();
    
    for (let i = 0; i < 30; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      dates.push(date);
    }
    
    return dates;
  }

  // Format date for display
  static formatDate(date: Date, timezone: string): string {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      timeZone: timezone,
    });
  }

  // Format date for API (YYYY-MM-DD)
  static formatDateForAPI(date: Date, timezone: string): string {
    return date.toLocaleDateString('en-CA', { timeZone: timezone });
  }

  // Generate time slots for a specific date
  static generateTimeSlots(date: Date, timezone: string): TimeSlot[] {
    const slots: TimeSlot[] = [];
    const dayOfWeek = date.getDay();
    const dateString = this.formatDateForAPI(date, timezone);
    
    // Check if store is open on this date
    const isOpen = this.isStoreOpen(date, timezone);
    if (!isOpen) return slots;

    // Get store hours for this day
    const storeHours = STORE_CONFIG.hours.find(h => h.dayOfWeek === dayOfWeek);
    if (!storeHours) return slots;

    // Parse open and close times
    const [openHour, openMinute] = storeHours.openTime.split(':').map(Number);
    const [closeHour, closeMinute] = storeHours.closeTime.split(':').map(Number);
    
    const openTime = new Date(date);
    openTime.setHours(openHour, openMinute, 0, 0);
    
    const closeTime = new Date(date);
    closeTime.setHours(closeHour, closeMinute, 0, 0);

    // Generate 15-minute intervals
    const currentTime = new Date(openTime);
    while (currentTime < closeTime) {
      const timeString = currentTime.toTimeString().slice(0, 5);
      const displayTime = currentTime.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
        timeZone: timezone,
      });

      slots.push({
        id: `${dateString}-${timeString}`,
        time: timeString,
        displayTime,
        isAvailable: true,
        isSelected: false,
      });

      currentTime.setMinutes(currentTime.getMinutes() + 15);
    }

    return slots;
  }

  // Check if store is open on a specific date
  static isStoreOpen(date: Date, timezone: string): boolean {
    const dateString = this.formatDateForAPI(date, timezone);
    
    // Check for overrides first
    const override = STORE_CONFIG.overrides.find(o => o.date === dateString);
    if (override) {
      return override.isOpen;
    }

    // Check regular hours
    const dayOfWeek = date.getDay();
    const storeHours = STORE_CONFIG.hours.find(h => h.dayOfWeek === dayOfWeek);
    
    return !!storeHours;
  }

  // Get store status (open/closed)
  static getStoreStatus(timezone: string): { isOpen: boolean; nextOpen?: string } {
    const now = this.getCurrentTimeInTimezone(timezone);
    const isOpen = this.isStoreOpen(now, timezone);
    
    return { isOpen };
  }

  // Set selected date
  static async setSelectedDate(date: Date): Promise<void> {
    this.selectedDate = date;
    await this.persistSelectedDate();
  }

  // Get selected date
  static getSelectedDate(): Date | null {
    return this.selectedDate;
  }

  // Set selected time slot
  static async setSelectedTimeSlot(slot: TimeSlot): Promise<void> {
    this.selectedTimeSlot = slot;
    await this.persistSelectedTimeSlot();
  }

  // Get selected time slot
  static getSelectedTimeSlot(): TimeSlot | null {
    return this.selectedTimeSlot;
  }

  // Get greeting message based on current timezone
  static getGreetingMessage(): string {
    const activeTimezone = this.getActiveTimezone();
    const currentTime = this.getCurrentTimeInTimezone(activeTimezone);
    const hour = currentTime.getHours();
    
    let greeting = '';
    if (hour >= 5 && hour < 10) {
      greeting = 'Good Morning';
    } else if (hour >= 10 && hour < 12) {
      greeting = 'Late Morning Vibes!';
    } else if (hour >= 12 && hour < 17) {
      greeting = 'Good Afternoon';
    } else if (hour >= 17 && hour < 21) {
      greeting = 'Good Evening';
    } else {
      greeting = 'Night Owl in';
    }

    const cityName = this.getActiveCityName();
    return `${greeting} ${cityName}!`;
  }

  // Get timezone display name
  static getTimezoneDisplayName(timezone: string): string {
    const cityName = timezone.split('/').pop()?.replace('_', ' ') || timezone;
    return cityName;
  }

  // Check if service is initialized
  static isInitialized(): boolean {
    return this._isInitialized;
  }

  // Refresh store configuration from API
  static async refreshStoreConfig(): Promise<void> {
    await this.initializeStoreConfig();
    // Refresh notifications when store config changes
    await NotificationService.refreshStoreOpeningReminder();
  }

  // Get current store configuration
  static getStoreConfig(): StoreConfig {
    return STORE_CONFIG;
  }

  // Load persisted state from AsyncStorage
  private static async loadPersistedState(): Promise<void> {
    try {
      console.log('Loading persisted state...');
      
      // Load timezone preference
      const timezonePreference = await AsyncStorage.getItem(this.STORAGE_KEYS.USE_ALTERNATIVE_TIMEZONE);
      if (timezonePreference !== null) {
        this.useAlternativeTimezone = JSON.parse(timezonePreference);
        console.log('Loaded timezone preference:', this.useAlternativeTimezone);
      }

      // Load selected date
      const selectedDateString = await AsyncStorage.getItem(this.STORAGE_KEYS.SELECTED_DATE);
      if (selectedDateString) {
        this.selectedDate = new Date(selectedDateString);
        console.log('Loaded selected date:', this.selectedDate.toISOString());
      }

      // Load selected time slot
      const selectedTimeSlotString = await AsyncStorage.getItem(this.STORAGE_KEYS.SELECTED_TIME_SLOT);
      if (selectedTimeSlotString) {
        this.selectedTimeSlot = JSON.parse(selectedTimeSlotString);
        console.log('Loaded selected time slot:', this.selectedTimeSlot);
      }
    } catch (error) {
      console.error('Error loading persisted state:', error);
    }
  }

  // Persist timezone preference
  private static async persistTimezonePreference(): Promise<void> {
    try {
      await AsyncStorage.setItem(
        this.STORAGE_KEYS.USE_ALTERNATIVE_TIMEZONE,
        JSON.stringify(this.useAlternativeTimezone)
      );
      console.log('Persisted timezone preference:', this.useAlternativeTimezone);
    } catch (error) {
      console.error('Error persisting timezone preference:', error);
    }
  }

  // Persist selected date
  private static async persistSelectedDate(): Promise<void> {
    try {
      if (this.selectedDate) {
        await AsyncStorage.setItem(
          this.STORAGE_KEYS.SELECTED_DATE,
          this.selectedDate.toISOString()
        );
        console.log('Persisted selected date:', this.selectedDate.toISOString());
      }
    } catch (error) {
      console.error('Error persisting selected date:', error);
    }
  }

  // Persist selected time slot
  private static async persistSelectedTimeSlot(): Promise<void> {
    try {
      if (this.selectedTimeSlot) {
        await AsyncStorage.setItem(
          this.STORAGE_KEYS.SELECTED_TIME_SLOT,
          JSON.stringify(this.selectedTimeSlot)
        );
        console.log('Persisted selected time slot:', this.selectedTimeSlot);
      }
    } catch (error) {
      console.error('Error persisting selected time slot:', error);
    }
  }

  // Clear all persisted state
  static async clearPersistedState(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([
        this.STORAGE_KEYS.USE_ALTERNATIVE_TIMEZONE,
        this.STORAGE_KEYS.SELECTED_DATE,
        this.STORAGE_KEYS.SELECTED_TIME_SLOT,
      ]);
      console.log('Cleared all persisted state');
    } catch (error) {
      console.error('Error clearing persisted state:', error);
    }
  }
}
