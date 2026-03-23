import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { Diamond } from "lucide-react-native";
import { useRouter } from "expo-router";
import { authService } from "../src/services/authService";
import { useTaskStore } from "../src/store/useTaskStore";
import { api } from "../src/services/api";
import Purchases, { LOG_LEVEL } from "react-native-purchases";
import { Platform } from "react-native";

const LoginScreen = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const setSession = useTaskStore((state) => state.setSession);

  const handleOAuthLogin = async () => {
    const provider = Platform.OS === "ios" ? "apple" : "google";
    try {
      setLoading(true);
      console.log(`${provider} login started`);
      await authService.signInWithOAuth(provider);
    } catch (error) {
      Alert.alert(
        "Login Error",
        `Failed to sign in with ${provider === "apple" ? "Apple" : "Google"}.`,
      );
    } finally {
      setLoading(false);
    }
  };

  const loginProvider = Platform.OS === "ios" ? "apple" : "google";
  const loginIcon =
    loginProvider === "apple"
      ? "https://static.cdnlogo.com/logos/a/12/apple.svg"
      : "https://static.cdnlogo.com/logos/g/23/goolge-icon.png";
  const loginText =
    loginProvider === "apple" ? "Sign in with Apple" : "Sign in with Google";

  return (
    <LinearGradient colors={["#0f172a", "#1e293b"]} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.content}>
          <View style={styles.hero}>
            <View style={styles.logoContainer}>
              <Image
                source={require("../assets/images/AppIcons/appstore.png")}
                style={{ width: "80%", height: "80%", borderRadius: 30 }}
                resizeMode="contain"
              />
            </View>
            <Text style={styles.title}>Weekora</Text>
            <Text style={styles.subtitle}>
              Build your best self, one day at a time.
            </Text>
          </View>

          <View style={styles.formContainer}>
            <TouchableOpacity
              style={[
                styles.loginButton,
                loginProvider === "apple" && styles.appleButton,
              ]}
              onPress={handleOAuthLogin}
              disabled={loading}
            >
              <View style={styles.loginContent}>
                {loading ? (
                  <ActivityIndicator
                    color={loginProvider === "apple" ? "#fff" : "#0f172a"}
                  />
                ) : (
                  <>
                    <Image
                      source={{ uri: loginIcon }}
                      style={styles.providerIcon}
                      contentFit="contain"
                    />
                    <Text
                      style={[
                        styles.loginText,
                        loginProvider === "apple" && styles.appleText,
                      ]}
                    >
                      {loginText}
                    </Text>
                  </>
                )}
              </View>
            </TouchableOpacity>

            <Text style={styles.termsText}>
              By continuing, you agree to our Terms of Service and Privacy
              Policy.
            </Text>
          </View>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  content: { flex: 1, padding: 32, justifyContent: "space-between" },
  hero: { alignItems: "center", marginTop: 100 },
  logoContainer: {
    width: 100,
    height: 100,
    // borderRadius: 30,
    // backgroundColor: "rgba(99, 102, 241, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
    // borderWidth: 1,
    // borderColor: "rgba(99, 102, 241, 0.2)",
  },
  title: { fontSize: 36, fontWeight: "900", color: "#fff", marginBottom: 12 },
  subtitle: {
    fontSize: 18,
    color: "#94a3b8",
    textAlign: "center",
    lineHeight: 28,
  },
  formContainer: { width: "100%", marginBottom: 40 },
  loginButton: {
    width: "100%",
    backgroundColor: "#fff",
    borderRadius: 16,
    paddingVertical: 18,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  appleButton: {
    backgroundColor: "#fff",
  },
  loginContent: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  providerIcon: { width: 24, height: 24, marginRight: 12 },
  loginText: { fontSize: 18, fontWeight: "700", color: "#0f172a" },
  appleText: { color: "#0a0000" },
  termsText: {
    marginTop: 24,
    fontSize: 12,
    color: "#64748b",
    textAlign: "center",
    lineHeight: 20,
  },
});

export default LoginScreen;
