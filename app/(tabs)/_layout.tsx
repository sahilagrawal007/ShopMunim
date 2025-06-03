// app/(tabs)/_layout.tsx
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveBackgroundColor: '#FFFFFF',
        tabBarInactiveBackgroundColor: '#FFFFFF',
        tabBarActiveTintColor: '#2563EB',     // blue-600
        tabBarInactiveTintColor: '#6B7280',   // gray-500
        tabBarLabelStyle: { fontSize: 12 },
        tabBarStyle: { height: 60, paddingBottom: 6 },
      }}
    >
      <Tabs.Screen
        name="index" // matches app/(tabs)/index.tsx
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="two"   // matches app/(tabs)/two.tsx
        options={{
          title: 'Products',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="pricetags-outline" color={color} size={size} />
          ),
        }}
      />
    </Tabs>
  );
}
