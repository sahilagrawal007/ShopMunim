import { useRouter } from 'expo-router';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import { auth, db } from '../../firebaseConfig';

export default function Notifications() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [notificationSettings, setNotificationSettings] = useState({
    pushNotifications: true,
    orderNotifications: true,
    paymentNotifications: true,
    reminderNotifications: true,
    marketingNotifications: false,
    soundEnabled: true,
    vibrationEnabled: true,
    dailySummary: true,
    weeklyReport: false,
    lowStockAlerts: true,
    customerMessages: true,
    systemUpdates: true
  });

  useEffect(() => {
    loadNotificationSettings();
  }, []);

  const loadNotificationSettings = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      const userDoc = await getDoc(doc(db, 'owners', user.uid));
      if (userDoc.exists()) {
        const data = userDoc.data();
        if (data.notificationSettings) {
          setNotificationSettings({
            ...notificationSettings,
            ...data.notificationSettings
          });
        }
      }
    } catch (error) {
      console.error('Error loading notification settings:', error);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('User not authenticated');

      await updateDoc(doc(db, 'owners', user.uid), {
        notificationSettings: notificationSettings,
        updatedAt: new Date()
      });

      Alert.alert('Success', 'Notification settings updated successfully', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleSetting = (key: keyof typeof notificationSettings) => {
    setNotificationSettings(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const NotificationItem = ({ 
    title, 
    description, 
    setting, 
    onToggle 
  }: {
    title: string;
    description: string;
    setting: boolean;
    onToggle: () => void;
  }) => (
    <View style={styles.notificationItem}>
      <View style={styles.notificationContent}>
        <Text style={styles.notificationTitle}>{title}</Text>
        <Text style={styles.notificationDescription}>{description}</Text>
      </View>
      <Switch
        value={setting}
        onValueChange={onToggle}
        trackColor={{ false: '#767577', true: '#81b0ff' }}
        thumbColor={setting ? '#007AFF' : '#f4f3f4'}
      />
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      <TouchableOpacity onPress={() => router.navigate('/settings')} style={styles.backButton}>
        <Feather name="arrow-left" size={24} color="#333" />
      </TouchableOpacity>
      
      <Text style={styles.title}>Notifications</Text>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>General Notifications</Text>
        
        <NotificationItem
          title="Push Notifications"
          description="Receive notifications on your device"
          setting={notificationSettings.pushNotifications}
          onToggle={() => toggleSetting('pushNotifications')}
        />

        <NotificationItem
          title="Sound"
          description="Play sound for notifications"
          setting={notificationSettings.soundEnabled}
          onToggle={() => toggleSetting('soundEnabled')}
        />

        <NotificationItem
          title="Vibration"
          description="Vibrate for notifications"
          setting={notificationSettings.vibrationEnabled}
          onToggle={() => toggleSetting('vibrationEnabled')}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Business Notifications</Text>
        
        <NotificationItem
          title="New Orders"
          description="Get notified when customers place orders"
          setting={notificationSettings.orderNotifications}
          onToggle={() => toggleSetting('orderNotifications')}
        />

        <NotificationItem
          title="Payment Updates"
          description="Notifications about payments and transactions"
          setting={notificationSettings.paymentNotifications}
          onToggle={() => toggleSetting('paymentNotifications')}
        />

        <NotificationItem
          title="Customer Messages"
          description="Messages from customers"
          setting={notificationSettings.customerMessages}
          onToggle={() => toggleSetting('customerMessages')}
        />

        <NotificationItem
          title="Low Stock Alerts"
          description="Get notified when products are running low"
          setting={notificationSettings.lowStockAlerts}
          onToggle={() => toggleSetting('lowStockAlerts')}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Reports & Updates</Text>
        
        <NotificationItem
          title="Daily Summary"
          description="Daily business summary report"
          setting={notificationSettings.dailySummary}
          onToggle={() => toggleSetting('dailySummary')}
        />

        <NotificationItem
          title="Weekly Report"
          description="Weekly business performance report"
          setting={notificationSettings.weeklyReport}
          onToggle={() => toggleSetting('weeklyReport')}
        />

        <NotificationItem
          title="System Updates"
          description="App updates and maintenance notifications"
          setting={notificationSettings.systemUpdates}
          onToggle={() => toggleSetting('systemUpdates')}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Other</Text>
        
        <NotificationItem
          title="Reminders"
          description="Payment reminders and important dates"
          setting={notificationSettings.reminderNotifications}
          onToggle={() => toggleSetting('reminderNotifications')}
        />

        <NotificationItem
          title="Marketing"
          description="Promotional offers and updates"
          setting={notificationSettings.marketingNotifications}
          onToggle={() => toggleSetting('marketingNotifications')}
        />
      </View>

      <TouchableOpacity 
        style={[styles.saveButton, loading && styles.disabledButton]} 
        onPress={handleSave}
        disabled={loading}
      >
        <Text style={styles.saveButtonText}>
          {loading ? 'Saving...' : 'Save Settings'}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    padding: 16,
  },
  backButton: {
    marginBottom: 20,
    marginTop: 40,
    width: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 24,
    color: "#333",
  },
  section: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 16,
    color: "#333",
  },
  notificationItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  notificationContent: {
    flex: 1,
    marginRight: 16,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
    marginBottom: 4,
  },
  notificationDescription: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
  },
  saveButton: {
    backgroundColor: "#007AFF",
    borderRadius: 8,
    padding: 16,
    alignItems: "center",
    marginTop: 20,
    marginBottom: 20,
  },
  disabledButton: {
    backgroundColor: "#ccc",
  },
  saveButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
}); 