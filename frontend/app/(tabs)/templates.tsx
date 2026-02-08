import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import {
  GraduationCap,
  Briefcase,
  Dumbbell,
  Zap,
  ChevronRight,
} from "lucide-react-native";
import { Colors, Fonts } from "@/src/theme/colors";
import Card from "@/src/components/Card";
import { storage } from "@/src/utils/storage";
import { Alert } from "react-native";

const ICON_MAP: any = {
  GraduationCap,
  Briefcase,
  Dumbbell,
  Zap,
};

export default function TemplatesScreen() {
  const TEST_USER_ID = "user-123";
  const [templates, setTemplates] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [hasLoadedOnce, setHasLoadedOnce] = React.useState(false);
  const [isFetching, setIsFetching] = React.useState(false);

  const fetchTemplates = React.useCallback(async () => {
    if (isFetching) return;
    try {
      if (!hasLoadedOnce) setLoading(true);
      setIsFetching(true);
      const data = await storage.getTemplates();
      setTemplates(data);
      setHasLoadedOnce(true);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setIsFetching(false);
    }
  }, [hasLoadedOnce, isFetching]);

  React.useEffect(() => {
    fetchTemplates();
  }, []);

  const handleApply = async (templateId: string, title: string) => {
    Alert.alert(
      "Apply Template",
      `Add all tasks from "${title}" to your plan for today?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Apply",
          onPress: async () => {
            try {
              await storage.applyTemplate(TEST_USER_ID, templateId);
              Alert.alert("Success", "Template applied! Check your planner.");
            } catch (e) {
              Alert.alert("Error", "Failed to apply template.");
            }
          },
        },
      ],
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View
          style={[
            styles.container,
            { flex: 1, justifyContent: "center", alignItems: "center" },
          ]}
        >
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={{ color: Colors.textMuted, marginTop: 12 }}>
            Loading templates...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Weekly Templates</Text>
          <Text style={styles.subtitle}>
            Setup your entire week in one tap.
          </Text>
        </View>

        {templates.map((template) => {
          const Icon = ICON_MAP[template.icon] || Zap;
          const color = template.color || Colors.primary;
          return (
            <TouchableOpacity
              key={template.id}
              onPress={() => handleApply(template.id, template.title)}
            >
              <Card style={styles.templateCard}>
                <View style={styles.iconContainer}>
                  <View
                    style={[styles.iconBg, { backgroundColor: `${color}20` }]}
                  >
                    <Icon color={color} size={28} />
                  </View>
                  <View style={styles.templateInfo}>
                    <Text style={styles.templateTitle}>{template.title}</Text>
                    <Text style={styles.templateDescription}>
                      {template.description}
                    </Text>
                  </View>
                  <ChevronRight color={Colors.textMuted} size={20} />
                </View>
              </Card>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  container: {
    padding: 20,
  },
  header: {
    marginBottom: 24,
    marginTop: 20,
  },
  title: {
    color: Colors.text,
    fontSize: 28,
    fontWeight: "bold",
    fontFamily: Fonts.bold,
  },
  subtitle: {
    color: Colors.textMuted,
    fontSize: 14,
    marginTop: 4,
    fontFamily: Fonts.regular,
  },
  templateCard: {
    padding: 12,
  },
  iconContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconBg: {
    width: 60,
    height: 60,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "rgb(237, 232, 234)",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  templateInfo: {
    flex: 1,
    marginLeft: 16,
  },
  templateTitle: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: "700",
    fontFamily: Fonts.bold,
  },
  templateDescription: {
    color: Colors.textMuted,
    fontSize: 12,
    marginTop: 2,
    fontWeight: "500",
    fontFamily: Fonts.medium,
  },
});
