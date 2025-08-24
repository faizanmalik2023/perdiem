import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

export interface StoreOpeningTime {
  dayOfWeek: number;
  openTime: string;
  closeTime: string;
}

export class NotificationService {
  private static readonly NOTIFICATION_ID = 'store-opening-reminder';
  private static readonly NOTIFICATION_TITLE = 'Store Opening Soon!';
  private static readonly NOTIFICATION_BODY = 'The store will open in 1 hour. Time to get ready!';
  private static readonly STORAGE_KEY = '@notification_preferences';

  /**
   * Initialize notification settings
   */
  static async initialize(): Promise<void> {
    try {
      console.log('Initializing notification service...');

      // Request permissions
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.log('Notification permissions not granted');
        return;
      }

      // Configure notification behavior
      Notifications.setNotificationHandler({
        handleNotification: async (notification) => {
          console.log('Notification received:', notification.request.identifier);
          
          // Only show notifications that are actually scheduled for the future
          // Don't show notifications that are triggered immediately
          const now = new Date();
          const scheduledTime = notification.request.trigger?.date;
          
          if (scheduledTime && new Date(scheduledTime) > now) {
            return {
              shouldShowBanner: true,
              shouldShowList: true,
              shouldPlaySound: true,
              shouldSetBadge: false,
            };
          } else {
            console.log('Ignoring immediate notification trigger');
            return {
              shouldShowBanner: false,
              shouldShowList: false,
              shouldPlaySound: false,
              shouldSetBadge: false,
            };
          }
        },
      });

      console.log('Notification service initialized successfully');
    } catch (error) {
      console.error('Error initializing notification service:', error);
    }
  }

  /**
   * Schedule store opening reminder notification
   */
  static async scheduleStoreOpeningReminder(): Promise<boolean> {
    try {
      console.log('Scheduling store opening reminder...');

      // Check if notification is already scheduled
      const isScheduled = await this.isStoreOpeningReminderScheduled();
      if (isScheduled) {
        console.log('Store opening reminder already scheduled, skipping');
        return;
      }

      // Cancel any existing notifications
      await this.cancelStoreOpeningReminder();

      // Get next store opening time
      const nextOpeningTime = this.getNextStoreOpeningTime();
      
      if (!nextOpeningTime) {
        console.log('No store opening time found');
        return false;
      }

      // Calculate notification time (1 hour before opening)
      const notificationTime = this.calculateNotificationTime(nextOpeningTime);
      
      if (!notificationTime) {
        console.log('Could not calculate notification time');
        return false;
      }

      // Check if notification time is in the future
      const now = new Date();
      const timeDifference = notificationTime.getTime() - now.getTime();
      const hoursDifference = timeDifference / (1000 * 60 * 60);
      
      console.log(`Notification time: ${notificationTime.toLocaleString()}`);
      console.log(`Current time: ${now.toLocaleString()}`);
      console.log(`Time difference: ${hoursDifference.toFixed(2)} hours`);
      
      if (notificationTime <= now) {
        console.log('Notification time is in the past, skipping');
        return false;
      }

      // Ensure notification is at least 1 minute in the future
      const minTime = new Date(now.getTime() + 60000); // 1 minute from now
      if (notificationTime <= minTime) {
        console.log('Notification time is too close to current time, skipping');
        return false;
      }

      // Schedule the notification
      await Notifications.scheduleNotificationAsync({
        identifier: this.NOTIFICATION_ID,
        content: {
          title: this.NOTIFICATION_TITLE,
          body: this.NOTIFICATION_BODY,
          sound: Platform.OS === 'ios' ? 'default' : true,
          priority: Notifications.AndroidNotificationPriority.HIGH,
        },
        trigger: {
          date: notificationTime,
        },
      });

      console.log(`Store opening reminder scheduled for: ${notificationTime.toLocaleString()}`);
      return true;
    } catch (error) {
      console.error('Error scheduling store opening reminder:', error);
      return false;
    }
  }

  /**
   * Cancel existing store opening reminder
   */
  static async cancelStoreOpeningReminder(): Promise<void> {
    try {
      await Notifications.cancelScheduledNotificationAsync(this.NOTIFICATION_ID);
      console.log('Cancelled existing store opening reminder');
    } catch (error) {
      console.error('Error cancelling store opening reminder:', error);
    }
  }

  /**
   * Get the next store opening time
   */
  static getNextStoreOpeningTime(): StoreOpeningTime | null {
    // Import DateTimeService dynamically to avoid require cycle
    const { DateTimeService } = require('./DateTimeService');
    const storeConfig = DateTimeService.getStoreConfig();
    const now = new Date();
    const currentDayOfWeek = now.getDay();
    const currentTime = now.toTimeString().slice(0, 5); // "HH:MM"

    // Convert JavaScript day (0-6) to API day (1-7)
    const apiDayOfWeek = currentDayOfWeek === 0 ? 7 : currentDayOfWeek;
    
    // Check today's opening time
    const todayHours = storeConfig.hours.find(h => h.dayOfWeek === apiDayOfWeek);
    if (todayHours && todayHours.openTime > currentTime) {
      return {
        dayOfWeek: apiDayOfWeek,
        openTime: todayHours.openTime,
        closeTime: todayHours.closeTime,
      };
    }

    // Check next 7 days for opening time
    for (let i = 1; i <= 7; i++) {
      const futureDate = new Date(now);
      futureDate.setDate(now.getDate() + i);
      const futureDayOfWeek = futureDate.getDay();
      const futureApiDayOfWeek = futureDayOfWeek === 0 ? 7 : futureDayOfWeek;
      
      const futureHours = storeConfig.hours.find(h => h.dayOfWeek === futureApiDayOfWeek);
      if (futureHours) {
        return {
          dayOfWeek: futureApiDayOfWeek,
          openTime: futureHours.openTime,
          closeTime: futureHours.closeTime,
        };
      }
    }

    return null;
  }

  /**
   * Calculate notification time (1 hour before opening)
   */
  static calculateNotificationTime(openingTime: StoreOpeningTime): Date | null {
    try {
      const now = new Date();
      const [openHour, openMinute] = openingTime.openTime.split(':').map(Number);
      
      // Find the next occurrence of this opening time
      let notificationDate = new Date(now);
      
      // Set the notification time (1 hour before opening)
      notificationDate.setHours(openHour - 1, openMinute, 0, 0);
      
      // If the notification time has passed today, find the next occurrence
      if (notificationDate <= now) {
        // Find next occurrence of this day of week
        const daysUntilNext = (openingTime.dayOfWeek - now.getDay() + 7) % 7;
        if (daysUntilNext === 0) {
          // Same day, but next week
          notificationDate.setDate(now.getDate() + 7);
        } else {
          notificationDate.setDate(now.getDate() + daysUntilNext);
        }
      }

      return notificationDate;
    } catch (error) {
      console.error('Error calculating notification time:', error);
      return null;
    }
  }

  /**
   * Get scheduled notifications
   */
  static async getScheduledNotifications(): Promise<Notifications.NotificationRequest[]> {
    try {
      return await Notifications.getAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('Error getting scheduled notifications:', error);
      return [];
    }
  }

  /**
   * Check if store opening reminder is scheduled
   */
  static async isStoreOpeningReminderScheduled(): Promise<boolean> {
    try {
      const scheduledNotifications = await this.getScheduledNotifications();
      return scheduledNotifications.some(notification => 
        notification.identifier === this.NOTIFICATION_ID
      );
    } catch (error) {
      console.error('Error checking scheduled notifications:', error);
      return false;
    }
  }

  /**
   * Refresh store opening reminder (called when store config changes)
   */
  static async refreshStoreOpeningReminder(): Promise<void> {
    try {
      console.log('Refreshing store opening reminder...');
      await this.scheduleStoreOpeningReminder();
    } catch (error) {
      console.error('Error refreshing store opening reminder:', error);
    }
  }

  /**
   * Get notification status
   */
  static async getNotificationStatus(): Promise<{
    permissionsGranted: boolean;
    reminderScheduled: boolean;
    nextNotificationTime?: Date;
  }> {
    try {
      const { status } = await Notifications.getPermissionsAsync();
      const permissionsGranted = status === 'granted';
      
      const scheduledNotifications = await this.getScheduledNotifications();
      const storeReminder = scheduledNotifications.find(
        notification => notification.identifier === this.NOTIFICATION_ID
      );
      
      return {
        permissionsGranted,
        reminderScheduled: !!storeReminder,
        nextNotificationTime: storeReminder?.trigger.date ? new Date(storeReminder.trigger.date) : undefined,
      };
    } catch (error) {
      console.error('Error getting notification status:', error);
      return {
        permissionsGranted: false,
        reminderScheduled: false,
      };
    }
  }
}
