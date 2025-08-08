import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { LinearGradient } from 'expo-linear-gradient';
import { Link, useRouter } from 'expo-router';
import { onAuthStateChanged } from 'firebase/auth';
import { addDoc, collection, doc, limit, onSnapshot, query, where } from 'firebase/firestore';
import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Image, ScrollView, Share, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { iconMap } from '../../constants/iconMap';
import { auth, db } from '../../firebaseConfig';

export default function DashboardScreen() {
  const ownerUid = auth.currentUser?.uid;
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
  const [profileImage, setProfileImage] = useState<string | null>(null);

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
          const customersRef2 = query(
            collection(db, 'customers'),
            where('shopId', '==', uid)
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
            }
          }, (error) => {
            console.error('❌ Error fetching customers (method 1):', error);
          });
          cleanupFns.push(unsubCustomers1);

          const unsubCustomers2 = onSnapshot(customersRef2, (querySnapshot) => {
            if (!auth.currentUser) return;
            const list: any[] = [];
            querySnapshot.forEach((doc) => {
              const data = doc.data();
              list.push({ id: doc.id, ...data, due: Number(data.due) || 0 });
            });
            console.log('👥 Fetched customers (method 2):', list);
            if (list.length > 0) {
              setCustomers(list);
            }
          }, (error) => {
            console.error('❌ Error fetching customers (method 2):', error);
          });
          cleanupFns.push(unsubCustomers2);

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
            
            // Calculate analytics from transactions
            if (list.length > 0) {
              calculateAnalyticsFromTransactions(list);
            } else {
              // If no transactions, use customer data as fallback
              if (customers.length > 0) {
                calculateAnalyticsFromCustomers(customers);
              }
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
    console.log('📊 Computed Analytics from Customers:', analytics);
    console.log('📋 Customer Details:', customerList.map(c => ({
      name: c.name,
      due: c.due,
      balance: c.due > 0 ? `Owes ₹${c.due}` : `Paid/Advance ₹${Math.abs(c.due)}`
    })));
    setAnalyticsData(analytics);
  };

  // Function to calculate analytics from transactions (primary method)
  const calculateAnalyticsFromTransactions = (transactionList: any[]) => {
    const customerMap: Record<string, { paid: number; due: number; credit: number }> = {};
    let totalCreditGiven = 0;

    console.log('🔍 Processing transactions for analytics:', transactionList.length, 'transactions');

    transactionList.forEach((tx) => {
      const cid = tx.customerId;
      if (!customerMap[cid]) {
        customerMap[cid] = { paid: 0, due: 0, credit: 0 };
      }

      const amount = Number(tx.amount) || 0;
      console.log(`💰 Transaction: ${tx.type} - ₹${amount} for customer ${cid}`);

      if (tx.type === 'paid' || tx.type === 'advance') {
        customerMap[cid].paid += amount;
      } else if (tx.type === 'due') {
        customerMap[cid].due += amount;
        customerMap[cid].credit += amount;
        totalCreditGiven += amount;
      }
    });

    const totalCustomers = Object.keys(customerMap).length;
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

  const copyToClipboard = useCallback(async () => {
    if (userProfile?.shopLink) {
      const link = userProfile.shopLink;
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
              {userProfile?.shopLink ? userProfile.shopLink : "No shop link available"}
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
          </View>
          <View className="flex-col space-y-2">
            <TouchableOpacity className="bg-white rounded-full py-2 px-4 mt-2">
              <Text className="text-[#6468E5] font-semibold text-sm">Collect Payment</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>

        {/* Customer List */}
        <View className="mb-6 bg-white p-4 rounded-lg shadow-md border border-gray-200">
          <Text className="text-lg font-bold text-gray-800 mb-4">Customers</Text>
          {customers.length > 0 ? (
            customers.slice(0, 3).map((cust, index) => {
              // Calculate customer balance from transactions
              const customerTransactions = recentTransactions.filter(tx => tx.customerId === cust.id);
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
                  <Text className={`font-bold ${calculatedBalance === 0 ? "text-green-600" : "text-red-600"}`}>
                    {calculatedBalance === 0 ? "Paid" : `Due ₹${calculatedBalance?.toFixed(2)}`}
                  </Text>
                </TouchableOpacity>
              );
            })
          ) : (
            <Text className="text-gray-500">No customers found.</Text>
          )}
          <Link href="./Customers" className="text-blue-600 text-sm mt-3 self-end">
            View All
          </Link>
        </View>

        {/* Recent Transactions */}
        <View className="mb-6 bg-white p-4 rounded-lg shadow-md border border-gray-200">
          <Text className="text-lg font-bold text-gray-800 mb-4">Recent Transactions</Text>
          {recentTransactions.length > 0 ? (
            recentTransactions.map((txn, index) => (
              <View
                key={index}
                className="flex-row justify-between items-center py-2 border-b border-gray-100 last:border-b-0"
              >
                <View className="flex-row items-center">
                  <Image
                    source={
                      iconMap[txn.productName?.toLowerCase() + ".png"] || iconMap["rupee.png"]
                    }
                    className="w-8 h-8 mr-3"
                  />
                  <View>
                    <Text className="text-gray-700 font-medium">
                      {txn.description || txn.productName || "Transaction"}
                    </Text>
                    <Text className="text-gray-500 text-xs">
                      {txn.date?.toDate ? new Date(txn.date.toDate()).toLocaleDateString() : "N/A"}
                    </Text>
                  </View>
                </View>
                <Text
                  className={`font-bold ${
                    txn.type === "credit" || txn.amount > 0 ? "text-green-600" : "text-red-600"
                  }`}
                >
                  ₹{txn.amount?.toFixed(2) || "0.00"}
                </Text>
              </View>
            ))
          ) : (
            <Text className="text-gray-500">No recent transactions.</Text>
          )}
          <Link href="/(customerTabs)/history" className="text-blue-600 text-sm mt-3 self-end">
            See All
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