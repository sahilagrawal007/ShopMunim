import { iconMap } from "@/constants/iconMap";
import { useRoute } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { getAuth } from "firebase/auth";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Feather from "react-native-vector-icons/Feather";
import { db } from "../../firebaseConfig";

interface RouteParams {
  shopId: string;
}

const JoinedShopDetails: React.FC = () => {
  const route = useRoute();
  const router = useRouter();
  const { shopId } = route.params as RouteParams;

  const [products, setProducts] = useState<any[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [shopDetails, setShopDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showAllProducts, setShowAllProducts] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchData();
  }, [shopId]);

  useEffect(() => {
    // Filter products based on search query
    const filtered = products.filter(product =>
      product.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredProducts(filtered);
  }, [products, searchQuery]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch shop details
      const shopDoc = await getDoc(doc(db, "shops", shopId));
      if (shopDoc.exists()) {
        setShopDetails({ id: shopDoc.id, ...shopDoc.data() });
      }

      // Fetch products
      const productDoc = await getDoc(doc(db, "products", shopId));
      if (productDoc.exists()) {
        const productList = productDoc.data().products || [];
        setProducts(productList);
        setFilteredProducts(productList);
      }
      const user = getAuth().currentUser;
      if (!user) return;
      // Fetch transactions for the selected shop
      const txnQuery = query(
        collection(db, "transactions"),
        where("shopId", "==", shopId),
        where("customerId", "==", user.uid)
      );
      
      const txnSnap = await getDocs(txnQuery);
      const txnList = txnSnap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setTransactions(txnList);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const calculateDue = () => {
    return transactions.reduce((total, txn) => {
      if (txn.type === "paid" || txn.type === "advance") return total + txn.amount;
      if (txn.type === "due") return total - txn.amount;
      return total;
    }, 0);
  };

  const getDisplayProducts = () => {
    if (showAllProducts) {
      return filteredProducts;
    }
    return filteredProducts.slice(0, 3);
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-[#F7F7F7]">
      <FlatList
        ListHeaderComponent={
          <View className="px-4 pb-4">
            {/* App Header */}
            <View className="flex-row justify-between items-center mb-6 mt-4">
              <View className="flex-row items-center">
                <Image source={iconMap["shop.png"]} className="w-6 h-6 mr-2" />
                <Text className="text-xl font-bold text-gray-900">ShopMunim</Text>
              </View>
              <TouchableOpacity>
                <Image source={iconMap["bell.png"]} className="w-6 h-6" />
              </TouchableOpacity>
            </View>

            {/* Shop Info */}
            <TouchableOpacity
              onPress={() => router.navigate("/(customerTabs)")}
              style={styles.backButton}
            >
              <Feather name="arrow-left" size={24} color="#333" />
            </TouchableOpacity>
            <View className="bg-white p-4 rounded-lg mb-4 shadow">
              <Text className="text-xl font-bold text-gray-900 mb-1">
                {shopDetails?.name || "Shop"}
              </Text>
              <Text className="text-xs text-gray-500 mb-1">Shop ID: {shopDetails?.id}</Text>
              <Text className="text-base font-semibold text-blue-600">
                Your Balance: ₹{calculateDue().toFixed(2)}
              </Text>
            </View>

            {/* Product List */}
            <View className="bg-white p-4 rounded-lg mb-4 shadow">
              <Text className="text-lg font-bold text-gray-800 mb-3">Products</Text>
              
              {/* Search Bar */}
              <View className="mb-3">
                <View className="flex-row items-center bg-gray-100 rounded-lg px-3 py-2">
                  <Feather name="search" size={20} color="#666" />
                  <TextInput
                    className="flex-1 ml-2 text-gray-700"
                    placeholder="Search products..."
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    placeholderTextColor="#999"
                  />
                  {searchQuery.length > 0 && (
                    <TouchableOpacity onPress={() => setSearchQuery("")}>
                      <Feather name="x" size={20} color="#666" />
                    </TouchableOpacity>
                  )}
                </View>
              </View>

              {filteredProducts.length > 0 ? (
                <ScrollView 
                  className="max-h-64"
                  showsVerticalScrollIndicator={false}
                  nestedScrollEnabled={true}
                >
                  {getDisplayProducts().map((product) => (
                    <View
                      key={product.id}
                      className="flex-row justify-between items-center py-2 border-b border-gray-100"
                    >
                      <Text className="text-gray-700">{product.name}</Text>
                      <Text className="text-gray-600 font-semibold">₹{product.price}</Text>
                    </View>
                  ))}
                  
                  {/* View More Button */}
                  {!showAllProducts && filteredProducts.length > 3 && (
                    <TouchableOpacity
                      onPress={() => setShowAllProducts(true)}
                      className="mt-3 py-2 bg-blue-500 rounded-lg"
                    >
                      <Text className="text-white text-center font-semibold">
                        View More ({filteredProducts.length - 3} more)
                      </Text>
                    </TouchableOpacity>
                  )}
                  
                  {/* Show Less Button */}
                  {showAllProducts && filteredProducts.length > 3 && (
                    <TouchableOpacity
                      onPress={() => setShowAllProducts(false)}
                      className="mt-3 py-2 bg-gray-500 rounded-lg"
                    >
                      <Text className="text-white text-center font-semibold">
                        Show Less
                      </Text>
                    </TouchableOpacity>
                  )}
                </ScrollView>
              ) : (
                <Text className="text-gray-400 text-sm">
                  {searchQuery ? "No products found matching your search." : "No products found."}
                </Text>
              )}
            </View>

            {/* Transactions Title */}
            <Text className="text-lg font-bold text-gray-800 mb-3">Transaction History</Text>
          </View>
        }
        data={transactions.sort((a, b) => (b.createdAt as any) - (a.createdAt as any))}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View className="bg-white px-4 py-3 border-b border-gray-100">
            <View className="flex-row justify-between items-center">
              <View>
                <Text className="font-medium text-gray-800">
                  {item.description || "Transaction"}
                </Text>
                <Text className="text-xs text-gray-400">
                  {new Date(item.createdAt).toLocaleDateString()}
                </Text>
              </View>
              <Text
                className={`font-semibold ${
                  item.type === "paid" || item.type === "advance"
                    ? "text-green-600"
                    : "text-red-600"
                }`}
              >
                {item.type === "paid" || item.type === "advance" ? "+" : "-"}₹{item.amount}
              </Text>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <Text className="text-center text-gray-400 mt-4">No transactions found.</Text>
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  backButton: {
    marginBottom: 20,
    marginTop: 1,
  },
}); 

export default JoinedShopDetails;
