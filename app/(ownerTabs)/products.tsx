import { LinearGradient } from "expo-linear-gradient";
import { getAuth } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import { Alert, Image, ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { db } from "../../firebaseConfig";
import Icon from "react-native-vector-icons/MaterialIcons";

export default function CustomersScreen() {
  const [productName, setProductName] = useState("");
  const [price, setPrice] = useState("");
  const [selectedIcon, setSelectedIcon] = useState<string | null>(null);
  const [products, setProducts] = useState<any[]>([]);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) return;

    try {
      const docRef = doc(db, "products", user.uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const items = docSnap.data().products || [];
        const formatted = items.map((item: any) => ({
          ...item,
          price: `₹${item.price}`,
        }));
        setProducts(formatted);
      }
    } catch (error) {
      console.error("Error fetching products:", error);
    }
  };

  async function addProduct() {
    if (!productName || !price) return;

    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) return;

    const docRef = doc(db, "products", user.uid);
    const newProduct = {
      id: Date.now().toString(),
      name: productName,
      price: Number(price),
      createdAt: new Date(),
    };

    try {
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const prevProducts = docSnap.data().products || [];
        await setDoc(docRef, {
          products: [...prevProducts, newProduct],
        });
      } else {
        await setDoc(docRef, {
          products: [newProduct],
        });
      }

      setProducts((prev) => [
        ...prev,
        {
          ...newProduct,
          price: `₹${price}`,
        },
      ]);

      setProductName("");
      setPrice("");
    } catch (e) {
      console.error("Error adding product:", e);
    }
  }

  async function deleteProduct(id: string) {
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) return;

    const docRef = doc(db, "products", user.uid);
    try {
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const updatedProducts = (docSnap.data().products || []).filter((p: any) => p.id !== id);
        await setDoc(docRef, { products: updatedProducts });

        const formatted = updatedProducts.map((p: any) => ({
          ...p,
          price: `₹${p.price}`,
        }));
        setProducts(formatted);
      }
    } catch (error) {
      console.error("Error deleting product:", error);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-[#F7F7F7]">
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        {/* Header */}
        <View className="flex-row justify-between items-center mb-6">
          <View className="flex-row items-center">
            <Icon name="storefront" size={30} color="#4B82F6" />
            <Text className="text-xl font-bold text-gray-900 ml-2">ShopMunim</Text>
          </View>
          <TouchableOpacity>
            <Icon name="notifications-active" size={30} color="#3B82F6" />
          </TouchableOpacity>
        </View>

        {/* Title */}
        <View className="flex-row items-center mb-6">
          <Text className="text-xl font-bold text-gray-900">Products</Text>
        </View>

        {/* Add Product Form */}
        <Text className="text-gray-500 mb-2">Manage all your shop's products and prices</Text>
        <View className="bg-white rounded-xl p-4 mb-6">
          <Text className="text-gray-700 text-lg font-bold mb-4">+ Add New Product</Text>

          <Text className="text-gray-400 mb-2 text-sm">Product Name</Text>
          <TextInput
            placeholder="e.g. Tea"
            value={productName}
            onChangeText={setProductName}
            className="border border-gray-300 rounded-lg px-3 py-3 mb-3 text-gray-700"
          />

          <Text className="text-gray-400 mb-2 text-sm">Price (₹)</Text>
          <TextInput
            placeholder="e.g. 10"
            value={price}
            onChangeText={setPrice}
            keyboardType="numeric"
            className="border border-gray-300 rounded-lg px-3 py-3 mb-3 text-gray-700"
          />

          <TouchableOpacity onPress={addProduct} className="rounded-lg overflow-hidden">
            <LinearGradient
              colors={["#3b82f6", "#8b5cf6"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              className="py-3 rounded-lg mb-4 mt-3"
            >
              <Text className="text-center text-white font-semibold">Add Product</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Products List */}
        <Text className="text-gray-700 font-semibold mb-2">Your Products</Text>
        {products.map((p) => (
          <View
            key={p.id}
            className="flex-row items-center bg-white p-3 rounded-xl mb-1.5 shadow-sm"
          >
            <View className="flex-1">
              <Text className="text-base text-gray-900 font-medium">{p.name}</Text>
            </View>
            <Text className="text-base text-gray-500 mr-4">{p.price}</Text>
            <TouchableOpacity
              onPress={() =>
                Alert.alert("Delete Product", `Are you sure you want to delete "${p.name}"?`, [
                  { text: "Cancel", style: "cancel" },
                  { text: "Delete", style: "destructive", onPress: () => deleteProduct(p.id) },
                ])
              }
              className="mx-1"
            >
              <Icon name="delete-forever" size={30} color="#EF4444" />
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
