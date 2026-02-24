import React, { useEffect } from "react";
import { View, ActivityIndicator, StyleSheet, Text } from "react-native";
import { useRouter } from "expo-router";
import { useTaskStore } from "../src/store/useTaskStore";

export default function AuthCallback() {
  const router = useRouter();
  const isAuthReady = useTaskStore((state) => state.isAuthReady);
  const isAuthenticating = useTaskStore((state) => state.isAuthenticating);
  const session = useTaskStore((state) => state.session);

  useEffect(() => {
    if (isAuthReady && !isAuthenticating) {
      if (session) {
        router.replace("/(tabs)");
      } else {
        router.replace("/login");
      }
    }
  }, [isAuthReady, isAuthenticating, session]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#6366f1" />
      <Text style={styles.text}>Completing secure sign in...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0f172a",
    justifyContent: "center",
    alignItems: "center",
  },
  text: {
    marginTop: 16,
    color: "#94a3b8",
    fontSize: 16,
  },
});
