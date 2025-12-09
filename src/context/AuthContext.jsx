// Holds current user + login/logout logic

import { createContext, useContext, useEffect, useState } from "react";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem("bb_user");
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  // Keep localStorage updated when user changes
  useEffect(() => {
    if (user) {
      localStorage.setItem("bb_user", JSON.stringify(user));
    } else {
      localStorage.removeItem("bb_user");
    }
  }, [user]);

  function login(userObj) {
    setUser(userObj);
  }

  function logout() {
    setUser(null);
  }

  const value = { user, login, logout };

    return (
      <AuthContext.Provider value={value}>
        {children}
      </AuthContext.Provider>
    );
  }

// convenience hook
export function useAuth() {
  return useContext(AuthContext);
}