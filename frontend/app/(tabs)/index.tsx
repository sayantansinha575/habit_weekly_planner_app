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

      const [tasksData, statsData] = await Promise.all([
        storage.fetchTasksonCurrentDate(TEST_USER_ID, date),
        storage.getUserStats(TEST_USER_ID),
      ]);

      setcurrentDatetasks(tasksData);
      setStats(statsData);
      setHasLoadedOnce(true);
    } catch (e) {
      console.error(e);
    } finally {
      if (!hasLoadedOnce) {
        setLoading(false);
      }
      isFetchingRef.current = false;
    }
  }, [hasLoadedOnce, selectedDate]);

  React.useEffect(() => {
    loadData();
  }, [selectedDate, loadData]);

  useFocusEffect(
    React.useCallback(() => {
      let isActive = true;

      const run = async () => {
        if (!isActive) return;
        await loadData();
      };

      run();

      return () => {
        isActive = false;
      };
    }, [loadData]),
  );

  const handleToggleTask = async (id: string) => {
    try {
      await storage.toggleTask(id);
      loadData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleSaveGoal = async (goalData: any) => {
    try {
      const dateToSave =
        goalData.scheduledDate instanceof Date
          ? goalData.scheduledDate
          : new Date(goalData.scheduledDate);
      await storage.addTask(
        TEST_USER_ID,
        goalData.title,
        dateToSave,
        goalData.scheduledTime,
        goalData.useNotification,
      );
      setModalVisible(false);
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
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
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
                >
                  {dayName}
                </Text>
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
                      isSelected && styles.selectedDayText,
                    ]}
                  >
                    {dayNum}
                  </Text>
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
        <Card style={styles.insightsPreview}>
          <Text style={styles.insightText}>
            You complete{" "}
            <Text style={{ color: Colors.primary, fontWeight: "700" }}>
              {stats.completionRate}%
            </Text>{" "}
            tasks overall. Best day:{" "}
            <Text style={{ color: Colors.primary, fontWeight: "700" }}>
              {stats.bestDay}
            </Text>
            .
          </Text>
        </Card>
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
    backgroundColor: Colors.background,
  },
  container: {
    padding: 20,
    paddingBottom: 100,
  },
  header: {
    marginBottom: 20,
    marginTop: 20,
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
  insightsPreview: {
    marginTop: 7,
    backgroundColor: "rgb(237, 232, 234)",
    borderColor: "rgba(29, 26, 35, 0.1)",
  },
  insightText: {
    color: Colors.text,
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
    fontFamily: Fonts.regular,
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
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 20,
    minWidth: 45,
  },
  selectedDayItem: {
    backgroundColor: "#FFF",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  dayNameText: {
    fontSize: 12,
    color: Colors.textMuted,
    fontFamily: Fonts.medium,
    marginBottom: 8,
  },
  selectedDayText: {
    color: "#000",
  },
  dayCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
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
