import 'react-native-gesture-handler';
import '../global.css';
import { useEffect } from 'react';
import { Redirect, Stack } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import { Image } from 'expo-image';
import { cssInterop } from 'nativewind';
import AuthProvider from '../providers/AuthProvider';
import CourseProvider from '../providers/CourseProvider';
import { useAuth } from '../store/authStore';
import { requestNotificationPermission, scheduleReminderNotification } from '../utils/notifications';
import { Colors } from '../constants/colors';

cssInterop(Image, { className: 'style' });

function RootNavigator() {
  const { isLoading, token } = useAuth();

  useEffect(() => {
    requestNotificationPermission();
    scheduleReminderNotification();
  }, []);

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center bg-background">
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" redirect={!!token} />
      <Stack.Screen name="(tabs)" redirect={!token} />
      <Stack.Screen
        name="course/[id]"
        redirect={!token}
        options={{ headerShown: true, title: 'Course Details', headerTintColor: Colors.primary }}
      />
      <Stack.Screen
        name="webview"
        redirect={!token}
        options={{ headerShown: true, title: 'Course Content', headerTintColor: Colors.primary }}
      />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <CourseProvider>
        <RootNavigator />
      </CourseProvider>
    </AuthProvider>
  );
}
