import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function requestNotificationPermission(): Promise<boolean> {
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

export async function sendBookmarkNotification(count: number) {
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
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '📚 Miss learning?',
          body: "You haven't opened EduTech in a while. Come back and continue!",
        },
        trigger: null,
      });
    }
  }
  await AsyncStorage.setItem('last_open', String(now));
}
