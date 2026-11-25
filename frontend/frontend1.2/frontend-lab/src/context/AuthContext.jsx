import { createContext, useContext, useState } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const login = async (email) => {
    const name = email.split('@')[0];
    setUser({ id: 1, name, email });
  }; // TODO Unit 2: POST /auth/login
  const logout = () => setUser(null);
  return <AuthContext value={{ user, login, logout }}>{children}</AuthContext>;
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
};