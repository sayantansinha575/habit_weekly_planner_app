import React from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView } from 'react-native';
import { TrendingUp, Calendar, Clock, Award } from 'lucide-react-native';
import { Colors } from '@/src/theme/colors';
import Card from '@/src/components/Card';

export default function InsightsScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Personal Insights</Text>
          <Text style={styles.subtitle}>Your progress at a glance.</Text>
        </View>

        <View style={styles.statsGrid}>
          <Card style={styles.statCard}>
            <TrendingUp color={Colors.primary} size={24} />
            <Text style={styles.statValue}>73%</Text>
            <Text style={styles.statLabel}>Completion</Text>
          </Card>
          <Card style={styles.statCard}>
            <Calendar color={Colors.secondary} size={24} />
            <Text style={styles.statValue}>Tuesday</Text>
            <Text style={styles.statLabel}>Best Day</Text>
          </Card>
        </View>

        <Card style={styles.mainInsight}>
          <View style={styles.insightHeader}>
            <Award color={Colors.accent} size={24} />
            <Text style={styles.insightTitle}>Consistency King</Text>
          </View>
          <Text style={styles.insightDescription}>
            “You complete <Text style={{ color: Colors.secondary, fontWeight: 'bold' }}>73%</Text> tasks when you plan the night before.”
          </Text>
        </Card>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Productivity Patterns</Text>
        </View>

        <Card style={styles.patternCard}>
          <View style={styles.patternHeader}>
            <Clock color={Colors.textMuted} size={20} />
            <Text style={styles.patternTitle}>Planning vs Execution</Text>
          </View>
          <View style={styles.barContainer}>
            <View style={[styles.bar, { width: '80%', backgroundColor: Colors.primary }]} />
            <Text style={styles.barLabel}>Planning: 80%</Text>
          </View>
          <View style={styles.barContainer}>
            <View style={[styles.bar, { width: '65%', backgroundColor: Colors.success }]} />
            <Text style={styles.barLabel}>Execution: 65%</Text>
          </View>
        </Card>

        <View style={styles.quoteCard}>
          <Text style={styles.quoteText}>
            "Discipline is doing what needs to be done, even if you don't want to do it."
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  container: {
    padding: 20,
  },
  header: {
    marginBottom: 24,
    marginTop: 20,
  },
  title: {
    color: Colors.text,
    fontSize: 28,
    fontWeight: 'bold',
  },
  subtitle: {
    color: Colors.textMuted,
    fontSize: 14,
    marginTop: 4,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statCard: {
    width: '48%',
    alignItems: 'center',
    padding: 20,
  },
  statValue: {
    color: Colors.text,
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 12,
  },
  statLabel: {
    color: Colors.textMuted,
    fontSize: 12,
    marginTop: 4,
  },
  mainInsight: {
    marginTop: 20,
    backgroundColor: 'rgba(255, 69, 0, 0.05)',
    borderColor: 'rgba(255, 69, 0, 0.2)',
  },
  insightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  insightTitle: {
    color: Colors.accent,
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  insightDescription: {
    color: Colors.text,
    fontSize: 14,
    lineHeight: 22,
  },
  sectionHeader: {
    marginTop: 32,
    marginBottom: 16,
  },
  sectionTitle: {
    color: Colors.text,
    fontSize: 18,
    fontWeight: '700',
  },
  patternCard: {
    padding: 16,
  },
  patternHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  patternTitle: {
    color: Colors.text,
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  barContainer: {
    marginBottom: 16,
  },
  bar: {
    height: 8,
    borderRadius: 4,
    marginBottom: 6,
  },
  barLabel: {
    color: Colors.textMuted,
    fontSize: 12,
  },
  quoteCard: {
    marginTop: 40,
    padding: 20,
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary,
    backgroundColor: 'rgba(138, 43, 226, 0.05)',
  },
  quoteText: {
    color: Colors.textMuted,
    fontSize: 14,
    fontStyle: 'italic',
    lineHeight: 20,
  },
});
