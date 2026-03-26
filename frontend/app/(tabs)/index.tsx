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
import {
  Flame,
  Plus,
  Sun,
  Cloud,
  Moon,
  CloudSun,
  User,
} from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Colors, Fonts } from "@/src/theme/colors";
import Card from "@/src/components/Card";
import TaskItem from "@/src/components/TaskItem";
import GoalModal from "@/src/components/GoalModal";
import { storage } from "@/src/utils/storage";
import EmptyState from "@/src/components/EmptyState";
import { useFocusEffect } from "@react-navigation/native";
import ProgressRing from "@/src/components/ProgressRing";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import { useTaskStore } from "@/src/store/useTaskStore";
import { shallow } from "zustand/shallow";
import * as Location from "expo-location";
import CustomSplashScreen from "@/src/components/CustomSplashScreen";

export default function DashboardScreen() {
  const router = useRouter();
  const user = useTaskStore((state) => state.user);
  const tasks = useTaskStore((state) => state.tasks);
  const stats = useTaskStore((state) => state.stats);
  const loading = useTaskStore((state) => state.loading);
  const loadTasks = useTaskStore((state) => state.loadTasks);
  const loadStats = useTaskStore((state) => state.loadStats);
  const toggleTask = useTaskStore((state) => state.toggleTask);
  const addTask = useTaskStore((state) => state.addTask);
  const subscriptionStatus = useTaskStore((state) => state.subscriptionStatus);
  const checkSubscription = useTaskStore((state) => state.checkSubscription);
  const isAuthReady = useTaskStore((state) => state.isAuthReady);
  const isSubscriptionLoading = useTaskStore(
    (state) => state.isSubscriptionLoading,
  );

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [weather, setWeather] = useState<{
    temp: number | null;
    city: string | null;
    country: string | null;
  }>({ temp: null, city: null, country: null });
  const [weatherLoading, setWeatherLoading] = useState(true);
  const [isModalVisible, setModalVisible] = useState(false);
  const isFetchingRef = React.useRef(false);

  const fetchWeather = async () => {
    try {
      setWeatherLoading(true);

      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== "granted") {
        console.log("Location permission denied");
        return;
      }

      const location = await Location.getCurrentPositionAsync({});

      const lat = location.coords.latitude;
      const lon = location.coords.longitude;

      console.log("GPS:", lat, lon);

      // 🌍 Get city name
      const geo = await Location.reverseGeocodeAsync({
        latitude: lat,
        longitude: lon,
      });
      console.log("Geo:", geo);

      const city = geo[0]?.city;
      const country = geo[0]?.country;

      const weatherRes = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`,
      );

      const weatherData = await weatherRes.json();

      console.log("Weather Data:", weatherData);

      setWeather({
        temp: Math.round(weatherData.current_weather.temperature),
        city: city,
        country: country,
      });
    } catch (error) {
      console.error("Weather fetch failed:", error);
    } finally {
      setWeatherLoading(false);
    }
  };

  // console.log("Weather:", weather);

  React.useEffect(() => {
    fetchWeather();
  }, []);

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
    if (isFetchingRef.current || !user?.id) return;
    isFetchingRef.current = true;
    try {
      await Promise.all([loadTasks(user.id), loadStats(user.id)]);
    } catch (e) {
      console.error("Dashboard loadData failed", e);
    } finally {
      isFetchingRef.current = false;
    }
  }, [loadTasks, loadStats, user?.id]);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  // Subscription check on focus
  useFocusEffect(
    React.useCallback(() => {
      if (user?.id) {
        checkSubscription();
      }
    }, [user?.id, checkSubscription]),
  );

  const handleToggleTask = async (id: string) => {
    if (!user?.id) return;
    try {
      await toggleTask(id);
      loadStats(user.id); // Background refresh stats
    } catch (e) {
      console.error(e);
    }
  };

  const handleSaveGoal = async (goalData: any) => {
    if (!user?.id) return;
    setModalVisible(false);
    try {
      await addTask(user.id, goalData);
    } catch (e) {
      console.error(e);
    }
  };

  // Local filtering for daily view
  const currentDatetasks = React.useMemo(() => {
    return tasks.filter((t) => {
      const taskDate = new Date(t.scheduledDate);
      return taskDate.toDateString() === selectedDate.toDateString();
    });
  }, [tasks, selectedDate]);

  const completionProgress = React.useMemo(() => {
    if (currentDatetasks.length === 0) return 0;
    return (
      currentDatetasks.filter((t: any) => t.isCompleted).length /
      currentDatetasks.length
    );
  }, [currentDatetasks]);

  // subcription handaler when click button
  const handlePress = () => {
    // 🚫 Block interaction until system is ready
    if (!isAuthReady || isSubscriptionLoading) {
      console.log("⏳ Still initializing, ignore tap");
      return <CustomSplashScreen />;
    }

    if (subscriptionStatus === "FREE" && tasks.length >= 2) {
      router.push("/subscription");
    } else {
      setModalVisible(true); // or setCurrentView("add-meal")
    }
  };

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
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.greeting}>{getGreeting()},</Text>
              <View style={styles.nameRow}>
                {weatherLoading ? (
                  <Text style={styles.greeting}>Fetching weather...</Text>
                ) : (
                  <>
                    {weather.temp !== null && (
                      <Text style={styles.name}>{weather.temp}°C</Text>
                    )}
                    {weather.city ? (
                      <Text style={styles.cityText}>
                        {weather.city}, {weather.country}
                      </Text>
                    ) : null}
                    {getWeatherIcon()}
                  </>
                )}
              </View>
            </View>
            <TouchableOpacity
              style={styles.profileBtn}
              onPress={() => router.push("/profile")}
            >
              <View style={styles.profileIconContainer}>
                <User color={Colors.primary} size={24} />
              </View>
            </TouchableOpacity>
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

            const dayMatch = stats?.rollingProgress?.find(
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
              <Text style={styles.streakValue}>
                {stats?.dailyStreak || 0} Days
              </Text>
            </View>
            <View style={styles.ringWrapper}>
              <ProgressRing
                progress={completionProgress}
                size={70}
                strokeWidth={6}
                color={Colors.secondary}
                trackColor="rgba(255, 255, 255, 0.2)"
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
              { width: `${stats?.completionRate || 0}%` },
            ]}
          />
          <Text style={styles.insightText}>
            You’ve completed{" "}
            <Text style={styles.insightHighlight}>
              {stats?.completionRate || 0}%
            </Text>{" "}
            of your tasks. Best day:{" "}
            <Text style={styles.insightHighlight}>
              {stats?.bestDay || "N/A"}
            </Text>
            .
          </Text>
        </View>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Today's Plan</Text>
          <TouchableOpacity onPress={() => router.push("/planner")}>
            <Text style={styles.sectionAction}>View all</Text>
          </TouchableOpacity>
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
              <EmptyState
                imageSource={require("@/assets/images/planner_checklist_3d.png")}
                message="Tap + to add your first goal for today"
              />
            )}
          </>
        )}
      </ScrollView>

      <TouchableOpacity
        style={styles.fab}
        // onPress={() => {
        //   // Only redirect if explicitly FREE and NOT loading
        //   const isFree = subscriptionStatus === "FREE";
        //   const isSubscriptionLoading =
        //     useTaskStore.getState().isSubscriptionLoading;

        //   if (isFree && !isSubscriptionLoading && tasks.length >= 2) {
        //     router.push("/subscription");
        //   } else {
        //     setModalVisible(true);
        //   }
        // }}
        onPress={handlePress}
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
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  profileBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(255,255,255,0.8)",
    justifyContent: "center",
    alignItems: "center",
    // elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  profileIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.9)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.5)",
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
  cityText: {
    color: Colors.textMuted,
    fontSize: 16,
    fontFamily: Fonts.medium,
    marginLeft: 4,
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
