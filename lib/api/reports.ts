import { api } from "./client";

export interface UserStatementParams {
    userQuery: string;
    period?: "this_week" | "this_month" | "last_month" | "custom";
    startDate?: string;
    endDate?: string;
}

export interface UserStatementResponse {
    user: {
        id: string;
        name: string;
        phone: string;
        email: string;
        status: string;
        activeUntil: string | null;
        createdAt: string;
        sponsor: { name: string; phone: string } | null;
        teamCount: number;
    };
    periodInfo: {
        period: string;
        fromDate: string;
        toDate: string;
    };
    summary: {
        totalSpent: number;
        totalEarned: number;
        currentWalletBalance: number;
        totalWithdrawn: number;
    };
    expenditureBreakdown: {
        orders: { count: number; totalAmount: number };
        giftCards: { count: number; totalAmount: number };
        quizzes: { count: number; totalAmount: number };
    };
    itemizedLogs: Array<{
        id: string;
        date: string;
        category: string;
        description: string;
        paymentMethod: string;
        amount: number;
        type: "DEBIT" | "CREDIT";
        status: string;
    }>;
}

export const reportsApi = {
    getUserStatement: async (params: UserStatementParams): Promise<UserStatementResponse> => {
        const res = await api.get("/reports/admin/user-statement", { params });
        return res.data;
    },
};
