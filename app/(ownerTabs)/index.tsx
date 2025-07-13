import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { LinearGradient } from 'expo-linear-gradient';
import { Link, useRouter } from 'expo-router';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, doc, limit, onSnapshot, orderBy, query, where } from 'firebase/firestore';
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
  const [analyticsData, setAnalyticsData] = useState<any>({ paidCustomers: 0, customersWithDue: 0, totalDue: 0, totalCreditGiven: 0 });
  const [customers, setCustomers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<any[]>([]);

  const pieData = [
    { key: 1, value: analyticsData?.paidCustomers || 0, svg: { fill: '#10B981' } },
    { key: 2, value: analyticsData?.customersWithDue || 0, svg: { fill: '#F59E0B' } },
    { key: 3, value: analyticsData?.totalDue || 0, svg: { fill: '#EF4444' } },
  ];

  useEffect(() => {
  const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
    if (user) {
      const uid = user.uid;
      console.log('Authenticated UID:', uid);

      const ownerRef = doc(db, 'owners', uid);
      const analyticsRef = doc(db, 'analytics', uid);
      const productsDocRef = doc(db, 'products', uid);
      const transactionsRef = query(
        collection(db, 'transactions'),
        where('ownerId', '==', uid),
        orderBy('date', 'desc'),
        limit(5)
      );
      const customersRef = query(
        collection(db, 'customers'),
        where('shopsJoined', 'array-contains', uid) // ✅ correct logic: using owner's UID
      );

      const cleanupFns: (() => void)[] = [];

      const unsubProfile = onSnapshot(ownerRef, (docSnap) => {
        if (docSnap.exists()) {
          setUserProfile({ uid: docSnap.id, ...docSnap.data() });
        }
        setLoading(false);
      });

      const unsubCustomers = onSnapshot(customersRef, (querySnapshot) => {
        const list: any[] = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          list.push({ id: doc.id, ...data, due: data.due || 0 });
        });
        console.log('Fetched customers based on UID:', list);
        setCustomers(list);
      });

      const unsubAnalytics = onSnapshot(analyticsRef, (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          console.log('Fetched analytics data:', data);
          setAnalyticsData(data);
        } else {
          console.log('No analytics data found, using defaults');
          setAnalyticsData({ paidCustomers: 0, customersWithDue: 0, totalDue: 0, totalCreditGiven: 0 });
        }
      });

      const unsubProducts = onSnapshot(productsDocRef, (docSnap) => {
        if (docSnap.exists()) {
          const productList = docSnap.data().products || [];
          const formatted = productList.map((item: any) => ({
            ...item,
            price: Number(item.price),
          }));
          console.log('Fetched products:', formatted);
          setProducts(formatted);
        } else {
          console.log('No products found for owner');
          setProducts([]);
        }
      });

      const unsubTransactions = onSnapshot(transactionsRef, (querySnapshot) => {
        const list: any[] = [];
        querySnapshot.forEach((doc) => list.push({ id: doc.id, ...doc.data() }));
        console.log('Fetched transactions:', list);
        setRecentTransactions(list);
      });

      cleanupFns.push(unsubProfile, unsubCustomers, unsubAnalytics, unsubProducts, unsubTransactions);

      return () => {
        cleanupFns.forEach((fn) => fn());
        unsubscribeAuth();
      };
    } else {
      setLoading(false);
    }
  });

  return () => unsubscribeAuth();
}, []);


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
  console.log('dueCustomers count:', dueCustomers.length, 'list:', dueCustomers);

  return (
    <SafeAreaView className="flex-1 bg-[#F7F7F7]">
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        {/* Header */}
        <View className="flex-row justify-between items-center mb-6">
          <View className="flex-row items-center">
            <Image source={iconMap['shop.png']} className="w-6 h-6 mr-2" />
            <Text className="text-xl font-bold text-gray-900">ShopMunim</Text>
          </View>
          <TouchableOpacity>
            <Image source={iconMap['bell.png']} className="w-6 h-6" />
          </TouchableOpacity>
        </View>

        {/* Welcome */}
        <View className="flex-row items-center justify-between mb-6">
          <View>
            <Text className="text-gray-500 text-sm">Welcome back,</Text>
            <Text className="text-lg font-bold text-gray-900">{userProfile?.name || 'Owner'}</Text>
          </View>
          <Image
            source={{ uri: 'https://randomuser.me/api/portraits/men/32.jpg' }}
            className="w-12 h-12 rounded-full"
          />
        </View>

        {/* Shop Link Card */}
        <View className="bg-white rounded-xl p-4 mb-6 flex-row items-center">
          <View className="bg-indigo-100 p-3 rounded-full mr-3">
            <Image source={iconMap['link.png']} className="w-5 h-5" />
          </View>
          <View className="flex-1">
            <Text className="text-xs text-gray-500">Your Shop Link</Text>
            <Text className="text-sm text-gray-700 truncate w-[200px] mb-3">
              {userProfile?.shopLink ? `${userProfile.shopLink}` : 'No shop link available'}
            </Text>
            <View className="flex-row space-x-2">
              <TouchableOpacity className="bg-[#4b91f3] px-3 py-1 rounded-lg" onPress={copyToClipboard}>
                <Text className="text-xs text-white">Copy</Text>
              </TouchableOpacity>
              <TouchableOpacity className="bg-white px-3 py-1 rounded-lg border border-gray-200" onPress={onShare}>
                <Text className="text-xs text-[#4b91f3]">Share</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <View className="flex-row justify-between mb-6">
          <TouchableOpacity className="items-center bg-white p-3 rounded-xl w-[49%]">
            <Image source={iconMap['rupee-circle.png']} className="w-6 h-6 mb-1" />
            <Text className="text-xs text-center p-2 text-gray-700">New Credit</Text>
          </TouchableOpacity>
          <TouchableOpacity className="items-center bg-white p-3 rounded-xl w-[49%]">
            <Ionicons name="cube" size={24} color="#3b91f3" style={{ marginBottom: 4 }} />
            <Text className="text-xs text-center p-2 text-gray-700">Shop QR</Text>
          </TouchableOpacity>
        </View>

        {/* Analytics Grid */}
        <Text className="text-gray-700 font-semibold mb-2">Analytics</Text>
        
        
        
        <View className="flex-row flex-wrap justify-between mb-6">
          <View className="w-[48%] bg-white p-4 rounded-xl mb-4 shadow-lg items-center">
            <View className="bg-indigo-100 p-3 rounded-full mb-2">
              <Image source={iconMap['user.png']} className="w-5 h-5" />
            </View>
            <Text className="text-lg font-bold text-indigo-500">{customers.length}</Text>
            <Text className="text-sm text-gray-500">Customers</Text>
          </View>
          <View className="w-[48%] bg-white p-4 rounded-xl mb-4 shadow items-center">
            <View className="bg-green-100 p-3 rounded-full mb-2">
              <Image source={iconMap['check.png']} className="w-5 h-5" />
            </View>
            <Text className="text-lg font-bold text-green-600">{analyticsData?.paidCustomers || 0}</Text>
            <Text className="text-sm text-gray-500">Paid</Text>
          </View>
          <View className="w-[48%] bg-white p-4 rounded-xl mb-4 shadow items-center">
            <View className="bg-yellow-100 p-3 rounded-full mb-2">
              <Image source={iconMap['clock.png']} className="w-5 h-5" />
            </View>
            <Text className="text-lg font-bold text-yellow-600">{analyticsData?.customersWithDue || 0}</Text>
            <Text className="text-sm text-gray-500">With Due</Text>
          </View>
          <View className="w-[48%] bg-white p-4 rounded-xl mb-4 shadow items-center">
            <View className="bg-red-100 p-3 rounded-full mb-2">
              <Image source={iconMap['rupee.png']} className="w-5 h-5" />
            </View>
            <Text className="text-lg font-bold text-red-600">₹{analyticsData?.totalDue?.toFixed(2) || '0.00'}</Text>
            <Text className="text-sm text-gray-500">Total Due</Text>
          </View>
        </View>

        {/* Credit Summary */}
        <LinearGradient colors={['#6468E5', '#5FA0F9']} className="rounded-2xl p-4 mb-6 flex-row justify-between items-center">
          <View>
            <Text className="text-white text-sm font-medium">Total Credit Given</Text>
            <Text className="text-white text-2xl font-extrabold mt-3">₹{analyticsData?.totalCreditGiven?.toFixed(2) || '0.00'}</Text>
          </View>
          <TouchableOpacity className="bg-white rounded-full py-2 px-4 mt-2">
            <Text className="text-[#6468E5] font-semibold text-sm">Collect Payment</Text>
          </TouchableOpacity>
        </LinearGradient>

        {/* Customer List */}
        <View className="mb-6 bg-white p-4 rounded-lg shadow-md border border-gray-200">
          <Text className="text-lg font-bold text-gray-800 mb-4">Customers</Text>
          {customers.length > 0 ? (
            customers.slice(0, 3).map((cust, index) => (
              <TouchableOpacity
                key={index}
                className="flex-row justify-between items-center py-2 border-b border-gray-100 last:border-b-0"
                onPress={() => {
                  if (!ownerUid) {
                    Alert.alert('Error', 'Unable to identify shop. Please sign in again.');
                    return;
                  }
                  router.push({
                    pathname: '/(ownerTabs)/CustomerProfile',
                    params: {
                      customerId: cust.id,
                      shopId: ownerUid,
                    },
                  });
                }}
              >
                <View className="flex-row items-center">
                  <Image source={iconMap['user.png']} className="w-10 h-10 rounded-full mr-3" />
                  <View>
                    <Text className="text-gray-700 font-medium">{cust.name}</Text>
                    <Text className="text-xs text-gray-500">Last: {cust.lastActivity || 'N/A'}</Text>
                  </View>
                </View>
                <Text className={`font-bold ${cust.due === 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {cust.due === 0 ? 'Paid' : `Due ₹${cust.due?.toFixed(2)}`}
                </Text>
              </TouchableOpacity>
            ))
          ) : (
            <Text className="text-gray-500">No customers found.</Text>
          )}
          <Link href="./customers" className="text-blue-600 text-sm mt-3 self-end">View All</Link>
        </View>

        {/* Recent Transactions */}
        <View className="mb-6 bg-white p-4 rounded-lg shadow-md border border-gray-200">
          <Text className="text-lg font-bold text-gray-800 mb-4">Recent Transactions</Text>
          {recentTransactions.length > 0 ? (
            recentTransactions.map((txn, index) => (
              <View key={index} className="flex-row justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
                <View className="flex-row items-center">
                  <Image
                    source={iconMap[txn.productName?.toLowerCase() + '.png'] || iconMap['rupee.png']}
                    className="w-8 h-8 mr-3"
                  />
                  <View>
                    <Text className="text-gray-700 font-medium">{txn.description || txn.productName || 'Transaction'}</Text>
                    <Text className="text-gray-500 text-xs">{txn.date?.toDate ? new Date(txn.date.toDate()).toLocaleDateString() : 'N/A'}</Text>
                  </View>
                </View>
                <Text className={`font-bold ${txn.type === 'credit' || txn.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  ₹{txn.amount?.toFixed(2) || '0.00'}
                </Text>
              </View>
            ))
          ) : (
            <Text className="text-gray-500">No recent transactions.</Text>
          )}
          <Link href="/(customerTabs)/history" className="text-blue-600 text-sm mt-3 self-end">See All</Link>
        </View>

        {/* Products */}
        <View className="mb-6 bg-white p-4 rounded-lg shadow-md border border-gray-200">
          <Text className="text-lg font-bold text-gray-800 mb-4">Products</Text>
          {products.length > 0 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="py-2">
              {products.map((product, index) => (
                <View key={index} className="w-32 bg-gray-50 p-3 rounded-lg mr-3 items-center border border-gray-100">
                  <Text className="text-gray-800 font-medium text-center">{product.name}</Text>
                  <Text className="text-gray-600 text-sm">₹{product.price?.toFixed(2) || '0.00'}</Text>
                </View>
              ))}
            </ScrollView>
          ) : (
            <Text className="text-gray-500">No products found.</Text>
          )}
          <Link href="./products" className="text-blue-600 text-sm mt-3 self-end">Manage</Link>
        </View>

        {/* ── REMINDER BANNER ── */}
        {Array.isArray(customers) && customers.filter(c => Number(c?.due || 0) > 0).length > 0 && (
          <LinearGradient
            colors={['#FDDE8E', '#FBA5A4']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            className="p-4 rounded-xl mb-8 flex-row items-center"
          >
            <Image
              source={iconMap['reminder-bell.png']}
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
                  const dueCustomers = customers.filter(c => Number(c?.due || 0) > 0);
                  if (dueCustomers.length === 0) return;

                  dueCustomers.forEach((cust) => {
                    console.log(`Reminder sent to ${cust.name} - ₹${cust.due.toFixed(2)}`);
                  });

                  Alert.alert('Reminders Sent', `${dueCustomers.length} customer(s) reminded.`);
                }}
              >
                <Text className="text-center text-red-600 font-semibold">
                  Remind Now
                </Text>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}