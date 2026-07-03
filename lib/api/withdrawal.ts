import { api } from "./client";
import type { WithdrawalRequest, WithdrawMethod, WithdrawStatus } from "@/types";

export const withdrawalApi = {
    request: async (data: {
        amount: number;
        method: WithdrawMethod;
        accountDetails: Record<string, string>;
    }): Promise<WithdrawalRequest> => {
        const res = await api.post("/withdrawals", data);
        return res.data;
    },

    myRequests: async (params?: { page?: number; limit?: number }): Promise<{ requests: WithdrawalRequest[]; total: number }> => {
        const res = await api.get("/withdrawals/my", { params });
        return res.data;
    },

    adminAll: async (params?: { page?: number; limit?: number; status?: WithdrawStatus }): Promise<{ requests: WithdrawalRequest[]; total: number }> => {
        const res = await api.get("/withdrawals/admin/all", { params });
        return res.data;
    },

    review: async (id: string, data: { status: "APPROVED" | "REJECTED"; reason?: string }): Promise<WithdrawalRequest> => {
        const res = await api.patch(`/withdrawals/admin/${id}/review`, data);
        return res.data;
    },
};
