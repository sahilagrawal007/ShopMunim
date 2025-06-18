import * as Clipboard from 'expo-clipboard'; // Assuming you have expo-clipboard installed for copy functionality
import { Link, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, doc, onSnapshot, query, where } from 'firebase/firestore';
import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Image, ScrollView, Share, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { auth, db } from '../../firebaseConfig'; // Correct import path

const ownerDashboard = () => {
  const [userProfile, setUserProfile] = useState<any>(null);
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [totalCreditGiven, setTotalCreditGiven] = useState<number>(0);
  const [customers, setCustomers] = useState<any[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        // Fetch User Profile from 'owners' collection
        const userDocRef = doc(db, 'owners', user.uid);
        const unsubscribeUserProfile = onSnapshot(userDocRef, (docSnap) => {
          if (docSnap.exists()) {
            setUserProfile(docSnap.data());
            console.log("User profile fetched:", docSnap.data());
          } else {
            console.log("No user profile found in Firestore for UID:", user.uid);
            setUserProfile(null);
          }
        }, (error) => {
          console.error("Error fetching user profile:", error);
        });

        // Fetch Analytics Data
        const analyticsCollectionRef = collection(db, 'analytics');
        const qAnalytics = query(analyticsCollectionRef, where('ownerId', '==', user.uid));
        const unsubscribeAnalytics = onSnapshot(qAnalytics, (querySnapshot) => {
          const data: any[] = [];
          querySnapshot.forEach((doc) => {
            data.push({ id: doc.id, ...doc.data() });
          });
          setAnalyticsData(data.length > 0 ? data[0] : null); // Assuming one analytics document per owner
          console.log("Analytics data fetched:", data);
          if (data.length === 0) {
            console.log("No analytics data found for this owner.");
          }
        }, (error) => {
          console.error("Error fetching analytics data:", error);
        });

        // Fetch Total Credit Given
        // Assuming 'totalCredit' is a field in the analytics document, or a separate collection
        const totalCreditRef = collection(db, 'totalCredit'); // Example collection, adjust if needed
        const qTotalCredit = query(totalCreditRef, where('ownerId', '==', user.uid));
        const unsubscribeTotalCredit = onSnapshot(qTotalCredit, (querySnapshot) => {
          const data: any[] = [];
          querySnapshot.forEach((doc) => {
            data.push({ id: doc.id, ...doc.data() });
          });
          if (data.length > 0 && data[0].amount) {
            setTotalCreditGiven(data[0].amount);
          } else {
            setTotalCreditGiven(0);
            console.log("No total credit given data found for this owner.");
          }
        }, (error) => {
          console.error("Error fetching total credit given:", error);
        });

        // Fetch Customers
        const customersCollectionRef = collection(db, 'customers');
        const qCustomers = query(customersCollectionRef, where('ownerId', '==', user.uid));
        const unsubscribeCustomers = onSnapshot(qCustomers, (querySnapshot) => {
          const data: any[] = [];
          querySnapshot.forEach((doc) => {
            data.push({ id: doc.id, ...doc.data() });
          });
          setCustomers(data);
          console.log("Customers fetched:", data);
          if (data.length === 0) {
            console.log("No customers found for this owner.");
          }
        }, (error) => {
          console.error("Error fetching customers:", error);
        });

        // Fetch Recent Transactions (last 5, sorted by date)
        const transactionsCollectionRef = collection(db, 'transactions');
        const qTransactions = query(transactionsCollectionRef, where('ownerId', '==', user.uid));
        const unsubscribeTransactions = onSnapshot(qTransactions, (querySnapshot) => {
          const data: any[] = [];
          querySnapshot.forEach((doc) => {
            data.push({ id: doc.id, ...doc.data() });
          });
          setRecentTransactions(data.sort((a, b) => b.date?.seconds - a.date?.seconds).slice(0, 5));
          console.log("Recent transactions fetched:", data);
          if (data.length === 0) {
            console.log("No recent transactions found for this owner.");
          }
        }, (error) => {
          console.error("Error fetching recent transactions:", error);
        });

        // Fetch Products
        const productsCollectionRef = collection(db, 'products');
        const qProducts = query(productsCollectionRef, where('ownerId', '==', user.uid));
        const unsubscribeProducts = onSnapshot(qProducts, (querySnapshot) => {
          const data: any[] = [];
          querySnapshot.forEach((doc) => {
            data.push({ id: doc.id, ...doc.data() });
          });
          setProducts(data);
          console.log("Products fetched:", data);
          if (data.length === 0) {
            console.log("No products found for this owner.");
          }
          setLoading(false);
        }, (error) => {
          console.error("Error fetching products:", error);
          setLoading(false);
        });

        return () => {
          unsubscribeUserProfile();
          unsubscribeAnalytics();
          unsubscribeTotalCredit();
          unsubscribeCustomers();
          unsubscribeTransactions();
          unsubscribeProducts();
        };
      } else {
        router.replace('/(auth)/login');
      }
      setLoading(false);
    });

    return () => unsubscribeAuth();
  }, []);

  const copyToClipboard = useCallback(async () => {
    if (userProfile?.shopLink) {
      const link = `https://yourshop.com/${userProfile.shopLink}`;
      await Clipboard.setStringAsync(link);
      Alert.alert('Copied!', 'Shop link copied to clipboard.');
    } else {
      Alert.alert('Error', 'No shop link to copy.');
    }
  }, [userProfile?.shopLink]);

  const onShare = useCallback(async () => {
    try {
      if (userProfile?.shopLink) {
        const result = await Share.share({
          message: `Check out my shop: https://yourshop.com/${userProfile.shopLink} - ${userProfile.shopName}`,
          url: `https://yourshop.com/${userProfile.shopLink}`,
          title: 'My Shop Link'
        });
        if (result.action === Share.sharedAction) {
          if (result.activityType) {
            // shared with activity type of result.activityType
          } else {
            // shared
          }
        } else if (result.action === Share.dismissedAction) {
          // dismissed
        }
      } else {
        Alert.alert('Error', 'No shop link to share.');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  }, [userProfile?.shopLink, userProfile?.shopName]);


  if (loading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-gray-100">
        <Text className="text-lg text-gray-700">Loading dashboard...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView className="flex-1 p-4 bg-gray-100">
        <StatusBar style="dark" />
        {/* Header */}
        <View className="flex-row justify-between items-center mb-6">
          <Text className="text-2xl font-bold text-gray-800">ShopMunim</Text>
          <TouchableOpacity onPress={() => router.push('/(ownerTabs)/settings')}>
            <Image source={require('../../assets/images/bell.png')} className="w-6 h-6" resizeMode="contain" />
          </TouchableOpacity>
        </View>

        {/* Welcome and Avatar */}
        <View className="flex-row justify-between items-center mb-8 bg-blue-100 p-4 rounded-lg shadow-sm">
          <View>
            <Text className="text-base text-gray-600">
              Welcome back,
            </Text>
            <Text className="text-xl font-semibold text-blue-800">
              {userProfile?.name || 'Owner'}!
            </Text>
          </View>
          <Image source={require('../../assets/images/user.png')} className="w-16 h-16 rounded-full border-2 border-blue-500" />
        </View>

        {/* Shop Link Card */}
        <View className="bg-white p-5 rounded-lg shadow-md mb-6 border border-gray-200">
          <View className="flex-row items-center mb-3">
            {/* Placeholder for QR Code */}
            <Image source={require('../../assets/images/icon.png')} className="w-16 h-16 mr-4" resizeMode="contain" />
            <View className="flex-1">
              <Text className="text-gray-600 text-sm font-semibold mb-1">Your Shop Link</Text>
              <Text className="text-blue-600 text-base font-medium">
                {userProfile?.shopLink ? `https://yourshop.com/${userProfile.shopLink}` : 'No shop link available'}
              </Text>
            </View>
          </View>
          <View className="flex-row justify-end items-center mt-3">
            <TouchableOpacity onPress={copyToClipboard} className="mr-3 p-2 rounded-md bg-blue-500 flex-row items-center">
              <Image source={require('../../assets/images/link.png')} className="w-4 h-4 mr-1 tint-white" resizeMode="contain" />
              <Text className="text-white font-semibold">Copy</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={onShare} className="p-2 rounded-md bg-blue-500 flex-row items-center">
              <Image source={require('../../assets/images/arrow-right.png')} className="w-4 h-4 mr-1 tint-white" resizeMode="contain" />
              <Text className="text-white font-semibold">Share</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Analytics Grid */}
        <View className="flex-row flex-wrap justify-between mb-6">
          <View className="w-[48%] bg-white p-4 rounded-lg shadow-md border border-gray-200 items-center justify-center mb-4">
            <Image source={require('../../assets/images/user.png')} className="w-10 h-10 mb-2" resizeMode="contain" />
            <Text className="text-sm text-gray-500 mb-1">Customers</Text>
            <Text className="text-xl font-bold text-purple-600">{customers.length}</Text>
          </View>
          <View className="w-[48%] bg-white p-4 rounded-lg shadow-md border border-gray-200 items-center justify-center mb-4">
            <Image source={require('../../assets/images/check.png')} className="w-10 h-10 mb-2" resizeMode="contain" />
            <Text className="text-sm text-gray-500 mb-1">Paid</Text>
            <Text className="text-xl font-bold text-blue-600">{analyticsData?.paidCustomers || '0'}</Text>
          </View>
          <View className="w-[48%] bg-white p-4 rounded-lg shadow-md border border-gray-200 items-center justify-center">
            <Image source={require('../../assets/images/clock.png')} className="w-10 h-10 mb-2" resizeMode="contain" />
            <Text className="text-sm text-gray-500 mb-1">With Due</Text>
            <Text className="text-xl font-bold text-red-600">{analyticsData?.customersWithDue || '0'}</Text>
          </View>
          <View className="w-[48%] bg-white p-4 rounded-lg shadow-md border border-gray-200 items-center justify-center">
            <Image source={require('../../assets/images/rupee.png')} className="w-10 h-10 mb-2" resizeMode="contain" />
            <Text className="text-sm text-gray-500 mb-1">Total Due</Text>
            <Text className="text-xl font-bold text-red-600">₹{analyticsData?.totalDue?.toFixed(2) || '0.00'}</Text>
          </View>
        </View>

        {/* Credit Summary Bar */}
        <View className="bg-blue-600 p-4 rounded-lg flex-row justify-between items-center mb-6 shadow-md">
          <View>
            <Text className="text-white text-base">Total Credit Given</Text>
            <Text className="text-white text-2xl font-bold">₹{totalCreditGiven.toFixed(2)}</Text>
          </View>
          <TouchableOpacity className="bg-white px-4 py-2 rounded-full flex-row items-center">
            <Image source={require('../../assets/images/wallet.png')} className="w-5 h-5 mr-2" resizeMode="contain" />
            <Text className="text-blue-600 font-semibold">Collect Payment</Text>
          </TouchableOpacity>
        </View>

        {/* Quick Actions */}
        <View className="mb-6">
          <View className="flex-row justify-around">
            <TouchableOpacity className="items-center bg-white p-3 rounded-lg shadow-sm w-1/4 mx-1">
              <Image source={require('../../assets/images/add-customer.png')} className="w-10 h-10 mb-2" resizeMode="contain" />
              <Text className="text-center text-xs text-gray-700">Add Customer</Text>
            </TouchableOpacity>
            <TouchableOpacity className="items-center bg-white p-3 rounded-lg shadow-sm w-1/4 mx-1">
              <Image source={require('../../assets/images/rupee-circle.png')} className="w-10 h-10 mb-2" resizeMode="contain" />
              <Text className="text-center text-xs text-gray-700">New Credit</Text>
            </TouchableOpacity>
            <TouchableOpacity className="items-center bg-white p-3 rounded-lg shadow-sm w-1/4 mx-1">
              <Image source={require('../../assets/images/biscuit.png')} className="w-10 h-10 mb-2" resizeMode="contain" />
              <Text className="text-center text-xs text-gray-700">Products</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Remind Customers Banner */}
        <View className="bg-red-100 p-4 rounded-lg flex-row justify-between items-center mb-6 shadow-sm">
          <View className="flex-row items-center flex-1">
            <Image source={require('../../assets/images/reminder-bell.png')} className="w-8 h-8 mr-3 tint-orange-500" resizeMode="contain" />
            <View className="flex-1">
              <Text className="text-orange-800 font-semibold text-base">Remind customers for due payments</Text>
              <Text className="text-orange-600 text-sm mt-1">Send payment reminders to customers with pending dues.</Text>
            </View>
          </View>
          <TouchableOpacity className="bg-orange-500 px-4 py-2 rounded-full ml-4">
            <Text className="text-white font-semibold">Remind Now</Text>
          </TouchableOpacity>
        </View>

        {/* Customer List */}
        <View className="mb-6 bg-white p-4 rounded-lg shadow-md border border-gray-200">
          <Text className="text-lg font-bold text-gray-800 mb-4">Customers</Text>
          {customers.length > 0 ? (
            customers.map((cust, index) => (
              <View key={index} className="flex-row justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
                <View className="flex-row items-center">
                  <Image source={require('../../assets/images/user.png')} className="w-10 h-10 rounded-full mr-3" resizeMode="contain" />
                  <View>
                    <Text className="text-gray-700 font-medium">{cust.name}</Text>
                    <Text className="text-xs text-gray-500">Last: {cust.lastActivity || 'N/A'}</Text>
                  </View>
                </View>
                <View className="flex-row items-center">
                  <Text className={`font-bold ${cust.due === 0 ? 'text-green-600' : 'text-red-600'} mr-2`}>
                    {cust.due === 0 ? 'Paid' : `Due ₹${cust.due?.toFixed(2)}`}
                  </Text>
                  <TouchableOpacity>
                    <Image source={require('../../assets/images/arrow-right.png')} className="w-4 h-4 tint-gray-500" resizeMode="contain" />
                  </TouchableOpacity>
                </View>
              </View>
            ))
          ) : (
            <Text className="text-gray-500">No customers found.</Text>
          )}
          <Link href="/(ownerTabs)/customers" className="text-blue-600 text-sm mt-3 self-end">
            View All
          </Link>
        </View>

        {/* Recent Transactions */}
        <View className="mb-6 bg-white p-4 rounded-lg shadow-md border border-gray-200">
          <Text className="text-lg font-bold text-gray-800 mb-4">Recent Transactions</Text>
          {recentTransactions.length > 0 ? (
            recentTransactions.map((transaction, index) => (
              <View key={index} className="flex-row justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
                <View className="flex-row items-center">
                  {/* Assuming you have a way to map transaction types to icons, or use a default */}
                  <Image
                    source={(() => {
                      switch (transaction.productName) {
                        case 'Tea': return require('../../assets/images/tea.png');
                        case 'Biscuits': return require('../../assets/images/biscuit.png');
                        case 'Cigarettes': return require('../../assets/images/cigarette.png');
                        default: return require('../../assets/images/rupee.png');
                      }
                    })()} 
                    className="w-8 h-8 mr-3" resizeMode="contain" 
                  />
                  <View>
                    <Text className="text-gray-700 font-medium">{transaction.description || transaction.productName || 'Transaction'}</Text>
                    <Text className="text-gray-500 text-xs">{transaction.date?.toDate ? new Date(transaction.date.toDate()).toLocaleDateString() : 'N/A'}</Text>
                  </View>
                </View>
                <Text className={`font-bold ${transaction.type === 'credit' || transaction.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  ₹{transaction.amount?.toFixed(2) || '0.00'}
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
                <View key={index} className="w-32 bg-gray-50 p-3 rounded-lg mr-3 items-center border border-gray-100">
                  <Image 
                    source={(() => {
                      switch (product.name) {
                        case 'Tea': return require('../../assets/images/tea.png');
                        case 'Biscuits': return require('../../assets/images/biscuit.png');
                        case 'Cigarettes': return require('../../assets/images/cigarette.png');
                        case 'Burger': return require('../../assets/images/burger.png');
                        default: return require('../../assets/images/shop.png'); // Generic icon for other products
                      }
                    })()} 
                    className="w-16 h-16 mb-2" 
                    resizeMode="contain" 
                  />
                  <Text className="text-gray-800 font-medium text-center">{product.name || 'Product'}</Text>
                  <Text className="text-gray-600 text-sm">₹{product.price?.toFixed(2) || '0.00'}</Text>
                </View>
              ))}
            </ScrollView>
          ) : (
            <Text className="text-gray-500">No products found.</Text>
          )}
          <Link href="/(ownerTabs)/products" className="text-blue-600 text-sm mt-3 self-end">
            Manage
          </Link>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
};

export default ownerDashboard;