import { useRoute } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { addDoc, collection, doc, getDoc } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import { Alert, ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";
import { db } from "../../firebaseConfig";

interface RouteParams {
  customerId: string;
  shopId: string;
}

interface Product {
  id: string;
  name: string;
  price: number;
}

const AddTransaction: React.FC = () => {
  const route = useRoute();
  const router = useRouter();
  const { customerId, shopId } = route.params as RouteParams;

  const [products, setProducts] = useState<Product[]>([]);
  const [quantities, setQuantities] = useState<{ [productId: string]: number }>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const ownerId = shopId; // Assuming shopId is ownerId, adjust if needed
      const docRef = doc(db, "products", ownerId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const items = docSnap.data().products || [];
        setProducts(items.map((item: any) => ({ ...item, price: Number(item.price) })));
      }
    } catch (error) {
      Alert.alert("Error", "Failed to fetch products.");
    }
  };

  const handleQuantityChange = (productId: string, value: string) => {
    const qty = Math.max(0, parseInt(value) || 0);
    setQuantities((prev) => ({ ...prev, [productId]: qty }));
  };

  const totalAmount = products.reduce(
    (sum, product) => sum + (quantities[product.id] || 0) * product.price,
    0
  );

  const handleSubmit = async () => {
    if (totalAmount <= 0) {
      Alert.alert("Error", "Please enter quantity for at least one product.");
      return;
    }
    setSubmitting(true);
    const productDetails = products
      .filter((p) => quantities[p.id] > 0)
      .map((p) => `${p.name} x${quantities[p.id]}`)
      .join(", ");
    try {
      await addDoc(collection(db, "transactions"), {
        shopId,
        customerId,
        amount: totalAmount,
        type: "due",
        description: productDetails,
        createdAt: new Date().toISOString(),
      });
      Alert.alert("Success", "Transaction added successfully.", [
        {
          text: "OK",
          onPress: () => {
            // Navigate back to CustomerProfile with refresh flag
            router.back();
          }
        }
      ]);
    } catch (e) {
      Alert.alert("Error", "Failed to add transaction.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollView className="flex-1 bg-[#F7F7F7] p-4">
      <Text className="text-xl font-bold mb-4">Add Transaction</Text>
      <Text className="text-base font-semibold mb-2">Select Products</Text>
      {products.length === 0 ? (
        <Text>No products found.</Text>
      ) : (
        products.map((product) => (
          <View key={product.id} className="flex-row items-center mb-3">
            <Text className="flex-1 text-gray-800">{product.name} (₹{product.price})</Text>
            <TextInput
              className="border border-gray-300 rounded px-2 py-1 w-16 text-center"
              keyboardType="numeric"
              value={quantities[product.id]?.toString() || ""}
              onChangeText={(val) => handleQuantityChange(product.id, val)}
              placeholder="0"
            />
          </View>
        ))
      )}
      <Text className="text-lg font-bold mt-4">Total: ₹{totalAmount}</Text>
      <TouchableOpacity
        className="bg-blue-500 rounded-lg py-3 mt-6"
        onPress={handleSubmit}
        disabled={submitting || totalAmount <= 0}
      >
        <Text className="text-white text-center font-bold text-lg">
          {submitting ? "Submitting..." : "Submit Transaction"}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

export default AddTransaction; 