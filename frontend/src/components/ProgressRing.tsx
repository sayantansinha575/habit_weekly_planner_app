import React from "react";
import { View, Text, StyleSheet } from "react-native";
import Svg, { Circle } from "react-native-svg";
import { Colors, Fonts } from "../theme/colors";

interface ProgressRingProps {
  progress: number; // 0 to 1
  size?: number;
  strokeWidth?: number;
  color?: string;
  label?: string;
  subLabel?: string;
  centerText?: string;
  textColor?: string;
  labelColor?: string;
  children?: React.ReactNode;
}

const ProgressRing = ({
  progress,
  size = 80,
  strokeWidth = 8,
  color = Colors.primary,
  label,
  subLabel,
  centerText,
  textColor,
  labelColor,
  children,
}: ProgressRingProps) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - progress * circumference;

  return (
    <View style={styles.container}>
      <View style={{ width: size, height: size }}>
        <Svg width={size} height={size}>
          {/* Background Circle */}
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="rgba(255,255,255,0.1)"
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          {/* Progress Circle */}
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={color}
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        </Svg>
        <View style={[StyleSheet.absoluteFill, styles.centerContent]}>
          {children ? (
            children
          ) : (
            <Text
              style={[
                styles.centerText,
                textColor ? { color: textColor } : null,
              ]}
            >
              {centerText || `${Math.round(progress * 100)}%`}
            </Text>
          )}
        </View>
      </View>
      {label && (
        <Text
          style={[
            styles.label,
            labelColor
              ? { color: labelColor }
              : textColor
                ? { color: textColor }
                : null,
          ]}
        >
          {label}
        </Text>
      )}
      {subLabel && <Text style={styles.subLabel}>{subLabel}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
  },
  centerContent: {
    alignItems: "center",
    justifyContent: "center",
  },
  centerText: {
    fontSize: 16,
    fontWeight: "bold",
    color: Colors.text,
    fontFamily: Fonts.bold,
  },
  label: {
    fontSize: 12,
    color: Colors.text,
    fontWeight: "600",
    marginTop: 8,
    fontFamily: Fonts.semiBold,
  },
  subLabel: {
    fontSize: 10,
    color: Colors.textMuted,
    marginTop: 2,
    fontFamily: Fonts.regular,
  },
});

export default ProgressRing;
