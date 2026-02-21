import { useAuthStore } from "@/stores/auth";
import axios from "axios";
import authService from "./services/authService";
import router from "@/router";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  paramsSerializer: {
    indexes: null,
  },
});

// Send token with every request
api.interceptors.request.use(config => {
  const authStore = useAuthStore()
  if (authStore.getToken()) {
    config.headers.Authorization = `Bearer ${authStore.getToken()}`;
  }
  return config;
});

// Refresh tokens if resopnse status is 401
api.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config;
    console.log(error);
    if (error.response.status === 401 
        && !originalRequest._retry
        && !originalRequest.url.includes('/refresh')) {
      originalRequest._retry = true;
      try {
        // Чтобы избежать нескольких одновременных refresh-запросов
        const response = await authService.refresh();
        const { access_token } = response.data;
        localStorage.setItem('token', access_token);
        
        return api(originalRequest);
      } catch (refreshError) {
        // Перенаправляем на страницу входа при неудачном refresh
        router.replace({ name: 'login' })
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

export default api