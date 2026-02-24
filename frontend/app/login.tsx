import React, { useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  Image,
  ActivityIndicator,
  Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Diamond } from "lucide-react-native";
import { useRouter } from "expo-router";
import { authService } from "../src/services/authService";
import { useTaskStore } from "../src/store/useTaskStore";
import { api } from "../src/services/api";

const LoginScreen = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const setSession = useTaskStore((state) => state.setSession);

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      console.log("Google login started");
      await authService.signInWithGoogle();
      // const { session }: any = await authService.signInWithGoogle();
      // console.log("OAuth result:", session);
      // await authService.handleSession(session);
      // setSession(session);

      // Note: In real scenarios, the listener in RootLayout or a session change
      // will trigger setSession. For now, we handle the manual flow if needed.
      // After success, we expect Supabase to handle the redirect.
    } catch (error) {
      Alert.alert("Login Error", "Failed to sign in with Google.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={["#0f172a", "#1e293b"]} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.content}>
          <View style={styles.hero}>
            <View style={styles.logoContainer}>
              <Diamond size={60} color="#6366f1" />
            </View>
            <Text style={styles.title}>Weekora</Text>
            <Text style={styles.subtitle}>
              Build your best self, one day at a time.
            </Text>
          </View>

          <View style={styles.formContainer}>
            <TouchableOpacity
              style={styles.googleButton}
              onPress={handleGoogleLogin}
              disabled={loading}
            >
              <View style={styles.googleContent}>
                {loading ? (
                  <ActivityIndicator color="#0f172a" />
                ) : (
                  <>
                    <Image
                      source={{
                        uri: "https://static.cdnlogo.com/logos/g/23/goolge-icon.png",
                      }}
                      style={styles.googleIcon}
                    />
                    <Text style={styles.googleText}>Sign in with Google</Text>
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
    borderRadius: 30,
    backgroundColor: "rgba(99, 102, 241, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "rgba(99, 102, 241, 0.2)",
  },
  title: { fontSize: 36, fontWeight: "900", color: "#fff", marginBottom: 12 },
  subtitle: {
    fontSize: 18,
    color: "#94a3b8",
    textAlign: "center",
    lineHeight: 28,
  },
  formContainer: { width: "100%", marginBottom: 40 },
  googleButton: {
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
  googleContent: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  googleIcon: { width: 24, height: 24, marginRight: 12 },
  googleText: { fontSize: 18, fontWeight: "700", color: "#0f172a" },
  termsText: {
    marginTop: 24,
    fontSize: 12,
    color: "#64748b",
    textAlign: "center",
    lineHeight: 20,
  },
});

export default LoginScreen;
