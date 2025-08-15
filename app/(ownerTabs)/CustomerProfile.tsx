import { useRoute } from "@react-navigation/native";
import { useRouter } from "expo-router";
import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Pressable,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  StyleSheet,
  Platform,
  KeyboardAvoidingView,
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
  const { customerId, shopId } = (route.params || {}) as RouteParams;

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal states for offline payment
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState<string>("");
  const [paymentNote, setPaymentNote] = useState<string>("");
  const [processingPayment, setProcessingPayment] = useState(false);

  // Helper to convert different createdAt formats -> JS timestamp ms
  const getTimeFromCreatedAt = (createdAt: any) => {
    if (!createdAt) return 0;
    // Firestore Timestamp with toDate()
    if (typeof createdAt === "object" && typeof createdAt.toDate === "function") {
      return createdAt.toDate().getTime();
    }
    // Firestore-like object with seconds/nanoseconds
    if (typeof createdAt === "object" && typeof createdAt.seconds === "number") {
      return createdAt.seconds * 1000 + (createdAt.nanoseconds ?? 0) / 1e6;
    }
    // ISO string
    if (typeof createdAt === "string") {
      const parsed = Date.parse(createdAt);
      return Number.isNaN(parsed) ? 0 : parsed;
    }
    // epoch number (ms)
    if (typeof createdAt === "number") return createdAt;
    return 0;
  };

  useEffect(() => {
    if (!customerId || !shopId) {
      Alert.alert("Error", "Missing customerId or shopId");
      setLoading(false);
      return;
    }

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
        if (!cancelled) Alert.alert("Error", "Could not load customer info.");
      }

      // 2) subscribe to transactions ordered by createdAt desc (newest first)
      try {
        const q = query(
          collection(db, "transactions"),
          where("customerId", "==", customerId),
          where("shopId", "==", shopId),
          orderBy("createdAt", "desc") // server-side ordering
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
            if (!cancelled) Alert.alert("Error", "Could not load transactions.");
            setLoading(false);
          }
        );
      } catch (err: any) {
        console.error("Failed to subscribe to transactions:", err);
        if (!cancelled) Alert.alert("Error", "Failed to load transaction history.");
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

  // Open small modal to record offline payment
  const openPaymentModal = () => {
    setPaymentAmount("");
    setPaymentNote("");
    setShowPaymentModal(true);
  };

  const closePaymentModal = () => {
    if (processingPayment) return; // prevent closing when processing
    setShowPaymentModal(false);
  };

  // Confirm offline payment -> add a 'paid' transaction
  const submitOfflinePayment = async () => {
    const amt = Number(paymentAmount.toString().replace(/[^\d.]/g, ""));
    if (!amt || isNaN(amt) || amt <= 0) {
      Alert.alert("Error", "Please enter a valid amount greater than 0.");
      return;
    }
    if (!customerId || !shopId) {
      Alert.alert("Error", "Missing customer or shop information.");
      return;
    }

    setProcessingPayment(true);
    try {
      const description = paymentNote?.trim() ? `Offline payment: ${paymentNote.trim()}` : "Offline payment";
      await addDoc(collection(db, "transactions"), {
        shopId,
        customerId,
        amount: amt,
        type: "paid",
        description,
        createdAt: serverTimestamp(),
        meta: { method: "offline" },
      });

      // Optionally: you can update a customer's quick fields here (like lastPaidAt / lastPayment)
      // await updateDoc(doc(db, 'customers', customerId), { lastPaidAt: serverTimestamp() });

      Alert.alert("Success", `Recorded payment of ₹${amt}`, [{ text: "OK", onPress: closePaymentModal }]);
    } catch (e) {
      console.error("Failed to add offline payment:", e);
      Alert.alert("Error", "Failed to record payment. Try again.");
    } finally {
      setProcessingPayment(false);
    }
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

        {/* Row with Add Transaction and Record Payment */}
        <View style={{ flexDirection: "row", justifyContent: "flex-end", gap: 8, marginBottom: 12 }}>
          <TouchableOpacity
            className="bg-blue-500 rounded-lg py-2 px-4"
            onPress={() =>
              router.push({ pathname: "/(ownerTabs)/AddTransaction", params: { customerId, shopId } })
            }
            style={{ marginRight: 8 }}
          >
            <Text className="text-white font-bold text-center">+ Add Transaction</Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="bg-green-500 rounded-lg py-2 px-4"
            onPress={openPaymentModal}
            accessibilityLabel="record-offline-payment"
          >
            <Text className="text-white font-bold text-center">Record Payment</Text>
          </TouchableOpacity>
        </View>

        {/* Transaction History */}
        <View className="bg-white rounded-lg p-4 shadow">
          <Text className="text-base font-bold text-gray-800 mb-3">Transaction History</Text>
          <FlatList
            data={transactions} // already returned sorted server-side
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View className="flex-row justify-between items-center py-3 border-b border-gray-100">
                <View>
                  <Text className="font-medium text-gray-800">{item.description || "Transaction"}</Text>
                  <Text className="text-xs text-gray-400">
                    {new Date(getTimeFromCreatedAt(item.createdAt)).toLocaleString()}
                  </Text>
                </View>
                <Text
                  className={`font-semibold ${item.type === "due" ? "text-red-600" : "text-green-600"}`}
                >
                  {item.type === "due" ? "+" : "-"}₹{item.amount}
                </Text>
              </View>
            )}
            ListEmptyComponent={<Text className="text-center text-gray-400 mt-4">No transactions found.</Text>}
          />
        </View>

        {/* ========== Offline Payment Modal ========== */}
        <Modal visible={showPaymentModal} animationType="fade" transparent>
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={modalStyles.container}
          >
            <View style={modalStyles.inner}>
              <Text style={modalStyles.title}>Record Offline Payment</Text>

              <Text style={modalStyles.label}>Amount (₹)</Text>
              <TextInput
                keyboardType="numeric"
                placeholder="e.g. 500"
                value={paymentAmount}
                onChangeText={setPaymentAmount}
                style={modalStyles.input}
              />

              <Text style={[modalStyles.label, { marginTop: 8 }]}>Note (optional)</Text>
              <TextInput
                placeholder="e.g. Cash received at shop"
                value={paymentNote}
                onChangeText={setPaymentNote}
                style={modalStyles.input}
              />

              <View style={{ flexDirection: "row", justifyContent: "flex-end", marginTop: 12 }}>
                <Pressable onPress={closePaymentModal} style={modalStyles.buttonOutline}>
                  <Text style={modalStyles.buttonOutlineText}>Cancel</Text>
                </Pressable>

                <Pressable
                  onPress={submitOfflinePayment}
                  style={[modalStyles.buttonPrimary, processingPayment ? { opacity: 0.6 } : {}]}
                  disabled={processingPayment}
                >
                  <Text style={modalStyles.buttonPrimaryText}>
                    {processingPayment ? "Saving..." : "Confirm"}
                  </Text>
                </Pressable>
              </View>
            </View>
          </KeyboardAvoidingView>
        </Modal>
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

const modalStyles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.4)",
    marginBottom: 35,
  },
  inner: {
    backgroundColor: "#fff",
    padding: 16,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 8,
  },
  label: {
    fontSize: 13,
    color: "#374151",
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    fontSize: 16,
    backgroundColor: "#fff",
  },
  buttonPrimary: {
    backgroundColor: "#10B981",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginLeft: 8,
  },
  buttonPrimaryText: {
    color: "#fff",
    fontWeight: "700",
  },
  buttonOutline: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  buttonOutlineText: {
    color: "#111827",
    fontWeight: "600",
  },
});

export default CustomerProfile;
