import axios from 'axios';

const TOKEN_KEY = 'rosebud_token';

export const tokenStore = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (t) => localStorage.setItem(TOKEN_KEY, t),
  clear: () => localStorage.removeItem(TOKEN_KEY),
};

const api = axios.create({ baseURL: '/api' });

api.interceptors.request.use((config) => {
  const token = tokenStore.get();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Oturum düşerse girişe yönlendir
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && !err.config.url.includes('/auth/login')) {
      tokenStore.clear();
      if (window.location.pathname !== '/giris') window.location.assign('/giris');
    }
    return Promise.reject(err);
  },
);

/** Backend hata mesajını okunur hale getirir */
export function errorMessage(err) {
  const data = err.response?.data;
  if (data?.details?.length) return `${data.error}: ${data.details.map((d) => d.message).join(', ')}`;
  return data?.error || err.message || 'Beklenmeyen hata';
}

export default api;
