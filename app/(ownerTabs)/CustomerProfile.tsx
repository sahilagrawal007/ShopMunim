import { useFocusEffect, useRoute } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { collection, doc, getDoc, getDocs, query, where } from "firebase/firestore";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { db } from "../../firebaseConfig";
import { Customer, Transaction } from "../../types";

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

  const fetchCustomerAndTransactions = async () => {
    setLoading(true);
    const customerRef = doc(db, "customers", customerId);
    const customerSnap = await getDoc(customerRef);
    if (customerSnap.exists()) {
      setCustomer({ uid: customerSnap.id, ...customerSnap.data() } as Customer);
    }
    try {
      const q = query(
        collection(db, "transactions"),
        where("customerId", "==", customerId),
        where("shopId", "==", shopId)
      );
      const querySnapshot = await getDocs(q);
      const txns: Transaction[] = [];
      querySnapshot.forEach((doc) => {
        txns.push({ id: doc.id, ...doc.data() } as Transaction);
      });
      setTransactions(txns);
    } catch (e: any) {
      console.error("Failed to load transactions:", e);
      Alert.alert("Error", "Could not load transaction history.");
    } finally {
      setLoading(false);
    }
  };

  // Refresh data when screen comes into focus (e.g., returning from AddTransaction)
  useFocusEffect(
    useCallback(() => {
      fetchCustomerAndTransactions();
    }, [customerId, shopId])
  );

  const calculateDue = () => {
    return transactions.reduce((sum, txn) => {
      if (txn.type === "due") return sum + txn.amount;
      if (txn.type === "paid" || txn.type === "advance") return sum - txn.amount;
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
        {/* Header */}
        <View className="mb-4 bg-white p-4 rounded-lg shadow">
          <Text className="text-xl font-bold text-gray-800">{customer.name}</Text>
          <Text className="text-xs text-gray-500">Customer ID: {customer.uid}</Text>
          <Text className="text-sm font-semibold text-blue-500 mt-1">Balance: ₹{calculateDue()}</Text>
        </View>

        {/* Add Transaction Button */}
        <TouchableOpacity
          className="bg-blue-500 rounded-lg py-2 px-4 mb-4 self-end"
          onPress={() => router.push({ pathname: '/(ownerTabs)/AddTransaction', params: { customerId, shopId } })}
        >
          <Text className="text-white font-bold text-center">+ Add Transaction</Text>
        </TouchableOpacity>

        {/* Transaction History */}
        <View className="bg-white rounded-lg p-4 shadow">
          <Text className="text-base font-bold text-gray-800 mb-3">Transaction History</Text>
          <FlatList
            data={transactions.sort((a, b) => (b.createdAt as any) - (a.createdAt as any))}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View className="flex-row justify-between items-center py-3 border-b border-gray-100">
                <View>
                  <Text className="font-medium text-gray-800">{item.description || "Transaction"}</Text>
                  <Text className="text-xs text-gray-400">
                    {new Date(item.createdAt).toLocaleDateString()}
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

export default CustomerProfile;
