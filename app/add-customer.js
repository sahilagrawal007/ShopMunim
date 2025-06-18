import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { addDoc, collection } from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import React, { useState } from 'react';
import { Alert, Image, ScrollView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { db, storage } from '../firebaseConfig';

export default function AddCustomer() {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [credit, setCredit] = useState('');
  const [note, setNote] = useState('');
  const [image, setImage] = useState(null);
  const router = useRouter();

  const handleAddCustomer = async () => {
    if (!name || !phone) {
      Alert.alert('Please fill in required fields');
      return;
    }
    let imageUrl = '';
    try {
      if (image) {
        // Convert image URI to blob
        const response = await fetch(image);
        const blob = await response.blob();
        const imageRef = ref(storage, `customers/${Date.now()}_${name}.jpg`);
        await uploadBytes(imageRef, blob);
        imageUrl = await getDownloadURL(imageRef);
      }
      await addDoc(collection(db, 'customers'), {
        name,
        phone,
        credit: credit ? Number(credit) : 0,
        note,
        imageUrl, // Save the image URL
        createdAt: new Date(),
      });
      Alert.alert('Customer added!');
      router.back();
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  const takePhoto = async () => {
    let result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#fafbfc' }}>
      <StatusBar style="dark" backgroundColor="#fff" translucent={false} />
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.card}>
          <TouchableOpacity style={styles.photoWrapper} onPress={pickImage} onLongPress={takePhoto}>
            {image ? (
              <Image source={{ uri: image }} style={styles.photo} />
            ) : (
              <View style={styles.photo}>
                <Text style={styles.photoText}>Tap to change photo</Text>
              </View>
            )}
            <View style={styles.editIconWrapper}>
              <Text style={styles.editIcon}>✏️</Text>
            </View>
          </TouchableOpacity>
          <Text style={styles.photoLabel}>Tap to change photo</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Priya Singh"
            value={name}
            onChangeText={setName}
            placeholderTextColor="#b0b0b0"
          />
          <TextInput
            style={styles.input}
            placeholder="e.g. 9876543210"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            placeholderTextColor="#b0b0b0"
          />
          <TextInput
            style={styles.input}
            placeholder="e.g. 500"
            value={credit}
            onChangeText={setCredit}
            keyboardType="numeric"
            placeholderTextColor="#b0b0b0"
          />
          <TextInput
            style={[styles.input, { height: 60 }]}
            placeholder="e.g. Regular customer from neighbourhood"
            value={note}
            onChangeText={setNote}
            multiline
            placeholderTextColor="#b0b0b0"
          />
          <TouchableOpacity style={styles.button} onPress={handleAddCustomer}>
            <Text style={styles.buttonText}>Add Customer</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fafbfc',
    paddingVertical: 32,
  },
  card: {
    width: '95%',
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  photoWrapper: {
    marginBottom: 8,
  },
  photo: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#eee',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 3,
  },
  photoText: {
    color: '#b0b0b0',
    fontSize: 13,
    textAlign: 'center',
  },
  editIconWrapper: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#4f46e5',
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  editIcon: {
    color: '#fff',
    fontSize: 14,
  },
  photoLabel: {
    color: '#b0b0b0',
    fontSize: 13,
    marginBottom: 16,
  },
  input: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 10,
    padding: 14,
    marginBottom: 14,
    fontSize: 16,
    backgroundColor: '#f7f7fa',
    color: '#222',
  },
  button: {
    width: '100%',
    backgroundColor: 'linear-gradient(90deg, #6366F1 0%, #60A5FA 100%)', // fallback for web, use gradient lib for native
    backgroundColor: '#6366F1', // fallback for native
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 4,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18,
  },
}); 