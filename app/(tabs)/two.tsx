// app/(tabs)/two.tsx
import { iconMap } from '@/constants/iconMap';
import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function CustomersScreen() {
  const [productName, setProductName] = useState('');
  const [price, setPrice] = useState('');
  const [selectedIcon, setSelectedIcon] = useState<string | null>(null);

  // Initial product list (dummy); you can later link to backend
  const [products, setProducts] = useState([
    { id: '1', name: 'Tea', price: '₹10', icon: 'tea.png' },
    { id: '2', name: 'Biscuits', price: '₹20', icon: 'biscuit.png' },
    { id: '3', name: 'Cigarettes', price: '₹40', icon: 'cigarette.png' },
  ]);

  function addProduct() {
    if (!productName || !price || !selectedIcon) return;
    setProducts((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        name: productName,
        price: `₹${price}`,
        icon: selectedIcon,
      },
    ]);
    setProductName('');
    setPrice('');
    setSelectedIcon(null);
  }

  function deleteProduct(id: string) {
    setProducts((prev) => prev.filter((p) => p.id !== id));
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        {/* ── HEADER ── */}
        <View className="flex-row items-center mb-6">
          <TouchableOpacity>
            <Image
              source={iconMap['arrow-right.png']}
              className="w-5 h-5 mr-2"
              style={{ transform: [{ rotate: '180deg' }] }} // flip arrow to point “back”
            />
          </TouchableOpacity>
          <Text className="text-xl font-bold text-gray-900">Products</Text>
        </View>

        {/* ── ADD NEW PRODUCT FORM ── */}
        <Text className="text-gray-700 font-semibold mb-2">+ Add New Product</Text>
        <View className="bg-gray-100 rounded-xl p-4 mb-6">
          {/* Product Name */}
          <TextInput
            placeholder="Product Name (e.g. Tea)"
            value={productName}
            onChangeText={setProductName}
            className="border border-gray-300 rounded-lg px-3 py-2 mb-3 text-gray-700"
          />
          {/* Price */}
          <TextInput
            placeholder="Price (e.g. 10)"
            value={price}
            onChangeText={setPrice}
            keyboardType="numeric"
            className="border border-gray-300 rounded-lg px-3 py-2 mb-3 text-gray-700"
          />

          {/* Icon Picker */}
          <Text className="text-gray-700 mb-2">Icon</Text>
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
                <Image
                  source={iconMap[iconName]}
                  className="w-8 h-8"
                />
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            onPress={addProduct}
            className="bg-gradient-to-r from-blue-500 to-purple-500 py-3 rounded-lg"
          >
            <Text className="text-center text-white font-semibold">Add Product</Text>
          </TouchableOpacity>
        </View>

        {/* ── YOUR PRODUCTS LIST ── */}
        <Text className="text-gray-700 font-semibold mb-2">Your Products</Text>
        {products.map((p) => (
          <View
            key={p.id}
            className="flex-row items-center bg-white p-3 rounded-xl mb-3 shadow-sm"
          >
            <Image
              source={iconMap[p.icon]}
              className="w-8 h-8 rounded-full mr-3"
            />
            <View className="flex-1">
              <Text className="text-base text-gray-900 font-medium">
                {p.name}
              </Text>
            </View>
            <Text className="text-base text-gray-500 mr-4">{p.price}</Text>
            <TouchableOpacity onPress={() => deleteProduct(p.id)} className="mx-1">
              <Image
                source={iconMap['delete.png']}
                className="w-5 h-5"
              />
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
