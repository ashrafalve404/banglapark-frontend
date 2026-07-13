import { api } from "./client";

export interface StatementAccount {
    id: string;
    memberId: number | null;
    name: string;
    email: string;
    phone: string;
    role: string;
    status: string;
    referralCode: string;
    referralLink: string | null;
    usedReferralCode: string | null;
    activeFrom: string | null;
    activeUntil: string | null;
    isFirstActivated: boolean;
    isBanned: boolean;
    createdAt: string;
    updatedAt: string;
    walletBalance: number;
    pendingWithdrawal: number;
    dailyReward: number;
    tierBonus: number;
    generationIncome: number;
    withdrawable: number;
}

export interface StatementTransaction {
    id: string;
    type: string;
    amount: number;
    balanceAfter: number;
    description: string;
    benefitCategory: string | null;
    createdAt: string;
}

export interface StatementWithdrawal {
    id: string;
    amount: number;
    method: string;
    accountDetails: Record<string, unknown>;
    status: string;
    createdAt: string;
    reviewedAt: string | null;
}

export interface StatementData {
    account: StatementAccount;
    transactions: StatementTransaction[];
    withdrawals: StatementWithdrawal[];
    team: { totalTeam: number };
    orders: { totalOrders: number; totalSpent: number };
}

export const statementApi = {
    get: async (): Promise<StatementData> => {
        const res = await api.get("/users/me/statement");
        return res.data;
    },
};
