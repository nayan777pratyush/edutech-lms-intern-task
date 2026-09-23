import * as SecureStore from 'expo-secure-store';
import { BASE_URL, ENDPOINTS, REQUEST_TIMEOUT } from '../constants/api';
import { Platform } from 'react-native';

async function getAuthToken() {
  if (Platform.OS === 'web') {
    return localStorage.getItem('auth_token');
  }

  return SecureStore.getItemAsync('auth_token');
}

async function request<T>(
  url: string,
  options: RequestInit = {},
  retries = 2
): Promise<T> {
  //console.log('API REQUEST START:', url);

  const token = await getAuthToken();

  //console.log('AUTH TOKEN CHECK COMPLETE');

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    //console.log('FETCH START:', url);

    const res = await fetch(url, {
      ...options,
      headers,
      signal: controller.signal,
    });

    //console.log('FETCH RESPONSE:', res.status);

    clearTimeout(timer);

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.message || `HTTP ${res.status}`);
    }

    const result = await res.json();

    //console.log('FETCH DATA:', result);

    return result as T;
  } catch (error: unknown) {
    clearTimeout(timer);

    //console.log('API ERROR:', error);

    const isAbort =
      error instanceof Error && error.name === 'AbortError';

    if (retries > 0 && !isAbort) {
      //console.log('RETRYING REQUEST...', retries);

      await new Promise((r) => setTimeout(r, 1000));

      return request<T>(url, options, retries - 1);
    }

    throw isAbort ? new Error('Request timed out') : error;
  }
}

export const api = {
  get: <T>(url: string) => request<T>(url),
  post: <T>(url: string, body: unknown) =>
    request<T>(url, { method: 'POST', body: JSON.stringify(body) }),
};

// Auth
export async function registerUser(data: {
  username: string;
  email: string;
  password: string;
}) {
  //console.log('REGISTER CLICKED');
  //console.log('REGISTER URL:', ENDPOINTS.REGISTER);
  // console.log('REGISTER DATA:', {
  //   username: data.username,
  //   email: data.email,
  // });

  const result = await api.post(ENDPOINTS.REGISTER, data);

  //console.log('REGISTER RESPONSE:', result);

  return result;
}

export async function loginUser(data: { email: string; password: string }) {
  return api.post<{ data: { accessToken: string; user: object } }>(
    ENDPOINTS.LOGIN,
    data
  );
}

export async function logoutUser() {
  return api.post(ENDPOINTS.LOGOUT, {});
}

export async function getCurrentUser() {
  return api.get(ENDPOINTS.CURRENT_USER);
}

// Courses & Instructors
export async function fetchCourses(page = 1, limit = 20) {
  return api.get(`${ENDPOINTS.COURSES}?page=${page}&limit=${limit}`);
}

export async function fetchInstructors(limit = 20) {
  return api.get(`${ENDPOINTS.INSTRUCTORS}?limit=${limit}`);
}



export async function verifyAccessToken(token: string) {
  const response = await fetch(`${BASE_URL}/users/current-user`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return response.ok;
}

export async function refreshAccessToken(refreshToken: string) {
  const response = await fetch(`${BASE_URL}/users/refresh-token`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${refreshToken}`,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.message || 'Refresh token expired');
  }

  return data.data.accessToken;
}