import { Redirect } from 'expo-router';

export default function Index() {
  // You can put role-based redirect logic here
  return <Redirect href="/(auth)/login" />;
}