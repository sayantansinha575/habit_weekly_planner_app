import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
} from "react-native";
import { TrendingUp, Calendar, Clock, Award } from "lucide-react-native";
import { Colors, Fonts } from "@/src/theme/colors";
import Card from "@/src/components/Card";
import ProgressRing from "@/src/components/ProgressRing";
import { storage } from "@/src/utils/storage";
import { useFocusEffect } from "@react-navigation/native";

export default function InsightsScreen() {
  const TEST_USER_ID = "user-123";
  const [stats, setStats] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  const [hasLoadedOnce, setHasLoadedOnce] = React.useState(false);
  const [isFetching, setIsFetching] = React.useState(false);

  const loadStats = React.useCallback(async () => {
    if (isFetching) return;
    try {
      if (!hasLoadedOnce) setLoading(true);
      setIsFetching(true);
      const data = await storage.getUserStats(TEST_USER_ID);
      setStats(data);
      setHasLoadedOnce(true);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setIsFetching(false);
    }
  }, [hasLoadedOnce, isFetching]);

  useFocusEffect(
    React.useCallback(() => {
      let isActive = true;

      const run = async () => {
        if (!isActive) return;
        await loadStats();
      };

      run();

      return () => {
        isActive = false;
      };
    }, [loadStats]),
  );

  if (loading || !stats) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View
          style={[
            styles.container,
            { flex: 1, justifyContent: "center", alignItems: "center" },
          ]}
        >
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={{ color: Colors.textMuted, marginTop: 12 }}>
            Loading insights...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Personal Insights</Text>
          <Text style={styles.subtitle}>Your progress at a glance.</Text>
        </View>

        <View style={styles.statsGrid}>
          <Card style={styles.statCard}>
            <ProgressRing
              progress={stats.completionRate / 100}
              color={Colors.primary}
              label="Completion"
              size={80}
            />
          </Card>
          <Card style={styles.statCard}>
            <Calendar color={Colors.secondary} size={24} />
            <Text style={styles.statValue}>{stats.bestDay}</Text>
            <Text style={styles.statLabel}>Best Day</Text>
          </Card>
        </View>

        <Card style={styles.mainInsight}>
          <View style={styles.insightHeader}>
            <Award color={Colors.accent} size={24} />
            <Text style={styles.insightTitle}>Consistency King</Text>
          </View>
          <Text style={styles.insightDescription}>
            “You have a{" "}
            <Text
              style={{
                color: Colors.secondary,
                fontWeight: "bold",
                fontFamily: Fonts.bold,
              }}
            >
              {stats.dailyStreak} day
            </Text>{" "}
            streak! Your most productive day is{" "}
            <Text
              style={{
                color: Colors.secondary,
                fontWeight: "bold",
                fontFamily: Fonts.bold,
              }}
            >
              {stats.bestDay}
            </Text>
            .”
          </Text>
        </Card>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Productivity Patterns</Text>
        </View>

        <Card style={styles.patternCard}>
          <View style={styles.patternHeader}>
            <Clock color={Colors.textMuted} size={20} />
            <Text style={styles.patternTitle}>Workload Overview</Text>
          </View>
          <View style={styles.barContainer}>
            <View
              style={[
                styles.bar,
                { width: "100%", backgroundColor: Colors.primary },
              ]}
            />
            <Text style={styles.barLabel}>Total Tasks: {stats.totalTasks}</Text>
          </View>
          <View style={styles.barContainer}>
            <View
              style={[
                styles.bar,
                {
                  width: `${stats.completionRate}%`,
                  backgroundColor: Colors.success,
                },
              ]}
            />
            <Text style={styles.barLabel}>
              Completed: {stats.completedTasks} ({stats.completionRate}%)
            </Text>
          </View>
        </Card>

        <View style={styles.quoteCard}>
          <Text style={styles.quoteText}>
            "Discipline is doing what needs to be done, even if you don't want
            to do it."
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
    fontWeight: "bold",
    fontFamily: Fonts.bold,
  },
  subtitle: {
    color: Colors.textMuted,
    fontSize: 14,
    marginTop: 4,
    fontFamily: Fonts.regular,
  },
  statsGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  statCard: {
    width: "48%",
    alignItems: "center",
    padding: 20,
  },
  statValue: {
    color: Colors.text,
    fontSize: 20,
    fontWeight: "bold",
    fontFamily: Fonts.bold,
    marginTop: 12,
  },
  statLabel: {
    color: Colors.textMuted,
    fontSize: 12,
    marginTop: 4,
    fontFamily: Fonts.regular,
  },
  mainInsight: {
    marginTop: 20,
    backgroundColor: "#FFF",
    borderColor: "rgba(29, 26, 35, 0.1)",
  },
  insightHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  insightTitle: {
    color: Colors.accent,
    fontSize: 16,
    fontWeight: "bold",
    fontFamily: Fonts.bold,
    marginLeft: 10,
  },
  insightDescription: {
    color: Colors.text,
    fontSize: 14,
    lineHeight: 22,
    fontFamily: Fonts.regular,
  },
  sectionHeader: {
    marginTop: 32,
    marginBottom: 16,
  },
  sectionTitle: {
    color: Colors.text,
    fontSize: 18,
    fontWeight: "700",
    fontFamily: Fonts.bold,
  },
  patternCard: {
    padding: 16,
  },
  patternHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  patternTitle: {
    color: Colors.text,
    fontSize: 14,
    fontWeight: "600",
    fontFamily: Fonts.semiBold,
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
    fontWeight: "500",
    fontFamily: Fonts.medium,
  },
  quoteCard: {
    marginTop: 40,
    padding: 24,
    borderRadius: 16,
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary,
    backgroundColor: "#FFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 2,
  },
  quoteText: {
    color: Colors.textMuted,
    fontSize: 14,
    fontStyle: "italic",
    lineHeight: 20,
    fontFamily: Fonts.regular,
  },
});
