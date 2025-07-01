// import * as FileSystem from 'expo-file-system';
// import * as Sharing from 'expo-sharing';
import { collection, getDocs, orderBy, query, where } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { auth, db } from "../../firebaseConfig";
import { Transaction } from "../../types";
// import * as MailComposer from 'expo-mail-composer';

export default function CustomerHistory() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filter, setFilter] = useState<"all" | "paid" | "due" | "advance">("all");

  useEffect(() => {
    loadTransactions();
  }, []);

  const loadTransactions = async () => {
    const user = auth.currentUser;
    if (!user) return;

    try {
      const transactionsQuery = query(
        collection(db, "transactions"),
        where("customerId", "==", user.uid),
        orderBy("createdAt", "desc")
      );

      const transactionsSnapshot = await getDocs(transactionsQuery);
      const transactionsData = transactionsSnapshot.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() } as Transaction)
      );

      setTransactions(transactionsData);
    } catch (error) {
      console.error("Error loading transactions:", error);
    }
  };

  const filteredTransactions = transactions.filter(
    (transaction) => filter === "all" || transaction.type === filter
  );

  // const handleDownloadReceipt = async (transaction: Transaction) => {
  //   const receiptText = `Receipt\n\nTransaction ID: ${transaction.id}\nDate: ${new Date(transaction.createdAt).toLocaleString()}\nType: ${transaction.type}\nAmount: ₹${transaction.amount.toFixed(2)}\nDescription: ${transaction.description || 'N/A'}`;
  //   const fileUri = FileSystem.cacheDirectory + `receipt-${transaction.id}.txt`;
  //   await FileSystem.writeAsStringAsync(fileUri, receiptText);
  //   await Sharing.shareAsync(fileUri, { dialogTitle: 'Share or Save Receipt' });
  // };

  // const handleEmailReceipt = async (transaction: Transaction) => {
  //   const receiptText = `Receipt\n\nTransaction ID: ${transaction.id}\nDate: ${new Date(transaction.createdAt).toLocaleString()}\nType: ${transaction.type}\nAmount: ₹${transaction.amount.toFixed(2)}\nDescription: ${transaction.description || 'N/A'}`;
  //   await MailComposer.composeAsync({
  //     subject: `Receipt for Transaction ${transaction.id}`,
  //     body: receiptText,
  //   });
  // };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Transaction History</Text>
      </View>

      <View style={styles.filterContainer}>
        {["all", "paid", "due", "advance"].map((filterType) => (
          <TouchableOpacity
            key={filterType}
            style={[styles.filterButton, filter === filterType && styles.filterButtonActive]}
            onPress={() => setFilter(filterType as any)}
          >
            <Text
              style={[
                styles.filterButtonText,
                filter === filterType && styles.filterButtonTextActive,
              ]}
            >
              {filterType.charAt(0).toUpperCase() + filterType.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.section}>
        {filteredTransactions.length === 0 ? (
          <Text style={styles.emptyText}>No transactions found</Text>
        ) : (
          filteredTransactions.map((transaction) => (
            <View key={transaction.id} style={styles.transactionCard}>
              <View style={styles.transactionInfo}>
                <Text style={styles.transactionDescription}>
                  {transaction.description || "Transaction"}
                </Text>
                <Text style={styles.transactionDate}>
                  {new Date(transaction.createdAt).toLocaleDateString()}
                </Text>
                <Text style={styles.transactionType}>Type: {transaction.type.toUpperCase()}</Text>
              </View>
              <View style={{ alignItems: "flex-end" }}>
                <Text
                  style={[
                    styles.transactionAmount,
                    transaction.type === "due"
                      ? styles.dueAmount
                      : transaction.type === "advance"
                      ? styles.advanceAmount
                      : styles.paidAmount,
                  ]}
                >
                  ₹{transaction.amount.toFixed(2)}
                </Text>
                {/* <TouchableOpacity
                <TouchableOpacity
                  style={styles.downloadButton}
                  onPress={() => handleDownloadReceipt(transaction)}
                >
                  <Text style={styles.downloadButtonText}>Download Receipt</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.downloadButton, { backgroundColor: '#34C759', marginTop: 4 }]}
                  onPress={() => handleEmailReceipt(transaction)}
                >
                  <Text style={styles.downloadButtonText}>Email Receipt</Text>
                </TouchableOpacity> */}
                {/* </TouchableOpacity> */}
              </View>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 8,
    color: "#333",
  },
  subtitle: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 32,
    color: "#666",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
    backgroundColor: "white",
  },
  button: {
    backgroundColor: "#007AFF",
    borderRadius: 8,
    padding: 16,
    alignItems: "center",
    marginBottom: 16,
  },
  buttonDisabled: {
    backgroundColor: "#ccc",
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  linkButton: {
    alignItems: "center",
  },
  linkText: {
    color: "#007AFF",
    fontSize: 16,
  },
  roleContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 32,
  },
  roleButton: {
    flex: 1,
    marginHorizontal: 8,
    padding: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "#ddd",
    alignItems: "center",
    backgroundColor: "white",
  },
  roleButtonSelected: {
    borderColor: "#007AFF",
    backgroundColor: "#007AFF",
  },
  roleButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  roleButtonTextSelected: {
    color: "white",
  },
  formContainer: {
    marginTop: 16,
  },
  header: {
    marginBottom: 24,
    paddingTop: 40,
  },
  welcomeText: {
    fontSize: 16,
    color: "#666",
  },
  nameText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
  },
  summaryContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: "white",
    padding: 16,
    borderRadius: 8,
    marginHorizontal: 4,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryLabel: {
    fontSize: 14,
    color: "#666",
    marginBottom: 8,
  },
  summaryAmount: {
    fontSize: 20,
    fontWeight: "bold",
  },
  dueAmount: {
    color: "#FF3B30",
  },
  advanceAmount: {
    color: "#34C759",
  },
  paidAmount: {
    color: "#007AFF",
  },
  section: {
    backgroundColor: "white",
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 16,
    color: "#333",
  },
  emptyText: {
    textAlign: "center",
    color: "#666",
    fontStyle: "italic",
  },
  transactionCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  transactionInfo: {
    flex: 1,
  },
  transactionDescription: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
  },
  transactionDate: {
    fontSize: 14,
    color: "#666",
    marginTop: 4,
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: "bold",
  },
  filterContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginVertical: 12,
  },
  filterButton: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: "#e0e0e0",
  },
  filterButtonActive: {
    backgroundColor: "#1e88e5",
  },
  filterButtonText: {
    color: "#333",
    fontSize: 14,
  },
  transactionType: {
    fontSize: 14,
    fontWeight: "600",
    marginTop: 4,
    color: "#555",
  },
  filterButtonTextActive: {
    color: "#fff",
    fontWeight: "bold",
  },
  downloadButton: {
    marginTop: 8,
    backgroundColor: "#007AFF",
    borderRadius: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  downloadButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
  },
});
