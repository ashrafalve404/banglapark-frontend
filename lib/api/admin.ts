import { api } from "./client";
import type { AdminStats, User, PlatformConfig } from "@/types";
import type { Banner } from "./banners";

export const adminApi = {
    stats: async (): Promise<AdminStats> => {
        const res = await api.get("/admin/stats");
        return res.data;
    },

    users: async (params?: { page?: number; limit?: number; search?: string; status?: string }): Promise<{ users: User[]; total: number }> => {
        const res = await api.get("/admin/users", { params });
        return res.data;
    },

    createUser: async (data: { name: string; email: string; phone: string; password: string; role?: string }): Promise<User> => {
        const res = await api.post("/admin/users", data);
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

    deleteUser: async (id: string): Promise<void> => {
        const res = await api.delete(`/admin/users/${id}`);
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

    banners: async (): Promise<Banner[]> => {
        const res = await api.get("/banners");
        return res.data;
    },

    createBanner: async (data: { imageUrl: string; linkUrl?: string; isActive?: boolean; sortOrder?: number }) => {
        const res = await api.post("/banners", data);
        return res.data;
    },

    updateBanner: async (id: string, data: { imageUrl?: string; linkUrl?: string; isActive?: boolean; sortOrder?: number }) => {
        const res = await api.patch(`/banners/${id}`, data);
        return res.data;
    },

    deleteBanner: async (id: string) => {
        const res = await api.delete(`/banners/${id}`);
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
