import { api } from "./client";
import type { Order, OrderStatus } from "@/types";

export const ordersApi = {
    checkout: async (data: {
        items: { productId: string; quantity: number }[];
        shippingAddress: Record<string, string>;
        notes?: string;
    }): Promise<Order> => {
        const res = await api.post("/orders", data);
        return res.data;
    },

    myOrders: async (params?: { page?: number; limit?: number }): Promise<{ orders: Order[]; total: number }> => {
        const res = await api.get("/orders/my", { params });
        return res.data;
    },

    myOrder: async (id: string): Promise<Order> => {
        const res = await api.get(`/orders/my/${id}`);
        return res.data;
    },

    adminAll: async (params?: { page?: number; limit?: number; status?: OrderStatus }): Promise<{ orders: Order[]; total: number }> => {
        const res = await api.get("/orders/admin/all", { params });
        return res.data;
    },

    adminGet: async (id: string): Promise<Order> => {
        const res = await api.get(`/orders/admin/${id}`);
        return res.data;
    },

    updateStatus: async (id: string, status: OrderStatus): Promise<Order> => {
        const res = await api.patch(`/orders/admin/${id}/status`, { status });
        return res.data;
    },
};
