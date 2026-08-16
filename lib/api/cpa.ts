import { api } from "./client";

export interface CpaTaskAdmin {
    id: string;
    title: string;
    description: string;
    price: number;
    redirectLink: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
    _count?: {
        purchases: number;
    };
}

export interface CpaTaskPublic {
    id: string;
    title: string;
    description: string;
    price: number;
    isActive: boolean;
    isPurchased: boolean;
    createdAt: string;
}

export interface CpaTaskUserPurchase {
    id: string;
    taskId: string;
    title: string;
    description: string;
    redirectLink: string;
    pricePaid: number;
    status: string;
    purchasedAt: string;
}

export interface CreateCpaTaskInput {
    title: string;
    description: string;
    price: number;
    redirectLink: string;
    isActive?: boolean;
}

export interface UpdateCpaTaskInput {
    title?: string;
    description?: string;
    price?: number;
    redirectLink?: string;
    isActive?: boolean;
}

export const cpaApi = {
    // Admin
    adminGetTasks: async (): Promise<CpaTaskAdmin[]> => {
        const res = await api.get("/cpa-marketing/admin/tasks");
        return res.data;
    },
    adminCreateTask: async (data: CreateCpaTaskInput): Promise<CpaTaskAdmin> => {
        const res = await api.post("/cpa-marketing/admin/tasks", data);
        return res.data;
    },
    adminUpdateTask: async (id: string, data: UpdateCpaTaskInput): Promise<CpaTaskAdmin> => {
        const res = await api.patch(`/cpa-marketing/admin/tasks/${id}`, data);
        return res.data;
    },
    adminDeleteTask: async (id: string): Promise<{ message: string }> => {
        const res = await api.delete(`/cpa-marketing/admin/tasks/${id}`);
        return res.data;
    },

    // User
    getPublicTasks: async (): Promise<CpaTaskPublic[]> => {
        const res = await api.get("/cpa-marketing/public/tasks");
        return res.data;
    },
    buyTask: async (taskId: string): Promise<{ message: string; purchase: CpaTaskUserPurchase }> => {
        const res = await api.post(`/cpa-marketing/user/buy/${taskId}`);
        return res.data;
    },
    getMyPurchases: async (): Promise<CpaTaskUserPurchase[]> => {
        const res = await api.get("/cpa-marketing/user/my-purchases");
        return res.data;
    },
};
