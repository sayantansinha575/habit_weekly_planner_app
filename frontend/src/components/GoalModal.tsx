import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  TouchableOpacity,
  Switch,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import DateTimePicker, {
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { X, Calendar as CalendarIcon } from "lucide-react-native";
import { Colors } from "../theme/colors";

interface GoalModalProps {
  isVisible: boolean;
  onClose: () => void;
  onSave: (goal: any) => void;
  initialData?: any;
}

const DAYS = ["M", "T", "W", "T", "F", "S", "S"];

const GoalModal = ({
  isVisible,
  onClose,
  onSave,
  initialData,
}: GoalModalProps) => {
  const [goalName, setGoalName] = useState("");
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(Platform.OS === "ios"); // Keep visible on iOS for spinner
  const [useNotification, setUseNotification] = useState(true);

  // For dynamic weeks
  const [weekDates, setWeekDates] = useState<Date[]>([]);

  useEffect(() => {
    if (!selectedDate) return;

    const today = new Date(selectedDate);
    const day = today.getDay();
    const diff = today.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(today);
    monday.setDate(diff);

    const week = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      return d;
    });

    setWeekDates(week);
  }, [selectedDate]);

  useEffect(() => {
    if (!isVisible) return;

    if (initialData) {
      setGoalName(initialData.title ?? "");

      // Handle scheduledDate and scheduledTime from database
      if (initialData.scheduledDate) {
        const date = new Date(initialData.scheduledDate);

        // If there's a scheduledTime, parse and set it (format: "HH:mm")
        if (initialData.scheduledTime) {
          const [hours, minutes] = initialData.scheduledTime
            .split(":")
            .map(Number);
          date.setHours(hours, minutes, 0, 0);
        }

        setSelectedDate(date);
      }

      // Set notification preference from task
      if (initialData.isNotificationEnabled !== undefined) {
        setUseNotification(initialData.isNotificationEnabled);
      }
    } else {
      // Reset for new task
      setGoalName("");
      setSelectedDate(new Date());
      setUseNotification(true);
    }
  }, [initialData, isVisible]);

  const handleSave = () => {
    // Extract time as HH:mm
    const timeString = selectedDate.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });

    onSave({
      id: initialData?.id || Math.random().toString(36).substr(2, 9),
      title: goalName,
      isCompleted: initialData?.isCompleted || false,
      scheduledDate: selectedDate, // Date object
      scheduledTime: timeString, // String "HH:mm"
      useNotification,
    });
    onClose();
  };

  const onDateChange = (event: DateTimePickerEvent, date?: Date) => {
    setShowDatePicker(false);
    if (date) {
      setSelectedDate(date);
    }
  };

  const onTimeChange = (event: DateTimePickerEvent, date?: Date) => {
    if (Platform.OS === "android") setShowTimePicker(false);
    if (date) {
      const newDate = new Date(selectedDate);
      newDate.setHours(date.getHours());
      newDate.setMinutes(date.getMinutes());
      setSelectedDate(newDate);
    }
  };

  const formatDate = (date: Date) => {
    const options: Intl.DateTimeFormatOptions = {
      weekday: "short",
      day: "numeric",
      month: "short",
    };
    const dateStr = date.toLocaleDateString("en-US", options);

    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);

    let prefix = "";
    if (date.toDateString() === today.toDateString()) prefix = "Today-";
    else if (date.toDateString() === tomorrow.toDateString())
      prefix = "Tomorrow-";

    return `${prefix}${dateStr}`;
  };

  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.modalContainer}
        >
          <View style={styles.header}>
            <Text style={styles.dateSubText}>{formatDate(selectedDate)}</Text>
            <View style={styles.headerRight}>
              <TouchableOpacity onPress={() => setShowDatePicker(true)}>
                <CalendarIcon color={Colors.text} size={22} />
              </TouchableOpacity>
              <TouchableOpacity onPress={onClose} style={{ marginLeft: 20 }}>
                <X color={Colors.textMuted} size={24} />
              </TouchableOpacity>
            </View>
          </View>

          {showDatePicker && (
            <DateTimePicker
              value={selectedDate}
              mode="date"
              display="default"
              onChange={onDateChange}
            />
          )}

          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Time Picker */}
            <View style={styles.timePickerSection}>
              {Platform.OS === "ios" ? (
                <DateTimePicker
                  value={selectedDate}
                  mode="time"
                  display="spinner"
                  onChange={onTimeChange}
                  textColor={Colors.text}
                />
              ) : (
                <TouchableOpacity
                  style={styles.androidTimeBtn}
                  onPress={() => setShowTimePicker(true)}
                >
                  <Text style={styles.timeTextActive}>
                    {selectedDate.toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </Text>
                </TouchableOpacity>
              )}
              {showTimePicker && Platform.OS === "android" && (
                <DateTimePicker
                  value={selectedDate}
                  mode="time"
                  display="default"
                  onChange={onTimeChange}
                />
              )}
            </View>

            {/* Day Selector with dynamic dates */}
            <View style={styles.daySelector}>
              {weekDates.map((date, index) => {
                const isSelected =
                  date.toDateString() === selectedDate.toDateString();
                return (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.dayCircle,
                      isSelected && styles.dayCircleActive,
                    ]}
                    onPress={() => setSelectedDate(date)}
                  >
                    <Text
                      style={[
                        styles.dayTextSmall,
                        isSelected && styles.dayTextActive,
                      ]}
                    >
                      {DAYS[index]}
                    </Text>
                    <Text
                      style={[
                        styles.dayDateText,
                        isSelected && styles.dayTextActive,
                        index === 6 && { color: "#FF4444" }, // Sunday in red
                      ]}
                    >
                      {date.getDate()}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Goal Input */}
            <View style={styles.inputSection}>
              <TextInput
                style={styles.input}
                placeholder="Goal name"
                placeholderTextColor={Colors.textMuted}
                value={goalName}
                onChangeText={setGoalName}
              />
            </View>

            {/* Push Notification Switch */}
            <View style={styles.optionRow}>
              <View>
                <Text style={styles.optionTitle}>Push Notification</Text>
                <Text style={styles.optionSubTitle}>
                  Remind me when it's time
                </Text>
              </View>
              <Switch
                value={useNotification}
                onValueChange={setUseNotification}
                trackColor={{ false: "#333", true: Colors.primary }}
                thumbColor={useNotification ? "#FFF" : "#AAA"}
              />
            </View>

            <View style={styles.footer}>
              <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveBtn, !goalName && styles.saveBtnDisabled]}
                onPress={handleSave}
                disabled={!goalName}
              >
                <Text style={styles.saveText}>Save</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContainer: {
    backgroundColor: Colors.card,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 24,
    maxHeight: "90%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 15,
    elevation: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
  },
  dateSubText: {
    color: Colors.text,
    fontSize: 14,
    fontStyle: "italic",
  },
  timePickerSection: {
    marginBottom: 20,
    alignItems: "center",
  },
  androidTimeBtn: {
    padding: 20,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 12,
  },
  timeTextActive: {
    color: Colors.primary,
    fontSize: 48,
    fontWeight: "300",
  },
  daySelector: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 30,
  },
  dayCircle: {
    width: 40,
    height: 50,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "transparent",
  },
  dayCircleActive: {
    backgroundColor: "rgba(0, 188, 212, 0.15)",
  },
  dayTextSmall: {
    color: Colors.textMuted,
    fontSize: 10,
    fontWeight: "400",
  },
  dayDateText: {
    color: Colors.text,
    fontSize: 14,
    fontWeight: "600",
    marginTop: 4,
  },
  dayTextActive: {
    color: Colors.primary,
    fontWeight: "bold",
  },
  inputSection: {
    borderBottomWidth: 1.5,
    borderBottomColor: "rgba(0,0,0,0.05)",
    marginBottom: 24,
  },
  input: {
    color: Colors.text,
    fontSize: 18,
    paddingVertical: 10,
    fontWeight: "500",
  },
  optionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
  },
  optionTitle: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: "600",
  },
  optionSubTitle: {
    color: Colors.textMuted,
    fontSize: 12,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 20,
    paddingBottom: 20,
  },
  cancelBtn: {
    padding: 12,
  },
  cancelText: {
    color: Colors.text,
    fontSize: 18,
    fontStyle: "italic",
  },
  saveBtn: {
    padding: 12,
  },
  saveBtnDisabled: {
    opacity: 0.5,
  },
  saveText: {
    color: Colors.text,
    fontSize: 18,
    fontStyle: "italic",
    fontWeight: "600",
  },
});

export default GoalModal;
