import { AuthWrapper } from '@/components/AuthWrapper';
import DatePicker from '@/components/DatePicker';
import { Colors } from '@/constants/Colors';
import { useAuth } from '@/contexts/AuthContext';
import { useColorScheme } from '@/hooks/useColorScheme';
import { DateTimeService, TimeSlot } from '@/services/DateTimeService';
import { LocationData, LocationService } from '@/services/LocationService';
import { NotificationService } from '@/services/NotificationService';
import React, { useEffect, useState } from 'react';
import { Alert, SafeAreaView, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';

export default function HomeScreen() {
  const { user, backendUser, signOut } = useAuth();
  const colorScheme = useColorScheme();
  
  const [isDatePickerVisible, setIsDatePickerVisible] = useState(false);
  const [useBottomSheet, setUseBottomSheet] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<TimeSlot | null>(null);
  const [storeStatus, setStoreStatus] = useState<{ isOpen: boolean }>({ isOpen: false });
  const [greetingMessage, setGreetingMessage] = useState('');
  const [userLocation, setUserLocation] = useState<LocationData | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [isLoadingStoreConfig, setIsLoadingStoreConfig] = useState(false);
  const [storeConfigError, setStoreConfigError] = useState<string | null>(null);
  const [notificationStatus, setNotificationStatus] = useState<{
    permissionsGranted: boolean;
    reminderScheduled: boolean;
    nextNotificationTime?: Date;
  }>({
    permissionsGranted: false,
    reminderScheduled: false,
  });

  useEffect(() => {
    initializeLocation();
    
    // Update every minute
    const interval = setInterval(() => {
      updateStoreStatus();
      updateGreetingMessage();
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  const initializeLocation = async () => {
    try {
      setIsLoadingLocation(true);
      setIsLoadingStoreConfig(true);
      setStoreConfigError(null);
      
      // Initialize DateTimeService with location and store config
      await DateTimeService.initializeWithLocation();
      
      // Get user location
      const location = DateTimeService.getUserLocation();
      setUserLocation(location);
      
      // Check if store config was loaded successfully
      if (!DateTimeService.isInitialized()) {
        setStoreConfigError('Failed to load store configuration');
      }
      
      // Update UI with location data
      updateStoreStatus();
      updateGreetingMessage();
      
      // Restore persisted selections
      const persistedDate = DateTimeService.getSelectedDate();
      const persistedTimeSlot = DateTimeService.getSelectedTimeSlot();
      
      if (persistedDate) {
        setSelectedDate(persistedDate);
      }
      if (persistedTimeSlot) {
        setSelectedTimeSlot(persistedTimeSlot);
      }
      
      // Update notification status after initialization
      updateNotificationStatus();
    } catch (error) {
      console.error('Error initializing location:', error);
      setStoreConfigError('Failed to initialize app');
    } finally {
      setIsLoadingLocation(false);
      setIsLoadingStoreConfig(false);
    }
  };

  const requestLocationAccess = async () => {
    try {
      setIsLoadingLocation(true);
      
      const location = await LocationService.getLocationWithPermission();
      if (location) {
        setUserLocation(location);
        DateTimeService.setUserLocation(location);
        updateStoreStatus();
        updateGreetingMessage();
        Alert.alert(
          'Location Access',
          `Great! We found you in ${LocationService.formatLocationForDisplay(location)}. You can now toggle between your local time and ${LocationService.getAlternativeCityName(location)} time.`,
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert(
          'Location Access',
          'Unable to access your location. You can still use the app with default timezone settings.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Error requesting location:', error);
      Alert.alert(
        'Location Error',
        'There was an error accessing your location. Please try again or check your device settings.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsLoadingLocation(false);
    }
  };

  const handleRefreshStoreConfig = async () => {
    try {
      setIsLoadingStoreConfig(true);
      setStoreConfigError(null);
      
      await DateTimeService.refreshStoreConfig();
      
      if (DateTimeService.isInitialized()) {
        updateStoreStatus();
        updateGreetingMessage();
      } else {
        setStoreConfigError('Failed to refresh store configuration');
      }
    } catch (error) {
      console.error('Error refreshing store config:', error);
      setStoreConfigError('Failed to refresh store configuration');
    } finally {
      setIsLoadingStoreConfig(false);
    }
  };

  const updateNotificationStatus = async () => {
    try {
      const status = await NotificationService.getNotificationStatus();
      setNotificationStatus(status);
    } catch (error) {
      console.error('Error updating notification status:', error);
    }
  };

  const handleToggleNotifications = async () => {
    try {
      console.log('Toggle button pressed. Current status:', notificationStatus.reminderScheduled);
      
      if (notificationStatus.reminderScheduled) {
        // Disable notifications
        console.log('Disabling notifications...');
        await NotificationService.cancelStoreOpeningReminder();
        setNotificationStatus(prev => ({
          ...prev,
          reminderScheduled: false,
          nextNotificationTime: undefined,
        }));
        Alert.alert('Notifications Disabled', 'Store opening reminders have been cancelled.');
      } else {
        // Enable notifications
        console.log('Enabling notifications...');
        const success = await NotificationService.scheduleStoreOpeningReminder();
        
        if (success) {
          // Manually set the status to true since scheduling was successful
          const nextOpeningTime = NotificationService.getNextStoreOpeningTime();
          if (nextOpeningTime) {
            const notificationTime = NotificationService.calculateNotificationTime(nextOpeningTime);
            setNotificationStatus(prev => ({
              ...prev,
              reminderScheduled: true,
              nextNotificationTime: notificationTime || undefined,
            }));
          } else {
            setNotificationStatus(prev => ({
              ...prev,
              reminderScheduled: true,
            }));
          }
          Alert.alert('Notifications Enabled', 'You will receive a notification 1 hour before the store opens.');
        } else {
          Alert.alert('Error', 'Failed to schedule notification. Please try again.');
        }
      }
    } catch (error) {
      console.error('Error toggling notifications:', error);
      Alert.alert('Error', 'Failed to update notification settings.');
    }
  };

  const updateStoreStatus = () => {
    const activeTimezone = DateTimeService.getActiveTimezone();
    const status = DateTimeService.getStoreStatus(activeTimezone);
    setStoreStatus(status);
  };

  const updateGreetingMessage = () => {
    const greeting = DateTimeService.getGreetingMessage();
    setGreetingMessage(greeting);
  };

  const handleTimezoneToggle = async () => {
    await DateTimeService.toggleTimezone();
    updateStoreStatus();
    updateGreetingMessage();
  };

  const handleDateSelect = async (date: Date, timeSlots: TimeSlot[]) => {
    setSelectedDate(date);
    const selectedSlot = timeSlots.find(slot => slot.isSelected);
    if (selectedSlot) {
      setSelectedTimeSlot(selectedSlot);
      await DateTimeService.setSelectedDate(date);
      await DateTimeService.setSelectedTimeSlot(selectedSlot);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut();
            } catch (error) {
              Alert.alert('Error', 'Failed to logout. Please try again.');
            }
          },
        },
      ]
    );
  };

  const formatSelectedDateTime = () => {
    if (!selectedDate || !selectedTimeSlot) return null;
    
    const activeTimezone = DateTimeService.getActiveTimezone();
    const formattedDate = DateTimeService.formatDate(selectedDate, activeTimezone);
    return `${formattedDate} at ${selectedTimeSlot.displayTime}`;
  };

  return (
    <AuthWrapper>
      <SafeAreaView style={[styles.container, { backgroundColor: Colors[colorScheme ?? 'light'].background }]}>
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.greeting, { color: Colors[colorScheme ?? 'light'].text }]}>
            {greetingMessage}
          </Text>
          <Text style={[styles.welcomeText, { color: Colors[colorScheme ?? 'light'].secondaryText }]}>
            Welcome, {backendUser?.name || backendUser?.email?.split('@')[0] || user?.displayName || user?.email?.split('@')[0] || 'User'}!
          </Text>
        </View>

        {/* Store Status */}
        <View style={[styles.card, { backgroundColor: Colors[colorScheme ?? 'light'].cardBackground }]}>
          <View style={styles.statusRow}>
            <Text style={[styles.statusLabel, { color: Colors[colorScheme ?? 'light'].text }]}>
              Store Status
            </Text>
            <View style={styles.statusIndicator}>
              <View
                style={[
                  styles.statusLight,
                  { backgroundColor: storeStatus.isOpen ? Colors[colorScheme ?? 'light'].success : Colors[colorScheme ?? 'light'].error },
                ]}
              />
              <Text
                style={[
                  styles.statusText,
                  { color: storeStatus.isOpen ? Colors[colorScheme ?? 'light'].success : Colors[colorScheme ?? 'light'].error },
                ]}
              >
                {storeStatus.isOpen ? 'Open' : 'Closed'}
              </Text>
            </View>
          </View>
          
          {storeConfigError && (
            <View style={styles.errorContainer}>
              <Text style={[styles.errorText, { color: Colors[colorScheme ?? 'light'].error }]}>
                ⚠️ {storeConfigError}
              </Text>
              <TouchableOpacity
                style={[styles.refreshButton, { backgroundColor: Colors[colorScheme ?? 'light'].tint }]}
                onPress={handleRefreshStoreConfig}
                disabled={isLoadingStoreConfig}
              >
                <Text style={styles.refreshButtonText}>
                  {isLoadingStoreConfig ? 'Refreshing...' : 'Refresh'}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Location & Timezone */}
        <View style={[styles.card, { backgroundColor: Colors[colorScheme ?? 'light'].cardBackground }]}>
          <Text style={[styles.cardTitle, { color: Colors[colorScheme ?? 'light'].text }]}>
            Location & Timezone
          </Text>
          
          {!userLocation && (
            <TouchableOpacity
              style={[styles.locationButton, { backgroundColor: Colors[colorScheme ?? 'light'].tint }]}
              onPress={requestLocationAccess}
              disabled={isLoadingLocation}
            >
              <Text style={styles.locationButtonText}>
                {isLoadingLocation ? 'Getting Location...' : 'Enable Location Access'}
              </Text>
            </TouchableOpacity>
          )}

          {userLocation && (
            <>
              <View style={styles.locationInfo}>
                <Text style={[styles.locationLabel, { color: Colors[colorScheme ?? 'light'].secondaryText }]}>
                  Your Location:
                </Text>
                <Text style={[styles.locationText, { color: Colors[colorScheme ?? 'light'].text }]}>
                  {LocationService.formatLocationForDisplay(userLocation)}
                </Text>
              </View>

              <View style={styles.timezoneToggle}>
                <Text style={[styles.timezoneText, { color: Colors[colorScheme ?? 'light'].secondaryText }]}>
                  {DateTimeService.getActiveCityName()}
                </Text>
                <Switch
                  value={DateTimeService.isUsingAlternativeTimezone()}
                  onValueChange={handleTimezoneToggle}
                  trackColor={{ false: '#767577', true: Colors[colorScheme ?? 'light'].tint }}
                  thumbColor={DateTimeService.isUsingAlternativeTimezone() ? '#f4f3f4' : '#f4f3f4'}
                />
               
              </View>
            </>
          )}
        </View>

        {/* Notification Settings */}
        <View style={[styles.card, { backgroundColor: Colors[colorScheme ?? 'light'].cardBackground }]}>
          <Text style={[styles.cardTitle, { color: Colors[colorScheme ?? 'light'].text }]}>
            Store Opening Reminders
          </Text>
          
          {!notificationStatus.permissionsGranted && (
            <Text style={[styles.notificationWarning, { color: Colors[colorScheme ?? 'light'].warning }]}>
              ⚠️ Notification permissions required
            </Text>
          )}

          <View style={styles.notificationToggle}>
            <View style={styles.notificationInfo}>
              <Text style={[styles.notificationLabel, { color: Colors[colorScheme ?? 'light'].text }]}>
                Get notified 1 hour before store opens
              </Text>
              {notificationStatus.nextNotificationTime && (
                <Text style={[styles.notificationTime, { color: Colors[colorScheme ?? 'light'].secondaryText }]}>
                  Next: {notificationStatus.nextNotificationTime.toLocaleString()}
                </Text>
              )}
            </View>
            <Switch
              value={notificationStatus.reminderScheduled}
              onValueChange={handleToggleNotifications}
              trackColor={{ false: '#767577', true: Colors[colorScheme ?? 'light'].tint }}
              thumbColor={notificationStatus.reminderScheduled ? '#f4f3f4' : '#f4f3f4'}
              disabled={!notificationStatus.permissionsGranted}
            />
          </View>
        </View>

        {/* Date/Time Selection */}
        <View style={[styles.card, { backgroundColor: Colors[colorScheme ?? 'light'].cardBackground }]}>
          <Text style={[styles.cardTitle, { color: Colors[colorScheme ?? 'light'].text }]}>
            Schedule Appointment
          </Text>
          
          <TouchableOpacity
            style={[styles.primaryButton, { backgroundColor: Colors[colorScheme ?? 'light'].tint }]}
            onPress={() => setIsDatePickerVisible(true)}
          >
            <Text style={styles.primaryButtonText}>
              {selectedDate && selectedTimeSlot ? 'Change Date & Time' : 'Select Date & Time'}
            </Text>
          </TouchableOpacity>

          {selectedDate && selectedTimeSlot && (
            <View style={styles.selectedDateTimeContainer}>
              <Text style={[styles.selectedDateTimeLabel, { color: Colors[colorScheme ?? 'light'].secondaryText }]}>
                Selected:
              </Text>
              <Text style={[styles.selectedDateTime, { color: Colors[colorScheme ?? 'light'].tint }]}>
                {formatSelectedDateTime()}
              </Text>
            </View>
          )}
        </View>

        {/* Display Mode Toggle */}
        <View style={[styles.card, { backgroundColor: Colors[colorScheme ?? 'light'].cardBackground }]}>
          <Text style={[styles.cardTitle, { color: Colors[colorScheme ?? 'light'].text }]}>
            Date Picker Mode
          </Text>
          <View style={styles.displayModeToggle}>
            <TouchableOpacity
              style={[
                styles.modeButton,
                {
                  backgroundColor: !useBottomSheet ? Colors[colorScheme ?? 'light'].tint : 'transparent',
                  borderColor: Colors[colorScheme ?? 'light'].border,
                },
              ]}
              onPress={() => setUseBottomSheet(false)}
            >
              <Text
                style={[
                  styles.modeButtonText,
                  {
                    color: !useBottomSheet ? '#FFFFFF' : Colors[colorScheme ?? 'light'].text,
                  },
                ]}
              >
                Full Screen
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.modeButton,
                {
                  backgroundColor: useBottomSheet ? Colors[colorScheme ?? 'light'].tint : 'transparent',
                  borderColor: Colors[colorScheme ?? 'light'].border,
                },
              ]}
              onPress={() => setUseBottomSheet(true)}
            >
              <Text
                style={[
                  styles.modeButtonText,
                  {
                    color: useBottomSheet ? '#FFFFFF' : Colors[colorScheme ?? 'light'].text,
                  },
                ]}
              >
                Bottom Sheet
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Logout Button */}
        <TouchableOpacity
          style={[styles.logoutButton, { backgroundColor: Colors[colorScheme ?? 'light'].error }]}
          onPress={handleLogout}
        >
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>
              </ScrollView>

        {/* Date Picker Modal */}
        <DatePicker
          isVisible={isDatePickerVisible}
          onClose={() => setIsDatePickerVisible(false)}
          onDateSelect={handleDateSelect}
          isBottomSheet={useBottomSheet}
        />
      </SafeAreaView>
    </AuthWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    padding: 20,
  },
  header: {
    marginBottom: 30,
    paddingTop: 10,
  },
  greeting: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  welcomeText: {
    fontSize: 18,
    opacity: 0.8,
  },
  card: {
    marginBottom: 20,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusLight: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
  },
  locationButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 15,
  },
  locationButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  locationInfo: {
    marginBottom: 15,
  },
  locationLabel: {
    fontSize: 14,
    marginBottom: 4,
  },
  locationText: {
    fontSize: 16,
    fontWeight: '600',
  },
  errorContainer: {
    marginTop: 15,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FFE0E0',
    backgroundColor: '#FFF5F5',
  },
  errorText: {
    fontSize: 14,
    marginBottom: 8,
  },
  refreshButton: {
    padding: 8,
    borderRadius: 6,
    alignItems: 'center',
  },
  refreshButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  notificationWarning: {
    fontSize: 14,
    marginBottom: 12,
    fontStyle: 'italic',
  },
  notificationToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  notificationInfo: {
    flex: 1,
    marginRight: 16,
  },
  notificationLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  notificationTime: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  timezoneToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  timezoneText: {
    fontSize: 14,
    fontWeight: '500',
  },
  primaryButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  selectedDateTimeContainer: {
    padding: 15,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  selectedDateTimeLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 5,
  },
  selectedDateTime: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  displayModeToggle: {
    flexDirection: 'row',
    gap: 12,
  },
  modeButton: {
    flex: 1,
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
  },
  modeButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  logoutButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  logoutButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
