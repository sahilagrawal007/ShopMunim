import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, Image, ScrollView } from 'react-native';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { LinearGradient } from 'expo-linear-gradient';
import { auth } from '../../firebaseConfig';
import { useRouter } from 'expo-router';
import Icon from "react-native-vector-icons/MaterialIcons";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleRegister = async () => {
    if (!email || !password || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      router.navigate('/(auth)/roleSelection');
    } catch (error: any) {
      Alert.alert('Registration Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView edges={["top", "left", "right"]} className="flex-1 bg-[#DBEAFE]">
      <ScrollView>
        <LinearGradient
          colors={["#DBEAFE", "#F3F4F6", "#FFFFFF"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          className="flex-1"
        >
          {/* Header Section */}
          <View className="flex-1 justify-center items-center px-8">
            {/* App Logo and Name */}
            <View className="items-center mb-8">
              <View className="bg-blue-100 rounded-3xl p-6 mb-4">
                <Icon name="storefront" size={60} color="#3B82F6" />
              </View>
              <Text className="text-3xl font-bold text-blue-900 mb-2">ShopMunim</Text>
              <Text className="text-blue-700 text-base text-center">
                Join the smart shop revolution
              </Text>
            </View>

            {/* Registration Form */}
            <View className="w-full max-w-sm">
              <View className="bg-white/80 backdrop-blur-lg rounded-2xl p-6 border border-blue-200 shadow-lg">
                <Text className="text-2xl font-bold text-blue-900 text-center mb-4">
                  Create Account
                </Text>

                <Text className="text-blue-700 text-center mb-6">
                  Start your journey with ShopMunim today
                </Text>

                {/* Email Input */}
                <View className="mb-4">
                  <Text className="text-blue-800 text-sm font-medium mb-2 ml-1">Email</Text>
                  <View className="bg-white rounded-xl border border-blue-300 shadow-sm">
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
                <View className="mb-4">
                  <Text className="text-blue-800 text-sm font-medium mb-2 ml-1">Password</Text>
                  <View className="bg-white rounded-xl border border-blue-300 shadow-sm">
                    <TextInput
                      style={styles.input}
                      placeholder="Create a password"
                      placeholderTextColor="#9CA3AF"
                      value={password}
                      onChangeText={setPassword}
                      secureTextEntry
                    />
                  </View>
                </View>

                {/* Confirm Password Input */}
                <View className="mb-6">
                  <Text className="text-blue-800 text-sm font-medium mb-2 ml-1">
                    Confirm Password
                  </Text>
                  <View className="bg-white rounded-xl border border-blue-300 shadow-sm">
                    <TextInput
                      style={styles.input}
                      placeholder="Confirm your password"
                      placeholderTextColor="#9CA3AF"
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                      secureTextEntry
                    />
                  </View>
                </View>

                {/* Register Button */}
                <TouchableOpacity
                  style={[styles.registerButton, loading && styles.buttonDisabled]}
                  onPress={handleRegister}
                  disabled={loading}
                >
                  <LinearGradient
                    colors={loading ? ["#9CA3AF", "#6B7280"] : ["#3B82F6", "#60A5FA"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    className="w-full rounded-xl py-4 items-center"
                  >
                    <Text className="text-white font-bold text-lg">
                      {loading ? "Creating Account..." : "Create Account"}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>

                {/* Login Link */}
                <TouchableOpacity
                  className="mt-6 items-center"
                  onPress={() => router.replace("/(auth)/login")}
                >
                  <Text className="text-blue-700 text-center">
                    Already have an account?{" "}
                    <Text className="text-blue-600 font-semibold underline">Sign in here</Text>
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Footer */}
            {/* Footer */}
            <View className="mt-8 items-center">
              <Text className="text-blue-600 text-sm text-center">Secure • Fast • Reliable</Text>
              <Text className="text-blue-500 text-xs text-center mt-2 mb-8">
                © 2024 ShopMunim. All rights reserved.
              </Text>
            </View>
          </View>
        </LinearGradient>
      </ScrollView>
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
  registerButton: {
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