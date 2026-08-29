import axios from "axios";

import api, {
  setTokenKeMemory,
  clearTokenMemory,
} from "../api";


const API_BASE_URL = "http://127.0.0.1:8000";


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