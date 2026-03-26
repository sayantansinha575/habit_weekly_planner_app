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
import {
  X,
  Check,
  Diamond,
  Zap,
  Shield,
  Crown,
  Star,
  CheckCircle2,
} from "lucide-react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { iapService } from "../src/services/iapService";
import { useTaskStore } from "@/src/store/useTaskStore";
import { api } from "../src/services/api";
import { Modal } from "react-native";

const SubscriptionScreen = () => {
  const router = useRouter();
  const { isMandatory, isOnboarding } = useLocalSearchParams();
  const [loading, setLoading] = useState(false);
  const [offerings, setOfferings] = useState<any>(null);
  const [selectedPackage, setSelectedPackage] = useState<any>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  const user = useTaskStore((state) => state.user);
  const subscriptionStatus = useTaskStore((state) => state.subscriptionStatus);
  const checkSubscription = useTaskStore((state) => state.checkSubscription);

  useEffect(() => {
    loadOfferings();
  }, []);

  const loadOfferings = async () => {
    setLoading(true);
    const data = await iapService.getOfferings();
    console.log("Offerings:", data);
    setOfferings(data);
    if (data?.availablePackages && data.availablePackages.length > 0) {
      // Auto-select Yearly (ANNUAL) if available, otherwise first
      const monthly = data.availablePackages.find(
        (p: any) => p.packageType === "MONTHLY",
      );
      setSelectedPackage(monthly || data.availablePackages[0]);
    }
    setLoading(false);
  };

  const handlePurchase = async () => {
    if (!selectedPackage) return;
    try {
      setLoading(true);
      const customerInfo = await iapService.purchasePackage(selectedPackage);
      // Check for any active entitlement
      const hasActiveSub =
        Object.values(customerInfo.entitlements.active).length > 0;

      if (hasActiveSub) {
        // Step 2: Immediate state update
        useTaskStore.getState().setSubscriptionStatus("PRO");

        if (user?.id) {
          await checkSubscription();
          // Optional: Sync to backend (Step 7 logic can be added here)
          try {
            await api.updateUser(user.id, { subscriptionStatus: "PREMIUM" });
          } catch (e) {
            console.error("Backend sync failed:", e);
          }
        }
        setShowSuccess(true);
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

    if (isOnboarding === "true") {
      router.replace("/(tabs)");
    } else {
      router.back();
    }
  };

  const features = [
    {
      icon: <Zap size={18} color="#FFD700" />,
      text: "Unlimited Habits & Tasks",
    },
    {
      icon: <Shield size={18} color="#FFD700" />,
      text: "Advanced Insights & Charts",
    },
    { icon: <Crown size={18} color="#FFD700" />, text: "Cloud Backup & Sync" },
    {
      icon: <Diamond size={18} color="#FFD700" />,
      text: "Premium Glass Theme",
    },
  ];

  const PackageCard = ({ pkg }: { pkg: any }) => {
    const meta = iapService.getPackageMetadata(pkg);
    const isSelected = selectedPackage?.identifier === pkg.identifier;

    const IconComponent =
      {
        Zap: Zap,
        Crown: Crown,
        Diamond: Diamond,
        Star: Star,
      }[meta.icon as string] || Star;

    return (
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => setSelectedPackage(pkg)}
        style={[styles.packageCard, isSelected && styles.selectedPackageCard]}
      >
        {meta.badge && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{meta.badge}</Text>
          </View>
        )}
        <View style={styles.cardHeader}>
          <View
            style={[
              styles.cardIconContainer,
              isSelected && styles.selectedCardIcon,
            ]}
          >
            <IconComponent size={24} color={isSelected ? "#fff" : "#FFD700"} />
          </View>
          <View style={styles.cardInfo}>
            <Text style={styles.cardTitle}>{meta.title}</Text>
            <Text style={styles.cardDesc}>{meta.description}</Text>
          </View>
        </View>
        <View style={styles.priceContainer}>
          <Text style={styles.priceText}>{pkg.product.priceString}</Text>
          <Text style={styles.priceSubtext}>
            {pkg.packageType === "WEEKLY"
              ? "/ week"
              : pkg.packageType === "MONTHLY"
                ? "/ month"
                : "/ year"}
          </Text>
        </View>
        {isSelected && (
          <View style={styles.checkIcon}>
            <CheckCircle2 size={20} color="#6366f1" />
          </View>
        )}
      </TouchableOpacity>
    );
  };

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

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.hero}>
            <View style={styles.heroGlow} />
            <Text style={styles.title}>Upgrade to Pro</Text>
            <Text style={styles.subtitle}>
              Unlock the full potential of your productivity journey with our
              premium features.
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

          <View style={styles.packagesWrapper}>
            {offerings?.availablePackages?.map((pkg: any) => (
              <PackageCard key={pkg.identifier} pkg={pkg} />
            ))}
          </View>

          <View style={styles.actionSection}>
            <TouchableOpacity
              style={styles.mainPurchaseButton}
              onPress={handlePurchase}
              disabled={loading || !selectedPackage}
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
                    {selectedPackage?.product?.introPrice
                      ? "Unlock Pro Now 3-Day Free Trial"
                      : "Unlock Pro Now 3-Day Free Trial"}
                  </Text>
                )}
              </LinearGradient>
            </TouchableOpacity>

            <Text style={styles.billingNote}>
              {selectedPackage?.packageType === "LIFETIME"
                ? "One-time payment. Lifetime access."
                : "Cancel anytime in Google Play Store settings."}
            </Text>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Secure transaction powered by Google Play
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>

      {/* Success Modal */}
      <Modal visible={showSuccess} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <LinearGradient
            colors={["#0f172a", "#1e293b"]}
            style={styles.successModal}
          >
            <View style={styles.successIconContainer}>
              <Crown size={60} color="#FFD700" />
            </View>
            <Text style={styles.successTitle}>Welcome to Pro! 🎉</Text>
            <Text style={styles.successMessage}>
              You've successfully unlocked all premium features. Your
              productivity journey just evolved.
            </Text>
            <TouchableOpacity
              style={styles.successButton}
              onPress={() => {
                setShowSuccess(false);
                router.back();
              }}
            >
              <Text style={styles.successButtonText}>Go to Dashboard</Text>
            </TouchableOpacity>
          </LinearGradient>
        </View>
      </Modal>
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
  scrollContent: { paddingHorizontal: 20, paddingBottom: 40 },
  hero: {
    alignItems: "center",
    marginBottom: 32,
    position: "relative",
    marginTop: 24,
  },
  heroGlow: {
    position: "absolute",
    top: -20,
    width: 200,
    height: 100,
    backgroundColor: "#6366f1",
    opacity: 0.15,
    borderRadius: 100,
    transform: [{ scaleX: 1.5 }],
    filter: "blur(40px)",
  },
  title: {
    fontSize: 34,
    fontFamily: "Outfit_700Bold",
    color: "#fff",
    marginBottom: 12,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 15,
    fontFamily: "Outfit_400Regular",
    color: "#94a3b8",
    textAlign: "center",
    lineHeight: 22,
    paddingHorizontal: 10,
  },
  featuresContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 32,
  },
  featureItem: {
    width: "48%",
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    padding: 12,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
  },
  featureIcon: { marginRight: 10 },
  featureText: {
    fontSize: 13,
    fontFamily: "Outfit_500Medium",
    color: "#e2e8f0",
    flex: 1,
  },
  packagesWrapper: { width: "100%", marginBottom: 32 },
  packageCard: {
    width: "100%",
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    padding: 20,
    borderRadius: 20,
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: "rgba(255, 255, 255, 0.08)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    position: "relative",
    overflow: "hidden",
  },
  selectedPackageCard: {
    borderColor: "#6366f1",
    backgroundColor: "rgba(99, 102, 241, 0.08)",
  },
  cardHeader: { flexDirection: "row", alignItems: "center", flex: 1 },
  cardIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "rgba(255, 215, 0, 0.12)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  selectedCardIcon: {
    backgroundColor: "#6366f1",
  },
  cardInfo: { flex: 1 },
  cardTitle: {
    fontSize: 18,
    fontFamily: "Outfit_700Bold",
    color: "#fff",
    marginBottom: 2,
  },
  cardDesc: {
    fontSize: 13,
    fontFamily: "Outfit_400Regular",
    color: "#94a3b8",
  },
  priceContainer: { alignItems: "flex-end" },
  priceText: {
    fontSize: 18,
    fontFamily: "Outfit_700Bold",
    color: "#fff",
  },
  priceSubtext: {
    fontSize: 12,
    fontFamily: "Outfit_400Regular",
    color: "#94a3b8",
  },
  badge: {
    position: "absolute",
    top: 0,
    right: 20,
    backgroundColor: "#FFD700",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
  },
  badgeText: {
    fontSize: 10,
    fontFamily: "Outfit_700Bold",
    color: "#0f172a",
    textTransform: "uppercase",
  },
  checkIcon: {
    marginLeft: 10,
  },
  actionSection: { width: "100%", alignItems: "center" },
  mainPurchaseButton: { width: "100%", marginBottom: 12 },
  gradientButton: {
    paddingVertical: 18,
    borderRadius: 18,
    alignItems: "center",
    shadowColor: "#6366f1",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 10,
  },
  buttonText: { color: "#fff", fontSize: 18, fontFamily: "Outfit_700Bold" },
  billingNote: {
    fontSize: 13,
    fontFamily: "Outfit_400Regular",
    color: "#64748b",
    textAlign: "center",
  },
  footer: { marginTop: 32, opacity: 0.5 },
  footerText: { color: "#94a3b8", fontSize: 12, textAlign: "center" },

  // Success Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.85)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  successModal: {
    width: "100%",
    padding: 32,
    borderRadius: 32,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 215, 0, 0.3)",
  },
  successIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "rgba(255, 215, 0, 0.15)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  successTitle: {
    fontSize: 26,
    fontFamily: "Outfit_700Bold",
    color: "#fff",
    marginBottom: 12,
    textAlign: "center",
  },
  successMessage: {
    fontSize: 16,
    fontFamily: "Outfit_400Regular",
    color: "#94a3b8",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 32,
  },
  successButton: {
    width: "100%",
    backgroundColor: "#fff",
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
  },
  successButtonText: {
    fontSize: 16,
    fontFamily: "Outfit_700Bold",
    color: "#0f172a",
  },
});

export default SubscriptionScreen;
