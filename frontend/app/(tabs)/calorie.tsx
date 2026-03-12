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

const { width } = Dimensions.get("window");

type ViewState = "dashboard" | "onboarding" | "profile" | "add-meal";
import { useTaskStore } from "@/src/store/useTaskStore";

export default function CalorieScreen() {
  // const { user, calorieProgress, loadCalAiProgress } = useTaskStore();
  const user = useTaskStore((state) => state.user);
  const calorieProgress = useTaskStore((state) => state.calorieProgress);
  const loadCalAiProgress = useTaskStore((state) => state.loadCalAiProgress);

  const [currentView, setCurrentView] = useState<ViewState>("dashboard");
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [dashboardPageIndex, setDashboardPageIndex] = useState(0);
  const horizontalPagerRef = useRef<ScrollView>(null);

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
    height: "",
    dateOfBirth: "1995-01-01",
    gender: "Male",
    dailyStepGoal: "10000",
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

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission", "Camera permission is required");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 0.5,
      base64: true,
      cameraType: ImagePicker.CameraType.back,
    });

    if (!result.canceled) {
      setSelectedImage(result.assets[0].uri);
      setImageBase64(result.assets[0].base64 || null);
    }
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
      await loadCalAiProgress(user.id, days);
      setActiveDays(days);
    },
    [user?.id, loadCalAiProgress],
  );

  const init = useCallback(async () => {
    if (!user?.id) return;
    try {
      setLoading(true);
      const profileData = await api.getCalAiProfile(user.id);
      if (profileData) {
        setProfile(profileData);
        setFormData({
          goalWeight: profileData.goalWeight.toString(),
          currentWeight: profileData.currentWeight.toString(),
          height: profileData.height,
          dateOfBirth: new Date(profileData.dateOfBirth)
            .toISOString()
            .split("T")[0],
          gender: profileData.gender,
          dailyStepGoal: profileData.dailyStepGoal.toString(),
        });
        const dashData = await api.getCalAiDashboard(user.id);
        setDashboardData(dashData);
        setCurrentView("dashboard");
      } else {
        setCurrentView("onboarding");
      }
    } catch (e) {
      console.error("Init failed:", e);
    } finally {
      setLoading(false);
    }
  }, [user?.id]); // Removed activeDays and fetchProgressData from dependencies

  useEffect(() => {
    init();
  }, [init]);

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
      const payload = {
        goalWeight: parseFloat(formData.goalWeight),
        currentWeight: parseFloat(formData.currentWeight),
        height: formData.height,
        dateOfBirth: formData.dateOfBirth,
        gender: formData.gender,
        dailyStepGoal: parseInt(formData.dailyStepGoal),
      };

      // Ensure animation shows for at least 1.5s for UX
      const [updated] = await Promise.all([
        api.updateCalAiProfile(user.id, payload),
        new Promise((resolve) => setTimeout(resolve, 2000)),
      ]);

      setProfile(updated);

      // Refresh data
      const dashData = await api.getCalAiDashboard(user.id);
      setDashboardData(dashData);

      // Smooth transition
      Animated.timing(screenFade, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }).start(() => {
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
          await init(); // Refresh dashboard data
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
              setLoading(true);
              await api.resetCalAiDashboard(user.id);
              await init();
            } catch (e) {
              Alert.alert("Error", "Failed to reset");
            } finally {
              setLoading(false);
            }
          },
        },
      ],
    );
  };

  if (loading && !profile && currentView === "dashboard") {
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
        <Text style={styles.inputLabel}>Goal Weight (kg)</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. 70"
          keyboardType="numeric"
          value={formData.goalWeight}
          onChangeText={(val) => setFormData({ ...formData, goalWeight: val })}
        />

        <Text style={styles.inputLabel}>Current Weight (kg)</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. 85"
          keyboardType="numeric"
          value={formData.currentWeight}
          onChangeText={(val) =>
            setFormData({ ...formData, currentWeight: val })
          }
        />

        <Text style={styles.inputLabel}>Height (cm)</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. 180"
          keyboardType="numeric"
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
                {dashboardData?.streak || 0}
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
            {dashboardData && dashboardData.caloriesLeft <= 0 ? (
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
                    {dashboardData
                      ? Math.max(0, dashboardData.caloriesLeft)
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
                      dashboardData
                        ? Math.min(
                            1,
                            Math.max(
                              0,
                              1 -
                                dashboardData.caloriesLeft /
                                  (dashboardData.dailyTarget || 2000),
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
                    (dashboardData?.proteinTarget || 150) -
                      (dashboardData?.totalProtein || 0),
                  )}
                  g
                </Text>
                <Text style={styles.macroLabel}>
                  Protein <Text style={{ fontFamily: Fonts.bold }}>left</Text>
                </Text>
              </View>
              <ProgressRing
                progress={
                  dashboardData
                    ? Math.min(
                        1,
                        (dashboardData.totalProtein || 0) /
                          (dashboardData.proteinTarget || 150),
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
                    (dashboardData?.carbsTarget || 250) -
                      (dashboardData?.totalCarbs || 0),
                  )}
                  g
                </Text>
                <Text style={styles.macroLabel}>
                  Carbs <Text style={{ fontFamily: Fonts.bold }}>left</Text>
                </Text>
              </View>
              <ProgressRing
                progress={
                  dashboardData
                    ? Math.min(
                        1,
                        (dashboardData.totalCarbs || 0) /
                          (dashboardData.carbsTarget || 250),
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
                    (dashboardData?.fatsTarget || 70) -
                      (dashboardData?.totalFats || 0),
                  )}
                  g
                </Text>
                <Text style={styles.macroLabel}>
                  Fats <Text style={{ fontFamily: Fonts.bold }}>left</Text>
                </Text>
              </View>
              <ProgressRing
                progress={
                  dashboardData
                    ? Math.min(
                        1,
                        (dashboardData.totalFats || 0) /
                          (dashboardData.fatsTarget || 70),
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

          <Text style={styles.sectionTitle}>Recent Meals</Text>
          {dashboardData?.meals && dashboardData.meals.length > 0 ? (
            dashboardData.meals.map((meal: any) => (
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

      <TouchableOpacity
        style={styles.fab}
        onPress={() => setCurrentView("add-meal")}
      >
        <Plus color="#FFF" size={32} />
      </TouchableOpacity>
    </View>
  );

  const renderAddMeal = () => (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.mainContainer}
    >
      <View style={styles.modalHeader}>
        <TouchableOpacity
          onPress={() => setCurrentView("dashboard")}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <ChevronLeft color={Colors.text} size={28} />
        </TouchableOpacity>
        <Text style={styles.modalTitle}>What did you eat?</Text>
        <View style={{ width: 28 }} />
      </View>

      <View style={styles.addMealContent}>
        {selectedImage ? (
          <View style={styles.imagePreviewContainer}>
            <Image
              source={{ uri: selectedImage }}
              style={styles.imagePreview}
            />
            <TouchableOpacity
              style={styles.removeImageBtn}
              onPress={() => {
                setSelectedImage(null);
                setImageBase64(null);
              }}
            >
              <Text style={styles.removeImageText}>×</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.imageButtonsRow}>
            <TouchableOpacity style={styles.imageActionBtn} onPress={takePhoto}>
              <Camera color={Colors.text} size={24} />
              <Text style={styles.imageActionText}>Take Photo</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.imageActionBtn} onPress={pickImage}>
              <Search color={Colors.text} size={24} />
              <Text style={styles.imageActionText}>Gallery</Text>
            </TouchableOpacity>
          </View>
        )}

        <TextInput
          style={styles.textArea}
          multiline
          numberOfLines={4}
          value={mealDescription}
          onChangeText={setMealDescription}
        />

        <View style={styles.aiNote}>
          <Info color={Colors.textMuted} size={16} />
          <Text style={styles.aiNoteText}>
            What did you eat? Or let AI see the photo...
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.primaryBtn, isScanning && { opacity: 0.7 }]}
          onPress={handleAnalyzeMeal}
          disabled={isScanning}
        >
          {isScanning ? (
            <ActivityIndicator color="#000" />
          ) : (
            <>
              <Zap color="#000" size={20} style={{ marginRight: 8 }} />
              <Text style={styles.primaryBtnText}>Analyze with AI</Text>
            </>
          )}
        </TouchableOpacity>

        <View style={styles.aiNote}>
          <Info color={Colors.textMuted} size={16} />
          <Text style={styles.aiNoteText}>
            Our AI will estimate the calories and macros based on your
            description.
          </Text>
        </View>
      </View>
    </KeyboardAvoidingView>
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
        <Text style={styles.inputLabel}>Goal Weight (kg)</Text>
        <TextInput
          style={styles.input}
          keyboardType="numeric"
          value={formData.goalWeight}
          onChangeText={(val) => setFormData({ ...formData, goalWeight: val })}
        />

        <Text style={styles.inputLabel}>Current Weight (kg)</Text>
        <TextInput
          style={styles.input}
          keyboardType="numeric"
          value={formData.currentWeight}
          onChangeText={(val) =>
            setFormData({ ...formData, currentWeight: val })
          }
        />

        <Text style={styles.inputLabel}>Height (cm)</Text>
        <TextInput
          style={styles.input}
          keyboardType="numeric"
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
          style={[styles.primaryBtn, loading && { opacity: 0.7 }]}
          onPress={handleSaveProfile}
          disabled={loading}
        >
          {loading ? (
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
        {currentView === "dashboard" && renderDashboard()}
        {currentView === "onboarding" && renderOnboarding()}
        {currentView === "add-meal" && renderAddMeal()}
        {currentView === "profile" && renderProfile()}
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
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
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
});
