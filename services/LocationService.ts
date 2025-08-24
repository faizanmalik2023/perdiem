import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';

export interface LocationData {
  city: string;
  region: string;
  country: string;
  timezone: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
}

export interface LocationPermission {
  granted: boolean;
  canAskAgain: boolean;
}

export class LocationService {
  private static readonly STORAGE_KEYS = {
    LOCATION_DATA: '@location_data',
    LOCATION_PERMISSION: '@location_permission',
  };

  /**
   * Request location permissions from the user
   */
  static async requestLocationPermission(): Promise<LocationPermission> {
    try {
      console.log('Requesting location permission...');
      
      // Check current permission status
      const { status: existingStatus } = await Location.getForegroundPermissionsAsync();
      
      if (existingStatus === 'granted') {
        console.log('Location permission already granted');
        const permission = { granted: true, canAskAgain: true };
        await AsyncStorage.setItem(this.STORAGE_KEYS.LOCATION_PERMISSION, JSON.stringify(permission));
        return permission;
      }

      // Request permission
      const { status, canAskAgain } = await Location.requestForegroundPermissionsAsync();
      
      const permission = { 
        granted: status === 'granted', 
        canAskAgain: canAskAgain ?? false 
      };
      
      console.log('Location permission result:', permission);
      await AsyncStorage.setItem(this.STORAGE_KEYS.LOCATION_PERMISSION, JSON.stringify(permission));
      
      return permission;
    } catch (error) {
      console.error('Error requesting location permission:', error);
      return { granted: false, canAskAgain: false };
    }
  }

  /**
   * Get current location data including city and timezone
   */
  static async getCurrentLocation(): Promise<LocationData | null> {
    try {
      console.log('Getting current location...');
      
      // Check permission first
      const { status } = await Location.getForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.log('Location permission not granted');
        return null;
      }

      // Get current position
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
        timeInterval: 10000,
      });

      console.log('Got coordinates:', location.coords);

      // Reverse geocode to get address
      const reverseGeocode = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      if (reverseGeocode.length === 0) {
        console.log('No reverse geocoding results');
        return null;
      }

      const address = reverseGeocode[0];
      console.log('Reverse geocoding result:', address);

      // Get timezone from coordinates
      const timezone = await this.getTimezoneFromCoordinates(
        location.coords.latitude, 
        location.coords.longitude
      );

      const locationData: LocationData = {
        city: address.city || address.subAdministrativeArea || 'Unknown City',
        region: address.region || address.administrativeArea || '',
        country: address.country || '',
        timezone: timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
        coordinates: {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        },
      };

      console.log('Final location data:', locationData);
      
      // Cache the location data
      await AsyncStorage.setItem(this.STORAGE_KEYS.LOCATION_DATA, JSON.stringify(locationData));
      
      return locationData;
    } catch (error) {
      console.error('Error getting current location:', error);
      return null;
    }
  }

  /**
   * Get timezone from coordinates (fallback to device timezone)
   */
  private static async getTimezoneFromCoordinates(latitude: number, longitude: number): Promise<string> {
    try {
      // For now, we'll use the device's timezone as a fallback
      // In a production app, you might want to use a timezone API like Google Maps API
      return Intl.DateTimeFormat().resolvedOptions().timeZone;
    } catch (error) {
      console.error('Error getting timezone from coordinates:', error);
      return 'America/New_York'; // Default fallback
    }
  }

  /**
   * Get cached location data
   */
  static async getCachedLocation(): Promise<LocationData | null> {
    try {
      const cachedData = await AsyncStorage.getItem(this.STORAGE_KEYS.LOCATION_DATA);
      if (cachedData) {
        return JSON.parse(cachedData);
      }
      return null;
    } catch (error) {
      console.error('Error getting cached location:', error);
      return null;
    }
  }

  /**
   * Check if location permission is granted
   */
  static async hasLocationPermission(): Promise<boolean> {
    try {
      const { status } = await Location.getForegroundPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.error('Error checking location permission:', error);
      return false;
    }
  }

  /**
   * Get location with permission handling
   */
  static async getLocationWithPermission(): Promise<LocationData | null> {
    try {
      // First check if we have permission
      const hasPermission = await this.hasLocationPermission();
      
      if (!hasPermission) {
        // Request permission
        const permission = await this.requestLocationPermission();
        if (!permission.granted) {
          console.log('Location permission denied');
          return null;
        }
      }

      // Get current location
      return await this.getCurrentLocation();
    } catch (error) {
      console.error('Error getting location with permission:', error);
      return null;
    }
  }

  /**
   * Clear cached location data
   */
  static async clearLocationCache(): Promise<void> {
    try {
      await AsyncStorage.removeItem(this.STORAGE_KEYS.LOCATION_DATA);
      await AsyncStorage.removeItem(this.STORAGE_KEYS.LOCATION_PERMISSION);
    } catch (error) {
      console.error('Error clearing location cache:', error);
    }
  }

  /**
   * Format location for display
   */
  static formatLocationForDisplay(location: LocationData): string {
    if (location.city && location.region) {
      return `${location.city}, ${location.region}`;
    } else if (location.city) {
      return location.city;
    } else if (location.region) {
      return location.region;
    } else {
      return 'Current Location';
    }
  }

  /**
   * Check if user is in NYC area
   */
  static isInNYCArea(location: LocationData): boolean {
    const { latitude, longitude } = location.coordinates;
    
    // NYC area bounds (approximate)
    const NYC_BOUNDS = {
      north: 40.9176,
      south: 40.4774,
      east: -73.7004,
      west: -74.2591,
    };

    return (
      latitude >= NYC_BOUNDS.south &&
      latitude <= NYC_BOUNDS.north &&
      longitude >= NYC_BOUNDS.west &&
      longitude <= NYC_BOUNDS.east
    );
  }

  /**
   * Get alternative timezone (if user is in NYC, return LA; otherwise return NYC)
   */
  static getAlternativeTimezone(location: LocationData | null): string {
    if (!location) {
      return 'America/New_York';
    }

    const isInNYC = this.isInNYCArea(location);
    return isInNYC ? 'America/Los_Angeles' : 'America/New_York';
  }

  /**
   * Get alternative city name for display
   */
  static getAlternativeCityName(location: LocationData | null): string {
    if (!location) {
      return 'NYC';
    }

    const isInNYC = this.isInNYCArea(location);
    return isInNYC ? 'LA' : 'NYC';
  }
}
