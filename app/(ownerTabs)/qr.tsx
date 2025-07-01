// app/(ownerTabs)/qr.tsx
import { useEffect, useState } from "react";
import { View, Text, Alert, Button, Share } from "react-native";
import QRCode from "react-native-qrcode-svg";
import { useRouter, useLocalSearchParams } from "expo-router";
import Clipboard from "expo-clipboard";
import { getAuth } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/firebaseConfig";

export default function OwnerQRScreen() {
  const [shopLink, setShopLink] = useState("null");
  const [shopName, setShopName] = useState("null");
  const router = useRouter();

  useEffect(() => {
    fetchProducts();
  }, []);
  ``;
  const fetchProducts = async () => {
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) return;

    try {
      const docRef = doc(db, "owners", user.uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setShopLink(docSnap.data().shopLink);
        setShopName(docSnap.data().name);
      }
    } catch (error) {
      console.error("Error fetching products:", error);
    }
  };

  const copyLink = async () => {
    await Clipboard.setStringAsync(shopLink);
    Alert.alert("Copied", "Shop link copied to clipboard");
  };

  const shareLink = async () => {
    await Share.share({
      message: `Check out my shop "${shopName}": ${shopLink}`,
    });
  };

  return (
    <View className="flex-1 justify-center items-center bg-white p-4">
      <Text className="text-lg font-semibold mb-4">Scan to Join:</Text>
      <QRCode value={shopLink} size={200} />
      <View className="flex-row space-x-4 mt-6">
        <Button title="Copy Link" onPress={copyLink} />
        <Button title="Share" onPress={shareLink} />
      </View>
      <View className="mt-6">
        <Button title="Back" onPress={() => router.back()} />
      </View>
    </View>
  );
}
