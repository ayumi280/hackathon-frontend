import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

export const api = axios.create({
  baseURL: `${BASE_URL}/api`,
  timeout: 30000,
});

// リクエスト時にlocalStorageのトークンをヘッダーに付加
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 401でトークン切れの場合はログアウト（ログイン・登録エンドポイント自体は除外）
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const url: string = err.config?.url || '';
    if (err.response?.status === 401 && !url.includes('/auth/')) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);
