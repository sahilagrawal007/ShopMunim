import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  SafeAreaView,
  Image,
} from "react-native";
import { doc, setDoc } from "firebase/firestore";
import { LinearGradient } from "expo-linear-gradient";
import { auth, db } from "../../firebaseConfig";
import { useRouter } from "expo-router";
import { Owner, Customer } from "../../types";
import { iconMap } from "../../constants/iconMap";

export default function RoleSelection() {
  const [role, setRole] = useState<"owner" | "customer" | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [shopName, setShopName] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const generateShopLink = (shopName: string) => {
    return shopName.toLowerCase().replace(/\s+/g, "-") + "-" + Date.now();
  };

  const handleRoleSelection = async () => {
    const user = auth.currentUser;
    if (!user) {
      Alert.alert("Error", "No authenticated user found");
      return;
    }

    if (!name || !phone) {
      Alert.alert("Error", "Name and phone are required");
      return;
    }

    if (role === "owner" && !shopName) {
      Alert.alert("Error", "Shop name is required for owners");
      return;
    }

    setLoading(true);
    try {
      const now = new Date();

      if (role === "owner") {
        const shopLink = generateShopLink(shopName);
        const ownerData: Owner = {
          uid: user.uid,
          name,
          email: user.email || "",
          phone,
          shopName,
          shopLink,
          createdAt: now,
          updatedAt: now,
        };

        await setDoc(doc(db, "owners", user.uid), ownerData);

        // Create shop document
        await setDoc(doc(db, "shops", user.uid), {
          id: user.uid,
          ownerId: user.uid,
          name: shopName,
          link: shopLink,
          customers: [],
          createdAt: now,
          updatedAt: now,
        });

        router.navigate("/(ownerTabs)");
      } else {
        const customerData: Customer = {
          uid: user.uid,
          name,
          email: user.email || "",
          phone,
          shopsJoined: [],
          createdAt: now,
          updatedAt: now,
        };

        await setDoc(doc(db, "customers", user.uid), customerData);
        router.navigate("/(customerTabs)");
      }
    } catch (error: any) {
      Alert.alert("Error", error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <LinearGradient
        colors={['#E0E7FF', '#F3F4F6', '#FFFFFF']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        className="flex-1"
      >
        {/* Header Section */}
        <View className="flex-1 justify-center items-center px-8">
          {/* App Logo and Name */}
          <View className="items-center mb-8">
            <View className="bg-indigo-100 rounded-3xl p-6 mb-4">
              <Image 
                source={iconMap["shop.png"]} 
                className="w-16 h-16"
                style={{ tintColor: '#4F46E5' }}
              />
            </View>
            <Text className="text-3xl font-bold text-indigo-900 mb-2">ShopMunim</Text>
            <Text className="text-indigo-700 text-base text-center">
              Choose your role to get started
            </Text>
          </View>

          {/* Role Selection Form */}
          <View className="w-full max-w-sm">
            <View className="bg-white/80 backdrop-blur-lg rounded-2xl p-6 border border-indigo-200 shadow-lg">
              <Text className="text-2xl font-bold text-indigo-900 text-center mb-6">
                Complete Your Profile
              </Text>

              {/* Role Selection */}
              <View className="mb-6">
                <Text className="text-indigo-800 text-sm font-medium mb-3 ml-1">Choose Your Role</Text>
                <View className="flex-row space-x-3">
                  <TouchableOpacity
                    style={[
                      styles.roleButton,
                      role === "owner" && styles.roleButtonSelected
                    ]}
                    onPress={() => setRole("owner")}
                  >
                    <Image 
                      source={iconMap["shop.png"]} 
                      className="w-8 h-8 mb-2"
                      style={{ tintColor: role === "owner" ? 'white' : '#4F46E5' }}
                    />
                    <Text style={[
                      styles.roleButtonText,
                      role === "owner" && styles.roleButtonTextSelected
                    ]}>
                      Shop Owner
                    </Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[
                      styles.roleButton,
                      role === "customer" && styles.roleButtonSelected
                    ]}
                    onPress={() => setRole("customer")}
                  >
                    <Image 
                      source={iconMap["user.png"]} 
                      className="w-8 h-8 mb-2"
                      style={{ tintColor: role === "customer" ? 'white' : '#4F46E5' }}
                    />
                    <Text style={[
                      styles.roleButtonText,
                      role === "customer" && styles.roleButtonTextSelected
                    ]}>
                      Customer
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Name Input */}
              <View className="mb-4">
                <Text className="text-indigo-800 text-sm font-medium mb-2 ml-1">Full Name</Text>
                <View className="bg-white rounded-xl border border-indigo-300 shadow-sm">
                  <TextInput
                    style={styles.input}
                    placeholder="Enter your full name"
                    placeholderTextColor="#9CA3AF"
                    value={name}
                    onChangeText={setName}
                  />
                </View>
              </View>

              {/* Phone Input */}
              <View className="mb-4">
                <Text className="text-indigo-800 text-sm font-medium mb-2 ml-1">Phone Number</Text>
                <View className="bg-white rounded-xl border border-indigo-300 shadow-sm">
                  <TextInput
                    style={styles.input}
                    placeholder="Enter your phone number"
                    placeholderTextColor="#9CA3AF"
                    value={phone}
                    onChangeText={setPhone}
                    keyboardType="phone-pad"
                  />
                </View>
              </View>

              {/* Shop Name Input (only for owners) */}
              {role === "owner" && (
                <View className="mb-6">
                  <Text className="text-indigo-800 text-sm font-medium mb-2 ml-1">Shop Name</Text>
                  <View className="bg-white rounded-xl border border-indigo-300 shadow-sm">
                    <TextInput
                      style={styles.input}
                      placeholder="Enter your shop name"
                      placeholderTextColor="#9CA3AF"
                      value={shopName}
                      onChangeText={setShopName}
                    />
                  </View>
                </View>
              )}

              {/* Continue Button */}
              <TouchableOpacity
                style={[styles.continueButton, (!role || !name || !phone || (role === "owner" && !shopName) || loading) && styles.buttonDisabled]}
                onPress={handleRoleSelection}
                disabled={!role || !name || !phone || (role === "owner" && !shopName) || loading}
              >
                <LinearGradient
                  colors={loading ? ['#9CA3AF', '#6B7280'] : ['#4F46E5', '#6366F1']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  className="w-full rounded-xl py-4 items-center"
                >
                  <Text className="text-white font-bold text-lg">
                    {loading ? "Setting Up..." : "Continue"}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>

          {/* Footer */}
          <View className="mt-6 items-center">
            <Text className="text-indigo-600 text-sm text-center">
              Secure • Fast • Reliable
            </Text>
          </View>
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  input: {
    padding: 16,
    fontSize: 16,
    color: '#1F2937',
    fontWeight: '500',
  },
  roleButton: {
    flex: 1,
    backgroundColor: 'rgba(79, 70, 229, 0.1)',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(79, 70, 229, 0.3)',
  },
  roleButtonSelected: {
    backgroundColor: '#4F46E5',
    borderColor: '#4F46E5',
  },
  roleButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4F46E5',
    textAlign: 'center',
  },
  roleButtonTextSelected: {
    color: 'white',
  },
  continueButton: {
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
});
