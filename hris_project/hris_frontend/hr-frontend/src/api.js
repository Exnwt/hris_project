import axios from 'axios';

let tokenDiMemory = null;

export const setTokenKeMemory = (token) => {
  tokenDiMemory = token;
};
export const getTokenDariMemory = () => {
  return tokenDiMemory;
};
export const clearTokenMemory = () => {
  tokenDiMemory = null;
};

// Instance utama untuk mengambil data internal
const api = axios.create({
  baseURL: 'http://127.0.0.1:8000',
  headers: {
    "Content-Type": "application/json",
  },
});



// REQUEST INTERCEPTOR: Otomatis tempelkan token Bearer dari RAM
api.interceptors.request.use(
  (config) => {
    if (tokenDiMemory) {
      config.headers.Authorization = `Bearer ${tokenDiMemory}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// RESPONSE INTERCEPTOR: Otomatis silent-refresh jika token habis (401)
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response && error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        // PERBAIKAN: URL diperbaiki ke endpoint refresh Django & kirim cookie HttpOnly
        const res = await axios.post(
          'http://127.0.0.1:8000/api/token/refresh/',
          {},
          { withCredentials: true }
        );
        if (res.status === 200) {
          setTokenKeMemory(res.data.access);
          originalRequest.headers.Authorization = `Bearer ${res.data.access}`;
          return api(originalRequest); // Ulangi request data yang gagal tadi
        }
      } catch (refreshError) {
        setTokenKeMemory(null);
        window.location.reload(); // Paksa login ulang jika refresh gagal
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

export default api;

// import axios from "axios";

// let tokenDiMemory = null;


// // =====================================================
// // TOKEN MANAGEMENT
// // =====================================================

// export const setTokenKeMemory = (token) => {
//   console.log("ACCESS TOKEN DISIMPAN:", token);
//   tokenDiMemory = token;
// };

// export const getTokenDariMemory = () => {
//   return tokenDiMemory;
// };

// export const clearTokenMemory = () => {
//   tokenDiMemory = null;
// };


// // =====================================================
// // AXIOS INSTANCE
// // =====================================================

// const api = axios.create({
//   baseURL: "http://127.0.0.1:8000",
//   headers: {
//     "Content-Type": "application/json",
//   },
// });


// // =====================================================
// // REQUEST INTERCEPTOR
// // =====================================================

// api.interceptors.request.use(
//   (config) => {

//     if (tokenDiMemory) {

//       config.headers.Authorization =
//         `Bearer ${tokenDiMemory}`;

//       console.log(
//         "API REQUEST:",
//         config.method?.toUpperCase(),
//         config.url
//       );

//     } else {

//       console.log(
//         "API REQUEST TANPA TOKEN:",
//         config.url
//       );

//     }

//     return config;
//   },

//   (error) => {
//     return Promise.reject(error);
//   }
// );


// // =====================================================
// // RESPONSE INTERCEPTOR
// // =====================================================

// api.interceptors.response.use(

//   (response) => {

//     console.log(
//       "API RESPONSE:",
//       response.status,
//       response.config.url
//     );

//     return response;
//   },

//   (error) => {

//     console.error(
//       "API ERROR:",
//       error.response?.status,
//       error.config?.url,
//       error.response?.data
//     );

//     return Promise.reject(error);
//   }
// );


// export default api;