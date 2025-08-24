import { Stack } from "expo-router";
import { onAuthStateChanged, User } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { auth, db } from "../firebaseConfig";
import { useRouter } from "expo-router";

export default function RootLayout() {
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<"owner" | "customer" | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        try {
          const ownerDoc = await getDoc(doc(db, "owners", user.uid));
          if (ownerDoc.exists()) {
            setUserRole("owner");
          } else {
            const customerDoc = await getDoc(doc(db, "customers", user.uid));
            if (customerDoc.exists()) {
              setUserRole("customer");
            } else setUserRole(null);
          }
        } catch (error) {
          console.error("Error checking user role:", error);
          setUserRole(null);
        }
      } else {
        setUserRole(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  // Redirect after login+role detected
  useEffect(() => {
    if (!loading && user && userRole) {
      if (userRole === "owner") {
        router.replace('/(ownerTabs)');
      } else if (userRole === "customer") {
        router.replace('/(customerTabs)');
      }
    }
    if (!loading && !user) {
      router.replace('/(auth)/login');
    }
  }, [loading, user, userRole, router]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(ownerTabs)" />
      <Stack.Screen name="(customerTabs)" />
    </Stack>
  );
}
