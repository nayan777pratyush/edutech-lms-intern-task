import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

import {
  ENDPOINTS,
  REQUEST_TIMEOUT,
} from '../constants/api';

async function getAuthToken(): Promise<string | null> {
  if (Platform.OS === 'web') {
    return localStorage.getItem('auth_token');
  }

  return SecureStore.getItemAsync('auth_token');
}

async function request<T>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  const token = await getAuthToken();

  const controller = new AbortController();

  const timer = setTimeout(() => {
    controller.abort();
  }, REQUEST_TIMEOUT);

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  try {
    console.log('API REQUEST:', url);

    const response = await fetch(url, {
      ...options,
      headers,
      signal: controller.signal,
    });

    clearTimeout(timer);

    console.log('API RESPONSE:', response.status, url);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));

      throw new Error(
        errorData?.message || `HTTP ${response.status}`
      );
    }

    return (await response.json()) as T;
  } catch (error: unknown) {
    clearTimeout(timer);

    if (
      error instanceof Error &&
      error.name === 'AbortError'
    ) {
      throw new Error(
        `Request timed out: ${url}`
      );
    }

    throw error;
  }
}

export const api = {
  get: <T>(url: string) =>
    request<T>(url),

  post: <T>(url: string, body: unknown) =>
    request<T>(url, {
      method: 'POST',
      body: JSON.stringify(body),
    }),
};

// --------------------------------------------------
// AUTH
// --------------------------------------------------

export async function registerUser(data: {
  username: string;
  email: string;
  password: string;
}) {
  return api.post(
    ENDPOINTS.REGISTER,
    data
  );
}

export async function loginUser(data: {
  email: string;
  password: string;
}) {
  return api.post<{
    data: {
      accessToken: string;
      refreshToken?: string;
      user: object;
    };
  }>(
    ENDPOINTS.LOGIN,
    data
  );
}

export async function logoutUser() {
  return api.post(
    ENDPOINTS.LOGOUT,
    {}
  );
}

export async function getCurrentUser() {
  return api.get(
    ENDPOINTS.CURRENT_USER
  );
}

// --------------------------------------------------
// COURSES & INSTRUCTORS
// --------------------------------------------------

export async function fetchCourses(
  page = 1,
  limit = 20
) {
  return api.get(
    `${ENDPOINTS.COURSES}?page=${page}&limit=${limit}`
  );
}

export async function fetchInstructors(
  limit = 20
) {
  return api.get(
    `${ENDPOINTS.INSTRUCTORS}?limit=${limit}`
  );
}

// --------------------------------------------------
// TOKEN VERIFICATION
// --------------------------------------------------

export async function verifyAccessToken(
  token: string
) {
  const response = await fetch(
    ENDPOINTS.CURRENT_USER,
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return response.ok;
}

// --------------------------------------------------
// REFRESH TOKEN
// --------------------------------------------------

export async function refreshAccessToken(
  refreshToken: string
) {
  const response = await fetch(
    ENDPOINTS.REFRESH_TOKEN,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${refreshToken}`,
        'Content-Type': 'application/json',
      },
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data?.message || 'Refresh token expired'
    );
  }

  return data.data.accessToken;
}