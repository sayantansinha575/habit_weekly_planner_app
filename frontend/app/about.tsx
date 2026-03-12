import React from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Image,
  Linking,
} from "react-native";
import { ChevronLeft, Diamond, Github, Globe, Mail } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Colors, Fonts } from "@/src/theme/colors";
import { useRouter } from "expo-router";
import Card from "@/src/components/Card";

export default function AboutScreen() {
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
        <Text style={styles.headerTitle}>About Us</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.logoSection}>
          <View style={styles.logoContainer}>
            <Image
              source={require("../assets/images/AppIcons/appstore.png")}
              style={{ width: "100%", height: "100%" }}
              resizeMode="contain"
            />
          </View>
          <Text style={styles.appName}>Weekora</Text>
          <Text style={styles.appVersion}>Version 1.0.0</Text>
        </View>

        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>Our Mission</Text>
          <Text style={styles.description}>
            Weekora is designed to help you build your best self, one day at a
            time. We believe that small, consistent habits lead to massive
            transformations. Our tool combines intuitive planning with
            AI-powered health tracking to give you a holistic view of your
            progress.
          </Text>
        </Card>

        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>Connect With Us</Text>
          <TouchableOpacity
            style={styles.linkRow}
            onPress={() => Linking.openURL("https://zruit.in/")}
          >
            <Globe size={20} color={Colors.primary} />
            <Text style={styles.linkText}>Visit Website</Text>
          </TouchableOpacity>
          <View style={styles.separator} />
          {/* <TouchableOpacity style={styles.linkRow}>
            <Github size={20} color={Colors.primary} />
            <Text style={styles.linkText}>GitHub Repository</Text>
          </TouchableOpacity> */}
          <View style={styles.separator} />
          <TouchableOpacity
            style={styles.linkRow}
            onPress={() => Linking.openURL("mailto:Support@weekora.ai")}
          >
            <Mail size={20} color={Colors.primary} />
            <Text style={styles.linkText}>Support Email</Text>
          </TouchableOpacity>
        </Card>

        <Text style={styles.footerText}>
          © 2026 Weekora. All rights reserved.
        </Text>
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
    alignItems: "center",
  },
  logoSection: {
    alignItems: "center",
    marginVertical: 30,
  },
  logoContainer: {
    width: 100,
    height: 100,
    borderRadius: 30,
    overflow: "hidden",
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  logoGradient: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  appName: {
    fontSize: 28,
    fontFamily: Fonts.bold,
    color: Colors.text,
    marginTop: 15,
  },
  appVersion: {
    fontSize: 14,
    fontFamily: Fonts.medium,
    color: Colors.textMuted,
    marginTop: 5,
  },
  card: {
    width: "100%",
    backgroundColor: "#FFF",
    borderRadius: 24,
    padding: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: Fonts.bold,
    color: Colors.text,
    marginBottom: 12,
  },
  description: {
    fontSize: 15,
    fontFamily: Fonts.regular,
    color: Colors.textMuted,
    lineHeight: 22,
  },
  linkRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    gap: 12,
  },
  linkText: {
    fontSize: 16,
    fontFamily: Fonts.medium,
    color: Colors.text,
  },
  separator: {
    height: 1,
    backgroundColor: "rgba(0,0,0,0.05)",
  },
  footerText: {
    fontSize: 12,
    fontFamily: Fonts.regular,
    color: Colors.textMuted,
    marginTop: 10,
    marginBottom: 30,
  },
});
