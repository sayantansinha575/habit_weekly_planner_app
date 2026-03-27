import React from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { ChevronLeft, ShieldCheck } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Colors, Fonts } from "@/src/theme/colors";
import { useRouter } from "expo-router";
import Card from "@/src/components/Card";

export default function PrivacyScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safeArea}>
      <LinearGradient
        colors={["#E3F2FD", "#F3E5F5", "#FCE4EC"]}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ChevronLeft color={Colors.text} size={28} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Privacy Policy</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.iconContainer}>
          <ShieldCheck size={60} color={Colors.primary} />
        </View>

        <Card style={styles.card}>
          <Text style={styles.lastUpdated}>Last Updated: March 2026</Text>

          <Text style={styles.sectionTitle}>1. Data Collection</Text>
          <Text style={styles.text}>
            We collect information you provide directly to us, such as your
            profile details (weight, height, goals) and your daily task data.
            This data is used to provide a personalized experience and AI-driven
            insights.
          </Text>

          <Text style={styles.sectionTitle}>2. Data Usage</Text>
          <Text style={styles.text}>
            Your data is stored securely and used solely for the purpose of
            helping you track your habits and calorie intake. We do not sell
            your personal information to third parties.
          </Text>

          <Text style={styles.sectionTitle}>3. Security</Text>
          <Text style={styles.text}>
            We use industry-standard security measures, including encryption and
            secure authentication via Supabase, to protect your data from
            unauthorized access.
          </Text>

          <Text style={styles.sectionTitle}>4. Your Rights</Text>
          <Text style={styles.text}>
            You have the right to access, update, or delete your account and
            associated data at any time through the profile settings.
          </Text>

          <Text style={styles.sectionTitle}>5. Contact Us</Text>
          <Text style={styles.text}>
            If you have any questions about this Privacy Policy, please contact
            us at The email address is Support@weekora.ai
          </Text>
        </Card>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: Fonts.bold,
    color: Colors.text,
    marginTop: 17,
  },
  backBtn: {
    padding: 4,
  },
  container: {
    padding: 20,
  },
  iconContainer: {
    alignItems: "center",
    marginVertical: 20,
  },
  card: {
    backgroundColor: "#FFF",
    borderRadius: 24,
    padding: 24,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  lastUpdated: {
    fontSize: 12,
    fontFamily: Fonts.medium,
    color: Colors.textMuted,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: Fonts.bold,
    color: Colors.text,
    marginTop: 15,
    marginBottom: 8,
  },
  text: {
    fontSize: 15,
    fontFamily: Fonts.regular,
    color: Colors.textMuted,
    lineHeight: 24,
  },
});
