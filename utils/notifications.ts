import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

const isExpoGo =
  Constants.executionEnvironment === 'storeClient';

async function getNotifications() {
  if (Platform.OS === 'web' || isExpoGo) {
    return null;
  }

  return await import('expo-notifications');
}

export async function requestNotificationPermission(): Promise<boolean> {
  const Notifications = await getNotifications();

  if (!Notifications) {
    return false;
  }

  const { status } = await Notifications.requestPermissionsAsync();

  return status === 'granted';
}

export async function sendBookmarkNotification(count: number) {
  const Notifications = await getNotifications();

  if (!Notifications) {
    return;
  }

  await Notifications.scheduleNotificationAsync({
    content: {
      title: '🎉 Great job!',
      body: `You've bookmarked ${count} courses. Keep exploring!`,
  },
  trigger: null,
  });
}

export async function scheduleReminderNotification() {
  const lastOpen = await AsyncStorage.getItem('last_open');
  const now = Date.now();

  if (lastOpen) {
    const diff = now - parseInt(lastOpen, 10);

    if (diff >= 24 * 60 * 60 * 1000) {
      const Notifications = await getNotifications();

      if (Notifications) {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: '📚 Miss learning?',
            body: "You haven't opened EduTech in a while. Come back and continue!",
          },
          trigger: null,
        });
      }
    }
  }

  await AsyncStorage.setItem('last_open', String(now));
}