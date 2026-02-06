import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  TextInput,
} from "react-native";
import { Camera, Search, Utensils, Info, ImagePlus } from "lucide-react-native";
import * as ImagePicker from "expo-image-picker";
import { Colors } from "@/src/theme/colors";
import Card from "@/src/components/Card";

export default function CalorieScreen() {
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isFetching, setIsFetching] = useState(false);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);

  const getNutriscoreColor = (grade: string) => {
    switch (grade.toLowerCase()) {
      case "a":
        return "#038141";
      case "b":
        return "#85BB2F";
      case "c":
        return "#FECB02";
      case "d":
        return "#EE8100";
      case "e":
        return "#E63E11";
      default:
        return Colors.textMuted;
    }
  };

  const takePhoto = async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();

    if (permissionResult.granted === false) {
      alert("You've refused to allow this app to access your camera!");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
      // For Open Food Facts, we usually need a barcode.
      // Since this is a "Calorie Meter" taking an image,
      // we'll simulate a search for now or provide an info placeholder
      // until the user specifies if they want barcode scanning.
      searchProduct("Generic Food");
    }
  };

  const pickImage = async () => {
    const permissionResult =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (permissionResult.granted === false) {
      alert("You've refused to allow this app to access your gallery!");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
      searchProduct("Generic Food");
    }
  };

  const searchProduct = async (query: string) => {
    if (!query || isFetching) return;
    try {
      if (!hasLoadedOnce) setLoading(true);
      setIsFetching(true);
      setProducts([]);

      // Open Food Facts Search API - increased page_size to 24
      const response = await fetch(
        `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(query)}&json=1&page_size=24`,
      );
      const data = await response.json();
      console.log("Found products:", data.products?.length);

      if (data.products && data.products.length > 0) {
        setProducts(data.products);
        setHasLoadedOnce(true);
      } else {
        alert("No products found on Open Food Facts for this search.");
      }
    } catch (error) {
      console.error(error);
      alert("Error fetching food info.");
    } finally {
      setLoading(false);
      setIsFetching(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Calorie Meter</Text>
          <Text style={styles.subtitle}>
            Identify food and track nutrition.
          </Text>
        </View>

        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Search color={Colors.textMuted} size={20} />
            <TextInput
              style={styles.input}
              placeholder="Search food (e.g. Apple, Pizza)"
              placeholderTextColor={Colors.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={() => searchProduct(searchQuery)}
            />
          </View>
        </View>

        <View style={styles.actionRow}>
          <Card
            style={[
              styles.actionCard,
              image && { padding: 0, overflow: "hidden" },
            ]}
          >
            <TouchableOpacity style={styles.actionBtn} onPress={takePhoto}>
              {image ? (
                <Image source={{ uri: image }} style={styles.previewImage} />
              ) : (
                <View style={styles.placeholder}>
                  <Camera color={Colors.primary} size={32} />
                  <Text style={styles.placeholderText}>Camera</Text>
                </View>
              )}
            </TouchableOpacity>
          </Card>

          {!image && (
            <Card style={styles.actionCard}>
              <TouchableOpacity style={styles.actionBtn} onPress={pickImage}>
                <View style={styles.placeholder}>
                  <ImagePlus color={Colors.secondary} size={32} />
                  <Text style={styles.placeholderText}>Gallery</Text>
                </View>
              </TouchableOpacity>
            </Card>
          )}
        </View>

        {image && (
          <TouchableOpacity
            style={styles.resetBtn}
            onPress={() => {
              setImage(null);
              setProducts([]);
            }}
          >
            <Text style={styles.resetText}>Clear Image</Text>
          </TouchableOpacity>
        )}

        {loading && (
          <View style={styles.loadingContent}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={{ color: Colors.textMuted, marginTop: 12 }}>
              Loading data...
            </Text>
          </View>
        )}

        {products.map((product, index) => (
          <Card key={product.id || index} style={styles.resultCard}>
            <View style={styles.resultHeader}>
              {product.image_url ? (
                <Image
                  source={{ uri: product.image_url }}
                  style={styles.productImage}
                />
              ) : (
                <View style={styles.productImagePlaceholder}>
                  <Utensils color={Colors.textMuted} size={20} />
                </View>
              )}
              <View style={styles.productNameContainer}>
                <Text style={styles.productName} numberOfLines={2}>
                  {product.product_name || "Unknown Product"}
                </Text>
                {product.brands && (
                  <Text style={styles.brandName}>{product.brands}</Text>
                )}
                {product.nutriscore_grade && (
                  <View
                    style={[
                      styles.scoreBadge,
                      {
                        backgroundColor: getNutriscoreColor(
                          product.nutriscore_grade,
                        ),
                      },
                    ]}
                  >
                    <Text style={styles.scoreText}>
                      Nutriscore {product.nutriscore_grade.toUpperCase()}
                    </Text>
                  </View>
                )}
              </View>
            </View>

            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Calories</Text>
                <Text style={styles.statValue}>
                  {product.nutriments?.["energy-kcal_100g"] || 0} kcal
                </Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Proteins</Text>
                <Text style={styles.statValue}>
                  {product.nutriments?.proteins_100g || 0}g
                </Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Carbs</Text>
                <Text style={styles.statValue}>
                  {product.nutriments?.carbohydrates_100g || 0}g
                </Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Fats</Text>
                <Text style={styles.statValue}>
                  {product.nutriments?.fat_100g || 0}g
                </Text>
              </View>
            </View>

            <View style={styles.infoNote}>
              <Info color={Colors.textMuted} size={14} />
              <Text style={styles.infoText}>
                Per 100g | {product.quantity || "No qty info"}
              </Text>
            </View>
          </Card>
        ))}

        {products.length === 0 && !loading && !image && (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              Upload or search to see nutritional info
            </Text>
          </View>
        )}
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
    paddingBottom: 40,
  },
  header: {
    marginBottom: 24,
    marginTop: 20,
  },
  title: {
    color: Colors.text,
    fontSize: 28,
    fontWeight: "bold",
  },
  subtitle: {
    color: Colors.textMuted,
    fontSize: 14,
    marginTop: 4,
  },
  searchContainer: {
    marginBottom: 20,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.card,
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 50,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  input: {
    flex: 1,
    color: Colors.text,
    marginLeft: 10,
    fontSize: 16,
  },
  actionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  actionCard: {
    flex: 1,
    height: 120,
    marginHorizontal: 5,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(138, 43, 226, 0.05)",
    borderStyle: "dashed",
    borderWidth: 1.5,
  },
  actionBtn: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  placeholder: {
    alignItems: "center",
  },
  placeholderText: {
    color: Colors.textMuted,
    marginTop: 8,
    fontSize: 14,
    fontWeight: "500",
  },
  previewImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  resetBtn: {
    alignSelf: "center",
    marginBottom: 20,
  },
  resetText: {
    color: Colors.primary,
    fontWeight: "600",
    fontSize: 14,
  },

  resultCard: {
    marginTop: 16,
    padding: 16,
  },
  resultHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  productImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  productImagePlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  productNameContainer: {
    flex: 1,
    marginLeft: 12,
  },
  productName: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: "bold",
  },
  brandName: {
    color: Colors.secondary,
    fontSize: 12,
    marginTop: 2,
  },
  scoreBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 6,
  },
  scoreText: {
    color: "#FFF",
    fontSize: 10,
    fontWeight: "bold",
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  statItem: {
    width: "45%",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
    alignItems: "center",
  },
  statLabel: {
    color: Colors.textMuted,
    fontSize: 12,
    marginBottom: 4,
  },
  statValue: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: "bold",
  },
  infoNote: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
    opacity: 0.7,
  },
  infoText: {
    color: Colors.textMuted,
    fontSize: 11,
    marginLeft: 6,
  },
  emptyContainer: {
    marginTop: 60,
    alignItems: "center",
  },
  emptyText: {
    color: Colors.textMuted,
    fontSize: 14,
    fontStyle: "italic",
  },
  loadingContent: {
    padding: 40,
    alignItems: "center",
  },
});
