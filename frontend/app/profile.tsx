import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  Image,
  Alert,
  Dimensions,
  Switch,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import {
  ChevronLeft,
  User,
  Settings,
  Shield,
  Info,
  LogOut,
  Flame,
  Apple,
  Award,
  ChevronRight,
  TrendingUp,
} from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Colors, Fonts } from "@/src/theme/colors";
import { useRouter } from "expo-router";
import { useTaskStore } from "@/src/store/useTaskStore";
import Card from "@/src/components/Card";
import { api } from "@/src/services/api";

const { width } = Dimensions.get("window");

const STREAK_MILESTONES = [1, 3, 7, 14, 30, 50];

export default function ProfileScreen() {
  const router = useRouter();
  const { user, stats, calorieProgress, signOut } = useTaskStore();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"badges" | "settings">("badges");

  const [formData, setFormData] = useState({
    goalWeight: "",
    currentWeight: "",
    height: "",
    dailyStepGoal: "",
    dateOfBirth: "1995-01-01",
    gender: "Male",
  });

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user?.id) return;
      try {
        const profileData = await api.getCalAiProfile(user.id);
        if (profileData) {
          setFormData({
            goalWeight: profileData.goalWeight.toString(),
            currentWeight: profileData.currentWeight.toString(),
            height: profileData.height,
            dailyStepGoal: profileData.dailyStepGoal.toString(),
            dateOfBirth: profileData.dateOfBirth
              ? new Date(profileData.dateOfBirth).toISOString().split("T")[0]
              : "1995-01-01",
            gender: profileData.gender || "Male",
          });
        }
      } catch (e) {
        console.error("Failed to fetch profile:", e);
      }
    };
    fetchProfile();
  }, [user?.id]);

  const handleLogout = async () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          await signOut();
          router.replace("/login");
        },
      },
    ]);
  };

  const handleUpdateCalorieProfile = async () => {
    if (!user?.id) return;
    try {
      setLoading(true);
      await api.updateCalAiProfile(user.id, {
        goalWeight: parseFloat(formData.goalWeight),
        currentWeight: parseFloat(formData.currentWeight),
        height: formData.height,
        dailyStepGoal: parseInt(formData.dailyStepGoal),
        dateOfBirth: formData.dateOfBirth,
        gender: formData.gender,
      });

      // Refresh global store data
      await useTaskStore.getState().loadCalAiData(user.id);

      Alert.alert("Success", "Profile updated successfully");
    } catch (e) {
      console.error("Profile update error:", e);
      Alert.alert("Error", "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  const renderBadge = (
    milestone: number,
    currentStreak: number,
    type: "planner" | "calorie",
  ) => {
    const isAchieved = currentStreak >= milestone;
    const color = type === "planner" ? Colors.primary : Colors.secondary;

    return (
      <View key={`${type}-${milestone}`} style={styles.badgeItem}>
        <View
          style={[styles.badgeIconContainer, !isAchieved && styles.badgeLocked]}
        >
          <Award
            color={isAchieved ? color : "#9E9E9E"}
            size={36}
            strokeWidth={1.5}
          />
          {isAchieved && (
            <View style={[styles.badgeGlow, { backgroundColor: color }]} />
          )}
        </View>
        <Text style={[styles.badgeMilestone, isAchieved && { color: "#000" }]}>
          {milestone} Day
        </Text>
        <Text style={styles.badgeType}>
          {type === "planner" ? "Planner" : "Calorie"}
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <LinearGradient
        colors={["#E3F2FD", "#F3E5F5", "#FCE4EC"]}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ChevronLeft color={Colors.text} size={28} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile</Text>
        <View style={{ width: 28 }} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        <ScrollView
          contentContainerStyle={styles.container}
          showsVerticalScrollIndicator={false}
        >
          {/* User Card */}
          <Card style={styles.userCard}>
            <View style={styles.avatarContainer}>
              <Image
                source={{
                  uri: `https://ui-avatars.com/api/?name=${user?.username || user?.email}&background=random&size=200`,
                }}
                style={styles.avatar}
              />
            </View>
            <View style={styles.userInfo}>
              <Text style={styles.userName}>
                {user?.username || "Eco Warrior"}
              </Text>
              <Text style={styles.userEmail}>{user?.email}</Text>
            </View>
          </Card>

          {/* Custom Tab Bar */}
          <View style={styles.tabBar}>
            <TouchableOpacity
              style={[styles.tab, activeTab === "badges" && styles.activeTab]}
              onPress={() => setActiveTab("badges")}
            >
              <Award
                color={
                  activeTab === "badges" ? Colors.primary : Colors.textMuted
                }
                size={20}
              />
              <Text
                style={[
                  styles.tabText,
                  activeTab === "badges" && styles.activeTabText,
                ]}
              >
                Badges
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === "settings" && styles.activeTab]}
              onPress={() => setActiveTab("settings")}
            >
              <Settings
                color={
                  activeTab === "settings" ? Colors.primary : Colors.textMuted
                }
                size={20}
              />
              <Text
                style={[
                  styles.tabText,
                  activeTab === "settings" && styles.activeTabText,
                ]}
              >
                Settings
              </Text>
            </TouchableOpacity>
          </View>

          {activeTab === "badges" ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Your Achievements</Text>
              <View style={styles.badgesContainer}>
                <View style={styles.badgeRowTitle}>
                  <Flame
                    size={18}
                    color={Colors.primary}
                    fill={Colors.primary}
                  />
                  <Text style={styles.rowLabel}>Planner Streaks</Text>
                </View>
                <View style={styles.badgeGrid}>
                  {STREAK_MILESTONES.map((m) =>
                    renderBadge(m, stats?.dailyStreak || 0, "planner"),
                  )}
                </View>

                <View style={[styles.badgeRowTitle, { marginTop: 24 }]}>
                  <Apple
                    size={18}
                    color={Colors.secondary}
                    fill={Colors.secondary}
                  />
                  <Text style={styles.rowLabel}>Calorie AI Streaks</Text>
                </View>
                <View style={styles.badgeGrid}>
                  {STREAK_MILESTONES.map((m) =>
                    renderBadge(m, calorieProgress?.streak || 0, "calorie"),
                  )}
                </View>
              </View>
            </View>
          ) : (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Calorie AI Settings</Text>
              <Card style={styles.settingsCard}>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Current Weight (kg)</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.currentWeight}
                    onChangeText={(t) =>
                      setFormData({ ...formData, currentWeight: t })
                    }
                    keyboardType="numeric"
                  />
                </View>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Goal Weight (kg)</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.goalWeight}
                    onChangeText={(t) =>
                      setFormData({ ...formData, goalWeight: t })
                    }
                    keyboardType="numeric"
                  />
                </View>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Height (cm)</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.height}
                    onChangeText={(t) =>
                      setFormData({ ...formData, height: t })
                    }
                    keyboardType="numeric"
                  />
                </View>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Step Goal</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.dailyStepGoal}
                    onChangeText={(t) =>
                      setFormData({ ...formData, dailyStepGoal: t })
                    }
                    keyboardType="numeric"
                  />
                </View>

                <TouchableOpacity
                  style={styles.updateBtn}
                  onPress={handleUpdateCalorieProfile}
                  disabled={loading}
                >
                  <LinearGradient
                    colors={[Colors.primary, "#24243e"]}
                    style={styles.gradientBtn}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <Text style={styles.updateBtnText}>
                      {loading ? "Updating..." : "Update Settings"}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              </Card>
            </View>
          )}

          {/* Links Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Support</Text>
            <Card style={styles.linksCard}>
              <TouchableOpacity
                style={styles.linkRow}
                onPress={() => router.push("/about")}
              >
                <View style={styles.linkIconWrapper}>
                  <Info size={20} color={Colors.primary} />
                </View>
                <Text style={styles.linkText}>About Us</Text>
                <ChevronRight size={20} color={Colors.textMuted} />
              </TouchableOpacity>

              <View style={styles.separator} />

              <TouchableOpacity
                style={styles.linkRow}
                onPress={() => router.push("/privacy")}
              >
                <View style={styles.linkIconWrapper}>
                  <Shield size={20} color="#4CAF50" />
                </View>
                <Text style={styles.linkText}>Privacy Policy</Text>
                <ChevronRight size={20} color={Colors.textMuted} />
              </TouchableOpacity>
            </Card>
          </View>

          {/* Logout Button */}
          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
            <LogOut color="#FF4D4D" size={20} />
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: Fonts.bold,
    color: Colors.text,
    marginTop: 17,
  },
  backBtn: {
    padding: 4,
  },
  container: {
    padding: 20,
  },
  userCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#FFF",
    borderRadius: 24,
    marginBottom: 20,
  },
  avatarContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "#FFF",
  },
  avatar: {
    width: "100%",
    height: "100%",
  },
  userInfo: {
    marginLeft: 15,
  },
  userName: {
    fontSize: 20,
    fontFamily: Fonts.bold,
    color: Colors.text,
  },
  userEmail: {
    fontSize: 14,
    fontFamily: Fonts.regular,
    color: Colors.textMuted,
  },
  tabBar: {
    flexDirection: "row",
    backgroundColor: "rgba(255,255,255,0.4)",
    borderRadius: 15,
    padding: 6,
    marginBottom: 24,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    gap: 8,
    borderRadius: 12,
  },
  activeTab: {
    backgroundColor: "#FFF",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  tabText: {
    fontSize: 14,
    fontFamily: Fonts.semiBold,
    color: Colors.textMuted,
  },
  activeTabText: {
    color: Colors.text,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: Fonts.bold,
    color: Colors.text,
    marginBottom: 16,
  },
  badgesContainer: {
    backgroundColor: "#FFF",
    borderRadius: 24,
    padding: 20,
    marginTop: 8,
    // Soft shadow
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  badgeRowTitle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
  },
  rowLabel: {
    fontSize: 14,
    fontFamily: Fonts.semiBold,
    color: Colors.text,
  },
  badgeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 15,
  },
  badgeItem: {
    width: (width - 120) / 3,
    alignItems: "center",
  },
  badgeIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#FFF",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
    position: "relative",
  },
  badgeLocked: {
    backgroundColor: "#F5F5F5",
    opacity: 0.6,
  },
  badgeGlow: {
    position: "absolute",
    width: 50,
    height: 50,
    borderRadius: 25,
    opacity: 0.1,
    zIndex: -1,
  },
  badgeMilestone: {
    fontSize: 12,
    fontFamily: Fonts.bold,
    color: Colors.textMuted,
  },
  badgeType: {
    fontSize: 10,
    fontFamily: Fonts.regular,
    color: Colors.textMuted,
  },
  settingsCard: {
    padding: 20,
    backgroundColor: "#FFF",
    borderRadius: 24,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontFamily: Fonts.semiBold,
    color: Colors.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#FFF",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "#F0F0F0",
    fontSize: 16,
    fontFamily: Fonts.medium,
  },
  updateBtn: {
    marginTop: 8,
    borderRadius: 15,
    overflow: "hidden",
  },
  gradientBtn: {
    padding: 16,
    alignItems: "center",
  },
  updateBtnText: {
    color: "#FFF",
    fontSize: 16,
    fontFamily: Fonts.bold,
  },
  linksCard: {
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 12,
  },
  linkRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
  },
  linkIconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#FFF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  linkText: {
    flex: 1,
    fontSize: 15,
    fontFamily: Fonts.medium,
    color: Colors.text,
  },
  separator: {
    height: 1,
    backgroundColor: "rgba(0,0,0,0.05)",
    marginHorizontal: 12,
  },
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    backgroundColor: "rgba(255,77,77,0.1)",
    borderRadius: 15,
    gap: 8,
    marginBottom: 30,
  },
  logoutText: {
    color: "#FF4D4D",
    fontSize: 16,
    fontFamily: Fonts.bold,
  },
});
