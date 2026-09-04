import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';
import api, { setTokenKeMemory } from '../api'; // PERBAIKAN: setTokenKeMemory disesuaikan nama export-nya

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const login = async (username, password) => {
    try {
      const response = await api.post('/api/token/', { username, password });
      if (response.data.access) {
        setTokenKeMemory(response.data.access);
        setUser({ username });
        return true;
      }
    } catch (error) {
      console.error('Login gagal:', error);
    }
    return false;
  };

  const logout = () => {
    setTokenKeMemory(null);
    setUser(null);
  };

  const checkAuthStatus = async () => {
    try {
      // PERBAIKAN: URL diperbaiki ke backend Django
      const response = await axios.post(
        'http://10.106.109.115:8000/api/token/refresh/',
        {},
        { withCredentials: true }
      );
      if (response.status === 200) {
        setTokenKeMemory(response.data.access);
        setUser({ username: 'Authenticated User' });
      }
    } catch (error) {
      setTokenKeMemory(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAuthStatus();
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);