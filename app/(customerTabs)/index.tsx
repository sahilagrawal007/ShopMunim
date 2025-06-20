import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { auth, db } from '../../firebaseConfig';
import { doc, getDoc, collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { Customer, Transaction } from '../../types';

export default function CustomerHome() {
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [totalDue, setTotalDue] = useState(0);
  const [totalAdvance, setTotalAdvance] = useState(0);

  useEffect(() => {
    loadCustomerData();
    loadRecentTransactions();
  }, []);

  const loadCustomerData = async () => {
    const user = auth.currentUser;
    if (!user) return;

    try {
      const customerDoc = await getDoc(doc(db, 'customers', user.uid));
      if (customerDoc.exists()) {
        setCustomer(customerDoc.data() as Customer);
      }
    } catch (error) {
      console.error('Error loading customer data:', error);
    }
  };

  const loadRecentTransactions = async () => {
    const user = auth.currentUser;
    if (!user) return;

    try {
      // Get recent transactions
      const transactionsQuery = query(
        collection(db, 'transactions'),
        where('customerId', '==', user.uid),
        orderBy('createdAt', 'desc'),
        limit(5)
      );
      
      const transactionsSnapshot = await getDocs(transactionsQuery);
      const transactions = transactionsSnapshot.docs.map(doc => 
        ({ id: doc.id, ...doc.data() } as Transaction)
      );
      
      setRecentTransactions(transactions);

      // Calculate totals
      const allTransactionsQuery = query(
        collection(db, 'transactions'),
        where('customerId', '==', user.uid)
      );
      
      const allTransactionsSnapshot = await getDocs(allTransactionsQuery);
      let due = 0;
      let advance = 0;
      
      allTransactionsSnapshot.docs.forEach(doc => {
        const transaction = doc.data() as Transaction;
        if (transaction.type === 'due') {
          due += transaction.amount;
        } else if (transaction.type === 'advance') {
          advance += transaction.amount;
        }
      });
      
      setTotalDue(due);
      setTotalAdvance(advance);
    } catch (error) {
      console.error('Error loading transactions:', error);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.welcomeText}>Welcome back!</Text>
        <Text style={styles.nameText}>{customer?.name}</Text>
      </View>

      <View style={styles.summaryContainer}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Total Due</Text>
          <Text style={[styles.summaryAmount, styles.dueAmount]}>
            ₹{totalDue.toFixed(2)}
          </Text>
        </View>
        
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Total Advance</Text>
          <Text style={[styles.summaryAmount, styles.advanceAmount]}>
            ₹{totalAdvance.toFixed(2)}
          </Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Transactions</Text>
        {recentTransactions.length === 0 ? (
          <Text style={styles.emptyText}>No transactions yet</Text>
        ) : (
          recentTransactions.map((transaction) => (
            <View key={transaction.id} style={styles.transactionCard}>
              <View style={styles.transactionInfo}>
                <Text style={styles.transactionDescription}>
                  {transaction.description || 'Transaction'}
                </Text>
                <Text style={styles.transactionDate}>
                  {new Date(transaction.createdAt).toLocaleDateString()}
                </Text>
              </View>
              <Text style={[
                styles.transactionAmount,
                transaction.type === 'due' ? styles.dueAmount : 
                transaction.type === 'advance' ? styles.advanceAmount : styles.paidAmount
              ]}>
                {transaction.type === 'due' ? '+' : transaction.type === 'advance' ? '+' : '-'}
                ₹{transaction.amount.toFixed(2)}
              </Text>
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
    backgroundColor: '#f5f5f5',
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 32,
    color: '#666',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
    backgroundColor: 'white',
  },
  button: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  linkButton: {
    alignItems: 'center',
  },
  linkText: {
    color: '#007AFF',
    fontSize: 16,
  },
  roleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 32,
  },
  roleButton: {
    flex: 1,
    marginHorizontal: 8,
    padding: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#ddd',
    alignItems: 'center',
    backgroundColor: 'white',
  },
  roleButtonSelected: {
    borderColor: '#007AFF',
    backgroundColor: '#007AFF',
  },
  roleButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  roleButtonTextSelected: {
    color: 'white',
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
    color: '#666',
  },
  nameText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  summaryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
    marginHorizontal: 4,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  summaryAmount: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  dueAmount: {
    color: '#FF3B30',
  },
  advanceAmount: {
    color: '#34C759',
  },
  paidAmount: {
    color: '#007AFF',
  },
  section: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  emptyText: {
    textAlign: 'center',
    color: '#666',
    fontStyle: 'italic',
  },
  transactionCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  transactionInfo: {
    flex: 1,
  },
  transactionDescription: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  transactionDate: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});