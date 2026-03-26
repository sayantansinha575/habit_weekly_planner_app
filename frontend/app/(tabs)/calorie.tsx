import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  BackHandler,
} from "react-native";
import { useRouter } from "expo-router";
import {
  Camera,
  Search,
  Utensils,
  Info,
  User as UserIcon,
  ChevronRight,
  Plus,
  TrendingUp,
  ChevronLeft,
  Flame,
  Zap,
  Target,
  Apple,
  RefreshCw,
  MoreHorizontal,
  Image as LucideImage,
} from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Colors, Fonts } from "@/src/theme/colors";
import Card from "@/src/components/Card";
import ProgressRing from "@/src/components/ProgressRing";
import { api } from "@/src/services/api";
import { useFocusEffect } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";
import { Image } from "expo-image";
import CalorieProgress from "@/src/components/CalorieProgress";
import EmptyState from "@/src/components/EmptyState";
import ScannerOverlay from "@/src/components/ScannerOverlay";
import { Animated, Easing } from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import CustomSplashScreen from "@/src/components/CustomSplashScreen";

const { width } = Dimensions.get("window");

type ViewState = "dashboard" | "onboarding" | "profile" | "add-meal";

import { useTaskStore } from "@/src/store/useTaskStore";

// --- Conversion Utilities ---
const lbsToKg = (lbs: string) => {
  const val = parseFloat(lbs);
  return isNaN(val) ? 0 : Math.round((val / 2.20462) * 10) / 10;
};
const kgToLbs = (kg: number | string) => {
  const val = typeof kg === "string" ? parseFloat(kg) : kg;
  return isNaN(val) ? "" : Math.round(val * 2.20462).toString();
};

