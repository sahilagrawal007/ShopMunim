import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, Image, Dimensions } from "react-native";
import { signInWithEmailAndPassword } from "firebase/auth";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { auth } from "../../firebaseConfig";
import { router } from "expo-router";
import { iconMap } from "../../constants/iconMap";

const { width } = Dimensions.get('window');

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      // Navigation handled by auth listener in _layout.tsx
    } catch (error: any) {
      Alert.alert("Login Error", error.message);
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
          <View className="items-center mb-12">
            <View className="bg-indigo-100 rounded-3xl p-6 mb-6">
              <Image 
                source={iconMap["shop.png"]} 
                className="w-20 h-20"
                style={{ tintColor: '#4F46E5' }}
              />
            </View>
            <Text className="text-4xl font-bold text-indigo-900 mb-2">ShopMunim</Text>
            <Text className="text-indigo-700 text-lg text-center">
              Your Smart Shop Management Solution
            </Text>
          </View>

          {/* Login Form */}
          <View className="w-full max-w-sm">
            <View className="bg-white/80 backdrop-blur-lg rounded-2xl p-6 border border-indigo-200 shadow-lg">
              <Text className="text-2xl font-bold text-indigo-900 text-center mb-6">
                Welcome Back
              </Text>
              
              <Text className="text-indigo-700 text-center mb-6">
                Sign in to manage your shop or track your purchases
              </Text>

              {/* Email Input */}
              <View className="mb-4">
                <Text className="text-indigo-800 text-sm font-medium mb-2 ml-1">Email</Text>
                <View className="bg-white rounded-xl border border-indigo-300 shadow-sm">
                  <TextInput
                    style={styles.input}
                    placeholder="Enter your email"
                    placeholderTextColor="#9CA3AF"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>
              </View>

              {/* Password Input */}
              <View className="mb-6">
                <Text className="text-indigo-800 text-sm font-medium mb-2 ml-1">Password</Text>
                <View className="bg-white rounded-xl border border-indigo-300 shadow-sm">
                  <TextInput
                    style={styles.input}
                    placeholder="Enter your password"
                    placeholderTextColor="#9CA3AF"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                  />
                </View>
              </View>

              {/* Login Button */}
              <TouchableOpacity
                style={[styles.loginButton, loading && styles.buttonDisabled]}
                onPress={handleLogin}
                disabled={loading}
              >
                <LinearGradient
                  colors={loading ? ['#9CA3AF', '#6B7280'] : ['#4F46E5', '#6366F1']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  className="w-full rounded-xl py-4 items-center"
                >
                  <Text className="text-white font-bold text-lg">
                    {loading ? "Signing In..." : "Sign In"}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>

              {/* Register Link */}
              <TouchableOpacity 
                className="mt-6 items-center"
                onPress={() => router.push("/(auth)/register")}
              >
                <Text className="text-indigo-700 text-center">
                  Don't have an account?{" "}
                  <Text className="text-indigo-600 font-semibold underline">
                    Create one here
                  </Text>
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Footer */}
          <View className="mt-8 items-center">
            <Text className="text-indigo-600 text-sm text-center">
              Secure • Fast • Reliable
            </Text>
            <Text className="text-indigo-500 text-xs text-center mt-2">
              © 2024 ShopMunim. All rights reserved.
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
  loginButton: {
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
});
