import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { X, Check, Diamond, Zap, Shield, Crown } from "lucide-react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { iapService } from "../src/services/iapService";
import { useTaskStore } from "@/src/store/useTaskStore";

const SubscriptionScreen = () => {
  const router = useRouter();
  const { isMandatory } = useLocalSearchParams();
  const [loading, setLoading] = useState(false);
  const [offerings, setOfferings] = useState<any>(null);

  const user = useTaskStore((state) => (state as any).user);
  const subscriptionStatus = useTaskStore(
    (state) => (state as any).subscriptionStatus,
  );

  useEffect(() => {
    loadOfferings();
  }, []);

  const loadOfferings = async () => {
    setLoading(true);
    const data = await iapService.getOfferings();
    setOfferings(data);
    setLoading(false);
  };

  const handlePurchase = async (pkg: any) => {
    try {
      setLoading(true);
      const customerInfo = await iapService.purchasePackage(pkg);
      if (customerInfo.entitlements.active["pro_monthly"]) {
        Alert.alert("Success", "You are now a Pro member! 🎉");
        // Update local state and nav away
        router.replace("/(tabs)");
      }
    } catch (e: any) {
      if (!e.userCancelled) {
        Alert.alert("Error", "Purchase failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (isMandatory === "true") {
      Alert.alert(
        "Pro Required",
        "Your trial has expired. Please subscribe to continue.",
      );
      return;
    }
    router.back();
  };

  const features = [
    {
      icon: <Zap size={20} color="#FFD700" />,
      text: "Unlimited Habits & Tasks",
    },
    {
      icon: <Shield size={20} color="#FFD700" />,
      text: "Advanced Insights & Charts",
    },
    { icon: <Crown size={20} color="#FFD700" />, text: "Cloud Backup & Sync" },
    {
      icon: <Diamond size={20} color="#FFD700" />,
      text: "Premium Glass Theme",
    },
  ];

  if (loading && !offerings) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  return (
    <LinearGradient colors={["#0f172a", "#1e293b"]} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            {isMandatory !== "true" && <X size={24} color="#94a3b8" />}
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.hero}>
            <View style={styles.iconContainer}>
              <Diamond size={60} color="#FFD700" />
            </View>
            <Text style={styles.title}>Upgrade to Pro</Text>
            <Text style={styles.subtitle}>
              Unlock the full potential of your productivity journey.
            </Text>
          </View>

          <View style={styles.featuresContainer}>
            {features.map((f, i) => (
              <View key={i} style={styles.featureItem}>
                <View style={styles.featureIcon}>{f.icon}</View>
                <Text style={styles.featureText}>{f.text}</Text>
              </View>
            ))}
          </View>

          <View style={styles.pricingCard}>
            <Text style={styles.trialText}>7 Days FREE, then $7/month</Text>
            <Text style={styles.descriptionText}>
              Cancel anytime in Google Play
            </Text>

            {offerings?.availablePackages?.map((pkg: any) => (
              <TouchableOpacity
                key={pkg.identifier}
                style={styles.purchaseButton}
                onPress={() => handlePurchase(pkg)}
                disabled={loading}
              >
                <LinearGradient
                  colors={["#6366f1", "#a855f7"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.gradientButton}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.buttonText}>
                      Start 7-Day Free Trial
                    </Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Secure transaction powered by Google Play
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#0f172a",
  },
  header: { padding: 16, alignItems: "flex-end" },
  closeButton: { padding: 8 },
  scrollContent: { padding: 24, alignItems: "center" },
  hero: { alignItems: "center", marginBottom: 40 },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "rgba(255, 215, 0, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  title: { fontSize: 32, fontWeight: "800", color: "#fff", marginBottom: 12 },
  subtitle: {
    fontSize: 16,
    color: "#94a3b8",
    textAlign: "center",
    lineHeight: 24,
  },
  featuresContainer: { width: "100%", marginBottom: 40 },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  featureIcon: { marginRight: 16 },
  featureText: { fontSize: 16, color: "#e2e8f0", fontWeight: "500" },
  pricingCard: {
    width: "100%",
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    padding: 24,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(255, 215, 0, 0.3)",
    alignItems: "center",
  },
  trialText: {
    fontSize: 20,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 8,
  },
  descriptionText: { fontSize: 14, color: "#94a3b8", marginBottom: 24 },
  purchaseButton: { width: "100%" },
  gradientButton: {
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: "center",
    shadowColor: "#6366f1",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  buttonText: { color: "#fff", fontSize: 18, fontWeight: "700" },
  footer: { marginTop: 32, opacity: 0.5 },
  footerText: { color: "#94a3b8", fontSize: 12 },
});

export default SubscriptionScreen;
