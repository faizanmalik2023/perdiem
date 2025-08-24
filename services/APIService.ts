export interface StoreTime {
  id: string;
  day_of_week: number; // 0-6 (Sunday-Saturday)
  is_open: boolean;
  start_time: string; // "09:00"
  end_time: string; // "17:00"
}

export interface StoreOverride {
  id: string;
  day: number; // 1-31
  month: number; // 1-12
  is_open: boolean;
  start_time?: string; // "09:00"
  end_time?: string; // "17:00"
}

export interface APIResponse<T> {
  data: T;
  error?: string;
}

export class APIService {
  private static readonly BASE_URL = 'https://coding-challenge-pd-1a25b1a14f34.herokuapp.com';
  private static readonly TIMEOUT = 10000; // 10 seconds

  /**
   * Make a generic API request
   */
  private static async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<APIResponse<T>> {
    try {
      const url = `${this.BASE_URL}${endpoint}`;
      console.log(`Making API request to: ${url}`);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.TIMEOUT);

      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log(`API response from ${endpoint}:`, data);

      return { data };
    } catch (error) {
      console.error(`API request failed for ${endpoint}:`, error);
      
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          return { data: [] as T, error: 'Request timeout' };
        }
        return { data: [] as T, error: error.message };
      }
      
      return { data: [] as T, error: 'Unknown error occurred' };
    }
  }

  /**
   * Get store times (opening and closing hours by day of week)
   */
  static async getStoreTimes(): Promise<APIResponse<StoreTime[]>> {
    return this.makeRequest<StoreTime[]>('/store-times/');
  }

  /**
   * Get store overrides (exceptions like holidays)
   */
  static async getStoreOverrides(): Promise<APIResponse<StoreOverride[]>> {
    return this.makeRequest<StoreOverride[]>('/store-overrides/');
  }

  /**
   * Check if the API is reachable
   */
  static async checkAPIHealth(): Promise<boolean> {
    try {
      const response = await this.makeRequest<any>('/store-times/');
      return !response.error;
    } catch (error) {
      console.error('API health check failed:', error);
      return false;
    }
  }

  /**
   * Convert API store time to internal format
   */
  static convertStoreTime(apiStoreTime: StoreTime) {
    return {
      dayOfWeek: apiStoreTime.day_of_week,
      openTime: apiStoreTime.start_time,
      closeTime: apiStoreTime.end_time,
      isOpen: apiStoreTime.is_open,
    };
  }

  /**
   * Convert API store override to internal format
   */
  static convertStoreOverride(apiOverride: StoreOverride) {
    const month = apiOverride.month.toString().padStart(2, '0');
    const day = apiOverride.day.toString().padStart(2, '0');
    const dateString = `2025-${month}-${day}`; // Using 2025 as base year

    return {
      date: dateString,
      isOpen: apiOverride.is_open,
      openTime: apiOverride.start_time,
      closeTime: apiOverride.end_time,
      reason: `Override for ${month}/${day}`,
    };
  }

  /**
   * Get all store configuration data
   */
  static async getStoreConfig(): Promise<{
    storeTimes: StoreTime[];
    storeOverrides: StoreOverride[];
    error?: string;
  }> {
    try {
      console.log('Fetching store configuration from API...');
      
      const [timesResponse, overridesResponse] = await Promise.all([
        this.getStoreTimes(),
        this.getStoreOverrides(),
      ]);

      const hasError = timesResponse.error || overridesResponse.error;
      const error = hasError ? 
        `Times: ${timesResponse.error || 'OK'}, Overrides: ${overridesResponse.error || 'OK'}` : 
        undefined;

      return {
        storeTimes: timesResponse.data || [],
        storeOverrides: overridesResponse.data || [],
        error,
      };
    } catch (error) {
      console.error('Error fetching store config:', error);
      return {
        storeTimes: [],
        storeOverrides: [],
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}
