import React from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity } from 'react-native';
import { GraduationCap, Briefcase, Dumbbell, Zap, ChevronRight } from 'lucide-react-native';
import { Colors } from '@/src/theme/colors';
import Card from '@/src/components/Card';

export default function TemplatesScreen() {
  const templates = [
    {
      id: '1',
      title: 'Student Exam Week',
      description: 'Focused on revision blocks and mental clarity.',
      icon: GraduationCap,
      color: '#4169E1',
    },
    {
      id: '2',
      title: 'Job Search Week',
      description: 'High intensity networking and interview prep.',
      icon: Briefcase,
      color: '#FF8C00',
    },
    {
      id: '3',
      title: 'Fitness / Fat Loss',
      description: 'Daily activity tracking and meal discipline.',
      icon: Dumbbell,
      color: '#32CD32',
    },
    {
      id: '4',
      title: 'Business / Hustle',
      description: 'Maximizing output and eliminating distractions.',
      icon: Zap,
      color: Colors.secondary,
    },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Weekly Templates</Text>
          <Text style={styles.subtitle}>Setup your entire week in one tap.</Text>
        </View>

        {templates.map((template) => (
          <TouchableOpacity key={template.id}>
            <Card style={styles.templateCard}>
              <View style={styles.iconContainer}>
                <View style={[styles.iconBg, { backgroundColor: `${template.color}20` }]}>
                  <template.icon color={template.color} size={28} />
                </View>
                <View style={styles.templateInfo}>
                  <Text style={styles.templateTitle}>{template.title}</Text>
                  <Text style={styles.templateDescription}>{template.description}</Text>
                </View>
                <ChevronRight color={Colors.textMuted} size={20} />
              </View>
            </Card>
          </TouchableOpacity>
        ))}
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
  templateCard: {
    padding: 12,
  },
  iconContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBg: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  templateInfo: {
    flex: 1,
    marginLeft: 16,
  },
  templateTitle: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: '700',
  },
  templateDescription: {
    color: Colors.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
});
