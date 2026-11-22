import { createContext, useContext } from 'react';

export const AuthContext = createContext(null);

/** const { user, login, logout, hasRole } = useAuth(); */
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth, AuthProvider içinde kullanılmalı');
  return ctx;
}
