import { api } from "./client";

export interface PositionDef {
    rank: number;
    name: string;
    requiredMembers: number;
    monthlySalary: number;
    isUnlocked: boolean;
}

export interface UserPositionData {
    activeTeamCount: number;
    positions: PositionDef[];
    highestUnlocked: PositionDef | null;
}

export const positionApi = {
    my: async (): Promise<UserPositionData> => {
        const res = await api.get("/position/my");
        return res.data;
    },

    adminMembers: async (params?: { page?: number; limit?: number; search?: string }) => {
        const res = await api.get("/position/admin/members", { params });
        return res.data as {
            users: Array<{
                id: string; name: string; phone: string; email: string;
                memberId: number | null; status: string; createdAt: string;
                activeTeamCount: number;
                currentPosition: { rank: number; name: string; monthlySalary: number } | null;
            }>;
            total: number; page: number; limit: number; totalPages: number;
        };
    },

    adminPay: async (userId: string) => {
        const res = await api.post(`/position/admin/pay/${userId}`);
        return res.data;
    },

    adminDistribute: async () => {
        const res = await api.post("/position/admin/distribute");
        return res.data;
    },
};
