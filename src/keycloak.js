import Keycloak from 'keycloak-js';

const keycloak = new Keycloak({
  // Jika diakses via Cloudflare / domain publik, arahkan langsung ke domain tersebut tanpa port 8080.
  // Jika diakses lokal, arahkan ke localhost:8080.
  url: window.location.hostname.includes('trycloudflare.com')
    ? 'https://cooperation-moore-genetics-var.trycloudflare.com'
    : 'http://localhost:8080',
  realm: 'erp-realm',
  clientId: 'erp-frontend',
});

export default keycloak;