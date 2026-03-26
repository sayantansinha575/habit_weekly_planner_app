import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Dimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Image } from "expo-image";
import { Colors, Fonts } from "../theme/colors";

const { width } = Dimensions.get("window");

const CustomSplashScreen = () => {
  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["#E3F2FD", "#F3E5F5", "#FCE4EC"]}
        style={StyleSheet.absoluteFill}
      />

      <View style={styles.content}>
        <View style={styles.logoContainer}>
          <Image
            source={require("../../assets/images/AppIcons/appstore.png")}
            style={styles.logo}
            contentFit="contain"
          />
        </View>

        <Text style={styles.title}>Weekora</Text>
        <Text style={styles.subtitle}>
          Build your best self, one day at a time.
        </Text>

        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Initializing...</Text>
        </View>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Powered by Advanced AI</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    alignItems: "center",
    width: "100%",
  },
  logoContainer: {
    width: 140,
    height: 140,
    backgroundColor: "#FFF",
    borderRadius: 35,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
    marginBottom: 24,
  },
  logo: {
    width: "85%",
    height: "85%",
    borderRadius: 25,
  },
  title: {
    fontSize: 42,
    fontFamily: Fonts.bold,
    color: Colors.text,
    letterSpacing: -1,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: Fonts.medium,
    color: Colors.textMuted,
    textAlign: "center",
    paddingHorizontal: 40,
    lineHeight: 24,
  },
  loaderContainer: {
    marginTop: 60,
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    fontFamily: Fonts.regular,
    color: Colors.textMuted,
    letterSpacing: 1,
  },
  footer: {
    position: "absolute",
    bottom: 50,
  },
  footerText: {
    fontSize: 12,
    fontFamily: Fonts.medium,
    color: Colors.textMuted,
    opacity: 0.6,
    textTransform: "uppercase",
    letterSpacing: 2,
  },
});

export default CustomSplashScreen;
