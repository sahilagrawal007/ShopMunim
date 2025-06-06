// app/(tabs)/index.tsx

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  Share,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Clipboard from 'expo-clipboard';
import { iconMap } from '../../constants/iconMap';

export default function DashboardScreen() {
  // ── STEP 0: Replace this with real user/shop data once you have login ──
  const [shopLink, setShopLink] = useState<string>('');

  // Simulate fetching the logged-in user's shop link
  useEffect(() => {
    const fetchUserShopLink = async () => {
      // TODO: Replace this with real fetch (e.g., from context or API)
      const dynamicLink = 'https://shopmunim.me/rohit'; // Placeholder
      setShopLink(dynamicLink);
    };
    fetchUserShopLink();
  }, []);

  // ── Copy Shop Link ──
  const handleCopy = async () => {
    if (!shopLink) return;
    await Clipboard.setStringAsync(shopLink);
    Alert.alert('Copied!', 'Shop link copied to clipboard.');
  };

  // ── Share Shop Link ──
  const handleShare = async () => {
    if (!shopLink) return;
    try {
      await Share.share({
        message: shopLink,
        url: shopLink,
        title: 'My Shop Link',
      });
    } catch (error) {
      console.error('Error sharing link:', error);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-[#F7F7F7]">
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        {/* ── HEADER ── */}
        <View className="flex-row justify-between items-center mb-6">
          <View className="flex-row items-center">
            <Image source={iconMap['shop.png']} className="w-6 h-6 mr-2" />
            <Text className="text-xl font-bold text-gray-900">ShopMunim</Text>
          </View>
          <TouchableOpacity>
            <Image source={iconMap['bell.png']} className="w-6 h-6" />
          </TouchableOpacity>
        </View>

        {/* ── WELCOME & AVATAR ── */}
        <View className="flex-row items-center justify-between mb-6">
          <View>
            <Text className="text-gray-500 text-sm">Welcome back,</Text>
            <Text className="text-lg font-bold text-gray-900">
              Rohit Sharma
            </Text>
          </View>
          <Image
            source={{ uri: 'https://randomuser.me/api/portraits/men/32.jpg' }}
            className="w-12 h-12 rounded-full"
          />
        </View>

        {/* ── SHOP LINK CARD ── */}
        <View className="bg-white rounded-xl p-4 mb-6 flex-row items-center">
          <View className="bg-indigo-100 p-3 rounded-full mr-3">
            <Image 
            source={iconMap['link.png']} 
            className="w-5 h-5" 
            />
          </View>

          <View className="flex-1">
            <Text className="text-xs text-gray-500">Your Shop Link</Text>
            <Text
              className="text-sm text-gray-700 truncate w-[200px] mb-3"
              numberOfLines={1}
            >
              {shopLink || 'Loading...'}
            </Text>

            <View className="flex-row space-x-2">
              {/* Copy Button */}
              <TouchableOpacity
                className="bg-[#4b91f3] px-5 py-1 rounded-2xl mr-2"
                onPress={handleCopy}
              >
                <Text className="text-sm text-white">Copy</Text>
              </TouchableOpacity>

              {/* Share Button */}
              <TouchableOpacity
                className="bg-white px-5 py-1 rounded-full border border-[#4b91f3]"
                onPress={handleShare}
              >
                <Text className="text-sm text-[#4b91f3]">Share</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* ── ANALYTICS GRID ── */}
        <Text className="text-gray-700 font-semibold mb-2">Analytics</Text>
        <View className="flex-row flex-wrap justify-between mb-6">
          {[
            {
              icon: 'user.png',
              label: 'Customers',
              value: '37',
              bg: 'bg-indigo-100',
              color: 'text-indigo-500',
            },
            {
              icon: 'check.png',
              label: 'Paid',
              value: '24',
              bg: 'bg-green-100',
              color: 'text-green-600',
            },
            {
              icon: 'clock.png',
              label: 'With Due',
              value: '10',
              bg: 'bg-yellow-100',
              color: 'text-yellow-600',
            },
            {
              icon: 'rupee.png',
              label: 'Total Due',
              value: '₹2,550',
              bg: 'bg-red-100',
              color: 'text-red-600',
            },
          ].map((item, i) => (
            <View
              key={i}
              className="w-[48%] bg-white p-4 rounded-xl mb-4 shadow-sm items-center"
            >
              <View
                className={`${item.bg} p-3 rounded-full mb-2 w-10 h-10 items-center justify-center`}
              >
                <Image 
                    source={iconMap[item.icon]} 
                    className="w-5 h-5" 
                />
              </View>
              <Text className={`text-lg font-bold ${item.color}`}>
                {item.value}
              </Text>
              <Text className="text-sm text-gray-500">{item.label}</Text>
            </View>
          ))}
        </View>

        {/* ── CREDIT SUMMARY BAR ── */}

        <LinearGradient
          colors={['#6468E5', '#5FA0F9']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          className="rounded-2xl p-4 mb-6 flex-row justify-between items-center"
        >
          <View>
            <Text className="text-white text-sm font-medium">
              Total Credit Given
            </Text>
            <Text className="text-white text-2xl font-extrabold mt-3">
              ₹12,350
            </Text>
          </View>

          <View className="flex-col items-end">
            <Image
              source={iconMap['wallet.png']}
              className="w-6 h-6 mb-2 mr-2"
            />
            <TouchableOpacity className="bg-white rounded-full py-2 px-4 mt-2">
              <Text className="text-[#6468E5] font-semibold text-sm">
                Collect Payment
              </Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>

        {/* ── QUICK ACTIONS ── */}
        <View className="flex-row justify-between mb-6">
          {[
            { icon: 'add-customer.png', label: 'Add Customer' },
            { icon: 'rupee-circle.png', label: 'New Credit' },
            { icon: 'menu.png', label: 'Products' },
          ].map((action, i) => (
            <TouchableOpacity
              key={i}
              className="items-center bg-white p-3 rounded-xl w-[30%]"
            >
              <Image 
                source={iconMap[action.icon]} 
                className="w-6 h-6 mb-1" 
              />
              <Text className="text-xs text-center text-gray-700">{action.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── CUSTOMER LIST ── */}
        <View className="mb-6">
          <View className="flex-row justify-between items-center mb-2">
            <Text className="text-gray-700 font-semibold text-lg">
              Customers
            </Text>
            <TouchableOpacity>
              <Text className="text-indigo-600 text-sm">View All</Text>
            </TouchableOpacity>
          </View>
          {[
            {
              id: '1',
              name: 'Priya Singh',
              due: '₹1,200',
              last: '3 days ago',
              avatar: 'https://randomuser.me/api/portraits/women/44.jpg',
            },
            {
              id: '2',
              name: 'Amit Kumar',
              due: '₹0',
              last: '1 day ago',
              avatar: 'https://randomuser.me/api/portraits/men/45.jpg',
            },
            {
              id: '3',
              name: 'Neha Verma',
              due: '₹500',
              last: 'Today',
              avatar: 'https://randomuser.me/api/portraits/women/46.jpg',
            },
          ].map((cust) => (
            <View
              key={cust.id}
              className="flex-row items-center bg-white p-3 rounded-xl mb-3 shadow-sm"
            >
              <Image
                source={{ uri: cust.avatar }}
                className="w-10 h-10 rounded-full mr-3"
              />
              <View className="flex-1">
                <Text className="text-base font-medium text-gray-900">
                  {cust.name}
                </Text>
                <Text className="text-xs text-gray-500">
                  Last: {cust.last}
                </Text>
              </View>
              <Text
                className={`text-sm font-semibold ${
                  cust.due === '₹0' ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {cust.due === '₹0' ? 'Paid' : `Due ${cust.due}`}
              </Text>
              <TouchableOpacity className="ml-2">
                <Image
                  source={iconMap['arrow-right.png']}
                  className="w-4 h-4"
                />
              </TouchableOpacity>
            </View>
          ))}
        </View>

        {/* ── RECENT TRANSACTIONS ── */}
        <View className="mb-6">
          <View className="flex-row justify-between items-center mb-2">
            <Text className="text-gray-700 font-semibold text-lg">
              Recent Transactions
            </Text>
            <TouchableOpacity>
              <Text className="text-indigo-600 text-sm">See All</Text>
            </TouchableOpacity>
          </View>
          {[
            {
              id: '1',
              icon: 'tea.png',
              label: 'Tea',
              to: 'Priya Singh',
              amount: '₹20',
              when: 'Today',
            },
            {
              id: '2',
              icon: 'biscuit.png',
              label: 'Biscuits',
              to: 'Amit Kumar',
              amount: '₹50',
              when: 'Yesterday',
            },
            {
              id: '3',
              icon: 'cigarette.png',
              label: 'Cigarettes',
              to: 'Neha Verma',
              amount: '₹120',
              when: '2 days ago',
            },
          ].map((txn) => (
            <View
              key={txn.id}
              className="flex-row items-center bg-white p-3 rounded-xl mb-1 shadow-sm"
            >
              <View className="bg-gray-50 p-2 rounded-full mr-3">
                <Image
                  source={iconMap[txn.icon]}
                  className="w-5 h-5"
                />
              </View>
              <View className="flex-1">
                <Text className="text-base text-gray-900 font-medium">
                  {txn.label}
                </Text>
                <Text className="text-xs text-gray-500">To: {txn.to}</Text>
              </View>
              <View className="items-end">
                <Text className="text-base font-semibold text-gray-900">
                  {txn.amount}
                </Text>
                <Text className="text-xs text-gray-500">{txn.when}</Text>
              </View>
            </View>
          ))}
        </View>


        {/* ── PRODUCTS ROW ── */}
        <View className="mb-6">
          <View className="flex-row justify-between items-center mb-2">
            <Text className="text-gray-700 font-semibold text-lg">
              Products
            </Text>
            <TouchableOpacity>
              <Text className="text-indigo-600 text-sm">Manage</Text>
            </TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {[
              { id: '1', icon: 'tea.png', label: 'Tea', price: '₹10' },
              { id: '2', icon: 'biscuit.png', label: 'Biscuits', price: '₹20' },
              { id: '3', icon: 'cigarette.png', label: 'Cigarettes', price: '₹40' },
              { id: '4', icon: 'burger.png', label: 'Burger', price: '₹50' },
            ].map((prod) => (
              <View
                key={prod.id}
                className="w-24 h-24 bg-white rounded-xl mx-1 items-center justify-center shadow-sm"
              >
                <Image
                  source={iconMap[prod.icon]}
                  className="w-8 h-8 mb-1"
                />
                <Text className="text-xs text-gray-900">{prod.label}</Text>
                <Text className="text-xs text-gray-500">{prod.price}</Text>
              </View>
            ))}
          </ScrollView>
        </View>

        {/* ── REMINDER BANNER ── */}
        <LinearGradient
          colors={['#FDDE8E', '#FBA5A4']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          className="p-4 rounded-xl mb-8 flex-row items-center"
        >
          <Image
            source={iconMap['reminder-bell.png']}
            className="w-14 h-14 mr-4 self-start"
            resizeMode="contain"
          />

          <View className="flex-1">
            <Text className="text-base font-semibold text-red-600 mb-1">
              Remind customers for due payments
            </Text>
            <Text className="text-sm text-gray-800 mb-3">
              Send payment reminders to customers with pending dues.
            </Text>
            <TouchableOpacity className="bg-white px-4 py-2 rounded-lg w-36">
              <Text className="text-center text-red-600 font-semibold">
                Remind Now
              </Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </ScrollView>
    </SafeAreaView>
  );
}
