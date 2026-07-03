import { api } from "./client";
import type { AdminStats, User, PlatformConfig } from "@/types";

export const adminApi = {
    stats: async (): Promise<AdminStats> => {
        const res = await api.get("/admin/stats");
        return res.data;
    },

    users: async (params?: { page?: number; limit?: number; search?: string; status?: string }): Promise<{ users: User[]; total: number }> => {
        const res = await api.get("/admin/users", { params });
        return res.data;
    },

    banUser: async (id: string): Promise<User> => {
        const res = await api.patch(`/admin/users/${id}/ban`);
        return res.data;
    },

    unbanUser: async (id: string): Promise<User> => {
        const res = await api.patch(`/admin/users/${id}/unban`);
        return res.data;
    },

    activateUser: async (id: string): Promise<User> => {
        const res = await api.patch(`/admin/users/${id}/activate`);
        return res.data;
    },

    deactivateUser: async (id: string): Promise<User> => {
        const res = await api.patch(`/admin/users/${id}/deactivate`);
        return res.data;
    },

    getConfig: async (): Promise<PlatformConfig[]> => {
        const res = await api.get("/admin/config");
        return res.data;
    },

    setConfig: async (key: string, value: unknown): Promise<PlatformConfig> => {
        const res = await api.post("/admin/config", { key, value });
        return res.data;
    },
};

export const reportsApi = {
    sales: async (params?: { from?: string; to?: string; page?: number; limit?: number }) => {
        const res = await api.get("/reports/sales", { params });
        return res.data;
    },

    commissions: async (params?: { from?: string; to?: string; page?: number; limit?: number }) => {
        const res = await api.get("/reports/commissions", { params });
        return res.data;
    },

    activeUsers: async (params?: { page?: number; limit?: number }) => {
        const res = await api.get("/reports/active-users", { params });
        return res.data;
    },
};
