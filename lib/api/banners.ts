import { api } from "./client";

export interface Banner {
    id: string;
    section: "SLIDER" | "OFFER" | "DAILY_WORK";
    imageUrl: string;
    linkUrl?: string;
    title?: string;
    badge?: string;
    isActive: boolean;
    sortOrder: number;
}

export const bannersApi = {
    findAll: async (): Promise<Banner[]> => {
        const res = await api.get("/banners");
        return res.data;
    },

    findActive: async (section?: string): Promise<Banner[]> => {
        const res = await api.get("/banners/active", { params: section ? { section } : {} });
        return res.data;
    },

    findOffers: async (): Promise<Banner[]> => {
        const res = await api.get("/banners/offers");
        return res.data;
    },

    findDailyWork: async (): Promise<Banner | null> => {
        const res = await api.get("/banners/daily-work");
        return res.data;
    },
};
