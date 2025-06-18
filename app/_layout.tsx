import { Stack } from 'expo-router';
<<<<<<< HEAD
import { useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, db } from '../firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';
import { useRouter } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
=======
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import 'react-native-reanimated';

import { useColorScheme } from '@/components/useColorScheme';

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary
} from 'expo-router';

export const unstable_settings = {
  // Ensure that reloading on `/modal` keeps a back button present.
  initialRouteName: '(tabs)',
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();
>>>>>>> e19f3bf9466a0f74e2c358da24d655e751192e65

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
<<<<<<< HEAD
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(ownerTabs)" />
      <Stack.Screen name="(customerTabs)" />
    </Stack>
=======
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="add-customer" options={{ title: 'Add Customer', headerShown: true,  headerTintColor: '#2563eb', headerTitleStyle: { color: '#0000' } }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
      </Stack>
    </ThemeProvider>
>>>>>>> e19f3bf9466a0f74e2c358da24d655e751192e65
  );
}
