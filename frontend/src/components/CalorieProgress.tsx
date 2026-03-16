import React, { useMemo, useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import {
  Flame,
  TrendingUp,
  Info,
  Scale,
  PieChart,
  User as UserIcon,
} from "lucide-react-native";
import { Colors, Fonts } from "@/src/theme/colors";
import Card from "@/src/components/Card";
import { LinearGradient } from "expo-linear-gradient";
import { G } from "react-native-svg";
import { LineChart } from "react-native-chart-kit";

const { width } = Dimensions.get("window");

interface CalorieProgressProps {
  data: {
    currentWeight: number;
    goalWeight: number;
    bmi: number;
    bmiCategory: string;
    chartData: Array<{ date: string; calories: number }>;
    streak: number;
  };
  onProfilePress?: () => void;
  loading?: boolean;
  onFilterChange?: (days: number) => void;
  activeDays?: number;
}

const Chart = React.memo(
  ({
    data,
    color,
    height = 200,
  }: {
    data: Array<{ date: string; calories: number }>;
    color: string;
    height?: number;
  }) => {
    if (!data || data.length === 0) return null;

    // Transform data for react-native-chart-kit
    const labels = useMemo(() => {
      return data.map((d, i) => {
        const date = new Date(d.date);
        // Show label for first, middle, last to keep it clean
        if (data.length <= 7)
          return date.toLocaleDateString("en-US", { weekday: "short" });
        if (
          i === 0 ||
          i === Math.floor(data.length / 2) ||
          i === data.length - 1
        ) {
          return date.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          });
        }
        return "";
      });
    }, [data]);

    const chartData = useMemo(
      () => ({
        labels,
        datasets: [
          {
            data: data.map((d) => d.calories),
            color: (opacity = 1) => color, // optional
            strokeWidth: 3, // optional
          },
          // Invisible dataset to ensure Y-axis starts from 0
          {
            data: [0],
            withDots: false,
          },
        ],
      }),
      [data, labels, color],
    );

    const chartConfig = useMemo(
      () => ({
        backgroundColor: "#ffffff",
        backgroundGradientFrom: "#ffffff",
        backgroundGradientTo: "#ffffff",
        decimalPlaces: 0,
        color: (opacity = 1) => `rgba(99, 102, 241, ${opacity})`,
        labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity * 0.5})`,
        style: {
          borderRadius: 16,
        },
        propsForDots: {
          r: data.length > 7 ? "0" : "4",
          strokeWidth: "2",
          stroke: color,
        },
        propsForLabels: {
          fontFamily: Fonts.medium,
          fontSize: 10,
        },
        fillShadowGradient: color,
        fillShadowGradientOpacity: 0.2,
        useShadowColorFromDataset: false,
        propsForBackgroundLines: {
          strokeDasharray: "4 4",
          stroke: "#F0F0F0",
        },
      }),
      [data.length, color],
    );

    return (
      <LineChart
        data={chartData}
        width={width - 40}
        height={height}
        chartConfig={chartConfig}
        bezier
        style={{
          marginVertical: 8,
          borderRadius: 16,
          paddingRight: 60, // Increased padding to make more room for labels on the left
        }}
        withHorizontalLines={true}
        withVerticalLines={false}
        withDots={data.length <= 30}
        fromZero={true}
        yAxisLabel=""
        yAxisSuffix=" "
        formatYLabel={(val) => Math.round(Number(val)).toString()}
      />
    );
  },
);

export default function CalorieProgress({
  data,
  onProfilePress,
  loading,
  onFilterChange,
  activeDays = 7,
}: CalorieProgressProps) {
  const filters = [
    { label: "7 Days", days: 7 },
    { label: "30 Days", days: 30 },
    { label: "90 Days", days: 90 },
    { label: "All time", days: 365 },
  ];
  // Logic: 0% if currentWeight is far from goal, 100% if currentWeight <= goalWeight
  // We'll use a 20kg historical range for progress visualization if no startWeight is available
  const weightProgress = Math.max(
    0,
    Math.min(
      1,
      data.currentWeight <= data.goalWeight
        ? 1
        : 1 - Math.min(1, (data.currentWeight - data.goalWeight) / 20),
    ),
  );

  const calorieValues = data.chartData.map((d) => d.calories);
  const chartValues = calorieValues;

  const handleFilter = useCallback(
    (days: number) => {
      onFilterChange?.(days);
    },
    [onFilterChange],
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Progress</Text>
        {/* <TouchableOpacity style={styles.profileBtn} onPress={onProfilePress}>
          <UserIcon color={Colors.text} size={24} />
        </TouchableOpacity> */}
      </View>

      <View style={styles.row}>
        {/* Weight Card */}
        <Card style={styles.halfCard}>
          <Text style={styles.cardLabel}>My Weight</Text>
          <Text style={styles.weightValue}>{data.currentWeight} kg</Text>
          <View style={styles.progressBarBg}>
            <View
              style={[
                styles.progressBarFill,
                { width: `${weightProgress * 100}%` },
              ]}
            />
          </View>
          <Text style={styles.goalText}>Goal {data.goalWeight} kg</Text>
          <View style={styles.divider} />
          <Text style={styles.footerText}>
            {(() => {
              const lastUpdate = new Date(
                (data as any).updatedAt || new Date(),
              );
              const nextWeighIn = new Date(lastUpdate);
              nextWeighIn.setDate(nextWeighIn.getDate() + 7);
              const now = new Date();
              const diffMs = nextWeighIn.getTime() - now.getTime();
              const diffDays = Math.max(
                0,
                Math.ceil(diffMs / (1000 * 60 * 60 * 24)),
              );
              return `Next weigh-in: ${diffDays}d`;
            })()}
          </Text>
        </Card>

        {/* Streak Card */}
        <Card style={styles.halfCard}>
          <View style={styles.streakCenter}>
            <View style={styles.flameGlow}>
              <Flame color="#FFA500" fill="#FFA500" size={40} />
            </View>
            <Text style={styles.streakTitle}>Day streak</Text>
            <Text style={styles.streakValue}>{data.streak}</Text>
          </View>
          <View style={styles.dotRow}>
            {["S", "M", "T", "W", "T", "F", "S"].map((day, i) => (
              <View key={i} style={styles.dotContainer}>
                <Text style={styles.dotLabel}>{day}</Text>
                <View
                  style={[
                    styles.dot,
                    i === new Date().getDay() && styles.activeDot,
                  ]}
                />
              </View>
            ))}
          </View>
        </Card>
      </View>

      {/* Time Filters */}
      <View style={styles.filterRow}>
        {filters.map((f: { label: string; days: number }) => {
          const isActive = activeDays === f.days;
          return (
            <TouchableOpacity
              key={f.label}
              style={[styles.filterTab, isActive && styles.activeTab]}
              onPress={() => handleFilter(f.days)}
            >
              <Text
                style={[styles.filterText, isActive && styles.activeFilterText]}
              >
                {f.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Goal Progress Chart */}
      <Card style={styles.fullCard}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Nutrition Trends</Text>
          <View style={styles.goalBadge}>
            <TrendingUp color={Colors.primary} size={14} />
            <Text style={styles.goalBadgeText}>Live Data</Text>
          </View>
        </View>
        <View style={styles.chartContainer}>
          {loading ? (
            <View>
              <ActivityIndicator size="small" color={Colors.primary} />
              <Text>Loading data...</Text>
            </View>
          ) : (
            <Chart data={data.chartData} color={Colors.primary} height={200} />
          )}
        </View>
        <View style={styles.promoBox}>
          <Text style={styles.promoText}>
            You're consistently hitting your targets! Keep up the great
            momentum.
          </Text>
        </View>
      </Card>

      {/* BMI Card */}
      <Card style={styles.fullCard}>
        <Text style={styles.cardTitle}>Your BMI</Text>
        <View style={styles.bmiDisplay}>
          <Text style={styles.bmiValue}>{data.bmi}</Text>
          <View style={styles.bmiCategoryBadge}>
            <Text style={styles.bmiCategoryText}>
              Your weight is {data.bmiCategory}
            </Text>
          </View>
        </View>
        <View style={styles.bmiGauge}>
          <LinearGradient
            colors={["#4D94FF", "#4CAF50", "#FFB84D", "#FF4D4D"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.gaugeBar}
          />
          <View
            style={[
              styles.gaugeIndicator,
              {
                left: `${Math.max(0, Math.min(100, ((data.bmi - 15) / (40 - 15)) * 100))}%`,
              },
            ]}
          />
        </View>
        <View style={styles.gaugeLabels}>
          <Text style={styles.gaugeLabel}>Underweight</Text>
          <Text style={styles.gaugeLabel}>Healthy</Text>
          <Text style={styles.gaugeLabel}>Overweight</Text>
          <Text style={styles.gaugeLabel}>Obese</Text>
        </View>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: Colors.text,
    fontFamily: Fonts.bold,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    marginTop: 20,
  },
  profileBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(0,0,0,0.05)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.05)",
  },
  row: {
    flexDirection: "row",
    gap: 15,
    marginBottom: 20,
  },
  halfCard: {
    flex: 1,
    padding: 16,
    borderRadius: 24,
    backgroundColor: "#FFF",
    alignItems: "center",
    height: 220,
    justifyContent: "space-between",
  },
  fullCard: {
    width: "100%",
    padding: 20,
    borderRadius: 24,
    backgroundColor: "#FFF",
    marginBottom: 20,
  },
  cardLabel: {
    fontSize: 12,
    color: "rgba(0,0,0,0.5)",
    fontFamily: Fonts.medium,
  },
  weightValue: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#000",
    fontFamily: Fonts.bold,
    marginVertical: 10,
  },
  progressBarBg: {
    width: "100%",
    height: 8,
    backgroundColor: "#F0F0F0",
    borderRadius: 4,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: "#4CAF50",
    borderRadius: 4,
  },
  goalText: {
    fontSize: 12,
    color: "rgba(0,0,0,0.5)",
    marginTop: 8,
  },
  divider: {
    width: "100%",
    height: 1,
    backgroundColor: "#F0F0F0",
    marginVertical: 12,
  },
  footerText: {
    fontSize: 12,
    color: "rgba(0,0,0,0.4)",
  },
  streakCenter: {
    alignItems: "center",
  },
  flameGlow: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "rgba(255, 165, 0, 0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  streakTitle: {
    fontSize: 14,
    color: "#FFA500",
    fontFamily: Fonts.bold,
    marginTop: 10,
  },
  streakValue: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#000",
    fontFamily: Fonts.bold,
  },
  dotRow: {
    flexDirection: "row",
    gap: 6,
    width: "100%",
    justifyContent: "center",
    marginTop: 10,
  },
  dotContainer: {
    alignItems: "center",
  },
  dotLabel: {
    fontSize: 8,
    color: "rgba(0,0,0,0.4)",
    marginBottom: 4,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  activeDot: {
    backgroundColor: "#E0E0E0",
  },
  filterRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "rgba(0,0,0,0.05)",
    padding: 6,
    borderRadius: 16,
    marginBottom: 20,
  },
  filterTab: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  activeTab: {
    backgroundColor: "#FFF",
    elevation: 2,
    shadowOpacity: 0.1,
  },
  filterText: {
    fontSize: 12,
    color: Colors.textMuted,
    fontFamily: Fonts.medium,
  },
  activeFilterText: {
    color: "#000",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#000",
    fontFamily: Fonts.bold,
  },
  goalBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  goalBadgeText: {
    fontSize: 12,
    color: "rgba(0,0,0,0.6)",
    fontFamily: Fonts.medium,
  },
  chartContainer: {
    height: 220,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 0,
    marginLeft: 0, // Removed negative margin to keep labels inside
  },
  promoBox: {
    backgroundColor: "rgba(76, 175, 80, 0.1)",
    padding: 16,
    borderRadius: 16,
    marginTop: 20,
  },
  promoText: {
    color: "#2E7D32",
    fontSize: 12,
    textAlign: "center",
    fontFamily: Fonts.medium,
    lineHeight: 18,
  },
  bmiDisplay: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 10,
    marginVertical: 15,
  },
  bmiValue: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#000",
    fontFamily: Fonts.bold,
  },
  bmiCategoryBadge: {
    backgroundColor: "#4CAF50",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  bmiCategoryText: {
    color: "#FFF",
    fontSize: 12,
    fontWeight: "bold",
  },
  bmiGauge: {
    width: "100%",
    height: 8,
    borderRadius: 4,
    position: "relative",
    marginVertical: 10,
  },
  gaugeBar: {
    width: "100%",
    height: "100%",
    borderRadius: 4,
  },
  gaugeIndicator: {
    position: "absolute",
    top: -4,
    width: 2,
    height: 16,
    backgroundColor: "#000",
  },
  gaugeLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },
  gaugeLabel: {
    fontSize: 9,
    color: "rgba(0,0,0,0.4)",
    fontFamily: Fonts.medium,
  },
});
