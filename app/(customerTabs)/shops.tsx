import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import {
    arrayUnion,
    collection,
    doc,
    getDoc,
    getDocs,
    query,
    updateDoc,
    where,
} from "firebase/firestore";
import React, { useCallback, useState } from "react";
import {
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { auth, db } from "../../firebaseConfig";
import { Customer, Shop } from "../../types";
import Icon from "react-native-vector-icons/MaterialIcons";
import { SafeAreaView } from "react-native-safe-area-context";

export default function CustomerShops() {
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [shops, setShops] = useState<Shop[]>([]);
  const [shopLink, setShopLink] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useFocusEffect(
    useCallback(() => {
      loadCustomerData();
    }, [])
  );

  const loadCustomerData = async () => {
    const user = auth.currentUser;
    if (!user) return;

    try {
      const customerDoc = await getDoc(doc(db, "customers", user.uid));
      if (customerDoc.exists()) {
        const customerData = customerDoc.data() as Customer;
        setCustomer(customerData);
        await loadJoinedShops(customerData.shopsJoined);
      }
    } catch (error) {
      console.error("Error loading customer data:", error);
    }
  };

  const loadJoinedShops = async (shopIds: string[]) => {
    if (shopIds.length === 0) return;

    try {
      const shopsQuery = query(collection(db, "shops"), where("__name__", "in", shopIds));

      const shopsSnapshot = await getDocs(shopsQuery);
      const shopsData = shopsSnapshot.docs.map((doc) => ({ ...doc.data() } as Shop));
     
      setShops(shopsData);
    } catch (error) {
      console.error("Error loading shops:", error);
    }
  };

  const joinShop = async () => {
    if (!shopLink.trim()) {
      Alert.alert("Error", "Please enter a shop link");
      return;
    }

    const user = auth.currentUser;
    if (!user || !customer) return;

    setLoading(true);
    try {
      // Find shop by link
      const shopsQuery = query(collection(db, "shops"), where("link", "==", shopLink.trim()));

      const shopsSnapshot = await getDocs(shopsQuery);

      if (shopsSnapshot.empty) {
        Alert.alert("Error", "Shop not found with this link");
        setLoading(false);
        return;
      }

      const shopDoc = shopsSnapshot.docs[0];
      const shopData = shopDoc.data() as Shop;

      // Check if already joined
      if (customer.shopsJoined.includes(shopData.id)) {
        Alert.alert("Info", "You are already a member of this shop");
        setLoading(false);
        return;
      }

      // Update customer's shopsJoined array
      await updateDoc(doc(db, "customers", user.uid), {
        shopsJoined: arrayUnion(shopDoc.id),
        updatedAt: new Date(),
      });

      // Update shop's customers array
      await updateDoc(doc(db, "shops", shopData.id), {
        customers: arrayUnion(user.uid),
        updatedAt: new Date(),
      });

      Alert.alert("Success", `You have joined ${shopData.name}!`);
      setShopLink("");
      loadCustomerData(); // Refresh data
    } catch (error: any) {
      Alert.alert("Error", error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleQRScan = () => {
    router.navigate("/(customerTabs)/scan");
  };

  return (
    <ScrollView style={styles.container}>
  

      <View style={styles.header}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>My Shops</Text>
          <TouchableOpacity
            onPress={() => router.push("/(customerTabs)/notifications")}
            style={styles.notificationButton}
          >
            <Icon name="notifications-active" size={30} color="#3B82F6" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Join New Shop</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter shop link"
          value={shopLink}
          onChangeText={setShopLink}
          autoCapitalize="none"
        />
        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={joinShop}
          disabled={loading}
        >
          <Text style={styles.buttonText}>{loading ? "Joining..." : "Join Shop"}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.button, styles.scanButton]} onPress={handleQRScan}>
          <Text style={styles.buttonText}>Join via QR</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Joined Shops</Text>
        {shops.length === 0 ? (
          <Text style={styles.emptyText}>No shops joined yet</Text>
        ) : (
          shops.map((shop) => (
            <View key={shop.id} style={styles.shopCard}>
              <Text style={styles.shopName}>{shop.name}</Text>
              <Text style={styles.shopLink}>Link: {shop.link}</Text>
              <TouchableOpacity style={styles.viewButton}>
                <Text style={styles.viewButtonText}>View Details</Text>
              </TouchableOpacity>
            </View>
          ))
        )}
      </View>
    </ScrollView>
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
  shopCard: {
    backgroundColor: "#fff",
    padding: 16,
    marginVertical: 8,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 3,
  },
  shopName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  shopLink: {
    fontSize: 14,
    color: "#1e88e5",
    marginTop: 4,
  },
  viewButton: {
    marginTop: 10,
    padding: 10,
    backgroundColor: "#1e88e5",
    borderRadius: 6,
    alignItems: "center",
  },
  viewButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  scanButton: {
    backgroundColor: "#4B91F3",
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  notificationButton: {
    padding: 8,
  },
  notificationIcon: {
    fontSize: 24,
  },
});
