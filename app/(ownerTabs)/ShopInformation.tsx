import { useRouter } from 'expo-router';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import { auth, db } from '../../firebaseConfig';

export default function ShopInformation() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    shopName: '',
    shopType: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    phone: '',
    email: '',
    gstNumber: '',
    openingTime: '',
    closingTime: '',
    isOpen: true,
    description: ''
  });

  useEffect(() => {
    loadShopData();
  }, []);

  const loadShopData = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      const shopDoc = await getDoc(doc(db, 'owners', user.uid));
      if (shopDoc.exists()) {
        const data = shopDoc.data();
        setFormData({
          shopName: data.shopName || '',
          shopType: data.shopType || '',
          address: data.address || '',
          city: data.city || '',
          state: data.state || '',
          pincode: data.pincode || '',
          phone: data.phone || '',
          email: data.email || user.email || '',
          gstNumber: data.gstNumber || '',
          openingTime: data.openingTime || '',
          closingTime: data.closingTime || '',
          isOpen: data.isOpen !== undefined ? data.isOpen : true,
          description: data.description || ''
        });
      }
    } catch (error) {
      console.error('Error loading shop data:', error);
    }
  };

  const handleSave = async () => {
    if (!formData.shopName.trim() || !formData.address.trim()) {
      Alert.alert('Error', 'Shop Name and Address are required');
      return;
    }

    setLoading(true);
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('User not authenticated');

      await updateDoc(doc(db, 'owners', user.uid), {
        shopName: formData.shopName,
        shopType: formData.shopType,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        pincode: formData.pincode,
        phone: formData.phone,
        email: formData.email,
        gstNumber: formData.gstNumber,
        openingTime: formData.openingTime,
        closingTime: formData.closingTime,
        isOpen: formData.isOpen,
        description: formData.description,
        updatedAt: new Date()
      });

      Alert.alert('Success', 'Shop information updated successfully', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <TouchableOpacity onPress={() => router.navigate('/settings')} style={styles.backButton}>
        <Feather name="arrow-left" size={24} color="#333" />
      </TouchableOpacity>
      
      <Text style={styles.title}>Shop Information</Text>
      
      <View style={styles.form}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Shop Name *</Text>
          <TextInput
            style={styles.input}
            value={formData.shopName}
            onChangeText={(text) => setFormData({...formData, shopName: text})}
            placeholder="Enter shop name"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Shop Type</Text>
          <TextInput
            style={styles.input}
            value={formData.shopType}
            onChangeText={(text) => setFormData({...formData, shopType: text})}
            placeholder="e.g., Grocery, Electronics, etc."
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Address *</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={formData.address}
            onChangeText={(text) => setFormData({...formData, address: text})}
            placeholder="Enter complete address"
            multiline
            numberOfLines={3}
          />
        </View>

        <View style={styles.row}>
          <View style={[styles.inputGroup, styles.halfWidth]}>
            <Text style={styles.label}>City</Text>
            <TextInput
              style={styles.input}
              value={formData.city}
              onChangeText={(text) => setFormData({...formData, city: text})}
              placeholder="City"
            />
          </View>
          <View style={[styles.inputGroup, styles.halfWidth]}>
            <Text style={styles.label}>State</Text>
            <TextInput
              style={styles.input}
              value={formData.state}
              onChangeText={(text) => setFormData({...formData, state: text})}
              placeholder="State"
            />
          </View>
        </View>

        <View style={styles.row}>
          <View style={[styles.inputGroup, styles.halfWidth]}>
            <Text style={styles.label}>Pincode</Text>
            <TextInput
              style={styles.input}
              value={formData.pincode}
              onChangeText={(text) => setFormData({...formData, pincode: text})}
              placeholder="Pincode"
              keyboardType="numeric"
            />
          </View>
          <View style={[styles.inputGroup, styles.halfWidth]}>
            <Text style={styles.label}>Phone</Text>
            <TextInput
              style={styles.input}
              value={formData.phone}
              onChangeText={(text) => setFormData({...formData, phone: text})}
              placeholder="Phone number"
              keyboardType="phone-pad"
            />
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            value={formData.email}
            onChangeText={(text) => setFormData({...formData, email: text})}
            placeholder="Shop email"
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>GST Number</Text>
          <TextInput
            style={styles.input}
            value={formData.gstNumber}
            onChangeText={(text) => setFormData({...formData, gstNumber: text})}
            placeholder="GST Number (optional)"
            autoCapitalize="characters"
          />
        </View>

        <View style={styles.row}>
          <View style={[styles.inputGroup, styles.halfWidth]}>
            <Text style={styles.label}>Opening Time</Text>
            <TextInput
              style={styles.input}
              value={formData.openingTime}
              onChangeText={(text) => setFormData({...formData, openingTime: text})}
              placeholder="e.g., 9:00 AM"
            />
          </View>
          <View style={[styles.inputGroup, styles.halfWidth]}>
            <Text style={styles.label}>Closing Time</Text>
            <TextInput
              style={styles.input}
              value={formData.closingTime}
              onChangeText={(text) => setFormData({...formData, closingTime: text})}
              placeholder="e.g., 8:00 PM"
            />
          </View>
        </View>

        <View style={styles.switchContainer}>
          <Text style={styles.label}>Shop Status</Text>
          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>
              {formData.isOpen ? 'Open' : 'Closed'}
            </Text>
            <Switch
              value={formData.isOpen}
              onValueChange={(value) => setFormData({...formData, isOpen: value})}
              trackColor={{ false: '#767577', true: '#81b0ff' }}
              thumbColor={formData.isOpen ? '#007AFF' : '#f4f3f4'}
            />
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={formData.description}
            onChangeText={(text) => setFormData({...formData, description: text})}
            placeholder="Brief description about your shop"
            multiline
            numberOfLines={4}
          />
        </View>

        <TouchableOpacity 
          style={[styles.saveButton, loading && styles.disabledButton]} 
          onPress={handleSave}
          disabled={loading}
        >
          <Text style={styles.saveButtonText}>
            {loading ? 'Saving...' : 'Save Shop Information'}
          </Text>
        </TouchableOpacity>
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
  form: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
    color: "#333",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: "white",
  },
  textArea: {
    height: 80,
    textAlignVertical: "top",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  halfWidth: {
    width: "48%",
  },
  switchContainer: {
    marginBottom: 20,
  },
  switchRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
  },
  switchLabel: {
    fontSize: 16,
    color: "#333",
  },
  saveButton: {
    backgroundColor: "#007AFF",
    borderRadius: 8,
    padding: 16,
    alignItems: "center",
    marginTop: 10,
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