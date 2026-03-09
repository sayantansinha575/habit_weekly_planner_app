import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  Easing,
} from "react-native";
import { Image } from "expo-image";
import { Colors, Fonts } from "@/src/theme/colors";
import { Zap, Target, Search, BarChart2 } from "lucide-react-native";

const { width, height } = Dimensions.get("window");

interface ScannerOverlayProps {
  imageUri: string | null;
  isVisible: boolean;
}

const STATUS_MESSAGES = [
  "Analyzing image content...",
  "Identifying food items...",
  "Estimating portion sizes...",
  "Calculating nutritional values...",
  "Categorizing macros...",
  "Finalizing results...",
];

export default function ScannerOverlay({
  imageUri,
  isVisible,
}: ScannerOverlayProps) {
  const scanAnim = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [statusIndex, setStatusIndex] = useState(0);

  useEffect(() => {
    if (isVisible) {
      // Fade in overlay
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();

      // Scanning animation (Native Driver - translateY)
      const scanLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(scanAnim, {
            toValue: 1,
            duration: 2000,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(scanAnim, {
            toValue: 0,
            duration: 2000,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
        ]),
      );

      // Progress bar animation (JS Driver - width)
      const progressLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(progressAnim, {
            toValue: 1,
            duration: 2000,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: false,
          }),
          Animated.timing(progressAnim, {
            toValue: 0,
            duration: 2000,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: false,
          }),
        ]),
      );

      scanLoop.start();
      progressLoop.start();

      // Cycle status messages
      const interval = setInterval(() => {
        setStatusIndex((prev) => (prev + 1) % STATUS_MESSAGES.length);
      }, 1500);

      return () => {
        clearInterval(interval);
        scanLoop.stop();
        progressLoop.stop();
      };
    } else {
      // Fade out overlay
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }).start();
    }
  }, [isVisible, scanAnim, progressAnim, fadeAnim]);

  if (!isVisible && fadeAnim === new Animated.Value(0)) return null;

  const translateY = scanAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [100, height - 200],
  });

  return (
    <Animated.View
      style={[
        StyleSheet.absoluteFill,
        styles.container,
        { opacity: fadeAnim, zIndex: 1000 },
      ]}
      pointerEvents="none"
    >
      {/* Background Image (Blurred) */}
      {imageUri && (
        <Image
          source={{ uri: imageUri }}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
        />
      )}
      <View
        style={[
          StyleSheet.absoluteFill,
          { backgroundColor: "rgba(0,0,0,0.85)" },
        ]}
      />

      {/* Scanning Area */}
      <View style={styles.scannerWrapper}>
        {imageUri && (
          <View style={styles.imageFrame}>
            <Image
              source={{ uri: imageUri }}
              style={styles.mainImage}
              contentFit="contain"
            />
            {/* The Scanning Beam */}
            <Animated.View
              style={[styles.scanLine, { transform: [{ translateY }] }]}
            >
              <View style={styles.scanGlow} />
            </Animated.View>
          </View>
        )}

        {/* Status Section */}
        <View style={styles.statusContainer}>
          <View style={styles.iconRow}>
            <Search color={Colors.secondary} size={24} style={styles.icon} />
            <Target color={Colors.secondary} size={24} style={styles.icon} />
            <BarChart2 color={Colors.secondary} size={24} style={styles.icon} />
          </View>
          <Text style={styles.statusText}>{STATUS_MESSAGES[statusIndex]}</Text>
          <View style={styles.progressTrack}>
            <Animated.View
              style={[
                styles.progressBar,
                {
                  width: progressAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ["0%", "100%"],
                  }),
                },
              ]}
            />
          </View>
        </View>
      </View>

      <View style={styles.footer}>
        <Zap color={Colors.secondary} size={32} />
        <Text style={styles.footerTitle}>Calorie AI Vision</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#000",
    justifyContent: "center",
    alignItems: "center",
  },
  scannerWrapper: {
    width: "90%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  imageFrame: {
    width: "100%",
    height: height * 0.5,
    borderRadius: 24,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "rgba(252, 163, 17, 0.3)",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  mainImage: {
    flex: 1,
  },
  scanLine: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: Colors.secondary,
    shadowColor: Colors.secondary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    zIndex: 2,
  },
  scanGlow: {
    position: "absolute",
    top: -20,
    left: 0,
    right: 0,
    height: 40,
    backgroundColor: "rgba(252, 163, 17, 0.2)",
  },
  statusContainer: {
    marginTop: 40,
    alignItems: "center",
    width: "100%",
  },
  iconRow: {
    flexDirection: "row",
    gap: 20,
    marginBottom: 20,
  },
  icon: {
    opacity: 0.8,
  },
  statusText: {
    color: "#FFF",
    fontSize: 18,
    fontFamily: Fonts.semiBold,
    textAlign: "center",
    marginBottom: 20,
    height: 24,
  },
  progressTrack: {
    width: "80%",
    height: 4,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 2,
    overflow: "hidden",
  },
  progressBar: {
    height: "100%",
    backgroundColor: Colors.secondary,
  },
  footer: {
    position: "absolute",
    bottom: 60,
    alignItems: "center",
  },
  footerTitle: {
    color: "#FFF",
    fontSize: 20,
    fontFamily: Fonts.bold,
    marginTop: 10,
    letterSpacing: 2,
  },
});
