import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { Flame, Plus, Sun, Cloud, Moon, CloudSun } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Colors, Fonts } from "@/src/theme/colors";
import Card from "@/src/components/Card";
import TaskItem from "@/src/components/TaskItem";
import GoalModal from "@/src/components/GoalModal";
import { storage } from "@/src/utils/storage";
import { useFocusEffect } from "@react-navigation/native";
import ProgressRing from "@/src/components/ProgressRing";
import { StatusBar } from "expo-status-bar";

export default function DashboardScreen() {
  const TEST_USER_ID = "user-123";
  const [currentDatetasks, setcurrentDatetasks] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({
    dailyStreak: 0,
    completionRate: 0,
  });
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [weather, setWeather] = useState({ temp: 24 });
  const [loading, setLoading] = useState(true);
  const [isModalVisible, setModalVisible] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const isFetchingRef = React.useRef(false);
  const weekDays = React.useMemo(() => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      days.push(date);
    }
    return days;
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    if (hour < 21) return "Good Evening";
    return "Good Night";
  };

  const getWeatherIcon = () => {
    const hour = new Date().getHours();
    if (hour < 6 || hour >= 21) return <Moon color={Colors.text} size={28} />;
    if (hour < 12) return <Sun color="#FCA311" size={28} />;
    if (hour < 17) return <CloudSun color="#FCA311" size={28} />;
    return <Cloud color={Colors.textMuted} size={28} />;
  };

  const loadData = React.useCallback(async () => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;

    try {
      if (!hasLoadedOnce) setLoading(true);

      const date = selectedDate;

      // 1. Get both Local and Sync promises
      const [tasksResult, statsResult] = await Promise.all([
        storage.fetchTasksonCurrentDate(TEST_USER_ID, date),
        storage.getUserStats(TEST_USER_ID),
      ]);

      // 2. Optimistically set local data first
      setcurrentDatetasks(tasksResult.local);
      setStats(statsResult.local);
      setLoading(false);
      setHasLoadedOnce(true);

      // 3. Wait for background sync in parallel
      const [syncedTasks, syncedStats] = await Promise.all([
        tasksResult.sync,
        statsResult.sync,
      ]);

      // 4. Update state with fresh data only if it returned successfully
      if (syncedTasks) setcurrentDatetasks(syncedTasks);
      if (syncedStats) setStats(syncedStats);
    } catch (e) {
      console.error("loadData failed", e);
    } finally {
      isFetchingRef.current = false;
    }
  }, [hasLoadedOnce, selectedDate]);

  React.useEffect(() => {
    loadData();
  }, [selectedDate, loadData]);

  // useFocusEffect(
  //   React.useCallback(() => {
  //     let isActive = true;

  //     const run = async () => {
  //       if (!isActive) return;
  //       await loadData();
  //     };

  //     run();

  //     return () => {
  //       isActive = false;
  //     };
  //   }, [loadData]),
  // );

  React.useEffect(() => {
    loadData();
  }, []);

  const handleToggleTask = async (id: string) => {
    // Optimistic Update
    const previousTasks = [...currentDatetasks];
    setcurrentDatetasks((prev) =>
      prev.map((t) =>
        t.id === id ? { ...t, isCompleted: !t.isCompleted } : t,
      ),
    );

    try {
      await storage.toggleTask(id);
      // Background re-fetch to ensure stats/other logic stay in sync
      loadData();
    } catch (e) {
      console.error(e);
      setcurrentDatetasks(previousTasks); // Rollback on hard error
    }
  };

  const handleSaveGoal = async (goalData: any) => {
    // Close modal immediately for UX
    setModalVisible(false);

    try {
      const dateToSave =
        goalData.scheduledDate instanceof Date
          ? goalData.scheduledDate
          : new Date(goalData.scheduledDate);

      // We don't have the ID yet, so we can't fully optimistically append safely
      // without generating a temp ID. For now, we'll let storage handle it
      // but keep UI fresh by re-fetching.
      await storage.addTask(
        TEST_USER_ID,
        goalData.title,
        dateToSave,
        goalData.scheduledTime,
        goalData.useNotification,
      );
      loadData();
    } catch (e) {
      console.error(e);
    }
  };

  const completionProgress =
    currentDatetasks.length > 0
      ? currentDatetasks.filter((t: any) => t.isCompleted).length /
        currentDatetasks.length
      : 0;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <LinearGradient
        colors={["#E3F2FD", "#F3E5F5", "#FCE4EC"]}
        style={StyleSheet.absoluteFill}
      />
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <LinearGradient
            colors={["rgba(255,255,255,0.4)", "transparent"]}
            style={styles.headerGlow}
          />
          <Text style={styles.greeting}>{getGreeting()},</Text>
          <View style={styles.nameRow}>
            <Text style={styles.name}>{weather.temp}°C</Text>
            {getWeatherIcon()}
          </View>
        </View>

        <View style={styles.calendarContainer}>
          {weekDays.map((date, index) => {
            const isSelected =
              date.toDateString() === selectedDate.toDateString();
            const dayName = date.toLocaleDateString("en-US", {
              weekday: "short",
            });
            const dayNum = date.getDate().toString().padStart(2, "0");

            const dayMatch = stats.rollingProgress?.find(
              (p: any) => p.day === dayName,
            );
            const dayRate = dayMatch ? dayMatch.rate : 0;

            return (
              <TouchableOpacity
                key={index}
                style={[styles.dayItem, isSelected && styles.selectedDayItem]}
                onPress={() => setSelectedDate(date)}
              >
                <Text
                  style={[
                    styles.dayNameText,
                    isSelected && styles.selectedDayText,
                  ]}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                >
                  {dayName}
                </Text>

                <View style={styles.dayProgressContainer}>
                  {isSelected && (
                    <>
                      <View style={styles.dayProgressTrack} />
                      <View
                        style={[
                          styles.dayProgressFill,
                          { height: `${dayRate}%` },
                        ]}
                      />
                    </>
                  )}
                  <View
                    style={[
                      styles.dayCircle,
                      isSelected
                        ? styles.selectedDayCircle
                        : styles.dashedDayCircle,
                    ]}
                  >
                    <Text
                      style={[
                        styles.dayNumText,
                        isSelected && styles.selectedDayTextItalic,
                      ]}
                    >
                      {dayNum}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        <LinearGradient
          colors={[Colors.primary, "#3D3A4A"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.streakCard}
        >
          <View style={styles.streakContent}>
            <View>
              <Text style={styles.streakLabel}>Current Streak</Text>
              <Text style={styles.streakValue}>{stats.dailyStreak} Days</Text>
            </View>
            <View style={styles.ringWrapper}>
              <ProgressRing
                progress={completionProgress}
                size={70}
                strokeWidth={6}
                color={Colors.secondary}
              >
                <Flame
                  color={Colors.secondary}
                  fill={Colors.secondary}
                  size={32}
                />
              </ProgressRing>
            </View>
          </View>
        </LinearGradient>
        <View style={styles.insightsPreviewContainer}>
          <View
            style={[
              styles.insightsProgressBarFill,
              { width: `${stats.completionRate}%` },
            ]}
          />
          <Text style={styles.insightText}>
            You complete{" "}
            <Text style={styles.insightHighlight}>{stats.completionRate}%</Text>{" "}
            tasks overall. Best day:{" "}
            <Text style={styles.insightHighlight}>{stats.bestDay}</Text>.
          </Text>
        </View>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Today's Plan</Text>
          <Text style={styles.sectionAction}>View all</Text>
        </View>
        {loading ? (
          <View
            style={[
              styles.loadingContent,
              { justifyContent: "center", alignItems: "center" },
            ]}
          >
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={{ color: Colors.textMuted, marginTop: 12 }}>
              Loading data...
            </Text>
          </View>
        ) : (
          <>
            {currentDatetasks.map((task) => (
              <TaskItem
                key={task.id}
                title={task.title}
                isCompleted={task.isCompleted}
                scheduledDate={task.scheduledDate}
                scheduledTime={task.scheduledTime}
                isAutoRolled={task.isAutoRolled}
                onToggle={() => handleToggleTask(task.id)}
              />
            ))}

            {currentDatetasks.length === 0 && (
              <View style={styles.emptyTasks}>
                <Text style={styles.emptyText}>No goals set for today</Text>
              </View>
            )}
          </>
        )}
      </ScrollView>

      <TouchableOpacity
        style={styles.fab}
        onPress={() => setModalVisible(true)}
      >
        <Plus color="#FFF" size={32} />
      </TouchableOpacity>

      <GoalModal
        isVisible={isModalVisible}
        onClose={() => setModalVisible(false)}
        onSave={handleSaveGoal}
      />
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
    paddingBottom: 100,
  },
  header: {
    marginBottom: 20,
    marginTop: 20,
    position: "relative",
  },
  headerGlow: {
    position: "absolute",
    top: -60,
    left: -20,
    right: -20,
    height: 120,
    zIndex: -1,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  greeting: {
    color: Colors.textMuted,
    fontSize: 16,
    fontFamily: Fonts.regular,
  },
  name: {
    color: Colors.text,
    fontSize: 28,
    fontWeight: "bold",
    fontFamily: Fonts.bold,
  },
  streakCard: {
    borderRadius: 24,
    padding: 24,
    marginBottom: 32,
    elevation: 8,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
  },
  streakContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  ringWrapper: {
    width: 70,
    height: 70,
    justifyContent: "center",
    alignItems: "center",
  },
  streakLabel: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 14,
    fontWeight: "600",
    fontFamily: Fonts.semiBold,
  },
  streakValue: {
    color: "#FFF",
    fontSize: 32,
    fontWeight: "800",
    fontFamily: Fonts.bold,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    color: Colors.text,
    fontSize: 18,
    fontWeight: "700",
    fontFamily: Fonts.bold,
  },
  sectionAction: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: "600",
    fontFamily: Fonts.semiBold,
  },
  insightsPreviewContainer: {
    marginTop: 8,
    backgroundColor: "rgba(255, 255, 255, 0.4)",
    borderRadius: 20,
    height: 40,
    justifyContent: "center",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
    marginBottom: 24,
  },
  insightsProgressBarFill: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: "rgba(255, 255, 255, 0.6)",
    borderRadius: 20,
  },
  insightText: {
    color: Colors.text,
    fontSize: 13,
    textAlign: "center",
    fontFamily: Fonts.medium,
    zIndex: 1,
  },
  insightHighlight: {
    color: Colors.primary,
    fontWeight: "800",
    fontFamily: Fonts.bold,
  },
  fab: {
    position: "absolute",
    bottom: 20,
    right: 20,
    backgroundColor: Colors.primary,
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  loadingContent: {
    padding: 40,
    alignItems: "center",
  },
  emptyTasks: {
    padding: 40,
    alignItems: "center",
  },
  emptyText: {
    fontWeight: "bold",
    fontFamily: "Inter, sans-serif",
  },
  calendarContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
    paddingHorizontal: 4,
  },
  dayItem: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 12,
    borderRadius: 20,
  },
  selectedDayItem: {
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    elevation: 6,
    shadowColor: "rgba(0,0,0,0.1)",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
  },
  dayNameText: {
    fontSize: 12,
    color: "#1D1A23",
    fontWeight: "600",
    fontFamily: Fonts.semiBold,
    marginBottom: 8,
  },
  selectedDayText: {
    color: "#000",
  },
  selectedDayTextItalic: {
    color: "#000",
    fontStyle: "italic",
    fontFamily: Fonts.bold,
  },
  dayProgressContainer: {
    width: 36,
    height: 60,
    justifyContent: "flex-end",
    alignItems: "center",
    position: "relative",
  },
  dayProgressTrack: {
    position: "absolute",
    width: 10,
    backgroundColor: "rgba(255, 255, 255, 0.4)",
    top: 0,
    bottom: 0,
    borderRadius: 5,
  },
  dayProgressFill: {
    position: "absolute",
    width: 10,
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    bottom: 0,
    borderRadius: 5,
    maxHeight: "100%",
  },
  dayCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "transparent",
    zIndex: 2,
  },
  selectedDayCircle: {
    borderWidth: 1.5,
    borderColor: "#000",
  },
  dashedDayCircle: {
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderStyle: "dashed",
  },
  dayNumText: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.text,
    fontFamily: Fonts.bold,
  },
});
