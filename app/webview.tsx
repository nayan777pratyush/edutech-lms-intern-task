import React, { useState } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { WebView, WebViewMessageEvent } from 'react-native-webview';
import { useAuth } from '../store/authStore';
import { useLocalSearchParams } from 'expo-router';
import { Colors } from '../constants/colors';

export default function CourseWebViewScreen() {
  const { user, token } = useAuth();

  const params = useLocalSearchParams<{
    title: string;
    instructor: string;
    price: string;
    description: string;
  }>();

  const courseUrl = `https://rutikakhedkar.github.io/webview/?course=${encodeURIComponent(
    params.title || ''
  )}&instructor=${encodeURIComponent(
    params.instructor || ''
  )}&price=${encodeURIComponent(
    params.price || ''
  )}&description=${encodeURIComponent(
    params.description || ''
  )}`;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const onMessage = (event: WebViewMessageEvent) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);

      if (data.type === 'START_LEARNING') {
        console.log('User started learning');
      }
    } catch (err) {
      console.log(err);
    }
  };

  if (error) {
    return (
      <View className="flex-1 justify-center items-center bg-background px-6">
        <Text className="text-error text-sm text-center">
          Failed to load course content. Please try again.
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-1">
      <WebView
        source={{
          uri: courseUrl,
          headers: {
            Authorization: `Bearer ${token}`,
            UserName: user?.username || '',
            UserEmail: user?.email || '',
            Platform: 'Expo-App',
          },
        }}
        onMessage={onMessage}
        javaScriptEnabled
        domStorageEnabled
        onLoadStart={() => setLoading(true)}
        onLoadEnd={() => setLoading(false)}
        onError={() => {
          setLoading(false);
          setError(true);
        }}
      />
      {loading && (
        <View className="absolute inset-0 justify-center items-center bg-background/80">
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      )}
    </View>
  );
}
