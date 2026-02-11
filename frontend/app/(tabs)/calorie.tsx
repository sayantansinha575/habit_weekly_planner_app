import React, { useState, useEffect, useCallback } from "react";
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
} from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Colors, Fonts } from "@/src/theme/colors";
import Card from "@/src/components/Card";
import ProgressRing from "@/src/components/ProgressRing";
import { api } from "@/src/services/api";
import { useFocusEffect } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";
import { Image } from "expo-image";

const { width } = Dimensions.get("window");

type ViewState = "dashboard" | "onboarding" | "profile" | "add-meal";

export default function CalorieScreen() {
  const TEST_USER_ID = "user-123";
  const [currentView, setCurrentView] = useState<ViewState>("dashboard");
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [dashboardData, setDashboardData] = useState<any>(null);

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
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission", "Camera permission is required");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.5,
      base64: true,
    });

    if (!result.canceled) {
      setSelectedImage(result.assets[0].uri);
      setImageBase64(result.assets[0].base64 || null);
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
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

  const init = useCallback(async () => {
    try {
      setLoading(true);
      const profileData = await api.getCalAiProfile(TEST_USER_ID);
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
        const dashData = await api.getCalAiDashboard(TEST_USER_ID);
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
  }, []);

  useEffect(() => {
    init();
  }, [init]);

  const handleSaveProfile = async () => {
    try {
      setLoading(true);
      const payload = {
        goalWeight: parseFloat(formData.goalWeight),
        currentWeight: parseFloat(formData.currentWeight),
        height: formData.height,
        dateOfBirth: formData.dateOfBirth,
        gender: formData.gender,
        dailyStepGoal: parseInt(formData.dailyStepGoal),
      };
      const updated = await api.updateCalAiProfile(TEST_USER_ID, payload);
      setProfile(updated);
      await init(); // Refresh all
    } catch (e) {
      Alert.alert("Error", "Failed to save profile");
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyzeMeal = async () => {
    if (!mealDescription && !imageBase64) {
      Alert.alert("Input required", "Please add a description or a photo");
      return;
    }
    try {
      setIsAnalyzing(true);
      await api.analyzeMeal(
        TEST_USER_ID,
        mealDescription,
        imageBase64 || undefined,
      );
      setMealDescription("");
      setSelectedImage(null);
      setImageBase64(null);
      await init(); // Refresh dashboard
      setCurrentView("dashboard");
    } catch (e) {
      Alert.alert("Error", "Failed to analyze meal");
    } finally {
      setIsAnalyzing(false);
    }
  };

  if (loading && !profile && currentView === "dashboard") {
    return (
      <View style={[styles.mainContainer, styles.center]}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  // --- Sub-Views ---

  const renderOnboarding = () => (
    <ScrollView
      style={styles.scrollContainer}
      contentContainerStyle={styles.onboardingContent}
    >
      <Text style={styles.onboardingTitle}>Welcome to Cal AI</Text>
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

        <TouchableOpacity style={styles.primaryBtn} onPress={handleSaveProfile}>
          <Text style={styles.primaryBtnText}>Get Started</Text>
        </TouchableOpacity>
      </Card>
    </ScrollView>
  );

  const renderDashboard = () => (
    <ScrollView
      style={styles.scrollContainer}
      contentContainerStyle={styles.dashboardContent}
    >
      <View style={styles.dashHeader}>
        <View>
          <Text style={styles.dashTitle}>Hello!</Text>
          <Text style={styles.dashSubtitle}>
            Here's your summary for today.
          </Text>
        </View>
        <TouchableOpacity onPress={() => setCurrentView("profile")}>
          <View style={styles.profileBadge}>
            <UserIcon color={Colors.primary} size={20} />
          </View>
        </TouchableOpacity>
      </View>

      {/* Main Calorie Ring */}
      <View style={styles.mainRingContainer}>
        <ProgressRing
          progress={
            dashboardData
              ? Math.max(0, 1 - dashboardData.caloriesLeft / 2000)
              : 0
          }
          size={200}
          strokeWidth={15}
          color={Colors.secondary}
          centerText={dashboardData ? `${dashboardData.caloriesLeft}` : "0"}
          label="Calories Left"
          textColor="#FFF"
        />
      </View>

      {/* Macro Grid */}
      <View style={styles.macroRow}>
        <Card style={styles.macroCard}>
          <Flame color="#FF4D4D" size={20} />
          <Text style={styles.macroValue}>
            {dashboardData?.totalProtein || 0}g
          </Text>
          <Text style={styles.macroLabel}>Protein</Text>
        </Card>
        <Card style={styles.macroCard}>
          <Zap color="#FFB84D" size={20} />
          <Text style={styles.macroValue}>
            {dashboardData?.totalCarbs || 0}g
          </Text>
          <Text style={styles.macroLabel}>Carbs</Text>
        </Card>
        <Card style={styles.macroCard}>
          <Utensils color="#4D94FF" size={20} />
          <Text style={styles.macroValue}>
            {dashboardData?.totalFats || 0}g
          </Text>
          <Text style={styles.macroLabel}>Fats</Text>
        </Card>
      </View>

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
      </TouchableOpacity>

      <Text style={styles.sectionTitle}>Recent Meals</Text>
      {dashboardData?.meals && dashboardData.meals.length > 0 ? (
        dashboardData.meals.map((meal: any) => (
          <Card key={meal.id} style={styles.mealCard}>
            <View style={styles.mealInfo}>
              <Text style={styles.mealDesc}>{meal.description}</Text>
              <Text style={styles.mealMacros}>
                P: {meal.protein}g | C: {meal.carbs}g | F: {meal.fats}g
              </Text>
            </View>
            <Text style={styles.mealCals}>{meal.calories} kcal</Text>
          </Card>
        ))
      ) : (
        <Text style={styles.emptyText}>No meals tracked today yet.</Text>
      )}
    </ScrollView>
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
          <ChevronLeft color="#FFF" size={28} />
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
              <Camera color="#FFF" size={24} />
              <Text style={styles.imageActionText}>Take Photo</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.imageActionBtn} onPress={pickImage}>
              <Search color="#FFF" size={24} />
              <Text style={styles.imageActionText}>Gallery</Text>
            </TouchableOpacity>
          </View>
        )}

        <TextInput
          style={styles.textArea}
          placeholder="What did you eat? Or let AI see the photo..."
          multiline
          numberOfLines={4}
          value={mealDescription}
          onChangeText={setMealDescription}
        />

        <TouchableOpacity
          style={[styles.primaryBtn, isAnalyzing && { opacity: 0.7 }]}
          onPress={handleAnalyzeMeal}
          disabled={isAnalyzing}
        >
          {isAnalyzing ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <>
              <Zap color="#FFF" size={20} style={{ marginRight: 8 }} />
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
          <ChevronLeft color="#FFF" size={28} />
        </TouchableOpacity>
        <Text style={styles.modalTitle}>Cal AI Profile</Text>
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

        <TouchableOpacity style={styles.primaryBtn} onPress={handleSaveProfile}>
          <Text style={styles.primaryBtnText}>Update Profile</Text>
        </TouchableOpacity>
      </Card>
    </ScrollView>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <LinearGradient
        colors={["#0F0C29", "#24243e"]}
        style={StyleSheet.absoluteFill}
      />
      {currentView === "dashboard" && renderDashboard()}
      {currentView === "onboarding" && renderOnboarding()}
      {currentView === "add-meal" && renderAddMeal()}
      {currentView === "profile" && renderProfile()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#0F0C29",
  },
  mainContainer: {
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
    color: "#FFF",
    fontFamily: Fonts.bold,
    textAlign: "center",
  },
  onboardingSubtitle: {
    fontSize: 16,
    color: "rgba(255,255,255,0.8)",
    fontFamily: Fonts.regular,
    textAlign: "center",
    marginTop: 8,
    marginBottom: 32,
  },
  formCard: {
    padding: 20,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  inputLabel: {
    fontSize: 14,
    color: "#FFF",
    fontFamily: Fonts.semiBold,
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    fontFamily: Fonts.regular,
    color: "#FFF",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
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
  dashboardContent: {
    padding: 20,
    paddingBottom: 40,
  },
  dashHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 20,
    marginBottom: 30,
  },
  dashTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FFF",
    fontFamily: Fonts.bold,
  },
  dashSubtitle: {
    fontSize: 14,
    color: "rgba(255,255,255,0.7)",
    fontFamily: Fonts.regular,
  },
  profileBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  mainRingContainer: {
    alignItems: "center",
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
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    shadowOpacity: 0,
    elevation: 0,
    marginVertical: 0,
  },
  macroValue: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#FFF",
    fontFamily: Fonts.bold,
    marginTop: 8,
  },
  macroLabel: {
    fontSize: 10,
    color: "rgba(255,255,255,0.7)",
    fontFamily: Fonts.regular,
  },
  addMealHero: {
    marginTop: 30,
    borderRadius: 20,
    overflow: "hidden",
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
    color: "#FFF",
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
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    shadowOpacity: 0,
    elevation: 0,
    marginVertical: 0,
  },
  mealInfo: {
    flex: 1,
  },
  mealDesc: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#FFF",
    fontFamily: Fonts.bold,
  },
  mealMacros: {
    fontSize: 12,
    color: "rgba(255,255,255,0.7)",
    fontFamily: Fonts.regular,
    marginTop: 4,
  },
  mealCals: {
    fontSize: 16,
    fontWeight: "bold",
    color: Colors.secondary,
    fontFamily: Fonts.bold,
  },
  emptyText: {
    textAlign: "center",
    color: "rgba(255,255,255,0.4)",
    fontFamily: Fonts.regular,
    marginTop: 20,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FFF",
    fontFamily: Fonts.bold,
  },
  addMealContent: {
    padding: 20,
    flex: 1,
  },
  textArea: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 16,
    padding: 20,
    fontSize: 16,
    fontFamily: Fonts.regular,
    color: "#FFF",
    height: 150,
    textAlignVertical: "top",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  aiNote: {
    flexDirection: "row",
    marginTop: 20,
    paddingRight: 20,
  },
  aiNoteText: {
    fontSize: 12,
    color: "rgba(255,255,255,0.7)",
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
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  imageActionText: {
    color: "#FFF",
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
});
