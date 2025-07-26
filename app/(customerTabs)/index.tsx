import { iconMap } from "@/constants/iconMap";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { getAuth } from "firebase/auth";
import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  query,
  where,
} from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
  Dimensions,
  Image,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { PieChart } from "react-native-chart-kit";
import { SafeAreaView } from "react-native-safe-area-context";
import { db } from "../../firebaseConfig";

const screenWidth = Dimensions.get("window").width;

export default function CustomerHomeScreen() {
  const [customer, setCustomer] = useState<any>(null);
  const [shops, setShops] = useState<any[]>([]);
  const [due, setDue] = useState(0);
  const [spent, setSpent] = useState(0);
  const router = useRouter();

  useEffect(() => {
    const user = getAuth().currentUser;
    if (!user) return;

    let unsubscribe: any;

    const fetchData = async () => {
      const customerDoc = await getDoc(doc(db, "customers", user.uid));
      if (!customerDoc.exists()) return;

      const customerData = customerDoc.data();
      setCustomer(customerData);

      const joinedShops: string[] = customerData.shopsJoined || [];
      const shopsData = [];

      for (const shopId of joinedShops) {
        const shopDoc = await getDoc(doc(db, "shops", shopId));
        if (shopDoc.exists()) {
          shopsData.push({ id: shopId, ...shopDoc.data() });
        }
      }
      setShops(shopsData);

      const txnQuery = query(
        collection(db, "transactions"),
        where("customerId", "==", user.uid),
        where("shopId", "in", joinedShops)
      );

      unsubscribe = onSnapshot(txnQuery, (snapshot) => {
        let totalPaid = 0;
        let totalAdvance = 0;
        let totalDue = 0;

        snapshot.forEach((doc) => {
          const txn = doc.data();
          if (txn.type === "paid") totalPaid += txn.amount;
          if (txn.type === "due") totalDue += txn.amount;
          if (txn.type === "advance") {
            totalPaid += txn.amount;
            totalAdvance += txn.amount;
          }
        });

        const adjustedDue = Math.max(totalDue - totalAdvance, 0);
        const totalSpent = totalPaid + adjustedDue;

        setDue(adjustedDue);
        setSpent(totalSpent);
      });
    };

    fetchData();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const spendingChartData = [
    {
      name: "Total Spent",
      population: spent,
      color: "#3B82F6", // blue-500
      legendFontColor: "#3B82F6",
      legendFontSize: 14,
    },
    {
      name: "Due",
      population: due,
      color: "#60A5FA", // blue-400
      legendFontColor: "#60A5FA",
      legendFontSize: 14,
    },
  ];

  return (
    <SafeAreaView className="flex-1 bg-white">
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
            <Text className="text-lg font-bold text-gray-900">{customer?.name || "User"}</Text>
          </View>
          <Image
            source={{ uri: "https://randomuser.me/api/portraits/men/32.jpg" }}
            className="w-12 h-12 rounded-full"
          />
        </View>

        {/* Profile Card */}
        <LinearGradient
          colors={["#3B82F6", "#60A5FA"]}
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
            source={{ uri: "https://randomuser.me/api/portraits/men/32.jpg" }}
            className="w-12 h-12 rounded-full ml-4"
          />
        </LinearGradient>

        {/* Summary Cards */}
        <Text className="text-gray-800 text-base font-semibold mb-3">
          Spending Summary
        </Text>
        <View className="flex-row justify-between mb-6">
          {/* Total Spent Card (Updated to Red Theme) */}
          <View className="w-[48%] bg-white p-4 rounded-xl shadow items-center">
            <View className="bg-red-100 p-3 rounded-full mb-2">
              <Image source={iconMap["rupee.png"]} className="w-5 h-5" />
            </View>
            <Text className="text-lg font-bold text-red-600">₹{spent}</Text>
            <Text className="text-sm text-gray-500 text-center">Total Spent</Text>
          </View>

          {/* Due Card (Yellow Theme) */}
          <View className="w-[48%] bg-white p-4 rounded-xl shadow items-center">
            <View className="bg-yellow-100 p-3 rounded-full mb-2">
              <Image source={iconMap["clock.png"]} className="w-5 h-5" />
            </View>
            <Text className="text-lg font-bold text-yellow-600">₹{due}</Text>
            <Text className="text-sm text-gray-500 text-center">Due</Text>
          </View>
        </View>


        {/* Pie Chart */}
<View className="items-center bg-white p-4 rounded-2xl shadow mb-6">
  <PieChart
    data={[
      {
        name: "Total Spent",
        population: spent,
        color: "#e254548e", // red-600
        legendFontColor: "#e254548e",
        legendFontSize: 14,
      },
      {
        name: "Due",
        population: due,
        color: "#eac328a3", // yellow-400
        legendFontColor: "#eac328a3",
        legendFontSize: 14,
      },
    ]}
    width={screenWidth - 40}
    height={220}
    chartConfig={{
      backgroundGradientFrom: "#fff",
      backgroundGradientTo: "#fff",
      color: () => "#000",
    }}
    accessor="population"
    backgroundColor="transparent"
    paddingLeft="15"
    center={[0, 0]} // keep it centered
    hasLegend={false}
    absolute
  />
  {/* Legend */}
  <View className="flex-row justify-center mt-4 space-x-4">
    <View className="flex-row items-center">
      <View className="w-3 h-3 rounded-full mr-2 bg-red-600" />
      <Text className="text-sm text-red-600">Total Spent</Text>
    </View>
    <View className="flex-row items-center">
      <View className="w-3 h-3 rounded-full mr-2 bg-yellow-400" />
      <Text className="text-sm text-yellow-600">Due</Text>
    </View>
  </View>
</View>


        {/* Shops List */}
        <View className="mb-6 bg-white p-4 rounded-lg shadow-md border border-gray-200">
          <Text className="text-lg font-bold text-gray-800 mb-4">Your Shops</Text>
          {shops.length > 0 ? (
            shops.map((shop) => (
              <TouchableOpacity
                key={shop.id}
                className="flex-row justify-between items-center py-2 border-b border-gray-100 last:border-b-0"
                onPress={() =>
                  router.push({
                    pathname: "/(customerTabs)/shopDetails",
                    params: { shopId: shop.id },
                  })
                }
              >
                <View className="flex-row items-center">
                  <Image source={iconMap["shop.png"]} className="w-10 h-10 rounded-full mr-3" />
                  <View>
                    <Text className="text-gray-700 font-medium">{shop.name}</Text>
                    <Text className="text-xs text-gray-500">{shop.location || "No location"}</Text>
                  </View>
                </View>
                <Image source={iconMap["arrow-right.png"]} className="w-4 h-4" />
              </TouchableOpacity>
            ))
          ) : (
            <Text className="text-gray-500">No shops joined yet.</Text>
          )}
        </View>

        {/* Products List */}
        {/* <View className="mb-6">
          <Text className="text-gray-700 font-semibold text-lg mb-2">Products</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {products.map((prod, i) => (
              <View
                key={i}
                className="w-24 h-24 bg-white rounded-xl mx-1 items-center justify-center shadow-sm"
              >
                <Image source={iconMap[prod.icon || "tea.png"]} className="w-8 h-8 mb-1" />
                <Text className="text-xs text-gray-900">{prod.name}</Text>
                <Text className="text-xs text-gray-500">₹{prod.price}</Text>
              </View>
            ))}
          </ScrollView>
        </View> */}
      </ScrollView>
    </SafeAreaView>
  );
}