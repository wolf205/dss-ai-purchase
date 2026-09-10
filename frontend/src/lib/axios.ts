import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

export const apiClient = axios.create({
  baseURL: '/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Request interceptor: Attach JWT Bearer Token if present
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('dss_auth_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: unknown) => Promise.reject(error)
);

// Variables for Silent Refresh & Concurrency Queue
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}> = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else if (token) {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

const handleLogoutAndRedirect = () => {
  localStorage.removeItem('dss_auth_token');
  localStorage.removeItem('dss_refresh_token');
  localStorage.removeItem('dss_auth_user');
  if (window.location.pathname !== '/login') {
    window.location.href = '/login';
  }
};

// Response interceptor: Silent Refresh on TOKEN_EXPIRED
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<{ success: boolean; error?: { code: string; message: string; details?: unknown } }>) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // Không kích hoạt refresh nếu chính request refresh hoặc login thất bại
    if (originalRequest?.url?.includes('/auth/refresh') || originalRequest?.url?.includes('/auth/login')) {
      if (originalRequest?.url?.includes('/auth/refresh')) {
        handleLogoutAndRedirect();
      }
      return Promise.reject(error);
    }

    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      const errorCode = error.response.data?.error?.code;
      const refreshToken = localStorage.getItem('dss_refresh_token');

      // Chỉ thử refresh khi token hết hạn hoặc có refresh token và không phải do tài khoản bị khóa
      if (refreshToken && errorCode !== 'ACCOUNT_LOCKED') {
        if (isRefreshing) {
          return new Promise<string>((resolve, reject) => {
            failedQueue.push({ resolve, reject });
          })
            .then((newToken) => {
              if (originalRequest.headers) {
                originalRequest.headers.Authorization = `Bearer ${newToken}`;
              }
              return apiClient(originalRequest);
            })
            .catch((err) => Promise.reject(err));
        }

        originalRequest._retry = true;
        isRefreshing = true;

        try {
          // Gọi trực tiếp axios không qua interceptor để tránh lặp
          const response = await axios.post('/api/v1/auth/refresh', {
            refreshToken,
          });

          const { accessToken, refreshToken: newRefreshToken } = response.data.data;
          localStorage.setItem('dss_auth_token', accessToken);
          if (newRefreshToken) {
            localStorage.setItem('dss_refresh_token', newRefreshToken);
          }

          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          }

          processQueue(null, accessToken);
          return apiClient(originalRequest);
        } catch (refreshError) {
          processQueue(refreshError, null);
          handleLogoutAndRedirect();
          return Promise.reject(refreshError);
        } finally {
          isRefreshing = false;
        }
      } else {
        handleLogoutAndRedirect();
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;

