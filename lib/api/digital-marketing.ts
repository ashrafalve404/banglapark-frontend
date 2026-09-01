import { api } from "./client";

export type DigitalMarketingPackage = {
    id: string;
    title: string;
    description?: string;
    image?: string;
    link?: string;
    price: number;
    profitPercent: number;
    durationHours: number;
    isHidden: boolean;
    sortOrder: number;
    createdAt: string;
};

export type DigitalMarketingPurchase = {
    id: string;
    userId: string;
    packageId: string;
    amount: number;
    profitAmount: number;
    totalReturn: number;
    status: "ACTIVE" | "COMPLETED";
    purchasedAt: string;
    maturesAt: string;
    creditedAt?: string;
    package?: {
        title: string;
        description?: string;
    };
    user?: {
        id: string;
        name: string;
        phone: string;
        memberId: number;
    };
};

export const digitalMarketingApi = {
    getPackages: async (): Promise<DigitalMarketingPackage[]> => {
        const res = await api.get("/digital-marketing/packages");
        return res.data;
    },

    purchase: async (packageId: string): Promise<{ success: boolean; message: string; purchase: DigitalMarketingPurchase }> => {
        const res = await api.post("/digital-marketing/purchase", { packageId });
        return res.data;
    },

    getMyPurchases: async (): Promise<{
        purchases: DigitalMarketingPurchase[];
        active: DigitalMarketingPurchase[];
        completed: DigitalMarketingPurchase[];
        now: string;
    }> => {
        const res = await api.get("/digital-marketing/my-purchases");
        return res.data;
    },

    // Admin
    adminGetAllPackages: async (): Promise<(DigitalMarketingPackage & { _count: { purchases: number } })[]> => {
        const res = await api.get("/digital-marketing/admin/packages");
        return res.data;
    },

    adminCreatePackage: async (body: Partial<DigitalMarketingPackage>): Promise<DigitalMarketingPackage> => {
        const res = await api.post("/digital-marketing/admin/packages", body);
        return res.data;
    },

    adminUpdatePackage: async (id: string, body: Partial<DigitalMarketingPackage>): Promise<DigitalMarketingPackage> => {
        const res = await api.patch(`/digital-marketing/admin/packages/${id}`, body);
        return res.data;
    },

    adminDeletePackage: async (id: string) => {
        const res = await api.delete(`/digital-marketing/admin/packages/${id}`);
        return res.data;
    },

    adminGetAllPurchases: async (params?: { page?: number; limit?: number; status?: string }): Promise<{
        purchases: DigitalMarketingPurchase[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }> => {
        const res = await api.get("/digital-marketing/admin/purchases", { params });
        return res.data;
    },
};
