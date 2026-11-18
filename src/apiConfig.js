// Markazlashgan API Konfiguratsiyasi (GitHub Pages va Mahalliy muhitlar uchun)
export const API_BASE = (import.meta.env && import.meta.env.VITE_API_BASE_URL) || (
  typeof window !== 'undefined' && window.location.hostname.includes('github.io')
    ? 'https://any3dcubic-bot.onrender.com'
    : ''
);

export function apiUrl(endpoint) {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${API_BASE}${cleanEndpoint}`;
}
