import axios from "axios";
import api, {
  setTokenKeMemory,
  clearTokenMemory,
} from "../api";
import { useState, useEffect } from "react";


const API_BASE_URL = "http://10.106.108.171:8000";


// =====================================================
// LOGIN
// =====================================================

export const login = async (username, password) => {

  console.log("MENGIRIM LOGIN...");

  const response = await axios.post(
    `${API_BASE_URL}/api/token/`,
    {
      username: username,
      password: password,
    }
  );

  console.log("LOGIN RESPONSE:", response.data);

  const accessToken = response.data.access;
  const refreshToken = response.data.refresh;

  setTokenKeMemory(accessToken);

  return {
    access: accessToken,
    refresh: refreshToken,
  };
};


// =====================================================
// CURRENT USER
// =====================================================

export const getCurrentUser = async () => {

  console.log("MENGAMBIL CURRENT USER...");

  const response = await api.get(
    "/api/auth/me/"
  );

  console.log(
    "CURRENT USER:",
    response.data
  );

  return response.data;
};


// =====================================================
// LOGOUT
// =====================================================

export const logout = () => {

  clearTokenMemory();

};

// src/hooks/usePermissions.js

export const usePermissions = () => {
  const [userPermissions, setUserPermissions] = useState({
    isSuperuser: false,
    allowedCodenames: [],
  });
  const [loadingPermissions, setLoadingPermissions] = useState(true);

  const fetchPermissions = async () => {
    setLoadingPermissions(true);
    try {
      const response = await api.get("api/v2/access/my-permissions/");
      setUserPermissions({
        isSuperuser: response.data.is_superuser,
        allowedCodenames: response.data.allowed_codenames || [],
      });
    } catch (error) {
      console.error("Gagal mengambil permission user:", error);
    } finally {
      setLoadingPermissions(false);
    }
  };

  useEffect(() => {
    fetchPermissions();
  }, []);

  // Helper Hak Akses (Mendukung Superuser & Wildcard "*")
  const hasAccess = (codename) => {
    if (userPermissions.isSuperuser) return true;
    if (userPermissions.allowedCodenames.includes("*")) return true;
    return userPermissions.allowedCodenames.includes(codename);
  };

  return {
    userPermissions,
    loadingPermissions,
    hasAccess,
    refreshPermissions: fetchPermissions, // Opsional jika butuh refresh manual
  };
};