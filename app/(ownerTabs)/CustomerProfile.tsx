import { useRoute } from "@react-navigation/native";
import { addDoc, collection, doc, getDoc, getDocs, query, where } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
  Alert,
  ActivityIndicator,
  FlatList,
  Image,
  Modal,
  Pressable,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { db } from "../../firebaseConfig";
import { Customer, Transaction, Owner } from "../../types";
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
    // Fetch customer info
    const customerRef = doc(db, "customers", customerId);
    const customerSnap = await getDoc(customerRef);
    if (customerSnap.exists()) {
      setCustomer({ uid: customerSnap.id, ...customerSnap.data() } as Customer);
    }
    try {
      // Fetch transactions for this customer in this shop
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
    // Sum up all transaction amounts (positive for due, negative for paid/advance)
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
    // Refresh transactions
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
      <View className="flex-1 bg-white p-4">
        {/* Add Transaction Button */}
        <TouchableOpacity
          className="bg-blue-500 rounded-lg py-2 px-4 mb-4 self-end"
          onPress={() => setModalVisible(true)}
        >
          <Text className="text-white font-bold text-center">+ Add Transaction</Text>
        </TouchableOpacity>
        {/* Modal for Add Transaction */}
        <Modal
          visible={modalVisible}
          transparent
          animationType="slide"
          onRequestClose={() => setModalVisible(false)}
        >
          <View className="flex-1 justify-center items-center bg-black bg-opacity-30">
            <View className="bg-white rounded-lg p-6 w-80">
              <Text className="text-lg font-bold mb-2">Add Transaction</Text>
              <Text className="mb-1">Type</Text>
              <View className="flex-row mb-2">
                {(["due", "paid", "advance"] as const).map((type) => (
                  <Pressable
                    key={type}
                    className={`px-3 py-1 mr-2 rounded-full border ${
                      txnType === type ? "bg-blue-500 border-blue-500" : "border-gray-300"
                    }`}
                    onPress={() => setTxnType(type)}
                  >
                    <Text className={txnType === type ? "text-white" : "text-gray-700"}>
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </Text>
                  </Pressable>
                ))}
              </View>
              <Text className="mb-1">Amount</Text>
              <TextInput
                className="border border-gray-300 rounded px-2 py-1 mb-2"
                keyboardType="numeric"
                value={txnAmount}
                onChangeText={setTxnAmount}
                placeholder="Enter amount"
              />
              <Text className="mb-1">Description (optional)</Text>
              <TextInput
                className="border border-gray-300 rounded px-2 py-1 mb-4"
                value={txnDesc}
                onChangeText={setTxnDesc}
                placeholder="Description"
              />
              <View className="flex-row justify-end">
                <TouchableOpacity
                  className="mr-2 px-4 py-2 bg-gray-200 rounded"
                  onPress={() => setModalVisible(false)}
                  disabled={submitting}
                >
                  <Text>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  className="px-4 py-2 bg-blue-500 rounded"
                  onPress={handleAddTransaction}
                  disabled={submitting || !txnAmount}
                >
                  <Text className="text-white font-bold">{submitting ? "Adding..." : "Add"}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
        <View className="flex-row items-center mb-4">
          <View>
            <Text className="text-lg font-bold">{customer.name}</Text>
            <Text className="text-gray-500">ID: {customer.uid}</Text>
            <Text className="text-blue-600 font-semibold mt-1">Due: ₹{calculateDue()}</Text>
          </View>
        </View>
        <Text className="text-base font-semibold mb-2">Transaction History</Text>
        <FlatList
          data={transactions.sort((a, b) => (b.createdAt as any) - (a.createdAt as any))}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View className="flex-row justify-between items-center py-2 border-b border-gray-100">
              <View>
                <Text className="font-medium">{item.description || "Transaction"}</Text>
                <Text className="text-xs text-gray-400">
                  {new Date(item.createdAt).toLocaleDateString()}
                </Text>
              </View>
              <Text className={item.type === "due" ? "text-red-500" : "text-green-600"}>
                {item.type === "due" ? "+" : "-"}₹{item.amount}
              </Text>
            </View>
          )}
          ListEmptyComponent={<Text className="text-gray-400 mt-4">No transactions found.</Text>}
        />
      </View>
    </SafeAreaView>
  );
};

export default CustomerProfile;
