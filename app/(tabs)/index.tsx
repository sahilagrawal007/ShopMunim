// app/(tabs)/index.tsx
import React from 'react';
import { View, Text, Image, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PieChart } from 'react-native-chart-kit'; // for placeholder pie chart
import { Dimensions } from 'react-native';
import { iconMap } from '../../constants/iconMap';

export default function DashboardScreen() {
  // Dummy data for pie chart (replace with real logic later)
  const pieData = [
    {
      key: 1,
      value: 24, // Paid
      svg: { fill: '#10B981' }, // green
    },
    {
      key: 2,
      value: 10, // With Due
      svg: { fill: '#F59E0B' }, // amber
    },
    {
      key: 3,
      value: 12, // Total Due (split)
      svg: { fill: '#EF4444' }, // red
    },
  ];

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        {/* ── HEADER ── */}
        <View className="flex-row justify-between items-center mb-6">
          <View className="flex-row items-center">
            <Image
              source={iconMap['shop.png']}
              className="w-6 h-6 mr-2"
            />
            <Text className="text-xl font-bold text-gray-900">ShopMunim</Text>
          </View>
          <TouchableOpacity>
            <Image
              source={iconMap['bell.png']}
              className="w-6 h-6"
            />
          </TouchableOpacity>
        </View>

        {/* ── SHOP LINK CARD ── */}
        <View className="bg-gray-100 rounded-xl p-4 mb-6 flex-row items-center">
          <View className="bg-indigo-100 p-3 rounded-full mr-3">
            <Image
              source={iconMap['link.png']}
              className="w-5 h-5"
            />
          </View>
          <View className="flex-1">
            <Text className="text-xs text-gray-500">Your Shop Link</Text>
            <Text
              className="text-sm text-gray-700 truncate w-[200px]"
              numberOfLines={1}
            >
              https://shopmunim.me/rohit
            </Text>
          </View>
          <TouchableOpacity className="bg-indigo-600 px-3 py-1 rounded-lg mr-2">
            <Text className="text-xs text-white">Copy</Text>
          </TouchableOpacity>
          <TouchableOpacity className="bg-white px-3 py-1 rounded-lg border border-gray-200">
            <Text className="text-xs text-indigo-600">Share</Text>
          </TouchableOpacity>
        </View>

        {/* ── ANALYTICS GRID ── */}
        <Text className="text-gray-700 font-semibold mb-2">Analytics</Text>
        <View className="flex-row flex-wrap justify-between mb-6">
          {/* Customers */}
          <View className="w-[48%] bg-gray-100 p-4 rounded-xl mb-4">
            <View className="bg-indigo-100 p-3 rounded-full mb-2 w-10 h-10 items-center justify-center">
              <Image
                source={iconMap['user.png']}
                className="w-5 h-5"
              />
            </View>
            <Text className="text-lg font-bold text-gray-900">37</Text>
            <Text className="text-sm text-gray-500">Customers</Text>
          </View>

          {/* Paid */}
          <View className="w-[48%] bg-gray-100 p-4 rounded-xl mb-4">
            <View className="bg-green-100 p-3 rounded-full mb-2 w-10 h-10 items-center justify-center">
              <Image
                source={iconMap['check.png']}
                className="w-5 h-5"
              />
            </View>
            <Text className="text-lg font-bold text-green-600">24</Text>
            <Text className="text-sm text-gray-500">Paid</Text>
          </View>

          {/* With Due */}
          <View className="w-[48%] bg-gray-100 p-4 rounded-xl mb-4">
            <View className="bg-yellow-100 p-3 rounded-full mb-2 w-10 h-10 items-center justify-center">
              <Image
                source={iconMap['clock.png']}
                className="w-5 h-5"
              />
            </View>
            <Text className="text-lg font-bold text-yellow-600">10</Text>
            <Text className="text-sm text-gray-500">With Due</Text>
          </View>

          {/* Total Due */}
          <View className="w-[48%] bg-gray-100 p-4 rounded-xl mb-4">
            <View className="bg-red-100 p-3 rounded-full mb-2 w-10 h-10 items-center justify-center">
              <Image
                source={iconMap['rupee.png']}
                className="w-5 h-5"
              />
            </View>
            <Text className="text-lg font-bold text-red-600">₹2,550</Text>
            <Text className="text-sm text-gray-500">Total Due</Text>
          </View>
        </View>
        
        {/* ── PIE CHART PLACEHOLDER ── */}
        {/* <View className="bg-white rounded-xl h-44 mb-6 items-center justify-center shadow">
          <PieChart style={{ height: 140, width: 140 }} data={pieData} width={0} height={0} accessor={''} backgroundColor={''} paddingLeft={''} />
          <View className="flex-row justify-center mt-3 space-x-4">
            <View className="flex-row items-center">
              <View className="w-2 h-2 bg-green-500 rounded-full mr-1" />
              <Text className="text-xs text-gray-500">Paid</Text>
            </View>
            <View className="flex-row items-center">
              <View className="w-2 h-2 bg-yellow-500 rounded-full mr-1" />
              <Text className="text-xs text-gray-500">With Due</Text>
            </View>
            <View className="flex-row items-center">
              <View className="w-2 h-2 bg-red-500 rounded-full mr-1" />
              <Text className="text-xs text-gray-500">Total Due</Text>
            </View>
          </View>
        </View> */}
        

        {/* ── WELCOME & AVATAR ── */}
        <View className="flex-row items-center justify-between mb-6">
          <View>
            <Text className="text-gray-500 text-sm">Welcome back,</Text>
            <Text className="text-lg font-bold text-gray-900">
              Rohit Sharma
            </Text>
          </View>
          <Image
            source={{
              uri: 'https://randomuser.me/api/portraits/men/32.jpg',
            }}
            className="w-12 h-12 rounded-full"
          />
        </View>

        {/* ── CREDIT SUMMARY BAR ── */}
        <View className="bg-gradient-to-r from-blue-500 to-purple-500 p-4 rounded-xl mb-6">
          <Text className="text-white text-lg font-bold">
            Total Credit Given
          </Text>
          <Text className="text-white text-2xl font-extrabold mb-3">
            ₹12,350
          </Text>
          <TouchableOpacity className="bg-white rounded-lg py-2 px-4 w-36">
            <Text className="text-center text-blue-600 font-semibold">
              Collect Payment
            </Text>
          </TouchableOpacity>
        </View>

        {/* ── QUICK ACTIONS ── */}
        <View className="flex-row justify-between mb-6">
          <TouchableOpacity className="items-center bg-gray-100 p-3 rounded-xl w-[30%]">
            <Image
              source={iconMap['add-customer.png']}
              className="w-6 h-6 mb-1"
            />
            <Text className="text-xs text-gray-700">Add Customer</Text>
          </TouchableOpacity>
          <TouchableOpacity className="items-center bg-gray-100 p-3 rounded-xl w-[30%]">
            <Image
              source={iconMap['rupee-circle.png']}
              className="w-6 h-6 mb-1"
            />
            <Text className="text-xs text-gray-700">New Credit</Text>
          </TouchableOpacity>
          <TouchableOpacity className="items-center bg-gray-100 p-3 rounded-xl w-[30%]">
            <Image
              source={iconMap['menu.png']}
              className="w-6 h-6 mb-1"
            />
            <Text className="text-xs text-gray-700">Products</Text>
          </TouchableOpacity>
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
              className="flex-row items-center bg-white p-3 rounded-xl mb-3 shadow-sm"
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
        <View className="bg-gradient-to-r from-yellow-200 to-red-200 p-4 rounded-xl mb-8">
          <View className="flex-row items-center mb-2">
            <Image
              source={iconMap['reminder-bell.png']}
              className="w-5 h-5 mr-2"
            />
            <Text className="text-base font-semibold text-red-600">
              Remind customers for due payments
            </Text>
          </View>
          <Text className="text-xs text-gray-700 mb-3">
            Send payment reminders to customers with pending dues.
          </Text>
          <TouchableOpacity className="bg-white px-4 py-2 rounded-lg w-36">
            <Text className="text-center text-red-600 font-semibold">
              Remind Now
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
