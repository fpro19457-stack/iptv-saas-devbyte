import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const API_URL = 'http://localhost:3002/api';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('adminToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('adminToken');
      localStorage.removeItem('admin');
    } else if (error.response?.status === 403) {
      console.error('Sin permiso');
    }
    return Promise.reject(error);
  }
);

export default api;