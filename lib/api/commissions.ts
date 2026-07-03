import { api } from "./client";
import type { GenerationCommission, DailyBenefitLog, BenefitTier } from "@/types";

export const commissionsApi = {
    my: async (params?: { page?: number; limit?: number }): Promise<{ commissions: GenerationCommission[]; total: number }> => {
        const res = await api.get("/commissions/my", { params });
        return res.data;
    },

    adminAll: async (params?: { page?: number; limit?: number }): Promise<{ commissions: GenerationCommission[]; total: number }> => {
        const res = await api.get("/commissions/admin/all", { params });
        return res.data;
    },
};

export const dailyBenefitApi = {
    tiers: async (): Promise<BenefitTier[]> => {
        const res = await api.get("/daily-benefit/tiers");
        return res.data;
    },

    myLogs: async (params?: { page?: number; limit?: number }): Promise<{ logs: DailyBenefitLog[]; total: number }> => {
        const res = await api.get("/daily-benefit/my/logs", { params });
        return res.data;
    },

    adminLogs: async (params?: { page?: number; limit?: number }): Promise<{ logs: DailyBenefitLog[]; total: number }> => {
        const res = await api.get("/daily-benefit/admin/logs", { params });
        return res.data;
    },
};
