import { useRouter } from 'expo-router';
import { signOut } from 'firebase/auth';
import React from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import { useAppPreferences } from '../../components/AppPreferencesContext';
import { auth } from '../../firebaseConfig';

export default function OwnerSettings() {
  const router = useRouter();
  const { preferences } = useAppPreferences();
  
  const handleSignOut = async () => {
    try {
      await signOut(auth);
      router.navigate('/(auth)/login');
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Settings</Text>
      </View>
      
      <View style={styles.section}>
        <TouchableOpacity style={styles.settingItem} onPress={() => router.navigate('/(ownerTabs)/EditProfile' as any)}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Feather name="user" size={20} color="#555" style={{ marginRight: 12 }} />
            <Text style={styles.settingText}>Edit Profile</Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity style={styles.settingItem} onPress={() => router.navigate('/(ownerTabs)/ChangePassword' as any)}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Feather name="lock" size={20} color="#555" style={{ marginRight: 12 }} />
            <Text style={styles.settingText}>Change Password</Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity style={styles.settingItem} onPress={() => router.navigate('/(ownerTabs)/ShopInformation' as any)}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Feather name="shopping-bag" size={20} color="#555" style={{ marginRight: 12 }} />
            <Text style={styles.settingText}>Shop Information</Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity style={styles.settingItem} onPress={() => router.navigate('/(ownerTabs)/Notifications' as any)}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Feather name="bell" size={20} color="#555" style={{ marginRight: 12 }} />
            <Text style={styles.settingText}>Notifications</Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.settingItem, styles.signOutButton]} onPress={handleSignOut}>
          <Text style={[styles.settingText, styles.signOutText]}>Sign Out</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 32,
    color: '#666',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
    backgroundColor: 'white',
  },
  button: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  linkButton: {
    alignItems: 'center',
  },
  linkText: {
    color: '#007AFF',
    fontSize: 16,
  },
  roleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 32,
  },
  roleButton: {
    flex: 1,
    marginHorizontal: 8,
    padding: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#ddd',
    alignItems: 'center',
    backgroundColor: 'white',
  },
  roleButtonSelected: {
    borderColor: '#007AFF',
    backgroundColor: '#007AFF',
  },
  roleButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  roleButtonTextSelected: {
    color: 'white',
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
    color: '#666',
  },
  nameText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  summaryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
    marginHorizontal: 4,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  summaryAmount: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  dueAmount: {
    color: '#FF3B30',
  },
  advanceAmount: {
    color: '#34C759',
  },
  paidAmount: {
    color: '#007AFF',
  },
  section: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  emptyText: {
    textAlign: 'center',
    color: '#666',
    fontStyle: 'italic',
  },
  transactionCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  transactionInfo: {
    flex: 1,
  },
  transactionDescription: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  transactionDate: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: 'bold',
  },
    settingText: {
    fontSize: 18,
    color: '#555',
    marginVertical: 8,
  },
  signOutText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
  signOutButton: {
    backgroundColor: '#ff5252',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  settingItem: {
    backgroundColor: '#fff',
    padding: 16,
    marginVertical: 6,
    borderRadius: 8,
    elevation: 2,
  },
  preferencesDisplay: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  preferencesTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  preferencesText: {
    fontSize: 16,
    color: '#666',
  },
});
