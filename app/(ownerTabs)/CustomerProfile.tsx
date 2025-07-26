import { useRoute } from "@react-navigation/native";
import { addDoc, collection, doc, getDoc, getDocs, query, where } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
  Alert,
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { db } from "../../firebaseConfig";
import { Customer, Transaction } from "../../types";
import { SafeAreaView } from "react-native-safe-area-context";

interface RouteParams {
  customerId: string;
  shopId: string;
}

const CustomerProfile: React.FC = () => {
  const route = useRoute();
  const { customerId, shopId } = route.params as RouteParams;

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [txnType, setTxnType] = useState<"due" | "paid" | "advance">("due");
  const [txnAmount, setTxnAmount] = useState("");
  const [txnDesc, setTxnDesc] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchCustomerAndTransactions();
  }, [customerId, shopId]);

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

  const calculateDue = () => {
    return transactions.reduce((sum, txn) => {
      if (txn.type === "due") return sum + txn.amount;
      if (txn.type === "paid" || txn.type === "advance") return sum - txn.amount;
      return sum;
    }, 0);
  };

  const handleAddTransaction = async () => {
    if (!txnAmount) return;
    setSubmitting(true);
    await addDoc(collection(db, "transactions"), {
      shopId,
      customerId,
      amount: Number(txnAmount),
      type: txnType,
      description: txnDesc,
      createdAt: new Date().toISOString(),
    });

    setTxnAmount("");
    setTxnDesc("");
    setTxnType("due");
    setModalVisible(false);
    setSubmitting(false);
    fetchCustomerAndTransactions();
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
          <Text className="text-sm font-semibold text-blue-500 mt-1">Due: ₹{calculateDue()}</Text>
        </View>

        {/* Add Transaction Button */}
        <TouchableOpacity
          className="bg-blue-500 rounded-lg py-2 px-4 mb-4 self-end"
          onPress={() => setModalVisible(true)}
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

        {/* Modal */}
        <Modal
          visible={modalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setModalVisible(false)}
        >
           <View
              className="flex-1 justify-center items-center"
              style={{
                backgroundColor: "rgba(0,0,0,0.2)", // Light transparent dim
                backdropFilter: "blur(2px)", // Optional for web (won’t work on native)
              }}
            >
            <View
              className="bg-white rounded-xl p-6 w-[85%] shadow-lg"
              style={{
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.25,
                shadowRadius: 4,
                elevation: 5,
              }}
            >
              <Text className="text-lg font-bold mb-3">Add Transaction</Text>

              <Text className="text-sm mb-1">Transaction Type</Text>
              <View className="flex-row mb-3">
                {(["due", "paid", "advance"] as const).map((type) => (
                  <Pressable
                    key={type}
                    className={`px-3 py-1 mr-2 rounded-full border ${
                      txnType === type ? "bg-blue-500 border-indigo-600" : "border-gray-300"
                    }`}
                    onPress={() => setTxnType(type)}
                  >
                    <Text className={txnType === type ? "text-white" : "text-gray-700"}>
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </Text>
                  </Pressable>
                ))}
              </View>

              <Text className="text-sm mb-1">Amount</Text>
              <TextInput
                className="border border-gray-300 rounded px-3 py-2 mb-3"
                keyboardType="numeric"
                value={txnAmount}
                onChangeText={setTxnAmount}
                placeholder="Enter amount"
              />

              <Text className="text-sm mb-1">Description</Text>
              <TextInput
                className="border border-gray-300 rounded px-3 py-2 mb-4"
                value={txnDesc}
                onChangeText={setTxnDesc}
                placeholder="Optional description"
              />

              <View className="flex-row justify-end space-x-2">
                <TouchableOpacity
                  className="bg-gray-200 px-4 py-2 rounded"
                  onPress={() => setModalVisible(false)}
                  disabled={submitting}
                >
                  <Text className="text-blue-500">Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  className="bg-blue-500 px-4 py-2 rounded"
                  onPress={handleAddTransaction}
                  disabled={submitting || !txnAmount}
                >
                  <Text className="text-white font-bold">
                    {submitting ? "Adding..." : "Add"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
};

export default CustomerProfile;
