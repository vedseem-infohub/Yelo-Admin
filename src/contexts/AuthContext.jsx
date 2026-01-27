import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem('yelo_token'));
  const [role, setRole] = useState(localStorage.getItem('yelo_role'));
  const [user, setUser] = useState(null);

  useEffect(() => {
    const savedUser = localStorage.getItem('yelo_admin_user');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        console.error('Failed to parse user from localStorage');
      }
    }
  }, []);

  const login = (newToken, newRole, newUser) => {
    localStorage.setItem('yelo_token', newToken);
    localStorage.setItem('yelo_role', newRole);
    localStorage.setItem('yelo_admin_user', JSON.stringify(newUser));
    setToken(newToken);
    setRole(newRole);
    setUser(newUser);
    window.dispatchEvent(new Event('storage'));
  };

  const logout = () => {
    localStorage.removeItem('yelo_token');
    localStorage.removeItem('yelo_role');
    localStorage.removeItem('yelo_admin_user');
    setToken(null);
    setRole(null);
    setUser(null);
    window.dispatchEvent(new Event('storage'));
  };

  const isAuthenticated = !!token;
  const isAdmin = role?.toLowerCase() === 'admin';

  return (
    <AuthContext.Provider value={{ token, role, user, isAuthenticated, isAdmin, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
