import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { Image } from 'expo-image';
import { useAuth } from '../../store/authStore';
import { useCourses } from '../../store/courseStore';
import { logoutUser } from '../../utils/api';
import * as ImagePicker from 'expo-image-picker';

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const { bookmarks, enrolled } = useCourses();
  const [avatarUrl, setAvatarUrl] = React.useState(
     'https://picsum.photos/200/300'
  );

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          try {
            await logoutUser();
          } catch {
            // ignore network errors on logout
          }
          await logout();
        },
      },
    ]);
  };

  //user avatar image is page not found so added image intensionally


  const handlePickImage = async () => {
    const permission =
      await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (!permission.granted) {
      Alert.alert(
        'Permission required',
        'Allow gallery access'
      );
      return;
    }
    
    const result =
      await ImagePicker.launchImageLibraryAsync({
        mediaTypes:
          ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
    
    if (!result.canceled) {
      const imageUri = result.assets[0].uri;
      setAvatarUrl(imageUri);
      // Upload to backend/cloudinary/S3
    }
  };

  const stats = [
    { label: 'Enrolled', value: enrolled.length, icon: '🎓' },
    { label: 'Bookmarked', value: bookmarks.length, icon: '🔖' },
  ];

  return (
    <ScrollView className="flex-1 bg-background" contentContainerClassName="pb-10">
      <TouchableOpacity
        className="items-center pt-8 pb-6 bg-surface border-b border-border"
        onPress={handlePickImage}
      >
        {avatarUrl ? (
          <Image
            source={{ uri: avatarUrl }}
            className="w-[90px] h-[90px] rounded-full mb-3"
            contentFit="cover"
          />
        ) : (
          <View className="w-[90px] h-[90px] rounded-full bg-primary justify-center items-center mb-3">
            <Text className="text-white text-4xl font-bold">
              {(user?.username ?? 'U')[0].toUpperCase()}
            </Text>
          </View>
        )}
        <Text className="text-xl font-extrabold text-foreground mb-1">
          {user?.username ?? 'User'}
        </Text>
        <Text className="text-[13px] text-muted">{user?.email ?? ''}</Text>
      </TouchableOpacity>

      <View className="flex-row m-4 gap-3">
        {stats.map((s) => (
          <View
            key={s.label}
            className="flex-1 bg-surface rounded-xl p-4 items-center border border-border"
          >
            <Text className="text-2xl mb-1">{s.icon}</Text>
            <Text className="text-[22px] font-extrabold text-primary">{s.value}</Text>
            <Text className="text-xs text-muted mt-0.5">{s.label}</Text>
          </View>
        ))}
      </View>

      <View className="bg-surface mx-4 rounded-xl p-4 border border-border mb-4">
        <Text className="text-sm font-bold text-muted mb-3 uppercase tracking-wide">
          Account
        </Text>
        <View className="flex-row justify-between py-2.5 border-b border-border">
          <Text className="text-sm text-muted">Username</Text>
          <Text className="text-sm text-foreground font-semibold">{user?.username}</Text>
        </View>
        <View className="flex-row justify-between py-2.5 border-b border-border">
          <Text className="text-sm text-muted">Email</Text>
          <Text className="text-sm text-foreground font-semibold">{user?.email}</Text>
        </View>
        <View className="flex-row justify-between py-2.5 border-b border-border">
          <Text className="text-sm text-muted">Role</Text>
          <Text className="text-sm text-foreground font-semibold">
            {user?.role ?? 'Student'}
          </Text>
        </View>
      </View>

      <TouchableOpacity
        className="mx-4 bg-primary rounded-[10px] py-3.5 items-center"
        onPress={handleLogout}
      >
        <Text className="text-white text-base font-bold">Logout</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
