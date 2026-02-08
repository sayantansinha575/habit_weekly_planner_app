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
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  Trash2,
  CheckCircle,
  XCircle,
} from "lucide-react-native";
import { Colors, Fonts } from "@/src/theme/colors";
import TaskItem from "@/src/components/TaskItem";
import GoalModal from "@/src/components/GoalModal";
import { storage } from "@/src/utils/storage";
import { useFocusEffect } from "@react-navigation/native";
import { Alert, TouchableWithoutFeedback, Modal } from "react-native";

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
  const isFetchingTasksRef = React.useRef(false);

  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedTaskIds, setSelectedTaskIds] = useState<Set<string>>(
    new Set(),
  );
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const loadTasks = React.useCallback(async () => {
    if (isFetchingTasksRef.current) return;

    isFetchingTasksRef.current = true;

    try {
      if (!hasLoadedTasksOnce) setLoading(true);

      const data = await storage.fetchTasks(TEST_USER_ID);
      setTasks(data);
      setHasLoadedTasksOnce(true);
    } catch (e) {
      console.error(e);
    } finally {
      if (!hasLoadedTasksOnce) {
        setLoading(false);
      }
      isFetchingTasksRef.current = false;
    }
  }, [hasLoadedTasksOnce]);
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

  const toggleSelection = (id: string) => {
    const newSelected = new Set(selectedTaskIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedTaskIds(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedTaskIds.size === tasks.length) {
      setSelectedTaskIds(new Set());
    } else {
      setSelectedTaskIds(new Set(tasks.map((t) => t.id)));
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedTaskIds.size === 0) return;

    Alert.alert(
      "Confirm Deletion",
      `Are you sure you want to delete ${selectedTaskIds.size} goal(s)?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              const idsToDelete = Array.from(selectedTaskIds);
              await storage.deleteTasks(idsToDelete);
              setTasks((prev) =>
                prev.filter((t) => !selectedTaskIds.has(t.id)),
              );
              setSelectedTaskIds(new Set());
              setIsEditMode(false);
            } catch (e) {
              Alert.alert("Error", "Failed to delete goals.");
            }
          },
        },
      ],
    );
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

        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleRow}>
            <Text style={styles.sectionTitle}>Main Goals</Text>
            {!isEditMode && (
              <TouchableOpacity
                onPress={() => setIsMenuOpen(true)}
                style={styles.menuBtn}
              >
                <MoreVertical
                  style={styles.menuBtnEditbutton}
                  color={Colors.textMuted}
                  size={20}
                />
              </TouchableOpacity>
            )}
          </View>
          {isEditMode && (
            <View style={styles.editActions}>
              <TouchableOpacity
                onPress={handleSelectAll}
                style={styles.actionBtn}
              >
                <Text style={styles.actionBtnText}>
                  {selectedTaskIds.size === tasks.length
                    ? "Deselect All"
                    : "Select All"}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  setIsEditMode(false);
                  setSelectedTaskIds(new Set());
                }}
                style={[styles.actionBtn, { marginLeft: 16 }]}
              >
                <Text style={[styles.actionBtnText, { color: "#FF4444" }]}>
                  Cancel
                </Text>
              </TouchableOpacity>
            </View>
          )}
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
          tasks.map((task) => (
            <TaskItem
              key={task.id}
              title={task.title}
              isCompleted={task.isCompleted}
              scheduledDate={task.scheduledDate}
              scheduledTime={task.scheduledTime}
              isAutoRolled={task.isAutoRolled}
              onToggle={() => handleToggleTask(task.id)}
              onEdit={isEditMode ? undefined : () => openEditModal(task)}
              isSelectionMode={isEditMode}
              isSelected={selectedTaskIds.has(task.id)}
              onSelect={() => toggleSelection(task.id)}
            />
          ))
        )}
      </ScrollView>

      {isEditMode && selectedTaskIds.size > 0 && (
        <TouchableOpacity
          style={styles.deleteFab}
          onPress={handleDeleteSelected}
        >
          <Trash2 color="#FFF" size={24} />
          <Text style={styles.deleteFabText}>
            Delete ({selectedTaskIds.size})
          </Text>
        </TouchableOpacity>
      )}

      <Modal
        visible={isMenuOpen}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsMenuOpen(false)}
      >
        <TouchableWithoutFeedback onPress={() => setIsMenuOpen(false)}>
          <View style={styles.modalOverlay}>
            <View style={styles.dropdownMenu}>
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => {
                  setIsEditMode(true);
                  setIsMenuOpen(false);
                }}
              >
                <Text style={styles.menuItemText}>Edit Goals</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

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
    backgroundColor: Colors.card,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.05)",
  },
  dateInfo: {
    marginTop: 16,
    alignItems: "center",
  },
  dayText: {
    color: Colors.text,
    fontSize: 18,
    fontWeight: "bold",
    fontFamily: Fonts.bold,
  },
  dateText: {
    color: Colors.textMuted,
    fontSize: 14,
    fontFamily: Fonts.regular,
  },
  container: {
    padding: 20,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    backgroundColor: Colors.card,
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  statItem: {
    alignItems: "center",
  },
  statValue: {
    color: Colors.primary,
    fontSize: 20,
    fontWeight: "bold",
    fontFamily: Fonts.bold,
  },
  statLabel: {
    color: Colors.textMuted,
    fontSize: 12,
    marginTop: 4,
    fontFamily: Fonts.regular,
  },
  sectionTitle: {
    color: Colors.text,
    fontSize: 18,
    fontWeight: "700",
    fontFamily: Fonts.bold,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    marginTop: 24,
  },
  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  menuBtn: {
    marginLeft: 8,
    padding: 4,
  },
  editActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  actionBtn: {
    paddingVertical: 4,
  },
  actionBtnText: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: "600",
    fontFamily: Fonts.semiBold,
  },
  deleteFab: {
    position: "absolute",
    bottom: 30,
    alignSelf: "center",
    backgroundColor: "#FF4444",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 30,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  deleteFabText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "bold",
    fontFamily: Fonts.bold,
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.1)",
  },
  dropdownMenu: {
    position: "absolute",
    top: 360, // Rough position, ideally we'd use layout measurements
    right: 20,
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 8,
    minWidth: 150,
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
  },
  menuItem: {
    padding: 12,
  },
  menuItemText: {
    color: Colors.text,
    fontSize: 14,
    fontWeight: "600",
    fontFamily: Fonts.semiBold,
  },
  addGoalBtn: {
    marginTop: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "rgba(29, 26, 35, 0.2)",
    borderStyle: "dashed",
    alignItems: "center",
    backgroundColor: "rgba(29, 26, 35, 0.05)",
  },
  addGoalText: {
    color: Colors.textMuted,
    fontSize: 14,
    fontWeight: "600",
    fontFamily: Fonts.semiBold,
  },
  loadingContent: {
    padding: 40,
    alignItems: "center",
  },

  menuBtnEditbutton: {
    marginLeft: 260,
    padding: 4,
  },
});