const ftInToCm = (ftIn: string) => {
  const match = ftIn.match(/(\d+)'(\d+)/);
  if (!match) return 0;
  const feet = parseInt(match[1]);
  const inches = parseInt(match[2]);
  const totalInches = feet * 12 + inches;
  return Math.round(totalInches * 2.54);
};

const cmToFtIn = (cm: number | string) => {
  const val = typeof cm === "string" ? parseFloat(cm) : cm;
  if (isNaN(val)) return "6'10";
  const totalInches = val / 2.54;
  const feet = Math.floor(totalInches / 12);
  const inches = Math.round(totalInches % 12);
  return `${feet}'${inches}`;
};

export default function CalorieScreen() {
  const calAiProfile = useTaskStore((s) => s.calAiProfile);
  const calAiDashboard = useTaskStore((s) => s.calAiDashboard);
  const calAiLoading = useTaskStore((s) => s.calAiLoading);
  const loadCalAiData = useTaskStore((s) => s.loadCalAiData);
  const hasCalAiLoaded = useTaskStore((s) => s.hasCalAiLoaded);
  const setCalAiLoaded = useTaskStore((s) => s.setCalAiLoaded);
  const user = useTaskStore((s) => s.user);
  const calorieProgress = useTaskStore((s) => s.calorieProgress);
  const loadCalAiProgress = useTaskStore((s) => s.loadCalAiProgress);
  const subscriptionStatus = useTaskStore((s) => s.subscriptionStatus);
  const isAuthReady = useTaskStore((s) => s.isAuthReady);
  const isSubscriptionLoading = useTaskStore((s) => s.isSubscriptionLoading);

  const router = useRouter();

  const [currentView, setCurrentView] = useState<ViewState | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [dashboardPageIndex, setDashboardPageIndex] = useState(0);
  const horizontalPagerRef = useRef<ScrollView>(null);
  const [chartLoading, setChartLoading] = useState(false);

  // Generate last 7 days
  const getLast7Days = () => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      days.push(date);
    }
    return days;
  };
  const weekDays = getLast7Days();

  // Form State for Onboarding/Profile
  const [formData, setFormData] = useState({
    goalWeight: "",
    currentWeight: "",
    height: "6'10",
    dateOfBirth: "1995-01-01",
    gender: "Male",
    dailyStepGoal: "10000",
    weightUnit: "lbs" as "lbs" | "kg",
    heightUnit: "ft'in" as "ft'in" | "cm",
  });

  // Add Meal State
  const [mealDescription, setMealDescription] = useState("");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [isOnboardingLoading, setIsOnboardingLoading] = useState(false);
  const loadingRotation = useRef(new Animated.Value(0)).current;
  const loadingFade = useRef(new Animated.Value(0)).current;
  const screenFade = useRef(new Animated.Value(1)).current;
  const scanLineAnim = useRef(new Animated.Value(0)).current;
  const bounceAnim = useRef(new Animated.Value(0)).current;

  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);

  useEffect(() => {
    if (currentView === "add-meal" && !permission?.granted) {
      requestPermission();
    }
  }, [currentView, permission?.granted]);

  useEffect(() => {
    if (currentView === "add-meal") {
      const scanLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(scanLineAnim, {
            toValue: 1,
            duration: 2000,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(scanLineAnim, {
            toValue: 0,
            duration: 2000,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
        ]),
      );
      scanLoop.start();
      return () => scanLoop.stop();
    }
  }, [currentView, scanLineAnim]);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(bounceAnim, {
          toValue: -6,
          duration: 800,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(bounceAnim, {
          toValue: 0,
          duration: 800,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, [bounceAnim]);

  const handleScannerCapture = async () => {
    if (!cameraRef.current) return;
    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.5,
        base64: true,
      });
      if (photo) {
        setSelectedImage(photo.uri);
        setImageBase64(photo.base64 || null);
      }
    } catch (e) {
      console.error("Capture failed:", e);
      Alert.alert("Error", "Failed to capture photo");
    }
  };
  const handlePress = () => {
    // 🚫 Block interaction until system is ready
    if (!isAuthReady || isSubscriptionLoading) {
      console.log("⏳ Still initializing, ignore tap");
      return <CustomSplashScreen />;
    }

    if (subscriptionStatus === "FREE") {
      router.push("/subscription");
    } else {
      setCurrentView("add-meal");
    }
  };

  const takePhoto = async () => {
    // Falls back to image picker if camera view is not active or needed
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    // ... rest of old takePhoto if needed, but we'll use handleScannerCapture mostly
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 0.5,
      base64: true,
    });

    if (!result.canceled) {
      setSelectedImage(result.assets[0].uri);
      setImageBase64(result.assets[0].base64 || null);
    }
  };

  // Hardware Back Button Handling
  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        if (currentView !== "dashboard" && currentView !== "onboarding") {
          setCurrentView("dashboard");
          return true;
        }
        return false;
      };

      BackHandler.addEventListener("hardwareBackPress", onBackPress);
      return () =>
        BackHandler.removeEventListener("hardwareBackPress", onBackPress);
    }, [currentView]),
  );

  const [activeDays, setActiveDays] = useState(7);

  const fetchProgressData = useCallback(
    async (days: number) => {
      if (!user?.id) return;

      setActiveDays(days); // ✅ update UI first
      setChartLoading(true);
      await loadCalAiProgress(user.id, days);

      setChartLoading(false);
    },
    [user?.id, loadCalAiProgress],
  );

  useEffect(() => {
    if (user?.id) {
      loadCalAiData(user.id);
    }
  }, [user?.id, loadCalAiData]);

  useEffect(() => {
    if (hasCalAiLoaded && !calAiLoading) {
      if (calAiProfile) {
        // Only auto-redirect if we are at the start or stuck in onboarding
        if (currentView === null || currentView === "onboarding") {
          setCurrentView("dashboard");
        }
      } else {
        // Only auto-redirect if we are at the start or stuck in dashboard without a profile
        if (currentView === null || currentView === "dashboard") {
          setCurrentView("onboarding");
        }
      }
    }
  }, [hasCalAiLoaded, calAiLoading, calAiProfile, currentView]);

  // Sync formData with calAiProfile when profile view is opened or profile changes
  useEffect(() => {
    if (
      calAiProfile &&
      (currentView === "profile" || currentView === "onboarding")
    ) {
      // Check if data actually changed before setting to avoid loop/extra render
      const newGoalWeight = kgToLbs(calAiProfile.goalWeight);
      const newCurrentWeight = kgToLbs(calAiProfile.currentWeight);
      const newHeight = cmToFtIn(calAiProfile.height);
      const newDob = new Date(calAiProfile.dateOfBirth)
        .toISOString()
        .split("T")[0];
      const newStepGoal = calAiProfile.dailyStepGoal?.toString() || "10000";

      if (
        formData.goalWeight !== newGoalWeight ||
        formData.currentWeight !== newCurrentWeight ||
        formData.height !== newHeight ||
        formData.dateOfBirth !== newDob ||
        formData.gender !== calAiProfile.gender ||
        formData.dailyStepGoal !== newStepGoal
      ) {
        setFormData((prev) => ({
          ...prev,
          goalWeight: newGoalWeight,
          currentWeight: newCurrentWeight,
          height: newHeight,
          dateOfBirth: newDob,
          gender: calAiProfile.gender,
          dailyStepGoal: newStepGoal,
        }));
      }
    }
  }, [calAiProfile, currentView, formData]);

  useEffect(() => {
    if (isOnboardingLoading) {
      Animated.parallel([
        Animated.timing(loadingFade, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.loop(
          Animated.timing(loadingRotation, {
            toValue: 1,
            duration: 2000,
            easing: Easing.linear,
            useNativeDriver: true,
          }),
        ),
      ]).start();
    } else {
      Animated.timing(loadingFade, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }).start();
    }
  }, [isOnboardingLoading]);

  const isFormValid =
    formData.goalWeight.trim() !== "" &&
    formData.currentWeight.trim() !== "" &&
    formData.height.trim() !== "" &&
    formData.dailyStepGoal.trim() !== "";

  useEffect(() => {
    // Separate effect for progress fetching to avoid re-running full init
    if (user?.id && currentView === "dashboard") {
      fetchProgressData(activeDays);
    }
  }, [user?.id, activeDays, fetchProgressData, currentView]);

  const handleSaveProfile = async () => {
    if (!isFormValid) return;

    try {
      setIsOnboardingLoading(true);

      // Convert to backend units (kg, cm)
      const goalWeightKg =
        formData.weightUnit === "lbs"
          ? lbsToKg(formData.goalWeight)
          : parseFloat(formData.goalWeight);

      const currentWeightKg =
        formData.weightUnit === "lbs"
          ? lbsToKg(formData.currentWeight)
          : parseFloat(formData.currentWeight);

      const heightCm =
        formData.heightUnit === "ft'in"
          ? ftInToCm(formData.height).toString()
          : formData.height;

      const payload = {
        goalWeight: goalWeightKg,
        currentWeight: currentWeightKg,
        height: heightCm,
        dateOfBirth: formData.dateOfBirth,
        gender: formData.gender,
        dailyStepGoal: parseInt(formData.dailyStepGoal),
      };

      // Ensure animation shows for at least 1.5s for UX
      const [updated] = await Promise.all([
        api.updateCalAiProfile(user.id, payload),
        new Promise((resolve) => setTimeout(resolve, 2000)),
      ]);

      await loadCalAiData(user.id);

      // Smooth transition
      Animated.timing(screenFade, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }).start(() => {
        // Force refresh all data for dashboard
        loadCalAiData(user.id);
        setCurrentView("dashboard");
        setIsOnboardingLoading(false);
        Animated.timing(screenFade, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }).start();
      });
    } catch (e) {
      setIsOnboardingLoading(false);
      Alert.alert("Error", "Failed to save profile");
    }
  };

  const handleAnalyzeMeal = async () => {
    if (!mealDescription && !imageBase64) {
      Alert.alert("Input required", "Please add a description or a photo");
      return;
    }
    try {
      setIsScanning(true);
      await api.analyzeMeal(user.id, mealDescription, imageBase64 || undefined);
      setMealDescription("");

      // Smooth transition back
      setTimeout(async () => {
        // Fade out screen
        Animated.timing(screenFade, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }).start(async () => {
          setSelectedImage(null);
          setImageBase64(null);
          await loadCalAiData(user.id); // Refresh dashboard data
          setCurrentView("dashboard");
          setIsScanning(false);
          // Fade back in
          Animated.timing(screenFade, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }).start();
        });
      }, 1000); // Small delay to let user see "Finalizing..."
    } catch (e) {
      setIsScanning(false);
      Alert.alert("Error", "Failed to analyze meal");
    }
  };

  const handleResetTarget = async () => {
    Alert.alert(
      "Reset Target",
      "Are you sure you want to clear today's meals and start a new target?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reset",
          style: "destructive",
          onPress: async () => {
            try {
              await api.resetCalAiDashboard(user.id);
              await loadCalAiData(user.id);
            } catch (e) {
              Alert.alert("Error", "Failed to reset");
            }
          },
        },
      ],
    );
  };

  if (calAiLoading && !calAiProfile && currentView === "dashboard") {
    return (
      <View style={[styles.mainContainer, styles.center]}>
        <ActivityIndicator size="large" color={Colors.card} />
        <Text style={{ color: Colors.textMuted, marginTop: 12 }}>
          Loading data...
        </Text>
      </View>
    );
  }

  // --- Sub-Views ---

  const renderOnboarding = () => (
    <ScrollView
      style={styles.scrollContainer}
      contentContainerStyle={styles.onboardingContent}
    >
      <Text style={styles.onboardingTitle}>Welcome to Calorie AI</Text>
      <Text style={styles.onboardingSubtitle}>
        Let's set up your personal nutrition profile.
      </Text>

      <Card style={styles.formCard}>
        <View style={styles.inputHeaderRow}>
          <Text style={styles.inputLabel}>
            Goal Weight ({formData.weightUnit})
          </Text>
          <View style={styles.unitToggle}>
            <TouchableOpacity
              style={[
                styles.unitBtn,
                formData.weightUnit === "lbs" && styles.unitBtnActive,
              ]}
              onPress={() => setFormData({ ...formData, weightUnit: "lbs" })}
            >
              <Text
                style={[
                  styles.unitBtnText,
                  formData.weightUnit === "lbs" && styles.unitBtnTextActive,
                ]}
              >
                lbs
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.unitBtn,
                formData.weightUnit === "kg" && styles.unitBtnActive,
              ]}
              onPress={() => setFormData({ ...formData, weightUnit: "kg" })}
            >
              <Text
                style={[
                  styles.unitBtnText,
                  formData.weightUnit === "kg" && styles.unitBtnTextActive,
                ]}
              >
                kg
              </Text>
            </TouchableOpacity>
          </View>
        </View>
        <TextInput
          style={styles.input}
          placeholder={formData.weightUnit === "lbs" ? "e.g. 154" : "e.g. 70"}
          keyboardType="numeric"
          value={formData.goalWeight}
          onChangeText={(val) => setFormData({ ...formData, goalWeight: val })}
        />

        <View style={styles.inputHeaderRow}>
          <Text style={styles.inputLabel}>
            Current Weight ({formData.weightUnit})
          </Text>
        </View>
        <TextInput
          style={styles.input}
          placeholder={formData.weightUnit === "lbs" ? "e.g. 187" : "e.g. 85"}
          keyboardType="numeric"
          value={formData.currentWeight}
          onChangeText={(val) =>
            setFormData({ ...formData, currentWeight: val })
          }
        />

        <View style={styles.inputHeaderRow}>
          <Text style={styles.inputLabel}>Height ({formData.heightUnit})</Text>
          <View style={styles.unitToggle}>
            <TouchableOpacity
              style={[
                styles.unitBtn,
                formData.heightUnit === "ft'in" && styles.unitBtnActive,
              ]}
              onPress={() => setFormData({ ...formData, heightUnit: "ft'in" })}
            >
              <Text
                style={[
                  styles.unitBtnText,
                  formData.heightUnit === "ft'in" && styles.unitBtnTextActive,
                ]}
              >
                ft'in
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.unitBtn,
                formData.heightUnit === "cm" && styles.unitBtnActive,
              ]}
              onPress={() => setFormData({ ...formData, heightUnit: "cm" })}
            >
              <Text
                style={[
                  styles.unitBtnText,
                  formData.heightUnit === "cm" && styles.unitBtnTextActive,
                ]}
              >
                cm
              </Text>
            </TouchableOpacity>
          </View>
        </View>
        <TextInput
          style={styles.input}
          placeholder={
            formData.heightUnit === "ft'in" ? "e.g. 6'10" : "e.g. 180"
          }
          keyboardType={formData.heightUnit === "cm" ? "numeric" : "default"}
          value={formData.height}
          onChangeText={(val) => setFormData({ ...formData, height: val })}
        />

        <Text style={styles.inputLabel}>Daily Step Goal</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. 10000"
          keyboardType="numeric"
          value={formData.dailyStepGoal}
          onChangeText={(val) =>
            setFormData({ ...formData, dailyStepGoal: val })
          }
        />

        <TouchableOpacity
          style={[styles.primaryBtn, !isFormValid && styles.disabledBtn]}
          onPress={handleSaveProfile}
          disabled={!isFormValid}
        >
          <Text
            style={[
              styles.primaryBtnText,
              !isFormValid && styles.disabledBtnText,
            ]}
          >
            Get Started
          </Text>
        </TouchableOpacity>
      </Card>
    </ScrollView>
  );

  const renderDashboard = () => (
    <View style={styles.mainContainer}>
      <ScrollView
        ref={horizontalPagerRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        style={styles.horizontalPager}
        contentOffset={{ x: dashboardPageIndex * width, y: 0 }}
        onMomentumScrollEnd={(e) => {
          const index = Math.round(e.nativeEvent.contentOffset.x / width);
          setDashboardPageIndex(index);
        }}
      >
        {/* Page 1: Main Dashboard */}
        <ScrollView
          style={[styles.scrollContainer, { width }]}
          contentContainerStyle={styles.dashboardContent}
        >
          <View style={styles.dashHeader}>
            <View style={styles.titleRow}>
              <Apple color={Colors.text} fill={Colors.secondary} size={32} />
              <Text style={styles.dashTitle}>Calorie AI</Text>
            </View>
            <View style={styles.streakBadge}>
              <Flame color="#FFA500" fill="#FFA500" size={20} />
              <Text style={styles.streakText}>
                {calAiDashboard?.streak || 0}
              </Text>
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

          {/* Main Calorie Card */}
          <View style={styles.mainRingContainer}>
            {calAiDashboard && calAiDashboard.caloriesLeft <= 0 ? (
              <View style={styles.celebrationContainer}>
                <LinearGradient
                  colors={["rgba(252, 163, 17, 0.2)", "rgba(255, 69, 0, 0.2)"]}
                  style={styles.celebrationGradient}
                >
                  <TrendingUp color={Colors.secondary} size={48} />
                  <Text style={styles.celebrationTitle}>Goal Reached! 🥳</Text>
                  <Text style={styles.celebrationText}>
                    You've completed your daily target. Amazing job!
                  </Text>
                  <TouchableOpacity
                    style={styles.resetBtn}
                    onPress={handleResetTarget}
                  >
                    <Text style={styles.resetBtnText}>Start New Target</Text>
                  </TouchableOpacity>
                </LinearGradient>
              </View>
            ) : (
              <Card style={styles.mainProgressCard}>
                <View style={styles.progressLeft}>
                  <Text style={styles.caloriesCount}>
                    {calAiDashboard
                      ? Math.max(0, calAiDashboard.caloriesLeft)
                      : "0"}
                  </Text>
                  <Text style={styles.caloriesLabel}>
                    Calories{" "}
                    <Text style={{ fontFamily: Fonts.bold }}>left</Text>
                  </Text>
                </View>

                <View style={styles.progressRight}>
                  <ProgressRing
                    progress={
                      calAiDashboard
                        ? Math.min(
                            1,
                            Math.max(
                              0,
                              1 -
                                calAiDashboard.caloriesLeft /
                                  (calAiDashboard.dailyTarget || 2000),
                            ),
                          )
                        : 0
                    }
                    size={110}
                    strokeWidth={10}
                    color={Colors.secondary}
                    trackColor="rgba(0,0,0,0.05)"
                  >
                    <View style={styles.flameIconContainer}>
                      <Flame
                        color={Colors.primary}
                        fill={Colors.primary}
                        size={24}
                      />
                    </View>
                  </ProgressRing>
                </View>
              </Card>
            )}
          </View>

          {/* Macro Grid */}
          <View style={styles.macroRow}>
            <Card style={styles.macroCard}>
              <View style={styles.macroCardHeader}>
                <Text style={styles.macroValue}>
                  {Math.max(
                    0,
                    (calAiDashboard?.proteinTarget || 150) -
                      (calAiDashboard?.totalProtein || 0),
                  )}
                  g
                </Text>
                <Text style={styles.macroLabel}>
                  Protein <Text style={{ fontFamily: Fonts.bold }}>left</Text>
                </Text>
              </View>
              <ProgressRing
                progress={
                  calAiDashboard
                    ? Math.min(
                        1,
                        (calAiDashboard.totalProtein || 0) /
                          (calAiDashboard.proteinTarget || 150),
                      )
                    : 0
                }
                size={60}
                strokeWidth={6}
                color="rgb(222, 102, 102)"
              >
                <Flame color="rgb(222, 102, 102)" size={20} />
              </ProgressRing>
            </Card>

            <Card style={styles.macroCard}>
              <View style={styles.macroCardHeader}>
                <Text style={styles.macroValue}>
                  {Math.max(
                    0,
                    (calAiDashboard?.carbsTarget || 250) -
                      (calAiDashboard?.totalCarbs || 0),
                  )}
                  g
                </Text>
                <Text style={styles.macroLabel}>
                  Carbs <Text style={{ fontFamily: Fonts.bold }}>left</Text>
                </Text>
              </View>
              <ProgressRing
                progress={
                  calAiDashboard
                    ? Math.min(
                        1,
                        (calAiDashboard.totalCarbs || 0) /
                          (calAiDashboard.carbsTarget || 250),
                      )
                    : 0
                }
                size={60}
                strokeWidth={6}
                color="rgb(227, 154, 98)"
              >
                <Zap color="rgb(227, 154, 98)" size={20} />
              </ProgressRing>
            </Card>

            <Card style={styles.macroCard}>
              <View style={styles.macroCardHeader}>
                <Text style={styles.macroValue}>
                  {Math.max(
                    0,
                    (calAiDashboard?.fatsTarget || 70) -
                      (calAiDashboard?.totalFats || 0),
                  )}
                  g
                </Text>
                <Text style={styles.macroLabel}>
                  Fats <Text style={{ fontFamily: Fonts.bold }}>left</Text>
                </Text>
              </View>
              <ProgressRing
                progress={
                  calAiDashboard
                    ? Math.min(
                        1,
                        (calAiDashboard.totalFats || 0) /
                          (calAiDashboard.fatsTarget || 70),
                      )
                    : 0
                }
                size={60}
                strokeWidth={6}
                color="rgb(102, 152, 222)"
              >
                <Utensils color="rgb(102, 152, 222)" size={20} />
              </ProgressRing>
            </Card>
          </View>
          {/* 
          <TouchableOpacity
            style={styles.addMealHero}
            onPress={() => setCurrentView("add-meal")}
          >
            <LinearGradient
              colors={[Colors.primary, "#24243e"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.gradientBtn}
            >
              <Plus color="#FFF" size={24} />
              <Text style={styles.addMealText}>Add a Meal</Text>
            </LinearGradient>
          </TouchableOpacity> */}

          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 16,
            }}
          >
            <Text style={[styles.sectionTitle, { marginBottom: 0 }]}>
              Recent Meals
            </Text>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                backgroundColor: "rgba(99, 102, 241, 0.1)",
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 20,
              }}
            >
              <Animated.View
                style={{ transform: [{ translateX: bounceAnim }] }}
              >
                <ChevronLeft color={Colors.primary} size={16} />
              </Animated.View>
              <Text
                style={{
                  fontSize: 13,
                  color: Colors.primary,
                  fontFamily: Fonts.semiBold,
                  marginLeft: 4,
                }}
              >
                Swipe for Progress
              </Text>
            </View>
          </View>
          {calAiDashboard?.meals && calAiDashboard.meals.length > 0 ? (
            calAiDashboard.meals.map((meal: any) => (
              <Card key={meal.id} style={styles.mealCard}>
                <View style={styles.mealInfo}>
                  <Text style={styles.mealDesc}>{meal.description}</Text>
                  <View style={styles.mealMacroPills}>
                    <View
                      style={[
                        styles.macroPill,
                        { backgroundColor: "rgba(255,77,77,0.08)" },
                      ]}
                    >
                      <Text
                        style={[styles.macroPillText, { color: "#FF4D4D" }]}
                      >
                        P: {meal.protein}g
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.macroPill,
                        { backgroundColor: "rgba(255,184,77,0.08)" },
                      ]}
                    >
                      <Text
                        style={[styles.macroPillText, { color: "#FFB84D" }]}
                      >
                        C: {meal.carbs}g
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.macroPill,
                        { backgroundColor: "rgba(77,148,255,0.08)" },
                      ]}
                    >
                      <Text
                        style={[styles.macroPillText, { color: "#4D94FF" }]}
                      >
                        F: {meal.fats}g
                      </Text>
                    </View>
                  </View>
                </View>
                <Text style={styles.mealCals}>{meal.calories} kcal</Text>
              </Card>
            ))
          ) : (
            <EmptyState
              imageSource={require("@/assets/images/salad_bowl_3d.png")}
              message="Tap + to add your first meal of the day"
            />
          )}
        </ScrollView>

        {/* Page 2: Progress Section */}
        <View style={{ width }}>
          {calorieProgress ? (
            <CalorieProgress
              data={calorieProgress}
              activeDays={activeDays}
              loading={chartLoading}
              onFilterChange={fetchProgressData}
              onProfilePress={() => setCurrentView("profile")}
            />
          ) : (
            <View style={[styles.mainContainer, styles.center]}>
              <ActivityIndicator color={Colors.primary} />
              <Text style={{ color: Colors.textMuted, marginTop: 12 }}>
                Loading progress...
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      <TouchableOpacity style={styles.fab} onPress={handlePress}>
        <Plus color="#FFF" size={32} />
      </TouchableOpacity>
    </View>
  );

  const renderAddMeal = () => (
    <View style={styles.scannerContainer}>
      {/* Scanner Body: Live Camera or Selected Image */}
      <View style={styles.scannerBody}>
        {!selectedImage ? (
          permission?.granted ? (
            <CameraView
              ref={cameraRef}
              style={StyleSheet.absoluteFill}
              facing="back"
            />
          ) : (
            <View style={styles.permissionContainer}>
              <ActivityIndicator color={Colors.primary} size="large" />
              <Text style={styles.permissionText}>Opening camera...</Text>
            </View>
          )
        ) : (
          <Image
            source={{ uri: selectedImage }}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
          />
        )}

        {/* Scanner Overlay Elements */}
        {!selectedImage && (
          <View style={StyleSheet.absoluteFill} pointerEvents="none">
            <LinearGradient
              colors={["rgba(0,0,0,0.6)", "transparent", "rgba(0,0,0,0.8)"]}
              style={StyleSheet.absoluteFill}
            />
            <View style={styles.scannerFrameContainer}>
              <View style={styles.scannerFrame}>
                {/* Corner Borders */}
                <View style={[styles.corner, styles.topLeft]} />
                <View style={[styles.corner, styles.topRight]} />
                <View style={[styles.corner, styles.bottomLeft]} />
                <View style={[styles.corner, styles.bottomRight]} />

                {/* Scanning Line */}
                <Animated.View
                  style={[
                    styles.scannerScanLine,
                    {
                      transform: [
                        {
                          translateY: scanLineAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0, width * 0.8], // Frame height is width * 0.8
                          }),
                        },
                      ],
                    },
                  ]}
                />
              </View>
            </View>
          </View>
        )}
      </View>

      <SafeAreaView
        style={[StyleSheet.absoluteFill, { backgroundColor: "transparent" }]}
        pointerEvents="box-none"
      >
        {/* Scanner Header */}
        <View style={styles.scannerHeader}>
          <TouchableOpacity
            onPress={() => setCurrentView("dashboard")}
            style={styles.scannerBackBtn}
          >
            <ChevronLeft color="#FFF" size={28} />
          </TouchableOpacity>
          <Text style={styles.scannerTitleText}>Scanner</Text>
          <TouchableOpacity style={styles.scannerMoreBtn}>
            <MoreHorizontal color="#FFF" size={24} />
          </TouchableOpacity>
        </View>

        <View style={{ flex: 1 }} pointerEvents="none" />

        {/* Bottom UI */}
        <View style={styles.scannerFooter}>
          <View style={styles.scannerModes}>
            <TouchableOpacity
              style={[styles.scannerModeItem, styles.activeModeItem]}
            >
              <View style={styles.modeIconCircle}>
                <Apple color="#000" size={20} />
              </View>
              <Text style={styles.activeModeText}>Scan food</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.scannerModeItem}
              onPress={pickImage}
            >
              <View
                style={[styles.modeIconCircle, { backgroundColor: "#FFF" }]}
              >
                <LucideImage color="#000" size={20} />
              </View>
              <Text style={styles.modeText}>Library</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.scannerCaptureRow}>
            <View style={{ width: 44 }} />
            <TouchableOpacity
              style={styles.captureBtn}
              onPress={handleScannerCapture}
            >
              <View style={styles.captureBtnInner}>
                <View style={styles.captureBtnCore} />
              </View>
            </TouchableOpacity>
            <TouchableOpacity style={styles.historyBtn} onPress={pickImage}>
              <View style={styles.historyBtnInner}>
                <LucideImage color="#FFF" size={20} />
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>

      {/* Analysis UI when image is selected */}
      {selectedImage && (
        <View style={styles.analysisOverlay}>
          <LinearGradient
            colors={["transparent", "rgba(0,0,0,0.9)"]}
            style={StyleSheet.absoluteFill}
          />
          <View style={{ width: "100%", gap: 12 }}>
            <TouchableOpacity
              style={styles.analyzeButton}
              onPress={handleAnalyzeMeal}
            >
              <LinearGradient
                colors={[Colors.primary, "#24243e"]}
                style={styles.analyzeButtonGradient}
              >
                <Zap color="#FFF" size={20} />
                <Text style={styles.analyzeButtonText}>Analyze Meal</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.retakeButton}
              onPress={() => {
                setSelectedImage(null);
                setImageBase64(null);
              }}
            >
              <Text style={styles.retakeButtonText}>Retake Photo</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );

  const renderProfile = () => (
    <ScrollView
      style={styles.scrollContainer}
      contentContainerStyle={styles.onboardingContent}
    >
      <View style={styles.modalHeader}>
        <TouchableOpacity
          onPress={() => setCurrentView("dashboard")}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <ChevronLeft color={Colors.text} size={28} />
        </TouchableOpacity>
        <Text style={styles.modalTitle}>Calorie AI Profile</Text>
        <View style={{ width: 28 }} />
      </View>

      <Card style={styles.formCard}>
        <View style={styles.inputHeaderRow}>
          <Text style={styles.inputLabel}>
            Goal Weight ({formData.weightUnit})
          </Text>
          <View style={styles.unitToggle}>
            <TouchableOpacity
              style={[
                styles.unitBtn,
                formData.weightUnit === "lbs" && styles.unitBtnActive,
              ]}
              onPress={() => setFormData({ ...formData, weightUnit: "lbs" })}
            >
              <Text
                style={[
                  styles.unitBtnText,
                  formData.weightUnit === "lbs" && styles.unitBtnTextActive,
                ]}
              >
                lbs
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.unitBtn,
                formData.weightUnit === "kg" && styles.unitBtnActive,
              ]}
              onPress={() => setFormData({ ...formData, weightUnit: "kg" })}
            >
              <Text
                style={[
                  styles.unitBtnText,
                  formData.weightUnit === "kg" && styles.unitBtnTextActive,
                ]}
              >
                kg
              </Text>
            </TouchableOpacity>
          </View>
        </View>
        <TextInput
          style={styles.input}
          keyboardType="numeric"
          value={formData.goalWeight}
          onChangeText={(val) => setFormData({ ...formData, goalWeight: val })}
        />

        <View style={styles.inputHeaderRow}>
          <Text style={styles.inputLabel}>
            Current Weight ({formData.weightUnit})
          </Text>
        </View>
        <TextInput
          style={styles.input}
          keyboardType="numeric"
          value={formData.currentWeight}
          onChangeText={(val) =>
            setFormData({ ...formData, currentWeight: val })
          }
        />

        <View style={styles.inputHeaderRow}>
          <Text style={styles.inputLabel}>Height ({formData.heightUnit})</Text>
          <View style={styles.unitToggle}>
            <TouchableOpacity
              style={[
                styles.unitBtn,
                formData.heightUnit === "ft'in" && styles.unitBtnActive,
              ]}
              onPress={() => setFormData({ ...formData, heightUnit: "ft'in" })}
            >
              <Text
                style={[
                  styles.unitBtnText,
                  formData.heightUnit === "ft'in" && styles.unitBtnTextActive,
                ]}
              >
                ft'in
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.unitBtn,
                formData.heightUnit === "cm" && styles.unitBtnActive,
              ]}
              onPress={() => setFormData({ ...formData, heightUnit: "cm" })}
            >
              <Text
                style={[
                  styles.unitBtnText,
                  formData.heightUnit === "cm" && styles.unitBtnTextActive,
                ]}
              >
                cm
              </Text>
            </TouchableOpacity>
          </View>
        </View>
        <TextInput
          style={styles.input}
          keyboardType={formData.heightUnit === "cm" ? "numeric" : "default"}
          value={formData.height}
          onChangeText={(val) => setFormData({ ...formData, height: val })}
        />

        <Text style={styles.inputLabel}>Daily Step Goal</Text>
        <TextInput
          style={styles.input}
          keyboardType="numeric"
          value={formData.dailyStepGoal}
          onChangeText={(val) =>
            setFormData({ ...formData, dailyStepGoal: val })
          }
        />

        <TouchableOpacity
          style={[styles.primaryBtn, calAiLoading && { opacity: 0.7 }]}
          onPress={handleSaveProfile}
          disabled={calAiLoading}
        >
          {calAiLoading ? (
            <ActivityIndicator color="#000" />
          ) : (
            <Text style={styles.primaryBtnText}>Update Profile</Text>
          )}
        </TouchableOpacity>
      </Card>
    </ScrollView>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <LinearGradient
        colors={["#E3F2FD", "#F3E5F5", "#FCE4EC"]}
        style={StyleSheet.absoluteFill}
      />
      <Animated.View style={[StyleSheet.absoluteFill, { opacity: screenFade }]}>
        {!currentView ? (
          <View style={[styles.mainContainer, styles.center]}>
            <ActivityIndicator size="large" color={Colors.primary} />
          </View>
        ) : (
          <>
            {currentView === "dashboard" && renderDashboard()}
            {currentView === "onboarding" && renderOnboarding()}
            {currentView === "add-meal" && renderAddMeal()}
            {currentView === "profile" && renderProfile()}
          </>
        )}
      </Animated.View>

      {isOnboardingLoading && (
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            styles.loadingOverlay,
            { opacity: loadingFade },
          ]}
        >
          <LinearGradient
            colors={["#6366F1", "#A855F7", "#EC4899"]}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.loadingInner}>
            <Animated.View
              style={{
                transform: [
                  {
                    rotate: loadingRotation.interpolate({
                      inputRange: [0, 1],
                      outputRange: ["0deg", "360deg"],
                    }),
                  },
                ],
              }}
            >
              <RefreshCw color="#FFF" size={48} />
            </Animated.View>
            <Text style={styles.loadingTitle}>Configuring Your Profile</Text>
            <Text style={styles.loadingSubtitle}>
              Personalizing your nutrition plan and setting your goals...
            </Text>
          </View>
        </Animated.View>
      )}

      <ScannerOverlay isVisible={isScanning} imageUri={selectedImage} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "transparent",
  },
  mainContainer: {
    flex: 1,
  },
  horizontalPager: {
    flex: 1,
  },
  scrollContainer: {
    flex: 1,
  },
  center: {
    justifyContent: "center",
    alignItems: "center",
  },
  onboardingContent: {
    padding: 24,
    paddingTop: 40,
  },
  onboardingTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: Colors.text,
    fontFamily: Fonts.bold,
    textAlign: "center",
  },
  onboardingSubtitle: {
    fontSize: 16,
    color: Colors.textMuted,
    fontFamily: Fonts.regular,
    textAlign: "center",
    marginTop: 8,
    marginBottom: 32,
  },
  formCard: {
    padding: 20,
    backgroundColor: "transparent",
    borderRadius: 24,
    borderWidth: 1,
    // borderColor: "rgba(255,255,255,0.5)",
    // shadowColor: "#000",
    // shadowOffset: { width: 0, height: 4 },
    // shadowOpacity: 0.05,
    // shadowRadius: 10,
    elevation: 0,
  },
  inputLabel: {
    fontSize: 14,
    color: Colors.text,
    fontFamily: Fonts.semiBold,
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    backgroundColor: "rgba(255,255,255,0.8)",
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    fontFamily: Fonts.regular,
    color: Colors.text,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.5)",
  },
  inputHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 16,
    marginBottom: 8,
  },
  unitToggle: {
    flexDirection: "row",
    backgroundColor: "rgba(0,0,0,0.05)",
    borderRadius: 8,
    padding: 2,
  },
  unitBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  unitBtnActive: {
    backgroundColor: "#FFF",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  unitBtnText: {
    fontSize: 12,
    color: Colors.textMuted,
    fontFamily: Fonts.medium,
  },
  unitBtnTextActive: {
    color: Colors.primary,
    fontFamily: Fonts.bold,
  },
  primaryBtn: {
    backgroundColor: Colors.secondary,
    borderRadius: 12,
    padding: 18,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 32,
    flexDirection: "row",
  },
  primaryBtnText: {
    color: "#000",
    fontSize: 16,
    fontWeight: "bold",
    fontFamily: Fonts.bold,
  },
  disabledBtn: {
    backgroundColor: "rgba(0,0,0,0.05)",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.1)",
  },
  disabledBtnText: {
    color: Colors.textMuted,
  },
  loadingOverlay: {
    justifyContent: "center",
    alignItems: "center",
    zIndex: 999,
  },
  loadingInner: {
    alignItems: "center",
    padding: 40,
  },
  loadingTitle: {
    fontSize: 24,
    color: "#FFF",
    fontFamily: Fonts.bold,
    marginTop: 24,
    textAlign: "center",
  },
  loadingSubtitle: {
    fontSize: 16,
    color: "rgba(255,255,255,0.8)",
    fontFamily: Fonts.regular,
    marginTop: 12,
    textAlign: "center",
    lineHeight: 24,
  },
  dashboardContent: {
    padding: 20,
    paddingBottom: 40,
  },
  dashHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 20,
    marginBottom: 20,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  dashTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: Colors.text,
    fontFamily: Fonts.bold,
  },
  streakBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
    elevation: 4,
    shadowColor: "rgba(0,0,0,0.1)",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
  },
  streakText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#000",
    fontFamily: Fonts.bold,
  },
  calendarContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 30,
    backgroundColor: "rgba(255,255,255,0.3)",
    padding: 10,
    borderRadius: 24,
  },
  dayItem: {
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 20,
    flex: 1,
  },
  selectedDayItem: {
    backgroundColor: "#FFF",
    elevation: 4,
    shadowColor: "rgba(0,0,0,0.1)",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
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
    borderWidth: 1.5,
  },
  selectedDayCircle: {
    borderColor: "#000",
  },
  dashedDayCircle: {
    borderColor: Colors.border,
    borderStyle: "dashed",
  },
  dayNumText: {
    fontSize: 14,
    color: Colors.text,
    fontFamily: Fonts.bold,
  },
  dashSubtitle: {
    fontSize: 14,
    color: Colors.textMuted,
    fontFamily: Fonts.regular,
  },
  profileBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.5)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.05)",
  },
  mainRingContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 20,
  },
  macroRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
  },
  macroCard: {
    width: (width - 60) / 3,
    alignItems: "center",
    padding: 12,
    borderRadius: 16,
    backgroundColor: "#FFF",
    // borderWidth: 1,
    borderColor: "#FFF",
    // shadowColor: "#000",
    // shadowOffset: { width: 0, height: 4 },
    // shadowOpacity: 0.05,
    // shadowRadius: 10,
    // elevation: 2,
    marginVertical: 0,
    height: 140, // Fixed height to align cards
    justifyContent: "space-between",
  },
  macroCardHeader: {
    alignItems: "center",
    width: "100%",
  },
  macroValue: {
    fontSize: 14,
    fontWeight: "bold",
    color: Colors.text,
    fontFamily: Fonts.bold,
    marginTop: 8,
  },
  macroLabel: {
    fontSize: 10,
    color: Colors.textMuted,
    fontFamily: Fonts.regular,
  },
  addMealHero: {
    marginTop: 30,
    borderRadius: 20,
    overflow: "hidden",
    elevation: 5,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  gradientBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  addMealText: {
    color: "#FFF",
    fontSize: 18,
    fontWeight: "bold",
    fontFamily: Fonts.bold,
    marginLeft: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: Colors.text,
    fontFamily: Fonts.bold,
    marginTop: 32,
    marginBottom: 16,
  },
  mealCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    marginBottom: 12,
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: "#FFF",
    shadowColor: "#FFF",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
    marginVertical: 0,
  },
  mealInfo: {
    flex: 1,
  },
  mealDesc: {
    fontSize: 16,
    fontWeight: "bold",
    color: Colors.text,
    fontFamily: Fonts.bold,
  },
  mealMacros: {
    fontSize: 12,
    color: Colors.textMuted,
    fontFamily: Fonts.regular,
    marginTop: 4,
  },
  mealMacroPills: {
    flexDirection: "row",
    gap: 8,
    marginTop: 8,
  },
  macroPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  macroPillText: {
    fontSize: 10,
    fontWeight: "bold",
    fontFamily: Fonts.bold,
  },
  mealCals: {
    fontSize: 16,
    fontWeight: "bold",
    color: Colors.secondary,
    fontFamily: Fonts.bold,
  },
  emptyText: {
    textAlign: "center",
    color: Colors.textMuted,
    fontFamily: Fonts.regular,
    marginTop: 20,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 15,
    marginTop: 23,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: Colors.text,
    fontFamily: Fonts.bold,
  },
  addMealContent: {
    padding: 20,
    flex: 1,
  },
  textArea: {
    backgroundColor: "rgba(255,255,255,0.7)",
    borderRadius: 16,
    padding: 20,
    fontSize: 16,
    fontFamily: Fonts.regular,
    color: Colors.text,
    height: 150,
    textAlignVertical: "top",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.5)",
  },
  celebrationContainer: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  celebrationGradient: {
    width: "100%",
    padding: 30,
    borderRadius: 24,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(252, 163, 17, 0.3)",
  },
  celebrationTitle: {
    fontSize: 24,
    color: Colors.text,
    fontFamily: Fonts.bold,
    marginTop: 15,
  },
  celebrationText: {
    fontSize: 14,
    color: Colors.textMuted,
    fontFamily: Fonts.regular,
    textAlign: "center",
    marginTop: 8,
    marginBottom: 20,
  },
  resetBtn: {
    backgroundColor: "rgba(0,0,0,0.05)",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.1)",
  },
  resetBtnText: {
    color: Colors.text,
    fontSize: 14,
    fontFamily: Fonts.semiBold,
  },
  aiNote: {
    flexDirection: "row",
    marginTop: 20,
    paddingRight: 20,
  },
  aiNoteText: {
    fontSize: 12,
    color: Colors.textMuted,
    fontFamily: Fonts.regular,
    marginLeft: 8,
    lineHeight: 18,
  },
  imageButtonsRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 20,
  },
  imageActionBtn: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.7)",
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.5)",
  },
  imageActionText: {
    color: Colors.text,
    fontSize: 12,
    fontFamily: Fonts.medium,
    marginTop: 8,
  },
  imagePreviewContainer: {
    width: "100%",
    height: 200,
    borderRadius: 20,
    overflow: "hidden",
    marginBottom: 20,
    position: "relative",
  },
  imagePreview: {
    width: "100%",
    height: "100%",
  },
  removeImageBtn: {
    position: "absolute",
    top: 10,
    right: 10,
    backgroundColor: "rgba(0,0,0,0.5)",
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
  },
  removeImageText: {
    color: "#FFF",
    fontSize: 20,
    fontWeight: "bold",
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
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  analyzeButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    gap: 12,
  },
  analyzeButtonText: {
    color: "#FFF",
    fontSize: 18,
    fontFamily: Fonts.bold,
  },
  mainProgressCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 30,
    paddingVertical: 25,
    backgroundColor: "#FFF",
    borderRadius: 32,
    width: "100%",
    elevation: 0,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.02)",
  },
  progressLeft: {
    flex: 1,
  },
  caloriesCount: {
    fontSize: 48,
    fontFamily: Fonts.bold,
    color: "#1D1A23",
    lineHeight: 56,
  },
  caloriesLabel: {
    fontSize: 18,
    color: Colors.textMuted,
    fontFamily: Fonts.regular,
    marginTop: 4,
  },
  progressRight: {
    alignItems: "center",
    justifyContent: "center",
  },
  flameIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 18,
    backgroundColor: "rgba(0,0,0,0.03)",
    alignItems: "center",
    justifyContent: "center",
  },
  scannerBody: {
    flex: 1,
    backgroundColor: "#000",
  },
  permissionContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  permissionText: {
    color: "#FFF",
    fontSize: 16,
    fontFamily: Fonts.medium,
    textAlign: "center",
    marginBottom: 20,
  },
  permissionBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 20,
  },
  permissionBtnText: {
    color: "#000",
    fontFamily: Fonts.bold,
  },
  scannerContainer: {
    flex: 1,
    backgroundColor: "#000",
  },
  scannerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 15,
    marginTop: Platform.OS === "ios" ? 0 : 25,
  },
  scannerBackBtn: {
    padding: 8,
  },
  scannerMoreBtn: {
    padding: 8,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 20,
  },
  scannerTitleText: {
    color: "#FFF",
    fontSize: 20,
    fontFamily: Fonts.bold,
  },
  scannerFrameContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  scannerFrame: {
    width: width * 0.8,
    height: width * 0.8,
    position: "relative",
  },
  corner: {
    position: "absolute",
    width: 40,
    height: 40,
    borderColor: "#FFF",
    borderWidth: 4,
  },
  topLeft: {
    top: 0,
    left: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    borderTopLeftRadius: 32,
  },
  topRight: {
    top: 0,
    right: 0,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
    borderTopRightRadius: 32,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderRightWidth: 0,
    borderTopWidth: 0,
    borderBottomLeftRadius: 32,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    borderBottomRightRadius: 32,
  },
  scannerScanLine: {
    position: "absolute",
    left: 10,
    right: 10,
    height: 3,
    zIndex: 10,
    backgroundColor: "rgba(255,255,255,0.8)",
    shadowColor: "#FFF",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 10,
  },
  scannerFooter: {
    paddingBottom: 40,
  },
  scannerModes: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 15,
    marginBottom: 30,
  },
  scannerModeItem: {
    width: 90,
    height: 90,
    backgroundColor: "rgba(255,255,255,0.9)",
    borderRadius: 16,
    padding: 12,
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  activeModeItem: {
    backgroundColor: "#DAF062", // Lime green from image
  },
  modeIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(0,0,0,0.05)",
    justifyContent: "center",
    alignItems: "center",
  },
  modeText: {
    fontSize: 12,
    fontFamily: Fonts.medium,
    color: "#666",
  },
  activeModeText: {
    fontSize: 12,
    fontFamily: Fonts.bold,
    color: "#000",
  },
  scannerCaptureRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  captureBtn: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  captureBtnInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#FFF",
    padding: 4,
  },
  captureBtnCore: {
    flex: 1,
    borderRadius: 28,
    backgroundColor: "#FF5E4D", // Reddish color from image
  },
  historyBtn: {
    padding: 10,
  },
  historyBtnInner: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  analysisOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 180,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 30,
    zIndex: 2000,
  },
  analyzeButton: {
    width: "100%",
    borderRadius: 24,
    overflow: "hidden",
    elevation: 8,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  retakeButton: {
    width: "100%",
    padding: 16,
    borderRadius: 24,
    backgroundColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  retakeButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontFamily: Fonts.medium,
  },
});
