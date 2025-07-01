import React, { useEffect, useState } from 'react';
import { View, Text, Image, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { getAuth } from 'firebase/auth';
import { db } from '../../firebaseConfig';
import { doc, getDoc, collection, getDocs } from 'firebase/firestore';
import { PieChart } from 'react-native-chart-kit';
import { iconMap } from '@/constants/iconMap';

const screenWidth = Dimensions.get('window').width;

export default function CustomerHomeScreen() {
  const [customer, setCustomer] = useState<any>(null);
  const [shops, setShops] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [spent, setSpent] = useState(1820);
  const [due, setDue] = useState(1200);

  useEffect(() => {
    const fetchCustomerData = async () => {
      const user = getAuth().currentUser;
      if (!user) return;

      const customerDoc = await getDoc(doc(db, 'customers', user.uid));
      if (!customerDoc.exists()) return;

      const customerData = customerDoc.data();
      setCustomer(customerData);

      // Fetch joined shops
      const joinedShops: string[] = customerData.shopsJoined || [];
      const shopsData = [];
      for (const shopId of joinedShops) {
        const shopDoc = await getDoc(doc(db, 'shops', shopId));
        if (shopDoc.exists()) {
          shopsData.push({ id: shopId, ...shopDoc.data() });
        }
      }
      setShops(shopsData);

      // Fetch transactions from all shops
      const txnList: any[] = [];
      for (const shopId of joinedShops) {
        const txnSnap = await getDocs(collection(db, 'transactions', shopId, 'list'));
        txnSnap.forEach((doc) => txnList.push(doc.data()));
      }
      setTransactions(txnList);

      // Fetch products from first shop (just for demo)
      if (joinedShops.length > 0) {
        const prodSnap = await getDocs(collection(db, 'products', joinedShops[0], 'list'));
        const prodList = prodSnap.docs.map(doc => doc.data());
        setProducts(prodList);
      }
    };

    fetchCustomerData();
  }, []);

  const spendingChartData = [
    {
      name: 'Spent',
      population: spent,
      color: '#6366F1',
      legendFontColor: '#6366F1',
      legendFontSize: 14,
    },
    {
      name: 'Due',
      population: due,
      color: '#EF4444',
      legendFontColor: '#EF4444',
      legendFontSize: 14,
    },
  ];

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        {/* Welcome */}
        <View className="flex-row items-center justify-between mb-6">
          <View>
            <Text className="text-gray-500 text-sm">Welcome back,</Text>
            <Text className="text-lg font-bold text-gray-900">
              {customer?.name || 'User'}
            </Text>
          </View>
          <Image
            source={{ uri: 'https://randomuser.me/api/portraits/men/32.jpg' }}
            className="w-12 h-12 rounded-full"
          />
        </View>

        {/* Profile Card */}
        <LinearGradient
          colors={['#6468E5', '#5FA0F9']}
          className="rounded-2xl p-4 flex-row justify-between items-center mb-6"
        >
          <View className="flex-1">
            <Text className="text-white text-sm">Hello,</Text>
            <Text className="text-white text-xl font-bold mt-1">{customer?.name}</Text>
            <Text className="text-white text-xs mt-2 opacity-90">
              Track your purchases and dues from all your favourite shops.
            </Text>
          </View>
          <Image
            source={{ uri: 'https://randomuser.me/api/portraits/men/32.jpg' }}
            className="w-12 h-12 rounded-full ml-4"
          />
        </LinearGradient>

        {/* Spending Chart */}
        <Text className="text-gray-800 text-base font-semibold mb-3">Your Spending</Text>
        <View className="flex-row justify-between mb-6">
          <View className="w-[48%] bg-white p-4 rounded-xl shadow items-center">
            <View className="bg-indigo-100 p-3 rounded-full mb-2 w-10 h-10 items-center justify-center">
              <Image source={iconMap['rupee.png']} className="w-5 h-5" />
            </View>
            <Text className="text-lg font-bold text-indigo-600">₹{spent}</Text>
            <Text className="text-sm text-gray-500">Total Spent</Text>
          </View>
          <View className="w-[48%] bg-white p-4 rounded-xl shadow items-center">
            <View className="bg-red-100 p-3 rounded-full mb-2 w-10 h-10 items-center justify-center">
              <Image source={iconMap['clock.png']} className="w-5 h-5" />
            </View>
            <Text className="text-lg font-bold text-red-600">₹{due}</Text>
            <Text className="text-sm text-gray-500">Total Due</Text>
          </View>
        </View>
        <View className="items-center bg-white p-4 rounded-2xl shadow mb-6">
          <PieChart
            data={spendingChartData}
            width={screenWidth - 40}
            height={220}
            chartConfig={{ color: () => '#000' }}
            accessor="population"
            backgroundColor="transparent"
            paddingLeft="15"
            hasLegend={false}
            absolute
          />
          <View className="flex-row justify-center mt-4 space-x-6">
            <View className="flex-row items-center">
              <View className="w-3 h-3 rounded-full bg-[#6366F1] mr-2" />
              <Text className="text-indigo-600 text-sm">Spent</Text>
            </View>
            <View className="flex-row items-center">
              <View className="w-3 h-3 rounded-full bg-[#EF4444] mr-2" />
              <Text className="text-red-500 text-sm">Due</Text>
            </View>
          </View>
        </View>

        {/* Shops List */}
        <View className="mb-6">
          <Text className="text-gray-700 font-semibold text-lg mb-2">Your Shops</Text>
          {shops.map((shop) => (
            <View key={shop.id} className="flex-row items-center bg-white p-3 rounded-xl mb-1 shadow-sm">
              <Image source={iconMap['shop.png']} className="w-10 h-10 mr-3" />
              <View className="flex-1">
                <Text className="text-base font-medium text-gray-900">{shop.name}</Text>
              </View>
              <TouchableOpacity>
                <Image source={iconMap['arrow-right.png']} className="w-4 h-4" />
              </TouchableOpacity>
            </View>
          ))}
        </View>

        {/* Recent Transactions */}
        <View className="mb-6">
          <Text className="text-gray-700 font-semibold text-lg mb-2">Recent Transactions</Text>
          {transactions.map((txn, index) => (
            <View key={index} className="flex-row items-center bg-white p-3 rounded-xl mb-1 shadow-sm">
              <Image source={iconMap[txn.icon || 'tea.png']} className="w-5 h-5 mr-3" />
              <View className="flex-1">
                <Text className="text-base text-gray-900 font-medium">{txn.label}</Text>
                <Text className="text-xs text-gray-500">To: {txn.to}</Text>
              </View>
              <Text className="text-base font-semibold text-gray-900">{txn.amount}</Text>
            </View>
          ))}
        </View>

        {/* Products */}
        <View className="mb-6">
          <Text className="text-gray-700 font-semibold text-lg mb-2">Products</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {products.map((prod, i) => (
              <View key={i} className="w-24 h-24 bg-white rounded-xl mx-1 items-center justify-center shadow-sm">
                <Image source={iconMap[prod.icon || 'tea.png']} className="w-8 h-8 mb-1" />
                <Text className="text-xs text-gray-900">{prod.name}</Text>
                <Text className="text-xs text-gray-500">₹{prod.price}</Text>
              </View>
            ))}
          </ScrollView>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}