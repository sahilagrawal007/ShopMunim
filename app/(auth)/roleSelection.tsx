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
import Icon from "react-native-vector-icons/MaterialIcons";
import Feather from "react-native-vector-icons/Feather";

export default function RoleSelection() {
  const [role, setRole] = useState<"owner" | "customer" | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [shopName, setShopName] = useState("");
  const [pincode, setPincode] = useState("");
  const [city, setCity] = useState("");
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const generateShopLink = (shopName: string) => {
    return shopName.toLowerCase().replace(/\s+/g, "-") + "-" + Date.now();
  };

  // Function to detect city from pincode
  const detectCityFromPincode = async (pincode: string) => {
    if (pincode.length === 6) {
      try {
        const response = await fetch(`https://api.postalpincode.in/pincode/${pincode}`);
        const data = await response.json();
        
        if (data[0]?.Status === "Success" && data[0]?.PostOffice?.[0]) {
          const postOffice = data[0].PostOffice[0];
          const detectedCity = postOffice.District || postOffice.City || postOffice.State;
          setCity(detectedCity);
        } else {
          setCity("");
        }
      } catch (error) {
        console.log("Could not detect city from pincode");
        setCity("");
      }
    } else {
      setCity("");
    }
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

    if (phone.length !== 10) {
      Alert.alert("Error", "Phone number must be exactly 10 characters");
      return;
    }

    if (role === "owner") {
      if (!shopName) {
        Alert.alert("Error", "Shop name is required for owners");
        return;
      }
      if (!pincode || pincode.length !== 6) {
        Alert.alert("Error", "Valid 6-digit pincode is required for owners");
        return;
      }
      if (!address.trim()) {
        Alert.alert("Error", "Address is required for owners");
        return;
      }
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
          pincode,
          city,
          address: address.trim(),
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
          pincode,
          city,
          address: address.trim(),
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
        colors={["#E0E7FF", "#F3F4F6", "#FFFFFF"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        className="flex-1"
      >
        {/* Header Section */}
        <View className="flex-1 justify-center items-center px-8">
          {/* App Logo and Name */}
          <View className="items-center mb-8">
            <View className="bg-indigo-100 rounded-3xl p-6 mb-4">
              <Icon name="storefront" size={60} color="#4B82F6" />
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
                <Text className="text-indigo-800 text-sm font-medium mb-3 ml-1">
                  Choose Your Role
                </Text>
                <View className="flex-row space-x-3">
                  <TouchableOpacity
                    style={[styles.roleButton, role === "owner" && styles.roleButtonSelected]}
                    onPress={() => setRole("owner")}
                  >
                    <Icon name="storefront" size={60} color="#4B82F6" />
                    <Text
                      style={[
                        styles.roleButtonText,
                        role === "owner" && styles.roleButtonTextSelected,
                      ]}
                    >
                      Shop Owner
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.roleButton, role === "customer" && styles.roleButtonSelected]}
                    onPress={() => setRole("customer")}
                  >
                    <Feather name="user" size={60} color="#4B82F6" />
                    <Text
                      style={[
                        styles.roleButtonText,
                        role === "customer" && styles.roleButtonTextSelected,
                      ]}
                    >
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
                    placeholder="Enter 10-digit phone number"
                    placeholderTextColor="#9CA3AF"
                    value={phone}
                    onChangeText={(text) => {
                      // Only allow numbers and limit to 10 characters
                      const numericText = text.replace(/[^0-9]/g, "");
                      if (numericText.length <= 10) {
                        setPhone(numericText);
                      }
                    }}
                    keyboardType="phone-pad"
                    maxLength={10}
                  />
                </View>
                {phone.length > 0 && phone.length !== 10 && (
                  <Text className="text-red-500 text-xs ml-1 mt-1">
                    Phone number must be exactly 10 digits
                  </Text>
                )}
              </View>

              {/* Owner-specific fields */}
              {role === "owner" && (
                <>
                  {/* Shop Name Input */}
                  <View className="mb-4">
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

                  {/* Pincode Input */}
                  <View className="mb-4">
                    <Text className="text-indigo-800 text-sm font-medium mb-2 ml-1">Pincode</Text>
                    <View className="bg-white rounded-xl border border-indigo-300 shadow-sm">
                      <TextInput
                        style={styles.input}
                        placeholder="Enter 6-digit pincode"
                        placeholderTextColor="#9CA3AF"
                        value={pincode}
                        onChangeText={(text) => {
                          // Only allow numbers and limit to 6 characters
                          const numericText = text.replace(/[^0-9]/g, "");
                          if (numericText.length <= 6) {
                            setPincode(numericText);
                            if (numericText.length === 6) {
                              detectCityFromPincode(numericText);
                            }
                          }
                        }}
                        keyboardType="numeric"
                        maxLength={6}
                      />
                    </View>
                    {pincode.length > 0 && pincode.length !== 6 && (
                      <Text className="text-red-500 text-xs ml-1 mt-1">
                        Pincode must be exactly 6 digits
                      </Text>
                    )}
                  </View>

                  {/* City Input (Auto-detected) */}
                  {city && (
                    <View className="mb-4">
                      <Text className="text-indigo-800 text-sm font-medium mb-2 ml-1">City</Text>
                      <View className="bg-gray-100 rounded-xl border border-gray-300 shadow-sm">
                        <TextInput
                          style={[styles.input, { color: "#6B7280" }]}
                          value={city}
                          editable={false}
                        />
                      </View>
                    </View>
                  )}

                  {/* Address Input */}
                  <View className="mb-6">
                    <Text className="text-indigo-800 text-sm font-medium mb-2 ml-1">Address</Text>
                    <View className="bg-white rounded-xl border border-indigo-300 shadow-sm">
                      <TextInput
                        style={[styles.input, { height: 80, textAlignVertical: "top" }]}
                        placeholder="Enter your complete address"
                        placeholderTextColor="#9CA3AF"
                        value={address}
                        onChangeText={setAddress}
                        multiline
                        numberOfLines={3}
                      />
                    </View>
                  </View>
                </>
              )}

              {/* Continue Button */}
              <TouchableOpacity
                style={[
                  styles.continueButton,
                  (!role ||
                    !name ||
                    !phone ||
                    phone.length !== 10 ||
                    (role === "owner" &&
                      (!shopName || !pincode || pincode.length !== 6 || !address.trim())) ||
                    loading) &&
                    styles.buttonDisabled,
                ]}
                onPress={handleRoleSelection}
                disabled={
                  !role ||
                  !name ||
                  !phone ||
                  phone.length !== 10 ||
                  (role === "owner" &&
                    (!shopName || !pincode || pincode.length !== 6 || !address.trim())) ||
                  loading
                }
              >
                <LinearGradient
                  colors={loading ? ["#9CA3AF", "#6B7280"] : ["#4F46E5", "#6366F1"]}
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
            <Text className="text-indigo-600 text-sm text-center">Secure • Fast • Reliable</Text>
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
