import { useRoute } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { collection, doc, getDoc, onSnapshot, query, where, orderBy } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Text,
  TouchableOpacity,
  View,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { db } from "../../firebaseConfig";
import { Customer, Transaction } from "../../types";
import Feather from "react-native-vector-icons/Feather";

interface RouteParams {
  customerId: string;
  shopId: string;
}

const CustomerProfile: React.FC = () => {
  const route = useRoute();
  const router = useRouter();
  const { customerId, shopId } = route.params as RouteParams;

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  // Helper to convert different createdAt formats -> JS timestamp ms
  const getTimeFromCreatedAt = (createdAt: any) => {
    if (!createdAt) return 0;
    // Firestore Timestamp
    if (typeof createdAt === "object" && typeof createdAt.toDate === "function") {
      return createdAt.toDate().getTime();
    }
    // Firestore-like object with seconds
    if (typeof createdAt === "object" && typeof createdAt.seconds === "number") {
      return createdAt.seconds * 1000 + (createdAt.nanoseconds ?? 0) / 1e6;
    }
    // ISO string
    if (typeof createdAt === "string") {
      const parsed = Date.parse(createdAt);
      return Number.isNaN(parsed) ? 0 : parsed;
    }
    // number (ms)
    if (typeof createdAt === "number") return createdAt;
    return 0;
  };

  // Load customer once + subscribe to sorted transactions
  useEffect(() => {
    let unsubscribeTransactions: (() => void) | null = null;
    let cancelled = false;

    const load = async () => {
      setLoading(true);

      // 1) load customer doc once
      try {
        const customerRef = doc(db, "customers", customerId);
        const customerSnap = await getDoc(customerRef);
        if (!cancelled) {
          if (customerSnap.exists()) {
            setCustomer({ uid: customerSnap.id, ...(customerSnap.data() as any) } as Customer);
          } else {
            setCustomer(null);
          }
        }
      } catch (err) {
        console.error("Failed to load customer:", err);
        Alert.alert("Error", "Could not load customer info.");
      }

      // 2) subscribe to transactions ordered by createdAt desc (newest first)
      try {
        const q = query(
          collection(db, "transactions"),
          where("customerId", "==", customerId),
          where("shopId", "==", shopId),
          orderBy("createdAt", "desc") // <- server-side ordering
        );

        unsubscribeTransactions = onSnapshot(
          q,
          (snapshot) => {
            if (cancelled) return;
            const txns: Transaction[] = snapshot.docs.map((d) => ({
              id: d.id,
              ...(d.data() as any),
            }));
            setTransactions(txns);
            setLoading(false);
          },
          (err) => {
            console.error("Transactions subscription error:", err);
            Alert.alert("Error", "Could not load transactions.");
            setLoading(false);
          }
        );
      } catch (err: any) {
        // Query may fail if e.g., index required or shopId/customerId missing
        console.error("Failed to subscribe to transactions:", err);
        Alert.alert("Error", "Failed to load transaction history.");
        setLoading(false);
      }
    };

    load();

    return () => {
      cancelled = true;
      if (unsubscribeTransactions) unsubscribeTransactions();
    };
  }, [customerId, shopId]);

  const calculateDue = () => {
    return transactions.reduce((sum, txn) => {
      if (txn.type === "due") return sum + (txn.amount || 0);
      if (txn.type === "paid" || txn.type === "advance") return sum - (txn.amount || 0);
      return sum;
    }, 0);
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!customer) {
    return (
      <View className="flex-1 justify-center items-center">
        <Text>Customer not found.</Text>
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-[#F7F7F7]">
      <View className="flex-1 p-4">
        <TouchableOpacity onPress={() => router.navigate("/(ownerTabs)")} style={styles.backButton}>
          <Feather name="arrow-left" size={24} color="#333" />
        </TouchableOpacity>

        {/* Header */}
        <View className="mb-4 bg-white p-4 rounded-lg shadow">
          <Text className="text-xl font-bold text-gray-800">{customer.name}</Text>
          <Text className="text-xs text-gray-500">Customer ID: {customer.uid}</Text>
          <Text className="text-sm font-semibold text-blue-500 mt-1">
            Balance: ₹{calculateDue()}
          </Text>
        </View>

        {/* Add Transaction Button */}
        <TouchableOpacity
          className="bg-blue-500 rounded-lg py-2 px-4 mb-4 self-end"
          onPress={() =>
            router.push({ pathname: "/(ownerTabs)/AddTransaction", params: { customerId, shopId } })
          }
        >
          <Text className="text-white font-bold text-center">+ Add Transaction</Text>
        </TouchableOpacity>

        {/* Transaction History */}
        <View className="bg-white rounded-lg p-4 shadow">
          <Text className="text-base font-bold text-gray-800 mb-3">Transaction History</Text>
          <FlatList
            data={transactions} // already returned sorted server-side
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View className="flex-row justify-between items-center py-3 border-b border-gray-100">
                <View>
                  <Text className="font-medium text-gray-800">
                    {item.description || "Transaction"}
                  </Text>
                  <Text className="text-xs text-gray-400">
                    {new Date(getTimeFromCreatedAt(item.createdAt)).toLocaleString()}
                  </Text>
                </View>
                <Text
                  className={`font-semibold ${
                    item.type === "due" ? "text-red-600" : "text-green-600"
                  }`}
                >
                  {item.type === "due" ? "+" : "-"}₹{item.amount}
                </Text>
              </View>
            )}
            ListEmptyComponent={
              <Text className="text-center text-gray-400 mt-4">No transactions found.</Text>
            }
          />
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  backButton: {
    width: 40,
    height: 40,
  },
});

export default CustomerProfile;
