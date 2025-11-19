// Holds current user + login/logout logic

import { createContext, useContext, useState } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Later your LoginPage will call this after a successful login
  function login() {
    setIsLoggedIn(true);
  }

  function logout() {
    setIsLoggedIn(false);
  }

  const value = { isLoggedIn, login, logout };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// convenience hook
export function useAuth() {
  return useContext(AuthContext);
}