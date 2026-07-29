import { api } from "./client";
import type { Category } from "@/types";

export const categoriesApi = {
    list: async (params?: { includeHidden?: boolean }): Promise<{ categories: Category[]; total: number }> => {
        const res = await api.get("/categories", { params });
        return { categories: res.data, total: res.data.length };
    },

    create: async (data: { name: string; image?: string; sortOrder?: number; isHidden?: boolean }): Promise<Category> => {
        const res = await api.post("/categories", data);
        return res.data;
    },

    createBulk: async (names: string[]): Promise<{ createdCount: number; skippedCount: number; totalProcessed: number }> => {
        const res = await api.post("/categories/bulk", { names });
        return res.data;
    },

    update: async (id: string, data: { name?: string; image?: string | null; sortOrder?: number; isHidden?: boolean }): Promise<Category> => {
        const res = await api.patch(`/categories/${id}`, data);
        return res.data;
    },

    toggleVisibility: async (id: string): Promise<Category> => {
        const res = await api.patch(`/categories/${id}/toggle-visibility`);
        return res.data;
    },

    delete: async (id: string): Promise<void> => {
        await api.delete(`/categories/${id}`);
    },
};

export const referralApi = {
    my: async () => {
        const res = await api.get("/referral/my");
        return res.data;
    },

    teamStats: async () => {
        const res = await api.get("/referral/team/stats");
        return res.data;
    },

    directTeam: async (params?: { page?: number; limit?: number }) => {
        const res = await api.get("/referral/team/direct", { params });
        return res.data;
    },
};
