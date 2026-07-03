import { api } from "./client";
import type { Wallet, WalletTransaction } from "@/types";

export const walletApi = {
    balance: async (): Promise<Wallet> => {
        const res = await api.get("/wallet/balance");
        return res.data;
    },

    transactions: async (params?: {
        page?: number;
        limit?: number;
        type?: string;
        from?: string;
        to?: string;
    }): Promise<{ transactions: WalletTransaction[]; total: number; page: number; limit: number; totalPages: number }> => {
        const res = await api.get("/wallet/transactions", { params });
        return res.data;
    },
};
