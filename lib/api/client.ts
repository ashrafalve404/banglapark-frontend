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

function fixImageProtocols(obj: unknown): void {
    if (!obj || typeof obj !== 'object') return;
    for (const value of Object.values(obj)) {
        if (typeof value === 'string') {
            const idx = value.indexOf('://');
            if (idx !== -1) {
                const afterProtocol = value.slice(idx + 3);
                if (afterProtocol.startsWith('api.banglapark.com/')) {
                    (obj as Record<string, unknown>)[Object.keys(obj).find(k => (obj as Record<string, unknown>)[k] === value)!] =
                        'https://' + afterProtocol;
                }
            }
        } else if (typeof value === 'object') {
            fixImageProtocols(value);
        }
    }
}

// Unwrap backend's { success, data } wrapper from TransformInterceptor
// and fix HTTP→HTTPS for image URLs (Safari mixed content fix)
api.interceptors.response.use(
    (res) => {
        if (res.data && typeof res.data === 'object' && 'success' in res.data && 'data' in res.data) {
            res.data = res.data.data;
        }
        if (typeof res.data === 'object') fixImageProtocols(res.data);
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
