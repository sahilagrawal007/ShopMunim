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

  // Statement (invoice) generation states
  const [showStatementModal, setShowStatementModal] = useState(false);
  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");
  const [processingStatement, setProcessingStatement] = useState(false);

  // Shop info for invoices/statements
  const [shopInfo, setShopInfo] = useState<any>(null);
  // Dynamic date picker support
  const [DateTimePickerComponent, setDateTimePickerComponent] = useState<any>(null);
  const [showFromPicker, setShowFromPicker] = useState(false);
  const [showToPicker, setShowToPicker] = useState(false);

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

      // Load shop/owner info for invoice/statement header
      try {
        const ownerRef = doc(db, "owners", shopId);
        const ownerSnap = await getDoc(ownerRef);
        if (!cancelled) {
          if (ownerSnap.exists()) {
            setShopInfo({ uid: ownerSnap.id, ...(ownerSnap.data() as any) });
          } else {
            setShopInfo(null);
          }
        }
      } catch (err) {
        console.error("Failed to load shop info:", err);
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

    // Lazy-load date picker (optional dependency)
    (async () => {
      try {
        const dtp = await import("@react-native-community/datetimepicker");
        // default export comes as object { default: Component }
        // store the component constructor
        setDateTimePickerComponent(() => (dtp as any).default || dtp);
      } catch (e) {
        console.log("DateTimePicker not available; falling back to text inputs.");
      }
    })();

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

  // Helpers for date range
  const parseDateInput = (value: string) => {
    const parsed = Date.parse(value);
    return Number.isNaN(parsed) ? null : new Date(parsed);
  };

  const filterTransactionsByDateRange = (from: string, to: string) => {
    const fromDt = parseDateInput(from);
    const toDt = parseDateInput(to);
    if (!fromDt || !toDt) return [] as Transaction[];
    const fromMs = fromDt.getTime();
    const toEnd = new Date(toDt);
    toEnd.setHours(23, 59, 59, 999);
    const toMs = toEnd.getTime();
    return transactions.filter((t) => {
      const ts = getTimeFromCreatedAt((t as any).createdAt);
      return ts >= fromMs && ts <= toMs;
    });
  };

  const buildHeaderHtml = () => {
    const shopName = shopInfo?.shopName || "ShopMunim";
    const ownerName = shopInfo?.name || "";
    const phone = shopInfo?.phone ? `Phone: ${shopInfo.phone}` : "";
    const email = shopInfo?.email ? `Email: ${shopInfo.email}` : "";
    const address = shopInfo?.address ? `${shopInfo.address}` : "";
    return `
      <div class=\"header\">
        <div>
          <div class=\"title\">${shopName}</div>
          <div class=\"muted\">${ownerName}</div>
        </div>
        <div style=\"text-align:right\">
          <div class=\"muted\">${phone}</div>
          <div class=\"muted\">${email}</div>
          <div class=\"muted\">${address}</div>
        </div>
      </div>
    `;
  };

  const buildStatementHtml = (from: string, to: string, txns: Transaction[]) => {
    const customerName = customer?.name || customer?.uid || "Customer";
    const rows = txns
      .map((t) => {
        const dateStr = new Date(getTimeFromCreatedAt((t as any).createdAt)).toLocaleString();
        const amount = Number(t.amount || 0).toFixed(2);
        const sign = t.type === "due" ? "+" : "-";
        const color = t.type === "due" ? "#DC2626" : "#059669";
        return `<tr>
          <td style=\"padding:8px;border-bottom:1px solid #e5e7eb;font-size:12px;\">${dateStr}</td>
          <td style=\"padding:8px;border-bottom:1px solid #e5e7eb;font-size:12px;\">${t.description || "Transaction"}</td>
          <td style=\"padding:8px;border-bottom:1px solid #e5e7eb;font-size:12px;\">${t.type.toUpperCase()}</td>
          <td style=\"padding:8px;border-bottom:1px solid #e5e7eb;font-weight:700;color:${color};text-align:right;\">${sign}₹${amount}</td>
        </tr>`;
      })
      .join("");

    const totals = txns.reduce(
      (acc, t) => {
        if (t.type === "due") acc.due += Number(t.amount || 0);
        if (t.type === "paid" || t.type === "advance") acc.paid += Number(t.amount || 0);
        return acc;
      },
      { due: 0, paid: 0 }
    );
    const net = totals.due - totals.paid;

    return `
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 16px; color: #111827; }
            .card { border: 1px solid #e5e7eb; border-radius: 12px; padding: 20px; }
            .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
            .title { font-size: 20px; font-weight: 800; color: #111827; }
            .muted { color: #6b7280; font-size: 12px; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            th { text-align: left; font-size: 12px; color: #374151; padding: 8px; border-bottom: 1px solid #e5e7eb; }
            .summary { margin-top: 14px; }
            .summary div { display:flex; justify-content: space-between; margin: 6px 0; }
          </style>
        </head>
        <body>
          <div class="card">
            ${buildHeaderHtml()}
            <div style=\"display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;\">
              <div class=\"muted\">Statement for ${customerName}</div>
              <div class=\"muted\">${new Date().toLocaleString()}</div>
            </div>
            <div class=\"muted\" style=\"margin-bottom:6px;\">Range: ${from} to ${to}</div>
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Description</th>
                  <th>Type</th>
                  <th style="text-align:right">Amount</th>
                </tr>
              </thead>
              <tbody>
                ${rows || `<tr><td colspan=\"4\" style=\"padding:12px;text-align:center;color:#6b7280;\">No transactions</td></tr>`}
              </tbody>
            </table>
            <div class="summary">
              <div><span>Total Due Added</span><strong>₹${totals.due.toFixed(2)}</strong></div>
              <div><span>Total Paid/Advance</span><strong>₹${totals.paid.toFixed(2)}</strong></div>
              <div><span>Net Balance</span><strong style="color:${net > 0 ? "#DC2626" : "#059669"}">₹${net.toFixed(2)}</strong></div>
            </div>
            <div class="muted" style="margin-top: 16px;">Generated by ShopMunim</div>
          </div>
        </body>
      </html>
    `;
  };

  const handleDownloadStatement = async () => {
    try {
      setProcessingStatement(true);
      if (!fromDate || !toDate) {
        Alert.alert("Error", "Please enter both From and To dates in YYYY-MM-DD format.");
        setProcessingStatement(false);
        return;
      }
      const fromDt = parseDateInput(fromDate);
      const toDt = parseDateInput(toDate);
      if (!fromDt || !toDt) {
        Alert.alert("Error", "Invalid date format. Please use YYYY-MM-DD.");
        setProcessingStatement(false);
        return;
      }
      if (fromDt.getTime() > toDt.getTime()) {
        Alert.alert("Error", "From date cannot be after To date.");
        setProcessingStatement(false);
        return;
      }
      const filtered = filterTransactionsByDateRange(fromDate, toDate);
      const html = buildStatementHtml(fromDate, toDate, filtered);
      // @ts-ignore - optional dependency resolved at runtime
      const Print = await import("expo-print");
      // @ts-ignore - optional dependency resolved at runtime
      const Sharing = await import("expo-sharing");
      const { uri } = await Print.printToFileAsync({ html });
      const name = `statement_${fromDate}_${toDate}_${customer?.uid || "customer"}.pdf`;
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: "application/pdf",
          dialogTitle: "Share Statement",
          UTI: "com.adobe.pdf",
        });
      } else {
        Alert.alert("Saved", `Statement saved at: ${uri}`);
      }

      // Log admin download event (statement)
      try {
        await addDoc(collection(db, "owners", shopId, "invoiceDownloads"), {
          shopId,
          customerId,
          invoiceType: "statement",
          periodFrom: fromDate,
          periodTo: toDate,
          transactionCount: filtered.length,
          createdAt: serverTimestamp(),
          platform: Platform.OS,
          source: "CustomerProfile",
        });
      } catch (logErr) {
        console.warn("Failed to log statement download:", logErr);
      }
      setShowStatementModal(false);
    } catch (error) {
      console.error("Failed to generate statement:", error);
      Alert.alert("Error", "Could not generate statement PDF. Please ensure 'expo-print' is installed.");
    } finally {
      setProcessingStatement(false);
    }
  };

  // Per-transaction invoice with shop details
  const buildInvoiceHtml = (txn: Transaction) => {
    const shopName = shopInfo?.shopName || "ShopMunim";
    const ownerName = shopInfo?.name || "";
    const phone = shopInfo?.phone ? `Phone: ${shopInfo.phone}` : "";
    const email = shopInfo?.email ? `Email: ${shopInfo.email}` : "";
    const address = shopInfo?.address ? `${shopInfo.address}` : "";
    const customerName = customer?.name || customer?.uid || "Customer";
    const createdAtMs = getTimeFromCreatedAt((txn as any).createdAt);
    const dateStr = createdAtMs ? new Date(createdAtMs).toLocaleString() : new Date().toLocaleString();
    const amountStr = `₹${Number(txn.amount || 0).toFixed(2)}`;
    const sign = txn.type === "due" ? "+" : "-";
    return `
      <html>
        <head>
          <meta name=\"viewport\" content=\"width=device-width, initial-scale=1\" />
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 16px; color: #111827; }
            .card { border: 1px solid #e5e7eb; border-radius: 12px; padding: 20px; }
            .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
            .title { font-size: 20px; font-weight: 800; color: #111827; }
            .muted { color: #6b7280; font-size: 12px; }
            .row { display: flex; justify-content: space-between; margin: 10px 0; }
            .label { color: #374151; font-weight: 600; }
            .value { color: #111827; }
            .amount { font-weight: 800; font-size: 22px; }
            .footer { margin-top: 20px; font-size: 12px; color: #6b7280; }
          </style>
        </head>
        <body>
          <div class=\"card\">
            ${buildHeaderHtml()}
            <div class=\"row\"><div class=\"label\">Invoice ID</div><div class=\"value\">${txn.id}</div></div>
            <div class=\"row\"><div class=\"label\">Date</div><div class=\"value\">${dateStr}</div></div>
            <div class=\"row\"><div class=\"label\">Customer</div><div class=\"value\">${customerName}</div></div>
            <div class=\"row\"><div class=\"label\">Type</div><div class=\"value\">${txn.type.toUpperCase()}</div></div>
            <div class=\"row\"><div class=\"label\">Description</div><div class=\"value\">${txn.description || "Transaction"}</div></div>
            <div class=\"row\" style=\"margin-top:16px;\">
              <div class=\"label\">Amount</div>
              <div class=\"amount\">${sign}${amountStr}</div>
            </div>
            <div class=\"footer\">Generated by ShopMunim</div>
          </div>
        </body>
      </html>
    `;
  };

  const handleDownloadInvoice = async (txn: Transaction) => {
    try {
      const html = buildInvoiceHtml(txn);
      // @ts-ignore - optional dependency resolved at runtime
      const Print = await import("expo-print");
      // @ts-ignore - optional dependency resolved at runtime
      const Sharing = await import("expo-sharing");
      const { uri } = await Print.printToFileAsync({ html });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: "application/pdf",
          dialogTitle: "Share Invoice",
          UTI: "com.adobe.pdf",
        });
      } else {
        Alert.alert("Saved", `Invoice saved at: ${uri}`);
      }

      // Log admin download event (single invoice)
      try {
        await addDoc(collection(db, "owners", shopId, "invoiceDownloads"), {
          shopId,
          customerId,
          transactionId: txn.id,
          invoiceType: "single",
          createdAt: serverTimestamp(),
          platform: Platform.OS,
          source: "CustomerProfile",
        });
      } catch (logErr) {
        console.warn("Failed to log invoice download:", logErr);
      }
    } catch (error) {
      console.error("Failed to generate invoice:", error);
      Alert.alert("Error", "Could not generate invoice PDF.");
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

        {/* Row with Add Transaction, Record Payment and Download Statement */}
        <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 12 }}>
          <TouchableOpacity
            className="bg-blue-500 rounded-lg py-2 px-3"
            onPress={() =>
              router.push({ pathname: "/(ownerTabs)/AddTransaction", params: { customerId, shopId } })
            }
            style={{ flex: 1, marginRight: 6 }}
          >
            <Text className="text-white font-bold text-center text-sm">+ Add Transaction</Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="bg-blue-500 rounded-lg py-2 px-3"
            onPress={openPaymentModal}
            accessibilityLabel="record-offline-payment"
            style={{ flex: 1, marginRight: 6 }}
          >
            <Text className="text-white font-bold text-center text-sm">Record Payment</Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="bg-blue-500 rounded-lg py-2 px-3"
            onPress={() => setShowStatementModal(true)}
            accessibilityLabel="download-statement"
            style={{ flex: 1 }}
          >
            <Text className="text-white font-bold text-center text-sm">Download Statement</Text>
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
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <Text
                    className={`font-semibold ${item.type === "due" ? "text-red-600" : "text-green-600"}`}
                    style={{ marginRight: 12 }}
                  >
                    {item.type === "due" ? "+" : "-"}₹{item.amount}
                  </Text>
                  <TouchableOpacity
                    onPress={() => handleDownloadInvoice(item)}
                    accessibilityLabel={`download-invoice-${item.id}`}
                  >
                    <Feather name="download" size={20} color="#2563EB" />
                  </TouchableOpacity>
                </View>
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

        {/* ========== Statement Range Modal ========== */}
        <Modal visible={showStatementModal} animationType="fade" transparent>
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={modalStyles.container}
          >
            <View style={modalStyles.inner}>
              <Text style={modalStyles.title}>Download Statement</Text>
              <Text style={modalStyles.label}>From</Text>
              <TouchableOpacity
                onPress={() => setShowFromPicker(true)}
                style={[modalStyles.input, { justifyContent: "center" }]}
              >
                <Text>{fromDate || "Select start date"}</Text>
              </TouchableOpacity>

              <Text style={[modalStyles.label, { marginTop: 8 }]}>To</Text>
              <TouchableOpacity
                onPress={() => setShowToPicker(true)}
                style={[modalStyles.input, { justifyContent: "center" }]}
              >
                <Text>{toDate || "Select end date"}</Text>
              </TouchableOpacity>

              <View style={{ flexDirection: "row", justifyContent: "flex-end", marginTop: 12 }}>
                <Pressable onPress={() => setShowStatementModal(false)} style={modalStyles.buttonOutline}>
                  <Text style={modalStyles.buttonOutlineText}>Cancel</Text>
                </Pressable>

                <Pressable
                  onPress={handleDownloadStatement}
                  style={[modalStyles.buttonPrimary, processingStatement ? { opacity: 0.6 } : {}]}
                  disabled={processingStatement}
                >
                  <Text style={modalStyles.buttonPrimaryText}>
                    {processingStatement ? "Preparing..." : "Download"}
                  </Text>
                </Pressable>
              </View>

              {/* Date Pickers */}
              {DateTimePickerComponent && showFromPicker && (
                <DateTimePickerComponent
                  value={fromDate ? new Date(fromDate) : new Date()}
                  mode="date"
                  display={Platform.OS === "ios" ? "spinner" : "default"}
                  onChange={(event: any, selectedDate?: Date) => {
                    setShowFromPicker(Platform.OS === "ios");
                    if (selectedDate) {
                      const yyyy = selectedDate.getFullYear();
                      const mm = String(selectedDate.getMonth() + 1).padStart(2, "0");
                      const dd = String(selectedDate.getDate()).padStart(2, "0");
                      setFromDate(`${yyyy}-${mm}-${dd}`);
                    }
                  }}
                />
              )}
              {DateTimePickerComponent && showToPicker && (
                <DateTimePickerComponent
                  value={toDate ? new Date(toDate) : new Date()}
                  mode="date"
                  display={Platform.OS === "ios" ? "spinner" : "default"}
                  onChange={(event: any, selectedDate?: Date) => {
                    setShowToPicker(Platform.OS === "ios");
                    if (selectedDate) {
                      const yyyy = selectedDate.getFullYear();
                      const mm = String(selectedDate.getMonth() + 1).padStart(2, "0");
                      const dd = String(selectedDate.getDate()).padStart(2, "0");
                      setToDate(`${yyyy}-${mm}-${dd}`);
                    }
                  }}
                />
              )}
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
  segment: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    paddingVertical: 10,
    marginRight: 8,
    borderRadius: 8,
    alignItems: "center",
  },
  segmentText: {
    color: "#111827",
    fontWeight: "600",
  },
  segmentActive: {
    backgroundColor: "#4F46E5",
    borderColor: "#4F46E5",
  },
  segmentActiveText: {
    color: "#fff",
    fontWeight: "700",
  },
});

export default CustomerProfile;
