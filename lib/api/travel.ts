import { api } from "./client";

export interface TravelTier {
    id: string | null;
    tierNumber: number;
    minMembers: number;
    destinations: string[];
    month: number;
    year: number;
    isActive: boolean;
    createdAt: string | null;
    updatedAt: string | null;
}

export interface TravelTierStatus {
    tierNumber: number;
    minMembers: number;
    destinations: string[];
    achieved: boolean;
}

export interface TravelEligibility {
    month: number;
    year: number;
    monthlyNewActiveCount: number;
    isEligible: boolean;
    unlockedTier: {
        tierNumber: number;
        minMembers: number;
        destinations: string[];
    } | null;
    allTiers: TravelTierStatus[];
}

export const travelApi = {
    // ── User ─────────────────────────────────────────────────────────────────
    getEligibility: async (): Promise<TravelEligibility> => {
        const res = await api.get("/travel/eligibility");
        return res.data;
    },

    getAchievers: async (month: number, year: number): Promise<Array<{
        id: string;
        name: string;
        phone: string;
        email: string;
        memberId?: number;
        monthlyNewActiveCount: number;
        tierNumber: number;
    }>> => {
        const res = await api.get("/travel/achievers", { params: { month, year } });
        return res.data;
    },

    // ── Admin ─────────────────────────────────────────────────────────────────
    adminGetTiers: async (month: number, year: number): Promise<TravelTier[]> => {
        const res = await api.get("/travel/admin/tiers", { params: { month, year } });
        return res.data;
    },

    adminUpsertTier: async (payload: {
        tierNumber: number;
        destinations: string[];
        month: number;
        year: number;
    }): Promise<TravelTier> => {
        const res = await api.post("/travel/admin/tiers", payload);
        return res.data;
    },

    adminClearTier: async (tierNumber: number, month: number, year: number): Promise<void> => {
        await api.delete(`/travel/admin/tiers/${tierNumber}`, { params: { month, year } });
    },
};
