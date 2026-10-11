import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import keycloak from './keycloak';

// Inisialisasi Keycloak dengan opsi memaksa login dan tambahan checkLoginIframe: false
keycloak.init({ 
  onLoad: 'login-required',
  checkLoginIframe: false 
}).then((authenticated) => {
  if (authenticated) {
    console.log("Authenticated:", keycloak.tokenParsed?.preferred_username);

    // Render aplikasi utama React
    ReactDOM.createRoot(document.getElementById('root')).render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );

    // Opsional: Perbarui token secara berkala di latar belakang agar tidak kadaluwarsa
    setInterval(() => {
      keycloak.updateToken(70).catch(() => {
        console.warn("Gagal memperbarui token, sesi mungkin telah berakhir.");
      });
    }, 60000);

  } else {
    window.location.reload();
  }
}).catch((err) => {
  console.error("Keycloak initialization failed", err);
});