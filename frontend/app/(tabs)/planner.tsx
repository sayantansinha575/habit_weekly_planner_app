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
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import { Colors, Fonts } from "@/src/theme/colors";
import TaskItem from "@/src/components/TaskItem";
import ProgressRing from "@/src/components/ProgressRing";
import GoalModal from "@/src/components/GoalModal";
import { useTaskStore } from "@/src/store/useTaskStore";
import { storage } from "@/src/utils/storage";
import EmptyState from "@/src/components/EmptyState";
import { useFocusEffect } from "@react-navigation/native";
import { Alert, TouchableWithoutFeedback, Modal } from "react-native";
import { useRouter } from "expo-router";
import CustomSplashScreen from "@/src/components/CustomSplashScreen";

export default function PlannerScreen() {
  const router = useRouter();
  const user = useTaskStore((state) => state.user);
  const tasks = useTaskStore((state) => state.tasks);
  const subscriptionStatus = useTaskStore((state) => state.subscriptionStatus);
  const loading = useTaskStore((state) => state.loading);
  const loadTasks = useTaskStore((state) => state.loadTasks);
  const toggleTask = useTaskStore((state) => state.toggleTask);
  const addTask = useTaskStore((state) => state.addTask);
  const updateTask = useTaskStore((state) => state.updateTask);
  const deleteTasks = useTaskStore((state) => state.deleteTasks);
  const isAuthReady = useTaskStore((state) => state.isAuthReady);
  const isSubscriptionLoading = useTaskStore(
    (state) => state.isSubscriptionLoading,
  );

  const [isModalVisible, setModalVisible] = useState(false);
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const isFetchingTasksRef = React.useRef(false);

  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedTaskIds, setSelectedTaskIds] = useState<Set<string>>(
    new Set(),
  );
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());

  const weekDays = React.useMemo(() => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      days.push(date);
    }
    return days;
  }, []);
  const handleLoadTasks = React.useCallback(async () => {
    if (isFetchingTasksRef.current || !user?.id) return;
    isFetchingTasksRef.current = true;
    try {
      await loadTasks(user.id);
    } catch (e) {
      console.error("Planner loadTasks failed", e);
    } finally {
      isFetchingTasksRef.current = false;
    }
  }, [loadTasks, user?.id]);

  React.useEffect(() => {
    handleLoadTasks();
  }, [handleLoadTasks]);

  const handleToggleTask = async (taskId: string) => {
    try {
      await toggleTask(taskId);
      // Stats in store will need refresh if they are visible here
    } catch (e) {
      console.error(e);
    }
  };

  const handleSaveGoal = async (goalData: any) => {
    if (!user?.id) return;
    setModalVisible(false);
    try {
      if (selectedTask) {
        await updateTask(selectedTask.id, goalData);
      } else {
        await addTask(user.id, goalData);
      }
      setSelectedTask(null);
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
              await deleteTasks(idsToDelete);
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
              style={[
                styles.dayItem,
                isSelected && styles.selectedDayItem,
                // Add a small margin to separate items on very narrow screens
                { marginHorizontal: 2 },
              ]}
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

      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.statsRow}>
          <ProgressRing
            progress={
              tasks.length > 0
                ? tasks.filter((t) => t.isCompleted).length / tasks.length
                : 0
            }
            color="#7EB6D2"
            label="Completed"
            subLabel={`${tasks.filter((t) => t.isCompleted).length}/${tasks.length} goals`}
            size={90}
          />
          <ProgressRing
            progress={
              tasks.length > 0
                ? tasks.filter((t) => t.isCompleted).length / tasks.length
                : 0
            }
            color="#7DC9A3"
            label="Efficiency"
            size={90}
          />
        </View>

        <TouchableOpacity style={styles.addGoalBtn} onPress={handlePress}>
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
                <MoreVertical color={Colors.textMuted} size={20} />
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
          <>
            {tasks.map((task) => (
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
            ))}

            {tasks.length === 0 && (
              <EmptyState
                imageSource={require("@/assets/images/planner_checklist_3d.png")}
                message="Tap + to add your first goal for today"
              />
            )}
          </>
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
    backgroundColor: "transparent",
  },
  calendarHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: "rgba(255, 255, 255, 0.4)",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.2)",
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
    backgroundColor: "transparent",
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    // backgroundColor: "rgba(255, 255, 255, 0.75)",
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
    // borderWidth: 1,
    // borderColor: "rgba(255, 255, 255, 0.5)",
    // shadowColor: "#000",
    // shadowOffset: { width: 0, height: 4 },
    // shadowOpacity: 0.02,
    // shadowRadius: 10,
    // elevation: 1,
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
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  menuBtn: {
    padding: 8,
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
    top: 340, // More neutral position
    right: 20,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderRadius: 12,
    padding: 8,
    minWidth: 150,
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
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
    padding: 4,
  },
  calendarContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
    paddingHorizontal: 14,
    marginTop: 40,
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
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
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
