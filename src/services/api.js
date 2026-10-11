import axios from 'axios';
import keycloak from '../keycloak'; // Sesuaikan jalur relatif file keycloak.js Anda

const api = axios.create({
  baseURL: 'http://localhost:8888', // Mengarah ke API Gateway Spring Boot
  headers: {
    'Content-Type': 'application/json',
  },
});

// Axios Interceptor untuk menyisipkan Bearer Token otomatis
api.interceptors.request.use(async (config) => {
  if (keycloak && keycloak.authenticated) {
    try {
      // Perbarui token jika masa berlakunya akan habis dalam 30 detik ke depan
      await keycloak.updateToken(30);
    } catch (error) {
      console.error('Gagal memperbarui token Keycloak:', error);
      // Jika token gagal diperbarui, arahkan pengguna untuk login ulang
      keycloak.login();
    }
    
    // Sisipkan token ke header Authorization
    config.headers.Authorization = `Bearer ${keycloak.token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

export default api;