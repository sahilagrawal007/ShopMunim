import { iconMap } from "@/constants/iconMap";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { getAuth } from "firebase/auth";
import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  updateDoc,
  getDocs,
} from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
  Dimensions,
  Image,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  Alert,
} from "react-native";
import { PieChart } from "react-native-chart-kit";
import { SafeAreaView } from "react-native-safe-area-context";
import { db } from "../../firebaseConfig";

const screenWidth = Dimensions.get("window").width;

export default function CustomerHomeScreen() {
  const [customer, setCustomer] = useState<any>(null);
  const [shops, setShops] = useState<any[]>([]);
  const [due, setDue] = useState(0);
  const [spent, setSpent] = useState(0);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [previousNotificationCount, setPreviousNotificationCount] = useState(0);
  const router = useRouter();

  // Function to show notifications modal
  const showNotificationsModal = () => {
    setShowNotifications(true);
  };

  // Function to mark notification as read
  const markNotificationAsRead = async (notificationId: string) => {
    try {
      // Update notification in Firestore to mark as read
      const notificationRef = doc(db, 'notifications', notificationId);
      await updateDoc(notificationRef, { read: true });
      
      // Update local state
      setNotifications(prev => prev.map(n => 
        n.id === notificationId ? { ...n, read: true } : n
      ));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
    }
  };

  // Function to show toast notification
  const displayToast = (message: string) => {
    setToastMessage(message);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  // Fallback function to fetch notifications without real-time updates
  const fetchNotificationsFallback = async (joinedShops: string[], customerId: string) => {
    try {
      
      const notificationsRef = collection(db, 'notifications');
      const q = query(notificationsRef, where("customerId", "==", customerId));
      const snapshot = await getDocs(q);
      
      const notificationsList: any[] = [];
      let unread = 0;

      snapshot.forEach((doc) => {
        const notification = { id: doc.id, ...doc.data() };
        // Include ALL notifications for this customer (not just from joined shops)
        // This shows complete history including past notifications
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
      setPreviousNotificationCount(notificationsList.length);
    } catch (error) {
      setNotifications([]);
      setUnreadCount(0);
    }
  };

  // Test function to manually check notifications
  const testNotifications = async () => {
    const user = getAuth().currentUser;
    if (!user) {
      Alert.alert('Error', 'No authenticated user');
      return;
    }
    
    try {
      
      // Test direct Firestore query
      const notificationsRef = collection(db, 'notifications');
      const snapshot = await getDocs(notificationsRef);
      
      snapshot.forEach((doc) => {
        const data = doc.data();
      });
      
      Alert.alert('Test Complete', `Found ${snapshot.size} total notifications. Check console for details.`);
    } catch (error) {
      Alert.alert('Test Failed', 'Check console for error details.');
    }
  };

  // Function to manually recalculate analytics
  const recalculateAnalytics = async () => {
    const user = getAuth().currentUser;
    if (!user) {
      Alert.alert('Error', 'No authenticated user');
      return;
    }

    try {
      
      // Get current joined shops
      const customerDoc = await getDoc(doc(db, "customers", user.uid));
      if (!customerDoc.exists()) {
        Alert.alert('Error', 'Customer profile not found');
        return;
      }
      
      const customerData = customerDoc.data();
      const joinedShops: string[] = customerData.shopsJoined || [];
      
      if (joinedShops.length === 0) {
        Alert.alert('No Shops', 'You are not joined to any shops yet');
        return;
      }

      // Fetch transactions manually
      const txnQuery = query(
        collection(db, "transactions"),
        where("customerId", "==", user.uid),
        where("shopId", "in", joinedShops)
      );
      
      const snapshot = await getDocs(txnQuery);
      let totalPaid = 0;
      let totalAdvance = 0;
      let totalDue = 0;
      
      snapshot.forEach((doc) => {
        const txn = doc.data();
        const amount = Number(txn.amount) || 0;
        
        if (txn.type === "paid") {
          totalPaid += amount;
        } else if (txn.type === "due") {
          totalDue += amount;
        } else if (txn.type === "advance") {
          totalAdvance += amount;
        }
      });

      const netDue = Math.max(totalDue - (totalPaid + totalAdvance), 0);
      const totalSpent = totalPaid + totalAdvance;

      // Update state
      setDue(netDue);
      setSpent(totalSpent);

      Alert.alert('Recalculation Complete', 
        `New values:\nTotal Spent: ₹${totalSpent}\nDue: ₹${netDue}\nCheck console for details.`
      );
      
    } catch (error) {
      Alert.alert('Recalculation Failed', 'Check console for error details.');
    }
  };

  useEffect(() => {
    const user = getAuth().currentUser;
    if (!user) return;

    let unsubscribe: any;
    let customerUnsubscribe: any;
    let notificationsUnsubscribe: any;

    const fetchData = async () => {
      const customerDoc = await getDoc(doc(db, "customers", user.uid));
      if (!customerDoc.exists()) return;

      const customerData = customerDoc.data();
      setCustomer(customerData);
      setProfileImage(customerData.photoURL || null);

      // Listen for customer profile changes
      customerUnsubscribe = onSnapshot(doc(db, "customers", user.uid), (doc) => {
        if (doc.exists()) {
          const data = doc.data();
          setCustomer(data);
          setProfileImage(data.photoURL || null);
        }
      });

      const joinedShops: string[] = customerData.shopsJoined || [];
      const shopsData = [];

      for (const shopId of joinedShops) {
        const shopDoc = await getDoc(doc(db, "shops", shopId));
        if (shopDoc.exists()) {
          shopsData.push({ id: shopId, ...shopDoc.data() });
        }
      }
      setShops(shopsData);

      // Listen for notifications from joined shops
      if (joinedShops.length > 0) {
        try {
          // Get ALL notifications for this customer (not just from joined shops)
          // This ensures customers see their complete notification history
          const notificationsQuery = query(
            collection(db, "notifications"),
            where("customerId", "==", user.uid)
          );

          notificationsUnsubscribe = onSnapshot(notificationsQuery, (snapshot) => {
            const notificationsList: any[] = [];
            let unread = 0;

            snapshot.forEach((doc) => {
              const notification = { id: doc.id, ...doc.data() };
              // Include ALL notifications for this customer (not just from joined shops)
              // This shows complete history including past notifications from shops they may have left
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

            // Check if new notifications arrived
            if (notificationsList.length > previousNotificationCount && previousNotificationCount > 0) {
              const newCount = notificationsList.length - previousNotificationCount;
              displayToast(`You have ${newCount} new notification${newCount > 1 ? 's' : ''}!`);
            }

            setNotifications(notificationsList);
            setUnreadCount(unread);
            setPreviousNotificationCount(notificationsList.length);
          }, (error) => {
            // Fallback: try to fetch without real-time updates
            fetchNotificationsFallback(joinedShops, user.uid);
          });
        } catch (error) {
          // Fallback: try to fetch without real-time updates
          fetchNotificationsFallback(joinedShops, user.uid);
        }
      }

      const txnQuery = query(
        collection(db, "transactions"),
        where("customerId", "==", user.uid)
        // Removed shopId filter to get ALL transactions for the customer
        // This ensures we don't miss transactions from shops they may have left
      );

      unsubscribe = onSnapshot(txnQuery, (snapshot) => {
        let totalPaid = 0;
        let totalAdvance = 0;
        let totalDue = 0;

        snapshot.forEach((doc) => {
          const txn = doc.data();
          const amount = Number(txn.amount) || 0;
          
          if (txn.type === "paid") {
            totalPaid += amount;
          } else if (txn.type === "due") {
            totalDue += amount;
          } else if (txn.type === "advance") {
            totalAdvance += amount;
          }
        });

        // Calculate net outstanding due (what customer actually owes)
        // Due transactions - (Paid + Advance payments)
        const netDue = Math.max(totalDue - (totalPaid + totalAdvance), 0);
        
        // Total spent = All payments made (paid + advance)
        const totalSpent = totalPaid + totalAdvance;
        
        // Total credit used = Total due amount (what was purchased on credit)
        const totalCreditUsed = totalDue;

        setDue(netDue);
        setSpent(totalSpent);
      });
    };

    fetchData();

    return () => {
      if (unsubscribe) unsubscribe();
      if (customerUnsubscribe) customerUnsubscribe();
      if (notificationsUnsubscribe) notificationsUnsubscribe();
    };
  }, []);

  const spendingChartData = [
    {
      name: "Total Spent",
      population: spent,
      color: "#3B82F6", // blue-500
      legendFontColor: "#3B82F6",
      legendFontSize: 14,
    },
    {
      name: "Due",
      population: due,
      color: "#60A5FA", // blue-400
      legendFontColor: "#60A5FA",
      legendFontSize: 14,
    },
  ];

  return (
    <SafeAreaView edges={["top", "left", "right"]} className="flex-1 bg-white">
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        {/* Header */}
        <View className="flex-row justify-between items-center mb-6">
          <View className="flex-row items-center">
            <Image source={iconMap["shop.png"]} className="w-6 h-6 mr-2" />
            <Text className="text-xl font-bold text-gray-900">ShopMunim</Text>
          </View>
          <TouchableOpacity 
            onPress={() => {
              if (notifications.length > 0) {
                showNotificationsModal();
              } else {
                Alert.alert("No Notifications", "You don't have any notifications yet.");
              }
            }}
            className="relative"
          >
            <Image source={iconMap["bell.png"]} className="w-6 h-6" />
            {unreadCount > 0 && (
              <View className="absolute -top-1 -right-1 bg-red-500 rounded-full w-5 h-5 items-center justify-center">
                <Text className="text-white text-xs font-bold">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Welcome */}
        {/* <View className="flex-row items-center justify-between mb-6">
          <View>
            <Text className="text-gray-500 text-sm">Welcome back,</Text>
            <Text className="text-lg font-bold text-gray-900">{customer?.name || "User"}</Text>
          </View>
          <Image
            source={{ uri: "https://randomuser.me/api/portraits/men/32.jpg" }}
            className="w-12 h-12 rounded-full"
          />
        </View> */}

        {/* Profile Card */}
        <LinearGradient
          colors={["#3B82F6", "#60A5FA"]}
          className="rounded-2xl p-4 flex-row justify-between items-center mb-6"
        >
          <View className="flex-1">
            <Text className="text-white text-sm">Welcome back,</Text>
            <Text className="text-white text-xl font-bold mt-1">{customer?.name}</Text>
            <Text className="text-white text-xs mt-2 opacity-90">
              Track your purchases and dues from all your favourite shops.
            </Text>
          </View>
          <TouchableOpacity 
            onPress={() => router.push("/(customerTabs)/editProfile")}
            className="ml-4"
          >
            <Image
              source={profileImage ? { uri: profileImage } : iconMap["user.png"]}
              className="w-20 h-20 rounded-full border-4 border-white"
              style={{ resizeMode: profileImage ? 'cover' : 'contain' }}
            />
          </TouchableOpacity>
        </LinearGradient>

        {/* Summary Cards */}
        <Text className="text-gray-800 text-base font-semibold mb-3">Spending Summary</Text>
        <View className="flex-row justify-between mb-6">
          {/* Total Spent Card (Updated to Red Theme) */}
          <View className="w-[48%] bg-white p-4 rounded-xl shadow items-center">
            <View className="bg-red-100 p-3 rounded-full mb-2">
              <Image source={iconMap["rupee.png"]} className="w-5 h-5" />
            </View>
            <Text className="text-lg font-bold text-red-600">₹{spent}</Text>
            <Text className="text-sm text-gray-500 text-center">Total Spent</Text>
          </View>

          {/* Due Card (Yellow Theme) */}
          <View className="w-[48%] bg-white p-4 rounded-xl shadow items-center">
            <View className="bg-yellow-100 p-3 rounded-full mb-2">
              <Image source={iconMap["clock.png"]} className="w-5 h-5" />
            </View>
            <Text className="text-lg font-bold text-yellow-600">₹{due}</Text>
            <Text className="text-sm text-gray-500 text-center">Due</Text>
          </View>
        </View>

        {/* Detailed Analytics */}
        {/* <View className="mb-6 bg-blue-50 p-4 rounded-lg border border-blue-200">
          <Text className="text-blue-800 font-semibold mb-3">📊 Transaction Analytics</Text>
          <View className="space-y-2">
            <View className="flex-row justify-between">
              <Text className="text-blue-700 text-sm">Total Credit Used:</Text>
              <Text className="text-blue-800 font-medium">₹{spent + due}</Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-blue-700 text-sm">Payments Made:</Text>
              <Text className="text-blue-800 font-medium">₹{spent}</Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-blue-700 text-sm">Outstanding Due:</Text>
              <Text className="text-blue-800 font-medium">₹{due}</Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-blue-700 text-sm">Payment Progress:</Text>
              <Text className="text-blue-800 font-medium">
                {spent + due > 0 ? Math.round((spent / (spent + due)) * 100) : 0}%
              </Text>
            </View>
          </View>
        </View> */}

        {/* Shops List */}
        <View className="mb-6 bg-white p-4 rounded-lg shadow-md border border-gray-200">
          <Text className="text-lg font-bold text-gray-800 mb-4">Your Shops</Text>
          {shops.length > 0 ? (
            shops.map((shop) => (
              <TouchableOpacity
                key={shop.id}
                className="flex-row justify-between items-center py-2 border-b border-gray-100 last:border-b-0"
                onPress={() =>
                  router.push({
                    pathname: "/(customerTabs)/shopDetails",
                    params: { shopId: shop.id },
                  })
                }
              >
                <View className="flex-row items-center">
                  <Image source={iconMap["shop.png"]} className="w-10 h-10 rounded-full mr-3" />
                  <View>
                    <Text className="text-gray-700 font-medium">{shop.name}</Text>
                    <Text className="text-xs text-gray-500">{shop.location || "No location"}</Text>
                  </View>
                </View>
                <Image source={iconMap["arrow-right.png"]} className="w-4 h-4" />
              </TouchableOpacity>
            ))
          ) : (
            <Text className="text-gray-500">No shops joined yet.</Text>
          )}
        </View>

        {/* Debug Section - Remove in production */}
        {/* <View className="mb-6 bg-yellow-50 p-4 rounded-lg border border-yellow-200">
          <Text className="text-yellow-800 font-semibold mb-2">Debug Info</Text>
          <Text className="text-yellow-700 text-sm mb-2">📱 Total Notifications: {notifications.length}</Text>
          <Text className="text-yellow-700 text-sm mb-2">🔴 Unread: {unreadCount}</Text>
          <Text className="text-yellow-700 text-sm mb-2">🏪 Joined Shops: {shops.length}</Text>
          <Text className="text-yellow-700 text-sm mb-2">👤 Customer ID: {getAuth().currentUser?.uid?.substring(0, 8)}...</Text>
          <Text className="text-yellow-700 text-sm mb-2">💰 Total Spent: ₹{spent}</Text>
          <Text className="text-yellow-700 text-sm mb-2">⏰ Current Due: ₹{due}</Text>
          <Text className="text-yellow-700 text-sm mb-2">💳 Total Credit Used: ₹{spent + due}</Text>
          <TouchableOpacity 
            className="bg-yellow-500 px-4 py-2 rounded-lg mt-2"
            onPress={testNotifications}
          >
            <Text className="text-white font-semibold text-center">Test Notifications</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            className="bg-blue-500 px-4 py-2 rounded-lg mt-2"
            onPress={() => setShowNotifications(true)}
          >
            <Text className="text-white font-semibold text-center">View All Notifications</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            className="bg-green-500 px-4 py-2 rounded-lg mt-2"
            onPress={recalculateAnalytics}
          >
            <Text className="text-white font-semibold text-center">Recalculate Analytics</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            className="bg-purple-500 px-4 py-2 rounded-lg mt-2"
            onPress={() => {
              console.log('🔍 Current State:', {
                spent,
                due,
                shops: shops.map(s => ({ id: s.id, name: s.name })),
                customerId: getAuth().currentUser?.uid
              });
              Alert.alert('State Logged', 'Current state logged to console. Check console for details.');
            }}
          >
            <Text className="text-white font-semibold text-center">Log Current State</Text>
          </TouchableOpacity>
        </View> */}
      </ScrollView>

      {/* Toast Notification */}
      {showToast && (
        <View className="absolute top-20 left-4 right-4 bg-blue-500 rounded-lg p-4 shadow-lg z-50">
          <View className="flex-row items-center">
            <Image source={iconMap["bell.png"]} className="w-5 h-5 mr-3" style={{ tintColor: 'white' }} />
            <Text className="text-white font-medium flex-1">{toastMessage}</Text>
            <TouchableOpacity onPress={() => setShowToast(false)}>
              <Text className="text-white text-lg">✕</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Notifications Modal */}
      {showNotifications && (
        <View className="absolute inset-0 bg-white bg-opacity-50 flex-1 justify-center items-center">
          <View className="bg-white rounded-2xl p-6 mx-4 w-[90%] max-h-[80%]">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-xl font-bold text-gray-900">Notification History</Text>
              <TouchableOpacity onPress={() => setShowNotifications(false)}>
                <Text className="text-gray-500 text-lg">✕</Text>
              </TouchableOpacity>
            </View>
            
            {/* Summary Header */}
            <View className="bg-blue-50 p-3 rounded-lg mb-4">
              <Text className="text-blue-800 text-sm font-medium">
                📱 {notifications.length} total notifications • {unreadCount} unread
              </Text>
              <Text className="text-blue-600 text-xs mt-1">
                Shows all payment reminders and updates from all shops
              </Text>
            </View>
            
            <ScrollView showsVerticalScrollIndicator={false}>
              {notifications.length > 0 ? (
                notifications.map((notification, index) => {
                  const isNew = !(notification as any).read;
                  const isRecent = new Date((notification as any).createdAt).getTime() > Date.now() - (24 * 60 * 60 * 1000); // Last 24 hours
                  
                  return (
                    <TouchableOpacity
                      key={notification.id}
                      className={`p-4 border-l-4 mb-3 rounded-lg ${
                        isNew ? 'bg-blue-50 border-blue-500' : 'bg-gray-50 border-gray-300'
                      }`}
                      onPress={() => markNotificationAsRead(notification.id)}
                    >
                      {/* Status Badge */}
                      <View className="flex-row justify-between items-start mb-2">
                        <View className="flex-row items-center">
                          <Text className="font-semibold text-gray-900 text-base">
                            {notification.title || 'Payment Reminder'}
                          </Text>
                          {isNew && (
                            <View className="ml-2 bg-blue-500 px-2 py-1 rounded-full">
                              <Text className="text-white text-xs font-bold">NEW</Text>
                            </View>
                          )}
                          {isRecent && !isNew && (
                            <View className="ml-2 bg-green-500 px-2 py-1 rounded-full">
                              <Text className="text-white text-xs font-bold">RECENT</Text>
                            </View>
                          )}
                        </View>
                        <Text className="text-xs text-gray-500">
                          {new Date((notification as any).createdAt).toLocaleDateString()}
                        </Text>
                      </View>
                      
                      <Text className="text-gray-700 text-sm mb-2">
                        {notification.message}
                      </Text>
                      
                      <View className="flex-row justify-between items-center">
                        <View>
                          <Text className="text-xs text-gray-500">
                            From: {(notification as any).shopName || 'Shop'}
                          </Text>
                          <Text className="text-xs text-gray-400">
                            {new Date((notification as any).createdAt).toLocaleString()}
                          </Text>
                        </View>
                        {(notification as any).amount && (
                          <Text className="text-sm font-semibold text-red-600">
                            ₹{(notification as any).amount.toFixed(2)}
                          </Text>
                        )}
                      </View>
                      
                      {isNew && (
                        <View className="mt-2">
                          <Text className="text-xs text-blue-600">
                            👆 Tap to mark as read
                          </Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })
              ) : (
                <View className="py-8 items-center">
                  <Image source={iconMap["bell.png"]} className="w-16 h-16 opacity-30 mb-4" />
                  <Text className="text-gray-500 text-center">No notifications yet</Text>
                  <Text className="text-gray-400 text-sm text-center mt-1">
                    You'll see payment reminders and updates here
                  </Text>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}