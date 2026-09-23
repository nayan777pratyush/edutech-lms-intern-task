import React, {
  useCallback,
  useEffect,
  useMemo,
  useReducer,
} from 'react';

import {
  AuthContext,
  AuthState,
  User,
  clearAuth,
  loadAuth,
  saveAuth,
} from '../store/authStore';

import {
  refreshAccessToken,
  verifyAccessToken,
} from '../utils/api';

type Action =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'LOGIN'; payload: { token: string; user: User } }
  | { type: 'LOGOUT' };

function reducer(state: AuthState, action: Action): AuthState {
  switch (action.type) {
    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload,
      };

    case 'LOGIN':
      return {
        user: action.payload.user,
        token: action.payload.token,
        isLoading: false,
      };

    case 'LOGOUT':
      return {
        user: null,
        token: null,
        isLoading: false,
      };

    default:
      return state;
  }
}

export default function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [state, dispatch] = useReducer(reducer, {
    user: null,
    token: null,
    isLoading: true,
  });

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const { token, refreshToken, user } = await loadAuth();

        if (!token || !refreshToken || !user) {
          await clearAuth();
          dispatch({ type: 'LOGOUT' });
          return;
        }

        const isAccessTokenValid = await verifyAccessToken(token);

        if (isAccessTokenValid) {
          dispatch({
            type: 'LOGIN',
            payload: { token, user },
          });
          return;
        }

        try {
          const newAccessToken = await refreshAccessToken(refreshToken);

          await saveAuth(newAccessToken, user, refreshToken);

          dispatch({
            type: 'LOGIN',
            payload: {
              token: newAccessToken,
              user,
            },
          });
        } catch {
          await clearAuth();
          dispatch({ type: 'LOGOUT' });
        }
      } catch {
        await clearAuth();
        dispatch({ type: 'LOGOUT' });
      }
    };

    initializeAuth();
  }, []);

  const login = useCallback(
    async (
      token: string,
      user: User,
      refreshToken: string,
    ) => {
      await saveAuth(token,user, refreshToken);

      dispatch({
        type: 'LOGIN',
        payload: { token, user },
      });
    },
    []
  );

  const logout = useCallback(async () => {
    await clearAuth();
    dispatch({ type: 'LOGOUT' });
  }, []);

  const setLoading = useCallback((val: boolean) => {
    dispatch({
      type: 'SET_LOADING',
      payload: val,
    });
  }, []);

  const value = useMemo(
    () => ({
      ...state,
      login,
      logout,
      setLoading,
    }),
    [state, login, logout, setLoading]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}