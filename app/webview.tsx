import React, { useState } from 'react';
import {
  View,
  Text,
  ActivityIndicator,
  Platform,
  TouchableOpacity,
} from 'react-native';
import {
  WebView,
  WebViewMessageEvent,
} from 'react-native-webview';
import { useAuth } from '../store/authStore';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCourses } from '../store/courseStore';
import { Colors } from '../constants/colors';

export default function CourseWebViewScreen() {
  const router = useRouter();
  const { user, token } = useAuth();
  const { enrolled } = useCourses();

  const params = useLocalSearchParams<{
    id: string;
    title: string;
    instructor: string;
    price: string;
    description: string;
  }>();

  const courseId = String(params.id || '');
  const isEnrolled = enrolled.includes(courseId);

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

  // WEB
if (Platform.OS === 'web') {
  return (
    <View className="flex-1 bg-background">
      <View className="flex-1">
        {React.createElement('iframe', {
          src: courseUrl,
          title: params.title || 'Course Content',
          onLoad: () => setLoading(false),
          onError: () => {
            setLoading(false);
            setError(true);
          },
          style: {
            width: '100%',
            height: '100%',
            border: 'none',
          },
        })}

        {loading && (
          <View className="absolute inset-0 justify-center items-center bg-background/80">
            <ActivityIndicator
              size="large"
              color={Colors.primary}
            />
          </View>
        )}
      </View>

      {isEnrolled && (
        <View className="p-4 bg-surface border-t border-border">
          <Text className="text-xs text-muted text-center mb-2">
            You are enrolled in this course
          </Text>

          <button
            onClick={() =>
              router.push({
                pathname: '/learning/[id]',
                params: {
                  id: courseId,
                  title: params.title || '',
                },
              })
            }
            style={{
              width: '100%',
              padding: '14px 20px',
              border: 'none',
              borderRadius: 12,
              backgroundColor: Colors.primary,
              color: '#FFFFFF',
              fontSize: 16,
              fontWeight: '700',
              cursor: 'pointer',
            }}
          >
            Start Learning
          </button>
        </View>
      )}
    </View>
  );
}

  // ANDROID / IOS
return (
  <View className="flex-1 bg-background">
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
          <ActivityIndicator
            size="large"
            color={Colors.primary}
          />
        </View>
      )}
    </View>

    {isEnrolled && (
      <View className="p-4 bg-surface border-t border-border">
        <Text className="text-xs text-muted text-center mb-2">
          You are enrolled in this course
        </Text>

        <TouchableOpacity
          className="bg-primary rounded-xl py-4 items-center"
          onPress={() =>
            router.push({
              pathname: '/learning/[id]',
              params: {
                id: courseId,
                title: params.title || '',
              },
            })
          }
        >
          <Text className="text-white font-bold text-base">
            Start Learning
          </Text>
        </TouchableOpacity>
      </View>
    )}
  </View>
);
}