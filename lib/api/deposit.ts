import { api } from "./client";

export type DepositRequest = {
    id: string;
    amount: number;
    transactionId: string;
    senderPhone: string;
    status: "PENDING" | "APPROVED" | "REJECTED";
    adminNote?: string;
    createdAt: string;
};

export const depositApi = {
    getAdminInfo: async (): Promise<{ bkashNumber: string }> => {
        const res = await api.get("/deposit/admin-info");
        return res.data;
    },

    submit: async (body: { amount: number; transactionId: string; senderPhone: string }): Promise<DepositRequest> => {
        const res = await api.post("/deposit", body);
        return res.data;
    },

    getMyRequests: async (params?: { page?: number; limit?: number }): Promise<{
        requests: DepositRequest[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }> => {
        const res = await api.get("/deposit/my", { params });
        return res.data;
    },

    // Admin
    adminList: async (params?: { page?: number; limit?: number; status?: string }): Promise<{
        requests: (DepositRequest & { user: { id: string; name: string; phone: string; memberId: number } })[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }> => {
        const res = await api.get("/deposit/admin/list", { params });
        return res.data;
    },

    approve: async (id: string, adminNote?: string) => {
        const res = await api.patch(`/deposit/admin/${id}/approve`, { adminNote });
        return res.data;
    },

    reject: async (id: string, adminNote?: string) => {
        const res = await api.patch(`/deposit/admin/${id}/reject`, { adminNote });
        return res.data;
    },
};
