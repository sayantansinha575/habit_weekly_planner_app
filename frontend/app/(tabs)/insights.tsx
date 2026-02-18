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
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
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
  const isFetchingRef = React.useRef(false);

  const loadStats = React.useCallback(async () => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;

    try {
      if (!hasLoadedOnce) setLoading(true);

      // 1. Get both Local and Sync promises
      const statsResult = await storage.getUserStats(TEST_USER_ID);

      // 2. Optimistically set local data first
      setStats(statsResult.local);
      setLoading(false);
      setHasLoadedOnce(true);

      // 3. Wait for background sync
      const syncedStats = await statsResult.sync;

      // 4. Update state with fresh data
      if (syncedStats) setStats(syncedStats);
    } catch (e) {
      console.error("loadStats failed", e);
    } finally {
      isFetchingRef.current = false;
    }
  }, [hasLoadedOnce]);

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
      <StatusBar style="dark" />
      <LinearGradient
        colors={["#E3F2FD", "#F3E5F5", "#FCE4EC"]}
        style={StyleSheet.absoluteFill}
      />
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
          <Card style={[styles.statCard, { backgroundColor: "#FFF" }]}>
            <Calendar color={Colors.secondary} size={24} />
            <Text
              style={styles.statValue}
              numberOfLines={1}
              adjustsFontSizeToFit
            >
              {stats.bestDay}
            </Text>
            <Text style={styles.statLabel}>Best Day</Text>
          </Card>
        </View>

        <Card style={styles.mainInsight}>
          <View style={styles.insightHeader}>
            <Award color={Colors.accent} size={24} />
            <Text
              style={styles.insightTitle}
              numberOfLines={1}
              adjustsFontSizeToFit
            >
              Consistency King
            </Text>
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
          <Text style={styles.sectionTitle}>Task Progress</Text>
        </View>

        <Card style={styles.chartCard}>
          <View style={styles.chartContainer}>
            {stats.weeklyProgress?.map((item: any, index: number) => {
              const colors = [
                "#8ECAE6",
                "#7ED3AD",
                "#C2A3D1",
                "#FCA311",
                "#FFD166",
                "#06D6A0",
                "#118AB2",
              ];
              const barColor = colors[index % colors.length];
              return (
                <View key={index} style={styles.barWrapper}>
                  <Text style={styles.barPercentage}>{item.rate}%</Text>
                  <View style={styles.barBackground}>
                    <View
                      style={[
                        styles.barFill,
                        {
                          height: `${Math.max(item.rate, 2)}%`,
                          backgroundColor: barColor,
                        },
                      ]}
                    />
                  </View>
                  <View style={styles.labelWrapper}>
                    <Text style={styles.rotatedLabel}>{item.day}</Text>
                  </View>
                </View>
              );
            })}
          </View>
          <View style={styles.chartBaseLine} />
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

        <Card style={styles.mainInsight}>
          <View>
            <Text style={styles.quoteText}>
              "Discipline is doing what needs to be done, even if you don't want
              to do it."
            </Text>
          </View>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "transparent",
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
    // backgroundColor: "rgba(255, 255, 255, 0.75)",
    borderRadius: 20,
    borderWidth: 0,
    // borderColor: "rgba(255, 255, 255, 0.5)",
    // shadowColor: "#000",
    // shadowOffset: { width: 0, height: 4 },
    // shadowOpacity: 0.02,
    // shadowRadius: 10,
    elevation: 0,
    backgroundColor: "transparent",
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
    // backgroundColor: "rgba(255, 255, 255, 0.75)",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#FFF",
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 10,
    elevation: 0,
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
    // backgroundColor: "rgba(255, 255, 255, 0.75)",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#FFF",
    shadowColor: "#FFF",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 10,
    elevation: 0,
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
    borderRadius: 20,
    // borderLeftWidth: 4,
    // borderLeftColor: Colors.primary,
    // backgroundColor: "rgba(255, 255, 255, 0.5)",
    // borderWidth: 1,
    // borderColor: "rgba(255, 255, 255, 0.2)",
    shadowColor: "#000",
    // shadowOffset: { width: 0, height: 4 },
    // shadowOpacity: 0.02,
    // shadowRadius: 10,
    elevation: 2,
  },
  quoteText: {
    color: Colors.textMuted,
    fontSize: 14,
    fontStyle: "italic",
    lineHeight: 20,
    fontFamily: Fonts.regular,
  },
  chartCard: {
    padding: 24,
    paddingBottom: 50,
    // backgroundColor: "rgba(255, 255, 255, 0.75)",
    borderRadius: 20,
    borderWidth: 0,
    borderColor: "#FFF",
    shadowColor: "#FFF",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 10,
    elevation: 0,
  },
  chartContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    height: 140,
  },
  barWrapper: {
    alignItems: "center",
    flex: 1,
  },
  barPercentage: {
    fontSize: 11,
    fontWeight: "bold",
    color: Colors.textMuted,
    marginBottom: 8,
    fontFamily: Fonts.bold,
  },
  barBackground: {
    width: "70%",
    maxWidth: 32,
    height: 100,
    backgroundColor: "transparent",
    justifyContent: "flex-end",
  },
  barFill: {
    width: "100%",
    borderRadius: 4,
  },
  labelWrapper: {
    position: "absolute",
    bottom: -45,
    width: 80,
    alignItems: "center",
  },
  rotatedLabel: {
    fontSize: 10,
    color: "#5B5B9D",
    fontFamily: Fonts.medium,
    transform: [{ rotate: "-35deg" }],
    textAlign: "right",
    width: 60,
  },
  chartBaseLine: {
    height: 2,
    backgroundColor: "rgba(0,0,0,0.1)",
    marginTop: 2,
    width: "100%",
  },
});
