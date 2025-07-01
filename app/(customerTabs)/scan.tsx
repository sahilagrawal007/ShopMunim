import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Alert,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
} from "react-native";
import { CameraView, Camera } from "expo-camera";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { auth } from "../../firebaseConfig"; // Import Firebase auth directly
import { joinShopByLink, handleJoinResult } from "../../utils/shopUtils";
import { BarCodeScannerResult } from "expo-barcode-scanner";

const { width } = Dimensions.get("window");

export default function ScanScreen() {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);
  const [loading, setLoading] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const router = useRouter();

  // Get current user from Firebase Auth directly
  const currentUser = auth.currentUser;

  useEffect(() => {
    getCameraPermissions();
  }, []);

  const getCameraPermissions = async () => {
    const { status } = await Camera.requestCameraPermissionsAsync();
    setHasPermission(status === "granted");
  };

  const handleBarCodeScanned = async ({ data }: BarCodeScannerResult) => {
    if (scanned || loading) return;

    if (!currentUser) {
      Alert.alert("Authentication Error", "Please log in to join shops.");
      router.back();
      return;
    }

    setScanned(true);
    setLoading(true);

    try {
      if (!data || typeof data !== "string") {
        Alert.alert("Invalid QR Code", "The scanned QR code does not contain valid data.");
        resetScanner();
        return;
      }

      const result = await joinShopByLink(data.trim(), currentUser.uid);

      handleJoinResult(result, () => {
        router.back();
      });
    } catch (error) {
      console.error("Error processing QR code:", error);
      Alert.alert("Error", "Failed to process the QR code. Please try again.");
    } finally {
      setLoading(false);
      if (!scanned) resetScanner();
    }
  };

  const resetScanner = () => {
    setScanned(false);
    setLoading(false);
  };

  const handleImagePicker = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (status !== "granted") {
        Alert.alert("Permission Denied", "We need camera roll permissions to select QR images.");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1,
      });

      if (!result.canceled) {
        Alert.alert(
          "Image Selected",
          "QR code reading from images is not yet implemented. Please use camera scanning instead."
        );
        // TODO: Implement QR reading from image using a library like react-native-qrcode-scanner
      }
    } catch (error) {
      console.error("Error picking image:", error);
      Alert.alert("Error", "Failed to pick image. Please try again.");
    }
  };

  if (hasPermission === null) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#0066cc" />
        <Text style={styles.loadingText}>Requesting camera permission...</Text>
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>No access to camera</Text>
        <TouchableOpacity style={styles.button} onPress={getCameraPermissions}>
          <Text style={styles.buttonText}>Grant Camera Permission</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Scan Shop QR Code</Text>
        <Text style={styles.subtitle}>Point your camera at a shop QR code</Text>
      </View>

      <View style={styles.cameraContainer}>
        <CameraView
          style={styles.camera}
          facing="back"
          onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
          onCameraReady={() => setCameraReady(true)}
          barcodeScannerSettings={{
            barcodeTypes: ["qr"],
          }}
        >
          <View style={styles.overlay}>
            <View style={styles.unfocusedContainer}>
              <View style={styles.middleContainer}>
                <View style={styles.focusedContainer}>
                  {loading && (
                    <View style={styles.loadingOverlay}>
                      <ActivityIndicator size="large" color="#fff" />
                      <Text style={styles.loadingText}>Processing...</Text>
                    </View>
                  )}
                </View>
              </View>
            </View>
          </View>
        </CameraView>
      </View>

      <View style={styles.bottomContainer}>
        {scanned && (
          <TouchableOpacity
            style={[styles.button, styles.scanAgainButton]}
            onPress={resetScanner}
            disabled={loading}
          >
            <Text style={styles.buttonText}>Scan Again</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[styles.button, styles.imageButton]}
          onPress={handleImagePicker}
          disabled={loading}
        >
          <Text style={styles.buttonText}>Select from Gallery</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.backButton]}
          onPress={() => router.back()}
          disabled={loading}
        >
          <Text style={styles.backButtonText}>Back to Shops</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  header: {
    padding: 20,
    paddingTop: 60,
    backgroundColor: "#fff",
    alignItems: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
  },
  cameraContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  camera: {
    width: width,
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  unfocusedContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  middleContainer: {
    width: 250,
    height: 250,
    justifyContent: "center",
    alignItems: "center",
  },
  focusedContainer: {
    width: 200,
    height: 200,
    borderWidth: 2,
    borderColor: "#fff",
    borderRadius: 12,
    backgroundColor: "transparent",
    justifyContent: "center",
    alignItems: "center",
  },
  loadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 12,
  },
  bottomContainer: {
    backgroundColor: "#fff",
    padding: 20,
    paddingBottom: 40,
  },
  button: {
    backgroundColor: "#0066cc",
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 10,
  },
  scanAgainButton: {
    backgroundColor: "#28a745",
  },
  imageButton: {
    backgroundColor: "#6c757d",
  },
  backButton: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#0066cc",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  backButtonText: {
    color: "#0066cc",
    fontSize: 16,
    fontWeight: "600",
  },
  errorText: {
    fontSize: 18,
    color: "#ff6b6b",
    textAlign: "center",
    marginBottom: 20,
  },
  loadingText: {
    fontSize: 16,
    color: "#fff",
    textAlign: "center",
    marginTop: 10,
  },
});
