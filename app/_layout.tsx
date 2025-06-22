import { Stack, useRouter } from 'expo-router';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { AppPreferencesProvider } from '../components/AppPreferencesContext';
import { auth, db } from '../firebaseConfig';

export default function RootLayout() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      
      if (user) {
        // Check user role and redirect accordingly
        try {
          const ownerDoc = await getDoc(doc(db, 'owners', user.uid));
          const customerDoc = await getDoc(doc(db, 'customers', user.uid));
          
          if (ownerDoc.exists()) {
            router.navigate('/(ownerTabs)');
          } else if (customerDoc.exists()) {
            router.navigate('/(customerTabs)');
          } else {
            // User exists but no role data - redirect to role selection
            router.navigate('/(auth)/roleSelection');
          }
        } catch (error) {
          console.error('Error checking user role:', error);
          router.navigate('/(auth)/login');
        }
      } else {
        router.navigate('/(auth)/login');  
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <AppPreferencesProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(ownerTabs)" />
        <Stack.Screen name="(customerTabs)" />
      </Stack>
    </AppPreferencesProvider>
  );
}
