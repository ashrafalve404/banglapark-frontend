import axios from "axios";
import Cookies from "js-cookie";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000/v1";

export const api = axios.create({
    baseURL: BASE_URL,
    timeout: 15000,
    headers: { "Content-Type": "application/json" },
});

// Attach access token to every request
api.interceptors.request.use((config) => {
    const token = Cookies.get("access_token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

// Unwrap backend's { success, data } wrapper from TransformInterceptor
api.interceptors.response.use(
    (res) => {
        if (res.data && typeof res.data === 'object' && 'success' in res.data && 'data' in res.data) {
            res.data = res.data.data;
        }
        return res;
    },
    async (error) => {
        const original = error.config;
        if (error.response?.status === 401 && !original._retry) {
            original._retry = true;
            const refreshToken = Cookies.get("refresh_token");
            if (refreshToken) {
                try {
                    const { data } = await axios.post(`${BASE_URL}/auth/refresh`, {
                        refreshToken,
                    });
                    Cookies.set("access_token", data.accessToken, { expires: 1 / 96 }); // 15 min
                    original.headers.Authorization = `Bearer ${data.accessToken}`;
                    return api(original);
                } catch {
                    Cookies.remove("access_token");
                    Cookies.remove("refresh_token");
                }
            }
            if (typeof window !== "undefined") window.location.href = "/login";
        }
        return Promise.reject(error);
    }
);
