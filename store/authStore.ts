import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext } from 'react';

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

export async function saveAuth(token: string, user: User, refreshToken: string) {
  await SecureStore.setItemAsync(TOKEN_KEY, token);
  await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken);
  await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
}

export async function clearAuth() {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
  await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
  await AsyncStorage.removeItem(USER_KEY);
}

export async function loadAuth(): Promise<{ token: string | null; user: User | null, refreshToken: string | null }> {
  const token = await SecureStore.getItemAsync(TOKEN_KEY);
  const refreshToken = await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
  const userStr = await AsyncStorage.getItem(USER_KEY);
  const user = userStr ? (JSON.parse(userStr) as User) : null;
  return { token, user, refreshToken };
}

export interface AuthContextType extends AuthState {
  login: (token: string, user: User, refreshToken: string) => Promise<void>;
  logout: () => Promise<void>;
  setLoading: (val: boolean) => void;
}

export const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
