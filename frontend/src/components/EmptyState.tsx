import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  ImageSourcePropType,
} from "react-native";
import { Colors, Fonts } from "@/src/theme/colors";

interface EmptyStateProps {
  imageSource: ImageSourcePropType;
  message: string;
}

const EmptyState: React.FC<EmptyStateProps> = ({ imageSource, message }) => {
  return (
    <View style={styles.container}>
      <View style={styles.stackWrapper}>
        {/* Shadow/Stack layers */}
        <View style={styles.stackLayer3} />
        <View style={styles.stackLayer2} />

        {/* Top Main Card */}
        <View style={styles.mainCard}>
          <View style={styles.contentRow}>
            <View style={styles.iconContainer}>
              <Image
                source={imageSource}
                style={styles.image}
                resizeMode="contain"
              />
            </View>
            <View style={styles.skeletonContainer}>
              <View style={styles.skeletonBarLong} />
              <View style={styles.skeletonBarShort} />
            </View>
          </View>
        </View>
      </View>
      <Text style={styles.messageText}>{message}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    alignItems: "center",
    width: "100%",
    marginTop: 10,
  },
  stackWrapper: {
    width: "100%",
    height: 110,
    alignItems: "center",
    marginBottom: 20,
  },
  mainCard: {
    width: "100%",
    height: 90,
    backgroundColor: "#fff",
    borderRadius: 24,
    paddingHorizontal: 20,
    justifyContent: "center",
    zIndex: 3,
    // iOS Shadow
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    // Android Shadow
    elevation: 3,
  },
  stackLayer2: {
    position: "absolute",
    bottom: 10,
    width: "92%",
    height: 90,
    backgroundColor: "#fff",
    borderRadius: 24,
    opacity: 0.6,
    zIndex: 2,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.02)",
  },
  stackLayer3: {
    position: "absolute",
    bottom: 0,
    width: "85%",
    height: 90,
    backgroundColor: "#fff",
    borderRadius: 24,
    opacity: 0.3,
    zIndex: 1,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.02)",
  },
  contentRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconContainer: {
    width: 60,
    height: 60,
    marginRight: 15,
  },
  image: {
    width: "100%",
    height: "100%",
  },
  skeletonContainer: {
    flex: 1,
    gap: 8,
  },
  skeletonBarLong: {
    width: "80%",
    height: 10,
    backgroundColor: "#F1F1F1",
    borderRadius: 5,
  },
  skeletonBarShort: {
    width: "50%",
    height: 10,
    backgroundColor: "#F1F1F1",
    borderRadius: 5,
  },
  messageText: {
    fontSize: 15,
    color: "#94a3b8",
    fontFamily: Fonts.medium,
    textAlign: "center",
    paddingHorizontal: 20,
  },
});

export default EmptyState;
