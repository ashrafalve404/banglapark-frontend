import { api } from "./client";
import type { Product, PaginatedResponse } from "@/types";

export const productsApi = {
    list: async (params?: {
        page?: number;
        limit?: number;
        search?: string;
        categoryId?: string;
    }): Promise<{ products: Product[]; total: number; page: number; limit: number }> => {
        const res = await api.get("/products", { params });
        return res.data;
    },

    getBySlug: async (slug: string): Promise<Product> => {
        const res = await api.get(`/products/${slug}`);
        return res.data;
    },

    create: async (data: FormData | Record<string, unknown>): Promise<Product> => {
        const res = await api.post("/products", data);
        return res.data;
    },

    update: async (id: string, data: Partial<Product>): Promise<Product> => {
        const res = await api.patch(`/products/${id}`, data);
        return res.data;
    },

    delete: async (id: string): Promise<void> => {
        await api.delete(`/products/${id}`);
    },
};
