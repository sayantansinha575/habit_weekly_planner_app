import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { CheckCircle2, Circle, Flame } from "lucide-react-native";
import { Colors } from "../theme/colors";

export interface TaskItemProps {
  title: string;
  isCompleted: boolean;
  scheduledDate?: string | Date;
  scheduledTime?: string;
  isAutoRolled?: boolean;
  onToggle?: () => void;
  onEdit?: () => void;
  isSelectionMode?: boolean;
  isSelected?: boolean;
  onSelect?: () => void;
}

const TaskItem = ({
  title,
  isCompleted,
  scheduledDate,
  scheduledTime,
  isAutoRolled,
  onToggle,
  onEdit,
  isSelectionMode,
  isSelected,
  onSelect,
}: TaskItemProps) => {
  const formatTaskDate = () => {
    if (!scheduledDate) return "";
    const date = new Date(scheduledDate);
    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    const month = months[date.getMonth()];
    const day = date.getDate();

    let timeDisplay = "";
    if (scheduledTime) {
      const [hours, minutes] = scheduledTime.split(":").map(Number);
      const ampm = hours >= 12 ? "PM" : "AM";
      const hours12 = hours % 12 || 12;
      timeDisplay = `, ${hours12}:${minutes.toString().padStart(2, "0")} ${ampm}`;
    }

    return `${month} ${day}${timeDisplay}`;
  };

  const displayText = formatTaskDate();
  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onEdit}
      activeOpacity={0.7}
    >
      <View style={styles.leftSection}>
        {isSelectionMode ? (
          <TouchableOpacity
            onPress={onSelect}
            style={styles.selectionIndicator}
          >
            {isSelected ? (
              <CheckCircle2 color={Colors.primary} size={24} />
            ) : (
              <Circle color={Colors.border} size={24} />
            )}
          </TouchableOpacity>
        ) : (
          <TouchableOpacity onPress={onToggle}>
            {isCompleted ? (
              <CheckCircle2 color={Colors.success} size={24} />
            ) : (
              <Circle color={Colors.textMuted} size={24} />
            )}
          </TouchableOpacity>
        )}
        <View style={styles.textContainer}>
          <Text style={[styles.title, isCompleted && styles.completedText]}>
            {title}
          </Text>
          {isAutoRolled && (
            <View style={styles.rolledBadge}>
              <Text style={styles.rolledTextAutorolled}>Auto-rolled</Text>
            </View>
          )}
          {displayText ? (
            <View style={styles.rolledBadge}>
              <Text style={styles.rolledText}>{displayText}</Text>
            </View>
          ) : null}
        </View>
      </View>
      {isCompleted && <Flame color={Colors.accent} size={20} />}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: Colors.card,
    padding: 16,
    borderRadius: 12,
    marginVertical: 4,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  leftSection: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  selectionIndicator: {
    marginRight: 4,
  },
  textContainer: {
    marginLeft: 12,
  },
  title: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: "500",
  },
  completedText: {
    textDecorationLine: "line-through",
    color: Colors.textMuted,
  },
  rolledBadge: {
    backgroundColor: "rgba(0, 0, 0, 0.05)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginTop: 4,
    alignSelf: "flex-start",
  },
  rolledText: {
    color: Colors.primary,
    fontSize: 10,
    fontWeight: "bold",
  },
  rolledTextAutorolled: {
    color: Colors.accent,
    fontSize: 10,
    fontWeight: "bold",
  },
});

export default TaskItem;
