import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  SafeAreaView,
} from "react-native";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "../../firebaseConfig";
import { useRouter } from "expo-router";
import { Owner, Customer } from "../../types";

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
      <View style={styles.container}>
        <Text style={styles.title}>Choose Your Role</Text>

        <View style={styles.roleContainer}>
          <TouchableOpacity
            style={[styles.roleButton, role === "owner" && styles.roleButtonSelected]}
            onPress={() => setRole("owner")}
          >
            <Text
              style={[styles.roleButtonText, role === "owner" && styles.roleButtonTextSelected]}
            >
              Shop Owner
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.roleButton, role === "customer" && styles.roleButtonSelected]}
            onPress={() => setRole("customer")}
          >
            <Text
              style={[styles.roleButtonText, role === "customer" && styles.roleButtonTextSelected]}
            >
              Customer
            </Text>
          </TouchableOpacity>
        </View>

        {role && (
          <View style={styles.formContainer}>
            <TextInput
              style={styles.input}
              placeholder="Full Name"
              placeholderTextColor="gray"
              value={name}
              onChangeText={setName}
            />

            <TextInput
              style={styles.input}
              placeholder="Phone Number"
              placeholderTextColor="gray"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
            />

            {role === "owner" && (
              <TextInput
                style={styles.input}
                placeholder="Shop Name"
                placeholderTextColor="gray"
                value={shopName}
                onChangeText={setShopName}
              />
            )}

            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleRoleSelection}
              disabled={loading}
            >
              <Text style={styles.buttonText}>{loading ? "Setting up..." : "Continue"}</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 8,
    color: "#333",
  },
  subtitle: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 32,
    color: "#666",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
    backgroundColor: "white",
    color: "black",
  },
  button: {
    backgroundColor: "#007AFF",
    borderRadius: 8,
    padding: 16,
    alignItems: "center",
    marginBottom: 16,
  },
  buttonDisabled: {
    backgroundColor: "#ccc",
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  linkButton: {
    alignItems: "center",
  },
  linkText: {
    color: "#007AFF",
    fontSize: 16,
  },
  roleContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 32,
  },
  roleButton: {
    flex: 1,
    marginHorizontal: 8,
    padding: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "#ddd",
    alignItems: "center",
    backgroundColor: "white",
  },
  roleButtonSelected: {
    borderColor: "#007AFF",
    backgroundColor: "#007AFF",
  },
  roleButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  roleButtonTextSelected: {
    color: "white",
  },
  formContainer: {
    marginTop: 16,
  },
  header: {
    marginBottom: 24,
    paddingTop: 40,
  },
  welcomeText: {
    fontSize: 16,
    color: "#666",
  },
  nameText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
  },
  summaryContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: "white",
    padding: 16,
    borderRadius: 8,
    marginHorizontal: 4,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryLabel: {
    fontSize: 14,
    color: "#666",
    marginBottom: 8,
  },
  summaryAmount: {
    fontSize: 20,
    fontWeight: "bold",
  },
  dueAmount: {
    color: "#FF3B30",
  },
  advanceAmount: {
    color: "#34C759",
  },
  paidAmount: {
    color: "#007AFF",
  },
  section: {
    backgroundColor: "white",
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 16,
    color: "#333",
  },
  emptyText: {
    textAlign: "center",
    color: "#666",
    fontStyle: "italic",
  },
  transactionCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  transactionInfo: {
    flex: 1,
  },
  transactionDescription: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
  },
  transactionDate: {
    fontSize: 14,
    color: "#666",
    marginTop: 4,
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: "bold",
  },
});
