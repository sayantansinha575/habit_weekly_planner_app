import React from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity } from 'react-native';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react-native';
import { Colors } from '../theme/colors';
import TaskItem from '../components/TaskItem';

const PlannerScreen = () => {
  const tasks = [
    { id: '1', title: 'Morning Workout', isCompleted: true },
    { id: '2', title: 'Project Deep Work', isCompleted: false, isAutoRolled: true },
    { id: '3', title: 'Read 20 Pages', isCompleted: false },
    { id: '4', title: 'Plan Tomorrow', isCompleted: false },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.calendarHeader}>
        <TouchableOpacity>
          <ChevronLeft color={Colors.text} size={24} />
        </TouchableOpacity>
        <View style={styles.dateInfo}>
          <Text style={styles.dayText}>Monday</Text>
          <Text style={styles.dateText}>Feb 1, 2026</Text>
        </View>
        <TouchableOpacity>
          <ChevronRight color={Colors.text} size={24} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>1/4</Text>
            <Text style={styles.statLabel}>Completed</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>25%</Text>
            <Text style={styles.statLabel}>Efficiency</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Main Goals</Text>
        {tasks.map((task) => (
          <TaskItem
            key={task.id}
            title={task.title}
            isCompleted={task.isCompleted}
            isAutoRolled={task.isAutoRolled}
          />
        ))}

        <TouchableOpacity style={styles.addGoalBtn}>
          <Text style={styles.addGoalText}>+ Add Daily Goal</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  calendarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  dateInfo: {
    alignItems: 'center',
  },
  dayText: {
    color: Colors.text,
    fontSize: 18,
    fontWeight: 'bold',
  },
  dateText: {
    color: Colors.textMuted,
    fontSize: 14,
  },
  container: {
    padding: 20,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    color: Colors.primary,
    fontSize: 20,
    fontWeight: 'bold',
  },
  statLabel: {
    color: Colors.textMuted,
    fontSize: 12,
    marginTop: 4,
  },
  sectionTitle: {
    color: Colors.text,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  addGoalBtn: {
    marginTop: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    borderStyle: 'dashed',
    alignItems: 'center',
  },
  addGoalText: {
    color: Colors.textMuted,
    fontSize: 14,
    fontWeight: '600',
  },
});

export default PlannerScreen;
