import React from 'react';
import { View, Text } from 'react-native';
import { useNetworkStatus } from '../hooks/useNetworkStatus';

export default function OfflineBanner() {
  const isOnline = useNetworkStatus();
  if (isOnline) return null;

  return (
    <View className="bg-error py-2 items-center">
      <Text className="text-white text-[13px] font-semibold">No internet connection</Text>
    </View>
  );
}
