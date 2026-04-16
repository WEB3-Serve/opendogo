const saved = localStorage.getItem('OPENDOGO_API_BASE_URL');
window.__APP_CONFIG__ = {
  API_BASE_URL: (saved || window.location.origin).replace(/\/$/, ''),
};
