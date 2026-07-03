import { api } from "./client";

export interface Banner {
    id: string;
    imageUrl: string;
    linkUrl?: string;
    isActive: boolean;
    sortOrder: number;
}

export const bannersApi = {
    findAll: async (): Promise<Banner[]> => {
        const res = await api.get("/banners");
        return res.data;
    },

    findActive: async (): Promise<Banner[]> => {
        const res = await api.get("/banners/active");
        return res.data;
    },
};
