import { api } from "./client";
import type { Category } from "@/types";

export const categoriesApi = {
    list: async (): Promise<{ categories: Category[]; total: number }> => {
        const res = await api.get("/categories");
        return { categories: res.data, total: res.data.length };
    },

    create: async (data: { name: string }): Promise<Category> => {
        const res = await api.post("/categories", data);
        return res.data;
    },

    update: async (id: string, data: { name: string }): Promise<Category> => {
        const res = await api.patch(`/categories/${id}`, data);
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
