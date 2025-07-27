import { useRouter } from 'expo-router';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { Alert, Image, ScrollView, Text, TextInput, TouchableOpacity, View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { iconMap } from '../../constants/iconMap';
import { auth, db } from '../../firebaseConfig';
import Feather from "react-native-vector-icons/Feather";

export default function CustomersScreen() {
  const router = useRouter();
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const ownerUid = auth.currentUser?.uid;

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        const customersRef = query(
          collection(db, 'customers'),
          where('shopsJoined', 'array-contains', user.uid)
        );
        const unsubCustomers = onSnapshot(customersRef, (querySnapshot) => {
          const list: any[] = [];
          querySnapshot.forEach((doc) => {
            const data = doc.data();
            list.push({ id: doc.id, ...data, due: data.due || 0 });
          });
          setCustomers(list);
          setLoading(false);
        });
        return unsubCustomers;
      } else {
        setCustomers([]);
        setLoading(false);
      }
    });
    return () => unsubscribeAuth();
  }, []);

  if (loading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-gray-100">
        <Text className="text-lg text-gray-700">Loading customers...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-[#F7F7F7]">
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <TouchableOpacity onPress={() => router.navigate("/(ownerTabs)")} style={styles.backButton}>
          <Feather name="arrow-left" size={24} color="#333" />
        </TouchableOpacity>

        <Text className="text-2xl font-bold text-gray-900 mb-6">All Customers</Text>
        <TextInput
          className="mb-3 px-4 py-4 bg-white rounded-xl border border-gray-200 text-gray-900 text-base"
          multiline={true}
          style={{ paddingTop: 10, paddingBottom: 15 }}
          placeholder="Search by customer name..."
          placeholderTextColor="gray"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {customers.filter((cust) => cust.name?.toLowerCase().includes(searchQuery.toLowerCase()))
          .length > 0 ? (
          customers
            .filter((cust) => cust.name?.toLowerCase().includes(searchQuery.toLowerCase()))
            .map((cust, index) => (
              <TouchableOpacity
                key={index}
                className="flex-row justify-between items-center py-3 px-2 mb-2 bg-white rounded-lg shadow-sm border border-gray-100"
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
                <Text className={`font-bold ${cust.due === 0 ? "text-green-600" : "text-red-600"}`}>
                  {cust.due === 0 ? "Paid" : `Due ₹${cust.due?.toFixed(2)}`}
                </Text>
              </TouchableOpacity>
            ))
        ) : (
          <Text className="text-gray-500">No customers found.</Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
} 

const styles = StyleSheet.create({
  backButton: {
    marginBottom: 20,
    marginTop: 1,
  },
}); 