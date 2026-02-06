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
import { ChevronLeft, ChevronRight } from "lucide-react-native";
import { Colors } from "@/src/theme/colors";
import TaskItem from "@/src/components/TaskItem";
import GoalModal from "@/src/components/GoalModal";
import { storage } from "@/src/utils/storage";
import { useFocusEffect } from "@react-navigation/native";

export default function PlannerScreen() {
  /* 
    TODO: Integrate with real Auth Context. 
    Using a fixed ID for development to ensure persistence works across reloads.
  */
  const TEST_USER_ID = "user-123";
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [isModalVisible, setModalVisible] = useState(false);
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [hasLoadedTasksOnce, setHasLoadedTasksOnce] = useState(false);
  const [isFetchingTasks, setIsFetchingTasks] = useState(false);

  const loadTasks = React.useCallback(async () => {
    if (isFetchingTasks) return;
    try {
      if (!hasLoadedTasksOnce) setLoading(true);
      setIsFetchingTasks(true);

      const data = await storage.fetchTasks(TEST_USER_ID);
      setTasks(data);
      setHasLoadedTasksOnce(true);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setIsFetchingTasks(false);
    }
  }, [hasLoadedTasksOnce, isFetchingTasks]);

  useFocusEffect(
    React.useCallback(() => {
      let isActive = true;

      const run = async () => {
        if (!isActive) return;
        await loadTasks();
      };

      run();

      return () => {
        isActive = false;
      };
    }, [loadTasks]),
  );

  const handleToggleTask = async (id: string) => {
    let previousTasks: any[] = [];

    setTasks((prev) => {
      previousTasks = prev;
      return prev.map((t) =>
        t.id === id ? { ...t, isCompleted: !t.isCompleted } : t,
      );
    });

    try {
      await storage.toggleTask(id);
    } catch (e) {
      setTasks(previousTasks);
    }
  };

  const handleSaveGoal = async (goalData: any) => {
    try {
      if (selectedTask) {
        // Editing existing task
        const dateToSave =
          goalData.scheduledDate instanceof Date
            ? goalData.scheduledDate
            : new Date(goalData.scheduledDate);

        const updatedTask = await storage.updateTask(
          goalData.id,
          goalData.title,
          dateToSave,
          goalData.scheduledTime,
          goalData.useNotification,
        );

        setTasks((prev) =>
          prev.map((t) => (t.id === updatedTask.id ? updatedTask : t)),
        );
      } else {
        // Adding new task
        const dateToSave =
          goalData.scheduledDate instanceof Date
            ? goalData.scheduledDate
            : new Date(goalData.scheduledDate);

        const newTask = await storage.addTask(
          TEST_USER_ID,
          goalData.title,
          dateToSave,
          goalData.scheduledTime,
          goalData.useNotification,
        );

        setTasks((prev) => [...prev, newTask]);
      }

      setModalVisible(false);
    } catch (e) {
      console.error(e);
    }
  };

  const openEditModal = (task: any) => {
    setSelectedTask(task);
    setModalVisible(true);
  };

  const openAddModal = () => {
    setSelectedTask(null);
    setModalVisible(true);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.calendarHeader}>
        <TouchableOpacity>
          <ChevronLeft color={Colors.text} size={24} />
        </TouchableOpacity>
        <View style={styles.dateInfo}>
          <Text style={styles.dayText}>Monday</Text>
          <Text style={styles.dateText}>Feb 3, 2026</Text>
        </View>
        <TouchableOpacity>
          <ChevronRight color={Colors.text} size={24} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              {tasks.filter((t) => t.isCompleted).length}/{tasks.length}
            </Text>
            <Text style={styles.statLabel}>Completed</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              {tasks.length > 0
                ? Math.round(
                    (tasks.filter((t) => t.isCompleted).length / tasks.length) *
                      100,
                  )
                : 0}
              %
            </Text>
            <Text style={styles.statLabel}>Efficiency</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.addGoalBtn} onPress={openAddModal}>
          <Text style={styles.addGoalText}>+ Add Daily Goal</Text>
        </TouchableOpacity>

        <Text style={styles.sectionTitle}>Main Goals</Text>

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
          tasks.map((task) => (
            <TaskItem
              key={task.id}
              title={task.title}
              isCompleted={task.isCompleted}
              scheduledDate={task.scheduledDate}
              scheduledTime={task.scheduledTime}
              isAutoRolled={task.isAutoRolled}
              onToggle={() => handleToggleTask(task.id)}
              onEdit={() => openEditModal(task)}
            />
          ))
        )}
      </ScrollView>

      <GoalModal
        isVisible={isModalVisible}
        onClose={() => setModalVisible(false)}
        onSave={handleSaveGoal}
        initialData={selectedTask}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  calendarHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  dateInfo: {
    marginTop: 16,
    alignItems: "center",
  },
  dayText: {
    color: Colors.text,
    fontSize: 18,
    fontWeight: "bold",
  },
  dateText: {
    color: Colors.textMuted,
    fontSize: 14,
  },
  container: {
    padding: 20,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
  },
  statItem: {
    alignItems: "center",
  },
  statValue: {
    color: Colors.primary,
    fontSize: 20,
    fontWeight: "bold",
  },
  statLabel: {
    color: Colors.textMuted,
    fontSize: 12,
    marginTop: 4,
  },
  sectionTitle: {
    color: Colors.text,
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 16,
    marginTop: 16,
  },
  addGoalBtn: {
    marginTop: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    borderStyle: "dashed",
    alignItems: "center",
  },
  addGoalText: {
    color: Colors.textMuted,
    fontSize: 14,
    fontWeight: "600",
  },
  loadingContent: {
    padding: 40,
    alignItems: "center",
  },
});
