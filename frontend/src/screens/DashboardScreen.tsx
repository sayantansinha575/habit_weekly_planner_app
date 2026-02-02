import React from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity } from 'react-native';
import { Flame, Plus } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../theme/colors';
import Card from '../components/Card';
import TaskItem from '../components/TaskItem';

const DashboardScreen = () => {
  // Mock data for UI development
  const tasks = [
    { id: '1', title: 'Morning Workout', isCompleted: true },
    { id: '2', title: 'Project Deep Work', isCompleted: false, isAutoRolled: true },
    { id: '3', title: 'Read 20 Pages', isCompleted: false },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <Text style={styles.greeting}>Good Morning,</Text>
          <Text style={styles.name}>Champion 🚀</Text>
        </View>

        <LinearGradient
          colors={[Colors.primary, '#4B0082']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.streakCard}
        >
          <View style={styles.streakContent}>
            <View>
              <Text style={styles.streakLabel}>Current Streak</Text>
              <Text style={styles.streakValue}>12 Days</Text>
            </View>
            <Flame color={Colors.secondary} size={48} />
          </View>
        </LinearGradient>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Today's Plan</Text>
          <Text style={styles.sectionAction}>View all</Text>
        </View>

        {tasks.map((task) => (
          <TaskItem
            key={task.id}
            title={task.title}
            isCompleted={task.isCompleted}
            isAutoRolled={task.isAutoRolled}
          />
        ))}

        <Card style={styles.insightsPreview}>
          <Text style={styles.insightText}>
            You complete <Text style={{ color: Colors.secondary }}>73%</Text> tasks when you plan the night before.
          </Text>
        </Card>
      </ScrollView>

      <TouchableOpacity style={styles.fab}>
        <Plus color="#FFF" size={32} />
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  container: {
    padding: 20,
    paddingBottom: 100,
  },
  header: {
    marginBottom: 24,
    marginTop: 20,
  },
  greeting: {
    color: Colors.textMuted,
    fontSize: 16,
  },
  name: {
    color: Colors.text,
    fontSize: 28,
    fontWeight: 'bold',
  },
  streakCard: {
    borderRadius: 20,
    padding: 24,
    marginBottom: 32,
    elevation: 5,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  streakContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  streakLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    fontWeight: '600',
  },
  streakValue: {
    color: '#FFF',
    fontSize: 32,
    fontWeight: '800',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    color: Colors.text,
    fontSize: 18,
    fontWeight: '700',
  },
  sectionAction: {
    color: Colors.primary,
    fontSize: 14,
  },
  insightsPreview: {
    marginTop: 24,
    backgroundColor: 'rgba(138, 43, 226, 0.1)',
    borderColor: 'rgba(138, 43, 226, 0.3)',
  },
  insightText: {
    color: Colors.text,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: Colors.primary,
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
});

export default DashboardScreen;
