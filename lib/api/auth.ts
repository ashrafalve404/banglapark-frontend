import { api } from "./client";
import Cookies from "js-cookie";
import type { AuthResponse, User } from "@/types";

export interface RegisterResult {
    requiresEmailVerification?: boolean;
    email?: string;
    message?: string;
    user?: User;
    accessToken?: string;
    refreshToken?: string;
}

export interface VerifyEmailResult extends AuthResponse {
    message?: string;
}

export const authApi = {
    register: async (data: {
        name: string;
        email: string;
        phone: string;
        password: string;
        referralCode?: string;
    }): Promise<RegisterResult> => {
        const res = await api.post("/auth/register", data);
        return res.data;
    },

    verifyEmail: async (data: { email: string; otp: string }): Promise<VerifyEmailResult> => {
        const res = await api.post("/auth/verify-email", data);
        return res.data;
    },

    resendVerification: async (data: { email: string }): Promise<{ message: string }> => {
        const res = await api.post("/auth/resend-verification", data);
        return res.data;
    },

    login: async (data: { email: string; password: string }): Promise<AuthResponse> => {
        const res = await api.post("/auth/login", data);
        return res.data;
    },

    googleLogin: async (idToken: string): Promise<AuthResponse> => {
        const res = await api.post("/auth/google", { idToken });
        return res.data;
    },

    logout: async () => {
        await api.post("/auth/logout").catch(() => { });
        Cookies.remove("access_token");
        Cookies.remove("refresh_token");
        Cookies.remove("user");
    },

    me: async (): Promise<User> => {
        const res = await api.get("/users/me");
        return res.data;
    },

    activation: async (): Promise<{ status: string; activeUntil: string; isFirstActivated: boolean; isExpired: boolean; daysLeft: number }> => {
        const res = await api.get("/users/me/activation");
        return res.data;
    },

    saveTokens: (tokens: { accessToken: string; refreshToken: string }) => {
        Cookies.set("access_token", tokens.accessToken, { expires: 7 });
        Cookies.set("refresh_token", tokens.refreshToken, { expires: 30 });
    },
};
