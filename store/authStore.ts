import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext } from 'react';
import { Platform } from 'react-native';

export interface User {
  _id: string;
  username: string;
  email: string;
  avatar?: { url?: string };
  role?: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
}

export const TOKEN_KEY = 'auth_token';
export const REFRESH_TOKEN_KEY = 'refresh_token';
export const USER_KEY = 'auth_user';

/**
 * Store sensitive tokens.
 * Native: Expo SecureStore
 * Web: browser localStorage
 */
async function setSecureValue(key: string, value: string) {
  if (Platform.OS === 'web') {
    localStorage.setItem(key, value);
    return;
  }

  await SecureStore.setItemAsync(key, value);
}

/**
 * Remove sensitive tokens.
 * Native: Expo SecureStore
 * Web: browser localStorage
 */
async function deleteSecureValue(key: string) {
  if (Platform.OS === 'web') {
    localStorage.removeItem(key);
    return;
  }

  await SecureStore.deleteItemAsync(key);
}

/**
 * Read sensitive tokens.
 * Native: Expo SecureStore
 * Web: browser localStorage
 */
async function getSecureValue(key: string): Promise<string | null> {
  if (Platform.OS === 'web') {
    return localStorage.getItem(key);
  }

  return await SecureStore.getItemAsync(key);
}

export async function saveAuth(
  token: string,
  user: User,
  refreshToken: string
) {
  await setSecureValue(TOKEN_KEY, token);
  await setSecureValue(REFRESH_TOKEN_KEY, refreshToken);

  await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
}

export async function clearAuth() {
  await deleteSecureValue(TOKEN_KEY);
  await deleteSecureValue(REFRESH_TOKEN_KEY);

  await AsyncStorage.removeItem(USER_KEY);
}

export async function loadAuth(): Promise<{
  token: string | null;
  user: User | null;
  refreshToken: string | null;
}> {
  const token = await getSecureValue(TOKEN_KEY);
  const refreshToken = await getSecureValue(REFRESH_TOKEN_KEY);

  const userStr = await AsyncStorage.getItem(USER_KEY);

  const user = userStr ? (JSON.parse(userStr) as User) : null;

  return {
    token,
    user,
    refreshToken,
  };
}

export interface AuthContextType extends AuthState {
  login: (
    token: string,
    user: User,
    refreshToken: string
  ) => Promise<void>;

  logout: () => Promise<void>;

  setLoading: (val: boolean) => void;
}

export const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth() {
  const ctx = useContext(AuthContext);

  if (!ctx) {
    throw new Error('useAuth must be used inside AuthProvider');
  }

  return ctx;
}