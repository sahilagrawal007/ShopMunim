import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { getAuth } from 'firebase/auth';
import {
    collection,
    doc,
    getDocs,
    query,
    updateDoc,
    where
} from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import {
    Dimensions,
    RefreshControl,
    SafeAreaView,
    ScrollView,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { db } from '../../firebaseConfig';

const screenWidth = Dimensions.get('window').width;

export default function CustomerNotificationsScreen() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  // Fetch notifications
  const fetchNotifications = async () => {
    try {
      const user = getAuth().currentUser;
      if (!user) {
        setLoading(false);
        return;
      }

      const notificationsRef = collection(db, 'notifications');
      const q = query(notificationsRef, where("customerId", "==", user.uid));
      const snapshot = await getDocs(q);
      
      const notificationsList: any[] = [];
      let unread = 0;

      snapshot.forEach((doc) => {
        const notification = { id: doc.id, ...doc.data() };
        notificationsList.push(notification);
        if (!(notification as any).read) {
          unread++;
        }
      });

      // Sort by creation date (newest first)
      notificationsList.sort((a, b) => {
        const dateA = new Date((a as any).createdAt || 0).getTime();
        const dateB = new Date((b as any).createdAt || 0).getTime();
        return dateB - dateA;
      });

      setNotifications(notificationsList);
      setUnreadCount(unread);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      setLoading(false);
    }
  };

  // Mark notification as read
  const markNotificationAsRead = async (notificationId: string) => {
    try {
      const notificationRef = doc(db, 'notifications', notificationId);
      await updateDoc(notificationRef, { read: true });
      
      setNotifications(prev => prev.map(n => 
        n.id === notificationId ? { ...n, read: true } : n
      ));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    try {
      const unreadNotifications = notifications.filter(n => !(n as any).read);
      
      for (const notification of unreadNotifications) {
        const notificationRef = doc(db, 'notifications', notification.id);
        await updateDoc(notificationRef, { read: true });
      }
      
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  // Refresh notifications
  const onRefresh = async () => {
    setRefreshing(true);
    await fetchNotifications();
    setRefreshing(false);
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <View className="flex-1 justify-center items-center">
          <Text className="text-gray-500 text-lg">Loading notifications...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white border-b border-gray-200 px-4 py-3">
        <View className="flex-row items-center justify-between">
          <TouchableOpacity
            onPress={() => router.back()}
            className="p-2 -ml-2"
          >
            <Ionicons name="arrow-back" size={24} color="#374151" />
          </TouchableOpacity>
          
          <Text className="text-xl font-bold text-gray-900">Notification History</Text>
          
          <TouchableOpacity
            onPress={markAllAsRead}
            className="p-2 -mr-2"
            disabled={unreadCount === 0}
          >
            <Text className={`text-sm font-medium ${unreadCount > 0 ? 'text-blue-600' : 'text-gray-400'}`}>
              Mark all read
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Summary Card */}
      <View className="mx-4 mt-4 bg-blue-50 p-4 rounded-xl border border-blue-100">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center">
            <View className="bg-blue-100 p-2 rounded-full mr-3">
              <Ionicons name="notifications" size={20} color="#2563EB" />
            </View>
            <View>
              <Text className="text-blue-800 text-base font-semibold">
                {notifications.length} total notifications
              </Text>
              <Text className="text-blue-600 text-sm">
                {unreadCount} unread
              </Text>
            </View>
          </View>
          
          <View className="bg-blue-100 px-3 py-1 rounded-full">
            <Text className="text-blue-800 text-xs font-medium">
              {unreadCount > 0 ? 'New' : 'All read'}
            </Text>
          </View>
        </View>
        
        <Text className="text-blue-600 text-xs mt-2">
          Shows all payment reminders and updates from all shops
        </Text>
      </View>

      {/* Notifications List */}
      <ScrollView 
        className="flex-1 px-4 mt-4"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {notifications.length > 0 ? (
          notifications.map((notification, index) => {
            const isNew = !(notification as any).read;
            const isRecent = new Date((notification as any).createdAt).getTime() > 
              Date.now() - 24 * 60 * 60 * 1000; // Last 24 hours
            const createdAt = new Date((notification as any).createdAt);
            const formattedDate = createdAt.toLocaleDateString('en-IN');
            const formattedTime = createdAt.toLocaleTimeString('en-IN', { 
              hour: '2-digit', 
              minute: '2-digit',
              second: '2-digit'
            });

            return (
              <TouchableOpacity
                key={notification.id}
                className={`mb-3 bg-white rounded-xl border-l-4 shadow-sm ${
                  isNew ? 'border-blue-500' : 'border-gray-300'
                }`}
                onPress={() => markNotificationAsRead(notification.id)}
                activeOpacity={0.7}
              >
                <View className="p-4">
                  {/* Header with status badges */}
                  <View className="flex-row justify-between items-start mb-3">
                    <View className="flex-row items-center flex-1">
                      <Text className="font-bold text-gray-900 text-base mr-2">
                        {notification.title || "Payment Reminder"}
                      </Text>
                      
                      {isNew && (
                        <View className="bg-blue-500 px-2 py-1 rounded-full">
                          <Text className="text-white text-xs font-bold">NEW</Text>
                        </View>
                      )}
                      
                      {isRecent && !isNew && (
                        <View className="bg-green-500 px-2 py-1 rounded-full">
                          <Text className="text-white text-xs font-bold">RECENT</Text>
                        </View>
                      )}
                    </View>
                    
                    <Text className="text-xs text-gray-500 font-medium">
                      {formattedDate}
                    </Text>
                  </View>

                  {/* Message */}
                  <Text className="text-gray-700 text-sm leading-5 mb-3">
                    {notification.message}
                  </Text>

                  {/* Footer with shop info and amount */}
                  <View className="flex-row justify-between items-center">
                    <View className="flex-1">
                      <Text className="text-xs text-gray-500 font-medium">
                        From: {(notification as any).shopName || "Shop"}
                      </Text>
                      <Text className="text-xs text-gray-400">
                        {formattedDate}, {formattedTime}
                      </Text>
                    </View>
                    
                    {(notification as any).amount && (
                      <View className="bg-red-50 px-3 py-2 rounded-lg border border-red-100">
                        <Text className="text-red-600 text-sm font-bold">
                          ₹{(notification as any).amount.toFixed(2)}
                        </Text>
                      </View>
                    )}
                  </View>

                  {/* Action hint for unread notifications */}
                  {isNew && (
                    <View className="mt-3 pt-3 border-t border-gray-100">
                      <Text className="text-xs text-blue-600 text-center">
                        👆 Tap to mark as read
                      </Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            );
          })
        ) : (
          <View className="py-16 items-center">
            <View className="bg-gray-100 p-6 rounded-full mb-4">
              <Ionicons name="notifications-off" size={48} color="#9CA3AF" />
            </View>
            <Text className="text-gray-500 text-lg font-medium text-center mb-2">
              No notifications yet
            </Text>
            <Text className="text-gray-400 text-sm text-center">
              You'll see payment reminders and updates here when they arrive
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Bottom Navigation Hint */}
      <View className="bg-white border-t border-gray-200 px-4 py-3">
        <Text className="text-gray-500 text-xs text-center">
          Pull down to refresh • Tap notifications to mark as read
        </Text>
      </View>
    </SafeAreaView>
  );
}
