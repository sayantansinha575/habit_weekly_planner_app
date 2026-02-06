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
import { Flame, Plus } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Colors } from "@/src/theme/colors";
import Card from "@/src/components/Card";
import TaskItem from "@/src/components/TaskItem";
import GoalModal from "@/src/components/GoalModal";
import { storage } from "@/src/utils/storage";
import { useFocusEffect } from "@react-navigation/native";

export default function DashboardScreen() {
  const TEST_USER_ID = "user-123";
  const [currentDatetasks, setcurrentDatetasks] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({
    dailyStreak: 0,
    completionRate: 0,
  });
  const [loading, setLoading] = useState(true);
  const [isModalVisible, setModalVisible] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);

  const loadData = React.useCallback(async () => {
    if (isFetching) return;
    try {
      if (!hasLoadedOnce) setLoading(true);
      setIsFetching(true);

      const date = new Date();

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
      setLoading(false);
      setIsFetching(false);
    }
  }, [hasLoadedOnce, isFetching]);

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

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <Text style={styles.greeting}>Good Morning,</Text>
          <Text style={styles.name}>Champion 🚀</Text>
        </View>

        <LinearGradient
          colors={[Colors.primary, "#4B0082"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.streakCard}
        >
          <View style={styles.streakContent}>
            <View>
              <Text style={styles.streakLabel}>Current Streak</Text>
              <Text style={styles.streakValue}>{stats.dailyStreak} Days</Text>
            </View>
            <Flame color={Colors.secondary} size={48} />
          </View>
        </LinearGradient>

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

        <Card style={styles.insightsPreview}>
          <Text style={styles.insightText}>
            You complete{" "}
            <Text style={{ color: Colors.secondary }}>
              {stats.completionRate}%
            </Text>{" "}
            tasks overall. Best day:{" "}
            <Text style={{ color: Colors.secondary }}>{stats.bestDay}</Text>.
          </Text>
        </Card>
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
    fontWeight: "bold",
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
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  streakLabel: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 14,
    fontWeight: "600",
  },
  streakValue: {
    color: "#FFF",
    fontSize: 32,
    fontWeight: "800",
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
  },
  sectionAction: {
    color: Colors.primary,
    fontSize: 14,
  },
  insightsPreview: {
    marginTop: 24,
    backgroundColor: "rgba(138, 43, 226, 0.1)",
    borderColor: "rgba(138, 43, 226, 0.3)",
  },
  insightText: {
    color: Colors.text,
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
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
    color: Colors.textMuted,
    fontSize: 14,
    fontStyle: "italic",
  },
});
