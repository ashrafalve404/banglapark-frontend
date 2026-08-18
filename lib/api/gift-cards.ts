import { api } from "./client";

export interface GiftCardAdmin {
    id: string;
    title: string;
    description: string;
    price: number;
    image?: string;
    voucherCode?: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
    totalRevenue?: number;
    _count?: {
        purchases: number;
    };
}

export interface GiftCardAdminStats {
    totalRevenue: number;
    totalPurchases: number;
    pendingApprovalsCount?: number;
    totalResalePayout?: number;
    totalCardsSold?: number;
    totalCards: number;
    activeCards: number;
    uniqueBuyers: number;
    activatedAccountsCount: number;
}

export interface GiftCardAdminPurchaseLog {
    id: string;
    purchasedAt: string;
    pricePaid: number;
    paymentMethod?: string;
    userBkashNumber?: string;
    bkashTrxId?: string;
    voucherCode?: string;
    wasAccountActivated: boolean;
    status?: string;
    canSellAt?: string;
    isSold?: boolean;
    soldAt?: string;
    user: {
        id: string;
        fullName: string;
        phone: string;
        email: string;
    };
    giftCard: {
        id: string;
        title: string;
        price: number;
    };
}

export interface GiftCardPublic {
    id: string;
    title: string;
    description: string;
    price: number;
    image?: string;
    isActive: boolean;
    isPurchased: boolean;
    createdAt: string;
}

export interface GiftCardUserPurchase {
    id: string;
    cardId: string;
    title: string;
    description: string;
    image?: string;
    pricePaid: number;
    paymentMethod?: string;
    voucherCode: string;
    wasAccountActivated: boolean;
    status?: string;
    canSellAt?: string;
    isSold?: boolean;
    soldAt?: string;
    purchasedAt: string;
}

export interface CreateGiftCardInput {
    title: string;
    description?: string;
    price: number;
    image?: string;
    voucherCode?: string;
    isActive?: boolean;
}

export interface UpdateGiftCardInput {
    title?: string;
    description?: string;
    price?: number;
    image?: string;
    voucherCode?: string;
    isActive?: boolean;
}

export interface BuyGiftCardInput {
    paymentMethod?: "WALLET" | "BKASH";
    userBkashNumber?: string;
    bkashTrxId?: string;
}

export const giftCardsApi = {
    // Admin
    adminGetStats: async (): Promise<GiftCardAdminStats> => {
        const res = await api.get("/gift-cards/admin/stats");
        return res.data;
    },
    adminGetPurchases: async (): Promise<GiftCardAdminPurchaseLog[]> => {
        const res = await api.get("/gift-cards/admin/purchases");
        return res.data;
    },
    adminApprovePurchase: async (id: string): Promise<{ message: string }> => {
        const res = await api.post(`/gift-cards/admin/purchases/${id}/approve`);
        return res.data;
    },
    adminRejectPurchase: async (id: string): Promise<{ message: string }> => {
        const res = await api.post(`/gift-cards/admin/purchases/${id}/reject`);
        return res.data;
    },
    adminDeletePurchase: async (id: string): Promise<{ message: string }> => {
        const res = await api.delete(`/gift-cards/admin/purchases/${id}`);
        return res.data;
    },
    adminGetCards: async (): Promise<GiftCardAdmin[]> => {
        const res = await api.get("/gift-cards/admin/cards");
        return res.data;
    },
    adminCreateCard: async (data: CreateGiftCardInput): Promise<GiftCardAdmin> => {
        const res = await api.post("/gift-cards/admin/cards", data);
        return res.data;
    },
    adminUpdateCard: async (id: string, data: UpdateGiftCardInput): Promise<GiftCardAdmin> => {
        const res = await api.patch(`/gift-cards/admin/cards/${id}`, data);
        return res.data;
    },
    adminDeleteCard: async (id: string): Promise<{ message: string }> => {
        const res = await api.delete(`/gift-cards/admin/cards/${id}`);
        return res.data;
    },

    // User
    getPublicCards: async (): Promise<GiftCardPublic[]> => {
        const res = await api.get("/gift-cards/public/cards");
        return res.data;
    },
    buyCard: async (cardId: string, data?: BuyGiftCardInput): Promise<{ message: string; wasAccountActivated: boolean; purchase: GiftCardUserPurchase }> => {
        const res = await api.post(`/gift-cards/user/buy/${cardId}`, data || {});
        return res.data;
    },
    getMyCards: async (): Promise<GiftCardUserPurchase[]> => {
        const res = await api.get("/gift-cards/user/my-cards");
        return res.data;
    },
    sellCard: async (purchaseId: string): Promise<{ message: string; purchase: GiftCardUserPurchase }> => {
        const res = await api.post(`/gift-cards/user/sell/${purchaseId}`);
        return res.data;
    },
};
