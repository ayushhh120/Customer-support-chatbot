import axios from "axios"

const TOKEN_KEY = "access_token";

const API = axios.create({
    baseURL: import.meta.env.VITE_BASE_URL,
    withCredentials: true,
});

// Send token in Authorization header so cross-origin (Vercel → backend) auth works
API.interceptors.request.use((config) => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

API.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error?.response?.status === 401) {
            localStorage.removeItem(TOKEN_KEY);
        }
        return Promise.reject(error);
    }
);

export default API;
export { TOKEN_KEY };
