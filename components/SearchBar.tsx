import React from 'react';
import { View, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';

interface Props {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
}

export default function SearchBar({ value, onChangeText, placeholder }: Props) {
  return (
    <View className="flex-row items-center bg-surface rounded-[10px] px-3 py-2.5 mx-4 mb-3 border border-border gap-2">
      <Ionicons name="search-outline" size={18} color={Colors.textSecondary} />
      <TextInput
        className="flex-1 text-sm text-foreground"
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder ?? 'Search courses...'}
        placeholderTextColor={Colors.textLight}
        autoCorrect={false}
        returnKeyType="search"
      />
    </View>
  );
}
