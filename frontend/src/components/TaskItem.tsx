import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { CheckCircle2, Circle, Flame } from 'lucide-react-native';
import { Colors } from '../theme/colors';

export interface TaskItemProps {
  title: string;
  isCompleted: boolean;
  isAutoRolled?: boolean;
  onToggle?: () => void;
  onEdit?: () => void;
}

const TaskItem = ({ title, isCompleted, isAutoRolled, onToggle, onEdit }: TaskItemProps) => {
  return (
    <TouchableOpacity style={styles.container} onPress={onEdit} activeOpacity={0.7}>
      <View style={styles.leftSection}>
        <TouchableOpacity onPress={onToggle}>
          {isCompleted ? (
            <CheckCircle2 color={Colors.success} size={24} />
          ) : (
            <Circle color={Colors.textMuted} size={24} />
          )}
        </TouchableOpacity>
        <View style={styles.textContainer}>
          <Text style={[styles.title, isCompleted && styles.completedText]}>{title}</Text>
          {isAutoRolled && (
            <View style={styles.rolledBadge}>
              <Text style={styles.rolledText}>Auto-rolled</Text>
            </View>
          )}
        </View>
      </View>
      {isCompleted && <Flame color={Colors.accent} size={20} />}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.card,
    padding: 16,
    borderRadius: 12,
    marginVertical: 4,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  textContainer: {
    marginLeft: 12,
  },
  title: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: '500',
  },
  completedText: {
    textDecorationLine: 'line-through',
    color: Colors.textMuted,
  },
  rolledBadge: {
    backgroundColor: '#333',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 4,
    alignSelf: 'flex-start',
  },
  rolledText: {
    color: Colors.secondary,
    fontSize: 10,
    fontWeight: 'bold',
  },
});

export default TaskItem;
