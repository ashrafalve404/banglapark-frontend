import { api } from "./client";

export interface Banner {
    id: string;
    section: "SLIDER" | "OFFER";
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

    findActive: async (): Promise<Banner[]> => {
        const res = await api.get("/banners/active");
        return res.data;
    },

    findOffers: async (): Promise<Banner[]> => {
        const res = await api.get("/banners/offers");
        return res.data;
    },
};
