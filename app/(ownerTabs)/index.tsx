import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { LinearGradient } from 'expo-linear-gradient';
import { Link, useRouter } from 'expo-router';
import { onAuthStateChanged } from 'firebase/auth';
import { addDoc, collection, doc, limit, onSnapshot, query, where, updateDoc, getDocs } from 'firebase/firestore';
import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Image, ScrollView, Share, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { iconMap } from '../../constants/iconMap';
import { auth, db } from '../../firebaseConfig';

export default function DashboardScreen() {
  const ownerUid = auth.currentUser?.uid; //for storing owner id in transaction collection
  const router = useRouter();
  const [userProfile, setUserProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [analyticsData, setAnalyticsData] = useState({
    paidCustomers: 0,
    customersWithDue: 0,
    totalDue: 0,
    totalCustomers: 0,
    totalCreditGiven: 0,
  });
  const [customers, setCustomers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<any[]>([]);
  const [allTransactions, setAllTransactions] = useState<any[]>([]);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [allTransactionsCount, setAllTransactionsCount] = useState<number>(0);
  const [sendingNotifications, setSendingNotifications] = useState(false);
  const [lastNotificationSent, setLastNotificationSent] = useState<string | null>(null);

  // Function to calculate analytics from transactions (primary method)
  const calculateAnalyticsFromTransactions = (transactionList: any[], customerList: any[]) => {
    const customerMap: Record<string, { paid: number; due: number; credit: number }> = {};

    console.log('🔍 Processing transactions for analytics:', transactionList.length, 'transactions');
    console.log('📋 Raw transaction data:', transactionList.map(tx => ({
      id: tx.id,
      customerId: tx.customerId,
      type: tx.type,
      amount: tx.amount,
      description: tx.description
    })));

    transactionList.forEach((tx) => {
      const cid = tx.customerId;
      if (!customerMap[cid]) {
        customerMap[cid] = { paid: 0, due: 0, credit: 0 };
      }

      const amount = Number(tx.amount) || 0;
      console.log(`💰 Transaction: ${tx.type} - ₹${amount} for customer ${cid}`);

      if (tx.type === 'paid' || tx.type === 'advance') {
        customerMap[cid].paid += amount;
        console.log(`✅ Added to paid: ${customerMap[cid].paid}`);
      } else if (tx.type === 'due') {
        customerMap[cid].due += amount;
        customerMap[cid].credit += amount;
        console.log(`❌ Added to due: ${customerMap[cid].due}`);
      } else {
        console.log(`⚠️ Unknown transaction type: ${tx.type}, amount: ${amount}`);
      }
    });

    // Use the actual customer list length, not just from transactions
    const totalCustomers = Array.isArray(customerList) ? customerList.length : Object.keys(customerMap).length;
    let paidCustomers = 0;
    let customersWithDue = 0;
    let totalDue = 0;

    console.log('📊 Customer balances from transactions:');
    Object.entries(customerMap).forEach(([cid, { paid, due }]) => {
      // Calculate net balance (due - paid)
      const netBalance = due - paid;
      console.log(`👤 Customer ${cid}: Due ₹${due}, Paid ₹${paid}, Net Balance ₹${netBalance}`);
      
      if (netBalance > 0) {
        customersWithDue++;
        totalDue += netBalance;
      } else {
        paidCustomers++;
      }
    });

    // Reflect net outstanding credit in the summary
    const totalCreditGiven = totalDue;

    const analytics = {
      paidCustomers,
      customersWithDue,
      totalDue,
      totalCreditGiven,
      totalCustomers,
    };
    console.log('📊 Computed Analytics from Transactions:', analytics);
    console.log('💰 Transaction Details:', customerMap);
    setAnalyticsData(analytics);
  };

  // Function to calculate analytics from customer data (fallback)
  const calculateAnalyticsFromCustomers = (customerList: any[]) => {
    const totalCustomers = customerList.length;
    let customersWithDue = 0;
    let totalDue = 0;
    let paidCustomers = 0;

    customerList.forEach((customer) => {
      const due = Number(customer.due) || 0;
      
      // According to user's logic:
      // Positive balance = Customer owes money (has dues)
      // Negative balance = Customer has paid in advance or is fully paid
      if (due > 0) {
        customersWithDue++;
        totalDue += due;
      } else {
        paidCustomers++;
      }
    });

    const analytics = {
      paidCustomers,
      customersWithDue,
      totalDue,
      totalCreditGiven: totalDue, // Total due amount is the credit given
      totalCustomers,
    };
    console.log('📊 Computed Analytics from Customers (fallback):', analytics);
    console.log('📋 Customer Details:', customerList.map(c => ({
      name: c.name,
      due: c.due,
      balance: c.due > 0 ? `Owes ₹${c.due}` : `Paid/Advance ₹${Math.abs(c.due)}`
    })));
    setAnalyticsData(analytics);
  };

  // Function to send payment collection notifications to customers with pending dues
  const sendPaymentCollectionNotifications = async () => {
    if (!ownerUid || !userProfile?.shopName) {
      Alert.alert('Error', 'Shop information not available. Please try again.');
      return;
    }

    // Debug: Log current analytics before sending notifications
    console.log('📊 Analytics before sending notifications:', analyticsData);

    // Check if notifications were recently sent (spam prevention)
    if (!canSendNotifications()) {
      const lastSent = new Date(lastNotificationSent!);
      const nextAllowed = new Date(lastSent.getTime() + (6 * 60 * 60 * 1000));
      const hoursLeft = Math.ceil((nextAllowed.getTime() - new Date().getTime()) / (1000 * 60 * 60));
      
      Alert.alert(
        'Notifications Recently Sent', 
        `Payment reminders were sent recently. You can send new reminders in ${hoursLeft} hour(s).`,
        [{ text: 'OK' }]
      );
      return;
    }

    setSendingNotifications(true);
    
    try {
      // Get customers with pending dues
      const customersWithDue = customers.filter(customer => {
        const customerTransactions = allTransactions.filter(tx => tx.customerId === customer.id);
        const calculatedBalance = customerTransactions.reduce((sum, tx) => {
          if (tx.type === "due") return sum + tx.amount;
          if (tx.type === "paid" || tx.type === "advance") return sum - tx.amount;
          return sum;
        }, 0);
        return calculatedBalance > 0;
      });

      if (customersWithDue.length === 0) {
        Alert.alert('No Dues', 'All customers are up to date with their payments.');
        return;
      }

      let notificationsSent = 0;
      let failedNotifications = 0;

      // Send notifications to each customer with pending dues
      for (const customer of customersWithDue) {
        try {
          const customerTransactions = allTransactions.filter(tx => tx.customerId === customer.id);
          const calculatedBalance = customerTransactions.reduce((sum, tx) => {
            if (tx.type === "due") return sum + tx.amount;
            if (tx.type === "paid" || tx.type === "advance") return sum - tx.amount;
            return sum;
          }, 0);

          // Create notification record in Firestore
          const notificationData = {
            shopId: ownerUid,
            shopName: userProfile.shopName,
            customerId: customer.id,
            customerName: customer.name,
            customerPhone: customer.phone || customer.phoneNumber,
            type: 'payment_collection',
            title: 'Payment Reminder',
            message: `Dear ${customer.name}, you have a pending payment of ₹${calculatedBalance.toFixed(2)} at ${userProfile.shopName}. Please clear your dues at your earliest convenience.`,
            amount: calculatedBalance,
            status: 'sent',
            createdAt: new Date().toISOString(),
            read: false,
            shopOwnerName: userProfile.name || 'Shop Owner'
          };

          // Add to notifications collection
          await addDoc(collection(db, 'notifications'), notificationData);

          // Update customer's last notification sent
          if (customer.id) {
            try {
              await updateDoc(doc(db, 'customers', customer.id), {
                lastPaymentReminder: new Date().toISOString(),
                lastReminderAmount: calculatedBalance
              });
            } catch (updateError) {
              console.log('Could not update customer reminder info:', updateError);
            }
          }

          notificationsSent++;
          console.log(`📱 Notification sent to ${customer.name} for ₹${calculatedBalance.toFixed(2)}`);

        } catch (error) {
          console.error(`Failed to send notification to ${customer.name}:`, error);
          failedNotifications++;
        }
      }

      // Show results
      if (failedNotifications === 0) {
        Alert.alert(
          'Notifications Sent Successfully!', 
          `${notificationsSent} payment reminder(s) sent to customers with pending dues.`,
          [{ text: 'OK' }]
        );
        
        // Update last notification sent time
        setLastNotificationSent(new Date().toISOString());
      } else {
        Alert.alert(
          'Notifications Partially Sent', 
          `${notificationsSent} notification(s) sent successfully. ${failedNotifications} failed.`,
          [{ text: 'OK' }]
        );
        
        // Update last notification sent time even if some failed
        if (notificationsSent > 0) {
          setLastNotificationSent(new Date().toISOString());
        }
      }

      // Log the action for analytics
      await addDoc(collection(db, 'notificationLogs'), {
        shopId: ownerUid,
        action: 'bulk_payment_reminders',
        customersNotified: notificationsSent,
        totalAmount: customersWithDue.reduce((sum, c) => {
          const customerTransactions = allTransactions.filter(tx => tx.customerId === c.id);
          const calculatedBalance = customerTransactions.reduce((sum, tx) => {
            if (tx.type === "due") return sum + tx.amount;
            if (tx.type === "paid" || tx.type === "advance") return sum - tx.amount;
            return sum;
          }, 0);
          return sum + calculatedBalance;
        }, 0),
        timestamp: new Date().toISOString()
      });

      // Update last notification sent time in owner profile
      try {
        await updateDoc(doc(db, 'owners', ownerUid), {
          lastPaymentRemindersSent: new Date().toISOString()
        });
      } catch (updateError) {
        console.log('Could not update owner notification info:', updateError);
      }

    } catch (error) {
      console.error('Error sending payment collection notifications:', error);
      Alert.alert('Error', 'Failed to send notifications. Please try again.');
    } finally {
      setSendingNotifications(false);
      
      // Debug: Log analytics after sending notifications to ensure they haven't changed
      console.log('📊 Analytics after sending notifications:', analyticsData);
    }
  };

  // Function to check if notifications were recently sent (spam prevention)
  const canSendNotifications = () => {
    if (!lastNotificationSent) return true;
    
    const lastSent = new Date(lastNotificationSent);
    const now = new Date();
    const timeDiff = now.getTime() - lastSent.getTime();
    const hoursDiff = timeDiff / (1000 * 60 * 60);
    
    // Allow sending notifications only once every 6 hours
    return hoursDiff >= 6;
  };

  // Test function to add sample transactions (for debugging)
  const addTestTransactions = async () => {
    if (!ownerUid) return;
    
    try {
      const testTransactions = [
        {
          shopId: ownerUid,
          customerId: customers[0]?.id,
          amount: 150,
          type: "due",
          description: "Tea x3, Biscuit x2",
          createdAt: new Date().toISOString(),
        },
        {
          shopId: ownerUid,
          customerId: customers[1]?.id,
          amount: 200,
          type: "due",
          description: "Coffee x2, Cake x1",
          createdAt: new Date().toISOString(),
        },
        {
          shopId: ownerUid,
          customerId: customers[2]?.id,
          amount: 100,
          type: "due",
          description: "Water x5",
          createdAt: new Date().toISOString(),
        }
      ];

      for (const transaction of testTransactions) {
        await addDoc(collection(db, "transactions"), transaction);
      }
      
      Alert.alert("Success", "Test transactions added!");
    } catch (error) {
      console.error("Error adding test transactions:", error);
      Alert.alert("Error", "Failed to add test transactions");
    }
  };

  // Test function to add sample payment transactions (for debugging)
  const addTestPaymentTransactions = async () => {
    if (!ownerUid) return;
    
    try {
      const testTransactions = [
        {
          shopId: ownerUid,
          customerId: customers[0]?.id,
          amount: 50,
          type: "paid",
          description: "Partial payment",
          createdAt: new Date().toISOString(),
        },
        {
          shopId: ownerUid,
          customerId: customers[1]?.id,
          amount: 100,
          type: "paid",
          description: "Payment received",
          createdAt: new Date().toISOString(),
        }
      ];

      for (const transaction of testTransactions) {
        await addDoc(collection(db, "transactions"), transaction);
      }
      
      Alert.alert("Success", "Test payment transactions added!");
    } catch (error) {
      console.error("Error adding test payment transactions:", error);
      Alert.alert("Error", "Failed to add test payment transactions");
    }
  };

  useEffect(() => {
  const cleanupFns: (() => void)[] = [];
  const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
    if (user) {
      const uid = user.uid;
      console.log('🔐 Authenticated UID:', uid);

      try {
        // Owner Profile
        const ownerRef = doc(db, 'owners', uid);
        const unsubProfile = onSnapshot(ownerRef, (docSnap) => {
          if (!auth.currentUser) return;
          if (docSnap.exists()) {
            const data = docSnap.data();
            console.log('👤 Owner profile data:', data);
            setUserProfile({ uid: docSnap.id, ...data });
            setProfileImage(data.photoURL || auth.currentUser?.photoURL || null);
            
            // Load last notification sent time
            if (data.lastPaymentRemindersSent) {
              setLastNotificationSent(data.lastPaymentRemindersSent);
            }
          } else {
            console.log('❌ No owner profile found for UID:', uid);
          }
          setLoading(false);
        }, (error) => {
          console.error('❌ Error fetching owner profile:', error);
          setLoading(false);
        });
        cleanupFns.push(unsubProfile);

        // Products
        const productsDocRef = doc(db, 'products', uid);
        const unsubProducts = onSnapshot(productsDocRef, (docSnap) => {
          if (docSnap.exists()) {
            const productList = docSnap.data().products || [];
            const formatted = productList.map((item: any) => ({
              ...item,
              price: Number(item.price),
            }));
            console.log("📦 Fetched products:", formatted);
            setProducts(formatted);
          } else {
            console.log("📦 No products found for owner");
            setProducts([]);
          }
        }, (error) => {
          console.error('❌ Error fetching products:', error);
          setProducts([]);
        });
        cleanupFns.push(unsubProducts);

        // Customers - try both queries
        const customersRef1 = query(
          collection(db, 'customers'),
          where('shopsJoined', 'array-contains', uid)
        );

        const unsubCustomers1 = onSnapshot(customersRef1, (querySnapshot) => {
          if (!auth.currentUser) return;
          const list: any[] = [];
          querySnapshot.forEach((doc) => {
            const data = doc.data();
            list.push({ id: doc.id, ...data, due: Number(data.due) || 0 });
          });
          console.log('👥 Fetched customers (method 1):', list);
          if (list.length > 0) {
            setCustomers(list);
            // Don't calculate analytics here - wait for transactions to be loaded
            console.log('📊 Customers loaded, waiting for transactions to calculate analytics');
          }
        }, (error) => {
          console.error('❌ Error fetching customers (method 1):', error);
        });
        cleanupFns.push(unsubCustomers1);

        

        // Transactions - This will be used to calculate real balances
        const transactionsRef = query(
          collection(db, 'transactions'),
          where('shopId', '==', uid),
          limit(5)
        );
        const unsubTransactions = onSnapshot(transactionsRef, (querySnapshot) => {
          if (!auth.currentUser) return;
          const list: any[] = [];
          querySnapshot.forEach((doc) => {
            const data = doc.data();
            list.push({ id: doc.id, ...data });
          });
          console.log('💰 Fetched transactions:', list);
          setRecentTransactions(list);
        }, (error) => {
          console.error('❌ Error fetching transactions:', error);
          setRecentTransactions([]);
        });
        cleanupFns.push(unsubTransactions);

        // All Transactions for Analytics Calculation
        const allTransactionsRef = query(
          collection(db, 'transactions'),
          where('shopId', '==', uid)
        );
        const unsubAllTransactions = onSnapshot(allTransactionsRef, (querySnapshot) => {
          if (!auth.currentUser) return;
          const list: any[] = [];
          querySnapshot.forEach((doc) => {
            const data = doc.data();
            list.push({ id: doc.id, ...data });
          });
          console.log('💰 Fetched ALL transactions for analytics:', list);
          
          // Only update and recalculate if the transaction data has actually changed
          const hasChanged = list.length !== allTransactions.length || 
            JSON.stringify(list.map(t => ({ id: t.id, amount: t.amount, type: t.type }))) !== 
            JSON.stringify(allTransactions.map(t => ({ id: t.id, amount: t.amount, type: t.type })));
          
          if (hasChanged) {
            console.log('🔄 Transaction data changed, updating analytics');
            setAllTransactions(list);
            setAllTransactionsCount(list.length);
            
            // Calculate analytics from transactions if customers are also loaded
            if (list.length > 0 && Array.isArray(customers) && customers.length > 0) {
              console.log('📊 Both customers and transactions loaded, calculating analytics from transactions');
              calculateAnalyticsFromTransactions(list, customers);
            } else if (list.length === 0 && Array.isArray(customers) && customers.length > 0) {
              console.log('📊 No transactions found, using customer data for analytics');
              calculateAnalyticsFromCustomers(customers);
            } else {
              console.log('📊 Waiting for both customers and transactions to be loaded');
            }
          } else {
            console.log('🔄 Transaction data unchanged, skipping analytics recalculation');
            setAllTransactionsCount(list.length);
          }
        }, (error) => {
          console.error('❌ Error fetching all transactions:', error);
        });
        cleanupFns.push(unsubAllTransactions);
        
      } catch (error) {
        console.error('❌ Error in data fetching:', error);
        setLoading(false);
      }
    } else {
      console.log('❌ No authenticated user');
      cleanupFns.forEach((fn) => fn());
      setLoading(false);
    }
  });

  return () => {
    cleanupFns.forEach((fn) => fn());
    unsubscribeAuth();
  };
}, []);


  // Keep total customer count in sync with the actual customers list
  useEffect(() => {
    setAnalyticsData((prev) => ({
      ...prev,
      totalCustomers: Array.isArray(customers) ? customers.length : 0,
    }));
  }, [customers]);

  // Recalculate analytics when both customers and transactions are available
  useEffect(() => {
    console.log('📊 useEffect triggered:', {
      customersLength: Array.isArray(customers) ? customers.length : 'not array',
      transactionsLength: Array.isArray(allTransactions) ? allTransactions.length : 'not array',
      customersLoaded: Array.isArray(customers) && customers.length > 0,
      transactionsLoaded: Array.isArray(allTransactions)
    });

    if (Array.isArray(customers) && customers.length > 0 && Array.isArray(allTransactions)) {
      if (allTransactions.length > 0) {
        console.log('📊 useEffect: Both customers and transactions available, calculating analytics from transactions');
        calculateAnalyticsFromTransactions(allTransactions, customers);
      } else {
        console.log('📊 useEffect: Only customers available, calculating analytics from customers');
        calculateAnalyticsFromCustomers(customers);
      }
    } else {
      console.log('📊 useEffect: Waiting for data to be fully loaded');
    }
  }, [customers, allTransactions]);

  const copyToClipboard = useCallback(async () => {
    if (userProfile?.shopLink) {
      const link = `${userProfile.shopLink}`;
      await Clipboard.setStringAsync(link);
      Alert.alert('Copied!', 'Shop link copied to clipboard.');
    } else {
      Alert.alert('Error', 'No shop link found.');
    }
  }, [userProfile?.shopLink]);

  const onShare = useCallback(async () => {
    if (userProfile?.shopLink && userProfile?.shopName) {
      try {
        await Share.share({
          message: `Check out my shop: ${userProfile.shopLink} - ${userProfile.shopName}`,
        });
      } catch (error: any) {
        Alert.alert('Error', error.message);
      }
    } else {
      Alert.alert('Error', 'Shop details not available.');
    }
  }, [userProfile?.shopLink, userProfile?.shopName]);

  if (loading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-gray-100">
        <Text className="text-lg text-gray-700">Loading dashboard...</Text>
      </SafeAreaView>
    );
  }

  const dueCustomers = Array.isArray(customers)
    ? customers.filter(c => Number(c?.due || 0) > 0)
    : [];

  return (
    <SafeAreaView edges={["top", "left", "right"]} className="flex-1 bg-[#F7F7F7]">
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        {/* Header */}
        <View className="flex-row justify-between items-center mb-6">
          <View className="flex-row items-center">
            <Image source={iconMap["shop.png"]} className="w-6 h-6 mr-2" />
            <Text className="text-xl font-bold text-gray-900">ShopMunim</Text>
          </View>
          <TouchableOpacity>
            <Image source={iconMap["bell.png"]} className="w-6 h-6" />
          </TouchableOpacity>
        </View>

        {/* Welcome */}
        <View className="flex-row items-center justify-between mb-6">
          <View>
            <Text className="text-gray-500 text-sm">Welcome back,</Text>
            <Text className="text-lg font-bold text-gray-900">{userProfile?.name || "Owner"}</Text>
          </View>
          <TouchableOpacity onPress={() => router.push("/(ownerTabs)/EditProfile")}>
            <Image
              source={profileImage ? { uri: profileImage } : iconMap["user.png"]}
              className="w-12 h-12 rounded-full border-2 border-gray-200"
              style={{ resizeMode: profileImage ? 'cover' : 'contain' }}
            />
          </TouchableOpacity>
        </View>

        {/* Shop Link Card */}
        <View className="bg-white rounded-xl p-4 mb-6 flex-row items-center">
          <TouchableOpacity
            className="bg-indigo-100 p-3 rounded-full mr-3"
            onPress={() => router.push("/(ownerTabs)/qr")}
          >
            <Ionicons name="qr-code-outline" size={20} color="#4F46E5" />
          </TouchableOpacity>
          <View className="flex-1">
            <Text className="text-xs text-gray-500">Your Shop Link</Text>
            <Text className="text-sm text-gray-700 truncate w-[200px] mb-3">
              {userProfile?.shopLink ? `${userProfile.shopLink}` : "No shop link available"}
            </Text>
            <View className="flex-row space-x-2">
              <TouchableOpacity
                className="bg-[#4b91f3] px-3 py-1 rounded-lg"
                onPress={copyToClipboard}
              >
                <Text className="text-xs text-white">Copy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="bg-white px-3 py-1 rounded-lg border border-gray-200"
                onPress={onShare}
              >
                <Text className="text-xs text-[#4b91f3]">Share</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        {/* <View className="flex-row justify-between mb-6">
          <TouchableOpacity className="items-center bg-white p-3 rounded-xl w-[49%]">
            <Image source={iconMap["rupee-circle.png"]} className="w-6 h-6 mb-1" />
            <Text className="text-xs text-center p-2 text-gray-700">New Credit</Text>
          </TouchableOpacity>
          <TouchableOpacity className="items-center bg-white p-3 rounded-xl w-[49%]">
            <Ionicons name="cube" size={24} color="#3b91f3" style={{ marginBottom: 4 }} />
            <Text className="text-xs text-center p-2 text-gray-700">Shop QR</Text>
          </TouchableOpacity>
        </View> */}

        {/* Analytics Grid */}
        <Text className="text-gray-700 font-semibold mb-2">Analytics</Text>

        <View className="flex-row flex-wrap justify-between mb-6">
          <View className="w-[48%] bg-white p-4 rounded-xl mb-4 shadow-lg items-center">
            <View className="bg-indigo-100 p-3 rounded-full mb-2">
              <Image source={iconMap["user.png"]} className="w-5 h-5" />
            </View>
            <Text className="text-lg font-bold text-indigo-500">{analyticsData.totalCustomers}</Text>
            <Text className="text-sm text-gray-500">Customers</Text>
          </View>
          <View className="w-[48%] bg-white p-4 rounded-xl mb-4 shadow items-center">
            <View className="bg-green-100 p-3 rounded-full mb-2">
              <Image source={iconMap["check.png"]} className="w-5 h-5" />
            </View>
            <Text className="text-lg font-bold text-green-600">
              {analyticsData.paidCustomers}
            </Text>
            <Text className="text-sm text-gray-500">Paid</Text>
          </View>
          <View className="w-[48%] bg-white p-4 rounded-xl mb-4 shadow items-center">
            <View className="bg-yellow-100 p-3 rounded-full mb-2">
              <Image source={iconMap["clock.png"]} className="w-5 h-5" />
            </View>
            <Text className="text-lg font-bold text-yellow-600">
              {analyticsData.customersWithDue}
            </Text>
            <Text className="text-sm text-gray-500">With Due</Text>
          </View>
          <View className="w-[48%] bg-white p-4 rounded-xl mb-4 shadow items-center">
            <View className="bg-red-100 p-3 rounded-full mb-2">
              <Image source={iconMap["rupee.png"]} className="w-5 h-5" />
            </View>
            <Text className="text-lg font-bold text-red-600">
              ₹{analyticsData.totalDue}
            </Text>
            <Text className="text-sm text-gray-500">Total Due</Text>
          </View>
        </View>

        {/* Debug Section */}
        <View className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
          <Text className="text-yellow-800 text-sm font-semibold mb-2">🔍 Debug Info</Text>
          <Text className="text-yellow-700 text-xs">
            Customers: {Array.isArray(customers) ? customers.length : 'Loading...'} | 
            Transactions: {Array.isArray(allTransactions) ? allTransactions.length : 'Loading...'} | 
            Total Credit: ₹{analyticsData.totalCreditGiven?.toFixed(2) || '0.00'}
          </Text>
          <Text className="text-yellow-600 text-xs mt-1">
            Last Update: {new Date().toLocaleTimeString()}
          </Text>
          <View className="flex-row space-x-2 mt-2">
            <TouchableOpacity 
              className="bg-yellow-600 px-3 py-1 rounded"
              onPress={() => {
                if (Array.isArray(allTransactions) && allTransactions.length > 0 && Array.isArray(customers) && customers.length > 0) {
                  console.log('🧪 Manual analytics recalculation triggered');
                  calculateAnalyticsFromTransactions(allTransactions, customers);
                } else if (Array.isArray(customers) && customers.length > 0) {
                  console.log('🧪 Manual analytics recalculation from customers triggered');
                  calculateAnalyticsFromCustomers(customers);
                } else {
                  Alert.alert('No Data', 'Customers or transactions not loaded yet');
                }
              }}
            >
              <Text className="text-white text-xs">Recalculate Analytics</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              className="bg-blue-600 px-3 py-1 rounded"
              onPress={() => {
                console.log('🧪 Current State:', {
                  customers,
                  allTransactions,
                  analyticsData,
                  allTransactionsCount
                });
                Alert.alert('State Logged', 'Check console for current state');
              }}
            >
              <Text className="text-white text-xs">Log State</Text>
            </TouchableOpacity>
          </View>
          <View className="flex-row space-x-2 mt-2">
            <TouchableOpacity 
              className="bg-green-600 px-3 py-1 rounded"
              onPress={addTestTransactions}
              disabled={!Array.isArray(customers) || customers.length === 0}
            >
              <Text className="text-white text-xs">Add Test Dues</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              className="bg-purple-600 px-3 py-1 rounded"
              onPress={addTestPaymentTransactions}
              disabled={!Array.isArray(customers) || customers.length === 0}
            >
              <Text className="text-white text-xs">Add Test Payments</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Credit Summary */}
        <LinearGradient
          colors={["#6468E5", "#5FA0F9"]}
          className="rounded-2xl p-4 mb-6 flex-row justify-between items-center"
        >
          <View>
            <Text className="text-white text-sm font-medium">Total Credit Given</Text>
            <Text className="text-white text-2xl font-extrabold mt-3">
              ₹{analyticsData.totalCreditGiven?.toFixed(2) || "0.00"}
            </Text>
            {analyticsData.customersWithDue > 0 && (
              <Text className="text-white text-xs mt-1 opacity-90">
                {analyticsData.customersWithDue} customer(s) with pending dues
              </Text>
            )}
          </View>
          <View className="flex-col space-y-2">
            <TouchableOpacity 
              className={`rounded-full py-2 px-4 mt-2 ${
                sendingNotifications || !canSendNotifications() ? 'bg-gray-300' : 'bg-white'
              }`}
              onPress={sendPaymentCollectionNotifications}
              disabled={sendingNotifications || !canSendNotifications()}
            >
              <Text className={`font-semibold text-sm ${
                sendingNotifications || !canSendNotifications() ? 'text-gray-500' : 'text-[#6468E5]'
              }`}>
                {sendingNotifications ? 'Sending...' : 
                 !canSendNotifications() ? 'Recently Sent' : 'Collect Payment'}
              </Text>
            </TouchableOpacity>
            {analyticsData.customersWithDue > 0 && (
              <Text className="text-white text-xs text-center opacity-75">
                {!canSendNotifications() ? 'Reminders sent recently' : 'Tap to send reminders'}
              </Text>
            )}
          </View>
        </LinearGradient>

        {/* Notification Status */}
        {analyticsData.customersWithDue > 0 && (
          <View className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
            <View className="flex-row items-center">
              <Ionicons name="information-circle" size={20} color="#3B82F6" />
              <View className="ml-2 flex-1">
                <Text className="text-blue-800 text-sm">
                  {sendingNotifications 
                    ? 'Sending payment reminders to customers...' 
                    : `Ready to send payment reminders to ${analyticsData.customersWithDue} customer(s) with pending dues.`
                  }
                </Text>
                {lastNotificationSent && !sendingNotifications && (
                  <View>
                    <Text className="text-blue-600 text-xs mt-1">
                      Last sent: {new Date(lastNotificationSent).toLocaleString()}
                    </Text>
                    {!canSendNotifications() && (
                      <Text className="text-orange-600 text-xs mt-1">
                        Next reminder available in {Math.ceil((new Date(lastNotificationSent).getTime() + (6 * 60 * 60 * 1000) - new Date().getTime()) / (1000 * 60 * 60))} hour(s)
                      </Text>
                    )}
                  </View>
                )}
              </View>
            </View>
          </View>
        )}

        {/* Customer List */}
        <View className="mb-6 bg-white p-4 rounded-lg shadow-md border border-gray-200">
          <Text className="text-lg font-bold text-gray-800 mb-4">Customers</Text>
          {customers.length > 0 ? (
                         customers.slice(0, 3).map((cust, index) => {
               // Calculate customer balance from ALL transactions (not just recent ones)
               const customerTransactions = allTransactions.filter(tx => tx.customerId === cust.id);
               const calculatedBalance = customerTransactions.reduce((sum, tx) => {
                 if (tx.type === "due") return sum + tx.amount;
                 if (tx.type === "paid" || tx.type === "advance") return sum - tx.amount;
                 return sum;
               }, 0);
              
              return (
                <TouchableOpacity
                  key={index}
                  className="flex-row justify-between items-center py-2 border-b border-gray-100 last:border-b-0"
                  onPress={() => {
                    if (!ownerUid) {
                      Alert.alert("Error", "Unable to identify shop. Please sign in again.");
                      return;
                    }
                    router.push({
                      pathname: "/(ownerTabs)/CustomerProfile",
                      params: {
                        customerId: cust.id,
                        shopId: ownerUid,
                      },
                    });
                  }}
                >
                  <View className="flex-row items-center">
                    <Image source={iconMap["user.png"]} className="w-10 h-10 rounded-full mr-3" />
                    <View>
                      <Text className="text-gray-700 font-medium">{cust.name}</Text>
                      <Text className="text-xs text-gray-500">
                        Last: {cust.lastActivity || "N/A"}
                      </Text>
                    </View>
                  </View>
                  <Text className={`font-bold ${calculatedBalance <= 0 ? "text-green-600" : "text-red-600"}`}>
                    {calculatedBalance <= 0 ? "Paid" : "Due"}
                  </Text>
                </TouchableOpacity>
              );
            })
          ) : (
            <Text className="text-gray-500">No customers found.</Text>
          )}
          <Link href="/(ownerTabs)/Customers" className="text-blue-600 text-sm mt-3 self-end">
            View All
          </Link>
        </View>



        {/* Products */}
        <View className="mb-6 bg-white p-4 rounded-lg shadow-md border border-gray-200">
          <Text className="text-lg font-bold text-gray-800 mb-4">Products</Text>
          {products.length > 0 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="py-2">
              {products.map((product, index) => (
                <View
                  key={index}
                  className="w-32 p-3 rounded-lg mr-3 items-center border border-blue-300"
                >
                  <Text className="text-gray-800 font-medium text-center">{product.name}</Text>
                  <Text className="text-gray-600 text-sm">
                    ₹{product.price?.toFixed(2) || "0.00"}
                  </Text>
                </View>
              ))}
            </ScrollView>
          ) : (
            <Text className="text-gray-500">No products found.</Text>
          )}
          <Link href="./products" className="text-blue-600 text-sm mt-3 self-end">
            Manage
          </Link>
        </View>

        {/* ── REMINDER BANNER ── */}
        {Array.isArray(customers) &&
          customers.filter((c) => Number(c?.due || 0) > 0).length > 0 && (
            <LinearGradient
              colors={["#FDDE8E", "#FBA5A4"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              className="p-4 rounded-xl mb-8 flex-row items-center"
            >
              <Image
                source={iconMap["reminder-bell.png"]}
                className="w-10 h-10 mr-4 self-start"
                resizeMode="contain"
              />

              <View className="flex-1">
                <Text className="text-base font-semibold text-red-600 mb-1">
                  Remind customers for due payments
                </Text>
                <Text className="text-sm text-gray-800 mb-3">
                  Send payment reminders to customers with pending dues.
                </Text>
                <TouchableOpacity
                  className="bg-white px-4 py-2 rounded-lg w-36"
                  onPress={() => {
                    const dueCustomers = customers.filter((c) => Number(c?.due || 0) > 0);
                    if (dueCustomers.length === 0) return;

                    dueCustomers.forEach((cust) => {
                      console.log(`Reminder sent to ${cust.name} - ₹${cust.due.toFixed(2)}`);
                    });

                    Alert.alert("Reminders Sent", `${dueCustomers.length} customer(s) reminded.`);
                  }}
                >
                  <Text className="text-center text-red-600 font-semibold">Remind Now</Text>
                </TouchableOpacity>
              </View>
            </LinearGradient>
          )}
      </ScrollView>
    </SafeAreaView>
  );
}