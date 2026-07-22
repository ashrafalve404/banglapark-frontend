import { api } from "./client";
import type { Notification } from "@/types";

export const notificationsApi = {
    list: async (params?: { page?: number; limit?: number }): Promise<{ notifications: Notification[]; total: number; unreadCount: number }> => {
        const res = await api.get("/notifications", { params });
        return res.data;
    },

    markRead: async (id: string): Promise<void> => {
        await api.patch(`/notifications/${id}/read`);
    },

    markAllRead: async (): Promise<void> => {
        await api.patch("/notifications/mark-all-read");
    },

    clearAll: async (): Promise<void> => {
        await api.delete("/notifications/clear-all");
    },

    delete: async (id: string): Promise<void> => {
        await api.delete(`/notifications/${id}`);
    },
};
