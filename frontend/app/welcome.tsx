import React, { useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  SafeAreaView,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import PagerView from "react-native-pager-view";
import { ArrowRight, CheckCircle2 } from "lucide-react-native";
import { Colors, Fonts } from "@/src/theme/colors";
import { useTaskStore } from "@/src/store/useTaskStore";

const { width } = Dimensions.get("window");

const ONBOARDING_DATA = [
  {
    id: "hero",
    title: "Welcome to\nWeekora AI",
    subtitle:
      "Your personal companion for building lasting habits and a healthier lifestyle.",
    image: require("../assets/images/AppIcons/appstore.png"),
    buttonLabel: "Get Started",
  },
  {
    id: "planner",
    title: "Smart Weekly\nPlanner",
    subtitle:
      "Organize your life with intelligent tasks that automatically roll over. Never lose momentum.",
    image: require("../assets/images/onboarding/onboarding_planner.png"),
    buttonLabel: "Next",
  },
  {
    id: "calorie",
    title: "AI Food\nScanner",
    subtitle:
      "Track your nutrition in seconds with our live AI camera. Just point, scan, and stay informed.",
    image: require("../assets/images/onboarding/onboarding_calorie.png"),
    buttonLabel: "Next",
  },
  {
    id: "insights",
    title: "Deep Personal\nInsights",
    subtitle:
      "Visualize your progress with premium charts and streaks that celebrate every win.",
    image: require("../assets/images/onboarding/onboarding_insights.png"),
    buttonLabel: "Finish",
  },
];

export default function WelcomeScreen() {
  const router = useRouter();
  const pagerRef = useRef<PagerView>(null);
  const [activePage, setActivePage] = useState(0);
  const completeOnboarding = useTaskStore((state) => state.completeOnboarding);

  const handleNext = async () => {
    if (activePage < ONBOARDING_DATA.length - 1) {
      pagerRef.current?.setPage(activePage + 1);
    } else {
      // Finalize onboarding
      if (completeOnboarding) await completeOnboarding();
      router.replace("/login");
    }
  };

  const skipToDashboard = async () => {
    if (completeOnboarding) await completeOnboarding();
    router.replace("/login");
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["#0f172a", "#1e1b4b"]}
        style={StyleSheet.absoluteFill}
      />

      <PagerView
        ref={pagerRef}
        style={styles.pager}
        initialPage={0}
        onPageSelected={(e) => setActivePage(e.nativeEvent.position)}
      >
        {ONBOARDING_DATA.map((item) => (
          <View key={item.id} style={styles.page}>
            <SafeAreaView style={styles.safeArea}>
              <View style={styles.topContent}>
                <Image
                  source={item.image}
                  style={styles.illustration}
                  contentFit="contain"
                  transition={1000}
                />
              </View>

              <View style={styles.bottomContent}>
                <Text style={styles.title}>{item.title}</Text>
                <Text style={styles.subtitle}>{item.subtitle}</Text>
              </View>
            </SafeAreaView>
          </View>
        ))}
      </PagerView>

      {/* Footer controls */}
      <SafeAreaView style={styles.footer} pointerEvents="box-none">
        <View style={styles.controlsRow}>
          {/* Progress Indicators */}
          <View style={styles.paginationRow}>
            {ONBOARDING_DATA.map((_, i) => (
              <View
                key={i}
                style={[styles.dot, activePage === i && styles.activeDot]}
              />
            ))}
          </View>

          {/* Action Button */}
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={handleNext}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={[Colors.primary, "#4f46e5"]}
              style={styles.btnGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={styles.btnText}>
                {ONBOARDING_DATA[activePage].buttonLabel}
              </Text>
              {activePage === ONBOARDING_DATA.length - 1 ? (
                <CheckCircle2 color="#FFF" size={20} />
              ) : (
                <ArrowRight color="#FFF" size={20} />
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {activePage > 0 && activePage < ONBOARDING_DATA.length - 1 && (
          <TouchableOpacity style={styles.skipBtn} onPress={skipToDashboard}>
            <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity>
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0f172a",
  },
  pager: {
    flex: 1,
  },
  page: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  topContent: {
    flex: 1.2,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 40,
  },
  illustration: {
    width: width * 0.85,
    height: width * 0.85,
  },
  bottomContent: {
    flex: 1,
    paddingHorizontal: 40,
    justifyContent: "flex-start",
  },
  title: {
    fontSize: 40,
    fontWeight: "bold",
    color: "#FFF",
    fontFamily: Fonts.bold,
    lineHeight: 48,
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 18,
    color: "rgba(255,255,255,0.7)",
    fontFamily: Fonts.medium,
    lineHeight: 26,
  },
  footer: {
    position: "absolute",
    bottom: 0,
    width: "100%",
    paddingBottom: Platform.OS === "ios" ? 0 : 40,
  },
  controlsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  paginationRow: {
    flexDirection: "row",
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  activeDot: {
    width: 24,
    backgroundColor: Colors.primary,
  },
  actionBtn: {
    borderRadius: 30,
    overflow: "hidden",
    elevation: 8,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
  },
  btnGradient: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 32,
    gap: 12,
  },
  btnText: {
    color: "#FFF",
    fontSize: 18,
    fontWeight: "bold",
    fontFamily: Fonts.bold,
  },
  skipBtn: {
    alignSelf: "center",
    marginTop: 24,
    padding: 10,
  },
  skipText: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 14,
    fontFamily: Fonts.medium,
  },
});
