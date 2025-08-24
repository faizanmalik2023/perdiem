import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { DateTimeService, TimeSlot } from '@/services/DateTimeService';
import React, { useEffect, useState } from 'react';
import {
    Dimensions,
    Modal,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

interface DatePickerProps {
  isVisible: boolean;
  onClose: () => void;
  onDateSelect: (date: Date, timeSlots: TimeSlot[]) => void;
  isBottomSheet?: boolean;
}

const { width, height } = Dimensions.get('window');

export default function DatePicker({ 
  isVisible, 
  onClose, 
  onDateSelect, 
  isBottomSheet = false 
}: DatePickerProps) {
  const [dates, setDates] = useState<Date[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const colorScheme = useColorScheme();

  useEffect(() => {
    if (isVisible) {
      const next30Days = DateTimeService.generateNext30Days();
      setDates(next30Days);
      setSelectedDate(null);
      setTimeSlots([]);
    }
  }, [isVisible]);

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    const activeTimezone = DateTimeService.getActiveTimezone();
    const slots = DateTimeService.generateTimeSlots(date, activeTimezone);
    setTimeSlots(slots);
  };

  const handleTimeSlotSelect = (slot: TimeSlot) => {
    const updatedSlots = timeSlots.map(s => ({
      ...s,
      isSelected: s.id === slot.id,
    }));
    setTimeSlots(updatedSlots);
  };

  const handleConfirm = () => {
    if (selectedDate && timeSlots.some(slot => slot.isSelected)) {
      const selectedSlot = timeSlots.find(slot => slot.isSelected);
      if (selectedSlot) {
        DateTimeService.setSelectedDate(selectedDate);
        DateTimeService.setSelectedTimeSlot(selectedSlot);
        onDateSelect(selectedDate, timeSlots);
        onClose();
      }
    }
  };

  const isDateToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isDateSelected = (date: Date) => {
    return selectedDate?.toDateString() === date.toDateString();
  };

  const renderDateItem = (date: Date) => {
    const activeTimezone = DateTimeService.getActiveTimezone();
    const formattedDate = DateTimeService.formatDate(date, activeTimezone);
    const isToday = isDateToday(date);
    const isSelected = isDateSelected(date);
    const isStoreOpen = DateTimeService.isStoreOpen(date, activeTimezone);

    return (
      <TouchableOpacity
        key={date.toISOString()}
        style={[
          styles.dateItem,
          {
            backgroundColor: Colors[colorScheme ?? 'light'].background,
            borderColor: Colors[colorScheme ?? 'light'].border,
          },
          isSelected && {
            backgroundColor: Colors[colorScheme ?? 'light'].tint,
            borderColor: Colors[colorScheme ?? 'light'].tint,
          },
        ]}
        onPress={() => handleDateSelect(date)}
      >
        <Text
          style={[
            styles.dateText,
            { color: Colors[colorScheme ?? 'light'].text },
            isSelected && { color: '#FFFFFF' },
          ]}
        >
          {formattedDate}
        </Text>
        {isToday && (
          <Text
            style={[
              styles.todayText,
              { color: Colors[colorScheme ?? 'light'].tint },
              isSelected && { color: '#FFFFFF' },
            ]}
          >
            Today
          </Text>
        )}
        <View
          style={[
            styles.statusIndicator,
            { backgroundColor: isStoreOpen ? '#4CAF50' : '#F44336' },
          ]}
        />
      </TouchableOpacity>
    );
  };

  const renderTimeSlot = (slot: TimeSlot) => {
    return (
      <TouchableOpacity
        key={slot.id}
        style={[
          styles.timeSlot,
          {
            backgroundColor: Colors[colorScheme ?? 'light'].background,
            borderColor: Colors[colorScheme ?? 'light'].border,
          },
          slot.isSelected && {
            backgroundColor: Colors[colorScheme ?? 'light'].tint,
            borderColor: Colors[colorScheme ?? 'light'].tint,
          },
          !slot.isAvailable && {
            backgroundColor: '#F5F5F5',
            borderColor: '#E0E0E0',
          },
        ]}
        onPress={() => slot.isAvailable && handleTimeSlotSelect(slot)}
        disabled={!slot.isAvailable}
      >
        <Text
          style={[
            styles.timeSlotText,
            { color: Colors[colorScheme ?? 'light'].text },
            slot.isSelected && { color: '#FFFFFF' },
            !slot.isAvailable && { color: '#9E9E9E' },
          ]}
        >
          {slot.displayTime}
        </Text>
      </TouchableOpacity>
    );
  };

  const modalContent = (
    <SafeAreaView
      style={[
        styles.container,
        {
          backgroundColor: Colors[colorScheme ?? 'light'].background,
        },
        isBottomSheet && styles.bottomSheetContainer,
      ]}
    >
      <View style={styles.header}>
        <Text
          style={[
            styles.title,
            { color: Colors[colorScheme ?? 'light'].text },
          ]}
        >
          Select Date & Time
        </Text>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Text
            style={[
              styles.closeButtonText,
              { color: Colors[colorScheme ?? 'light'].tint },
            ]}
          >
            ✕
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.datesContainer} horizontal showsHorizontalScrollIndicator={false}>
        {dates.map(renderDateItem)}
      </ScrollView>

      {selectedDate && (
        <View style={styles.timeSlotsContainer}>
          <Text
            style={[
              styles.timeSlotsTitle,
              { color: Colors[colorScheme ?? 'light'].text },
            ]}
          >
            Available Times
          </Text>
          <ScrollView style={styles.timeSlotsList} showsVerticalScrollIndicator={false}>
            <View style={styles.timeSlotsGrid}>
              {timeSlots.map(renderTimeSlot)}
            </View>
          </ScrollView>
        </View>
      )}

      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.confirmButton,
            {
              backgroundColor: Colors[colorScheme ?? 'light'].tint,
              opacity: selectedDate && timeSlots.some(slot => slot.isSelected) ? 1 : 0.5,
            },
          ]}
          onPress={handleConfirm}
          disabled={!selectedDate || !timeSlots.some(slot => slot.isSelected)}
        >
          <Text style={styles.confirmButtonText}>Confirm Selection</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );

  if (isBottomSheet) {
    return (
      <Modal
        visible={isVisible}
        transparent
        animationType="slide"
        onRequestClose={onClose}
        statusBarTranslucent
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={styles.overlayTouchable} onPress={onClose} />
          <View style={[styles.bottomSheet, { backgroundColor: Colors[colorScheme ?? 'light'].background }]}>
            <View style={styles.bottomSheetHandle} />
            <View style={styles.bottomSheetHeader}>
              <Text style={[styles.title, { color: Colors[colorScheme ?? 'light'].text }]}>
                Select Date & Time
              </Text>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Text style={[styles.closeButtonText, { color: Colors[colorScheme ?? 'light'].tint }]}>
                  ✕
                </Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.datesContainer} horizontal showsHorizontalScrollIndicator={false}>
              {dates.map(renderDateItem)}
            </ScrollView>

            {selectedDate && (
              <View style={styles.timeSlotsContainer}>
                <Text style={[styles.timeSlotsTitle, { color: Colors[colorScheme ?? 'light'].text }]}>
                  Available Times
                </Text>
                <ScrollView style={styles.timeSlotsList} showsVerticalScrollIndicator={false}>
                  <View style={styles.timeSlotsGrid}>
                    {timeSlots.map(renderTimeSlot)}
                  </View>
                </ScrollView>
              </View>
            )}

            <View style={styles.footer}>
              <TouchableOpacity
                style={[
                  styles.confirmButton,
                  {
                    backgroundColor: Colors[colorScheme ?? 'light'].tint,
                    opacity: selectedDate && timeSlots.some(slot => slot.isSelected) ? 1 : 0.5,
                  },
                ]}
                onPress={handleConfirm}
                disabled={!selectedDate || !timeSlots.some(slot => slot.isSelected)}
              >
                <Text style={styles.confirmButtonText}>Confirm Selection</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  }

  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      {modalContent}
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  bottomSheetContainer: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  overlayTouchable: {
    flex: 1,
  },
  bottomSheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: height * 0.85,
    minHeight: height * 0.7,
  },
  bottomSheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#D1D5DB',
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 8,
  },
  bottomSheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  datesContainer: {
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  dateItem: {
    padding: 16,
    marginRight: 12,
    borderRadius: 16,
    borderWidth: 2,
    minWidth: 90,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  dateText: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  todayText: {
    fontSize: 10,
    marginTop: 4,
    fontWeight: '500',
  },
  statusIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: 6,
  },
  timeSlotsContainer: {
    flex: 1,
    padding: 24,
    maxHeight: height * 0.5,
  },
  timeSlotsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  timeSlotsList: {
    flex: 1,
  },
  timeSlotsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 8,
  },
  timeSlot: {
    padding: 12,
    marginBottom: 8,
    borderRadius: 10,
    borderWidth: 2,
    width: '48%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  timeSlotText: {
    fontSize: 15,
    fontWeight: '600',
  },
  footer: {
    padding: 24,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  confirmButton: {
    padding: 18,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
