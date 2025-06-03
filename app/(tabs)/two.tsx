// app/(tabs)/two.tsx

import { db } from '../../firebaseConfig.js'; 
import { iconMap } from '@/constants/iconMap';
import React, { useState, useEffect } from 'react'; // 🆕 useEffect added
import { LinearGradient } from 'expo-linear-gradient';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { collection, addDoc, getDocs, deleteDoc, doc } from 'firebase/firestore';

export default function CustomersScreen() {
  const [productName, setProductName] = useState('');
  const [price, setPrice] = useState('');
  const [selectedIcon, setSelectedIcon] = useState<string | null>(null);
  const [products, setProducts] = useState<any[]>([]); // Start with empty list

  // 🆕 STEP 2: Fetch products from Firestore when screen loads
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'products'));
        const items = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          price: `₹${doc.data().price}`, // Format price as ₹xx
        }));
        setProducts(items);
      } catch (error) {
        console.error('Error fetching products:', error);
      }
    };

    fetchProducts();
  }, []);

  async function addProduct() {
    if (!productName || !price || !selectedIcon) return;

    try {
      const docRef = await addDoc(collection(db, 'products'), {
        name: productName,
        price: Number(price),
        icon: selectedIcon,
        createdAt: new Date(),
      });

      setProducts((prev) => [
        ...prev,
        {
          id: docRef.id,
          name: productName,
          price: `₹${price}`,
          icon: selectedIcon,
        },
      ]);

      setProductName('');
      setPrice('');
      setSelectedIcon(null);
    } catch (e) {
      console.error('Error adding product to Firestore: ', e);
    }
  }

  async function deleteProduct(id: string) {
    try {
      await deleteDoc(doc(db, 'products', id));
      setProducts((prev) => prev.filter((p) => p.id !== id));
    } catch (error) {
      console.error('Error deleting product:', error);
    }
  }

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

        <View className="flex-row items-center mb-6">
          <TouchableOpacity>
            <Image
              source={iconMap['arrow-right.png']}
              className="w-5 h-5 mr-2"
              style={{ transform: [{ rotate: '180deg' }] }}
            />
          </TouchableOpacity>
          <Text className="text-xl font-bold text-gray-900">Products</Text>
        </View>

        {/* Add New Product Form */}
        <Text className="text-gray-500 mb-2">
          Manage all your shop's products and prices
        </Text>
        <View className="bg-white rounded-xl p-4 mb-6">
          <Text className="text-gray-700 text-lg font-bold mb-4">
            + Add New Product
          </Text>

          <Text className="text-gray-400 mb-2 text-sm">Product Name</Text>
          <TextInput
            placeholder="e.g. Tea"
            value={productName}
            onChangeText={setProductName}
            className="border border-gray-300 rounded-lg px-3 py-3 mb-3 text-gray-700"
          />

          <Text className="text-gray-400 mb-2 text-sm">Price (₹)</Text>
          <TextInput
            placeholder="e.g. 10"
            value={price}
            onChangeText={setPrice}
            keyboardType="numeric"
            className="border border-gray-300 rounded-lg px-3 py-3 mb-3 text-gray-700"
          />

          <Text className="text-gray-400 mb-2">Icon</Text>
          <View className="flex-row justify-between mb-4">
            {[
              'tea.png',
              'biscuit.png',
              'cigarette.png',
              'burger.png',
              'water.png',
              'apple.png',
            ].map((iconName) => (
              <TouchableOpacity
                key={iconName}
                onPress={() => setSelectedIcon(iconName)}
                className={`p-2 rounded-lg ${
                  selectedIcon === iconName ? 'bg-indigo-100' : 'bg-gray-50'
                }`}
              >
                <Image source={iconMap[iconName]} className="w-8 h-8" />
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            onPress={addProduct}
            className="rounded-lg overflow-hidden"
          >
            <LinearGradient
              colors={['#3b82f6', '#8b5cf6']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              className="py-3 rounded-lg mb-4 mt-3"
            >
              <Text className="text-center text-white font-semibold">
                Add Product
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Products List */}
        <Text className="text-gray-700 font-semibold mb-2">Your Products</Text>
        {products.map((p) => (
          <View
            key={p.id}
            className="flex-row items-center bg-white p-3 rounded-xl mb-1.5 shadow-sm"
          >
            <Image source={iconMap[p.icon]} className="w-8 h-8 rounded-full mr-3" />
            <View className="flex-1">
              <Text className="text-base text-gray-900 font-medium">{p.name}</Text>
            </View>
            <Text className="text-base text-gray-500 mr-4">{p.price}</Text>
            <TouchableOpacity onPress={() => deleteProduct(p.id)} className="mx-1">
              <Image source={iconMap['delete.png']} className="w-5 h-5" />
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
