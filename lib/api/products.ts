import { api } from "./client";
import type { Product, PaginatedResponse } from "@/types";

export const productsApi = {
    list: async (params?: {
        page?: number;
        limit?: number;
        search?: string;
        categoryId?: string;
        sort?: 'price_asc' | 'price_desc' | 'newest' | 'popular';
        sellerType?: 'ALL' | 'ADMIN' | 'USER';
        approvalStatus?: 'PENDING' | 'APPROVED' | 'REJECTED';
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

    updateApproval: async (id: string, data: { approvalStatus: 'APPROVED' | 'REJECTED'; rejectionReason?: string }): Promise<Product> => {
        const res = await api.patch(`/products/${id}/approval`, data);
        return res.data;
    },

    delete: async (id: string): Promise<void> => {
        await api.delete(`/products/${id}`);
    },

    deleteMany: async (ids: string[]): Promise<void> => {
        await api.post("/products/bulk-delete", { ids });
    },

    recordClick: async (id: string): Promise<void> => {
        await api.post(`/products/${id}/click`);
    },
};

export const userProductsApi = {
    submitProduct: async (data: {
        name: string;
        description?: string;
        price: number;
        stock?: number;
        categoryId?: string;
        images?: string[];
        sizes?: string[];
    }): Promise<Product> => {
        const res = await api.post("/user-products", data);
        return res.data;
    },

    getMyProducts: async (): Promise<(Product & { totalSoldQuantity: number; totalRevenue: number; sellerEarnings80Percent: number })[]> => {
        const res = await api.get("/user-products/my-products");
        return res.data;
    },
};
