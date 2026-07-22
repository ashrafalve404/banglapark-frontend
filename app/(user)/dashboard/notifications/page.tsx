"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Bell, CheckSquare, Loader2, Trash2, X } from "lucide-react";
import { notificationsApi } from "@/lib/api/notifications";
import { formatDateTime } from "@/lib/utils";
import { useLocale } from "@/lib/i18n";

export default function UserNotificationsPage() {
    const { t, locale } = useLocale();
    const [page, setPage] = useState(1);
    const [actionLoading, setActionLoading] = useState(false);

    const { data, isLoading, refetch } = useQuery({
        queryKey: ["notifications", page],
        queryFn: () => notificationsApi.list({ page, limit: 15 }),
    });

    const notifications = data?.notifications ?? [];
    const total = data?.total ?? 0;
    const totalPages = Math.ceil(total / 15) || 1;

    const handleMarkAllRead = async () => {
        setActionLoading(true);
        try {
            await notificationsApi.markAllRead();
            refetch();
        } catch (err) {
            console.error(err);
        } finally {
            setActionLoading(false);
        }
    };

    const handleClearAll = async () => {
        if (!confirm(t("notifications.confirmClearAll") || (locale === "bn" ? "আপনি কি নিশ্চিত যে সব নোটিফিকেশন মুছে ফেলতে চান?" : "Clear all notifications?"))) {
            return;
        }
        setActionLoading(true);
        try {
            await notificationsApi.clearAll();
            refetch();
        } catch (err) {
            console.error(err);
        } finally {
            setActionLoading(false);
        }
    };

    const handleDeleteSingle = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        try {
            await notificationsApi.delete(id);
            refetch();
        } catch (err) {
            console.error(err);
        }
    };

    const handleMarkSingleRead = async (id: string, isRead: boolean) => {
        if (isRead) return;
        try {
            await notificationsApi.markRead(id);
            refetch();
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">{t("notifications.heading")}</h1>
                    <p className="text-sm text-gray-500">{t("notifications.subheading")}</p>
                </div>
                {notifications.length > 0 && (
                    <div className="flex items-center gap-2 self-start">
                        <button
                            onClick={handleMarkAllRead}
                            disabled={actionLoading}
                            className="btn-secondary py-2 px-3 text-xs font-semibold flex items-center gap-1.5"
                        >
                            <CheckSquare size={14} /> {t("notifications.markAllRead")}
                        </button>
                        <button
                            onClick={handleClearAll}
                            disabled={actionLoading}
                            className="bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 py-2 px-3 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5"
                        >
                            <Trash2 size={14} /> {t("notifications.clearAll")}
                        </button>
                    </div>
                )}
            </div>

            {isLoading ? (
                <div className="flex justify-center items-center py-20">
                    <Loader2 className="animate-spin text-green-800" size={32} />
                </div>
            ) : notifications.length === 0 ? (
                <div className="card py-20 text-center text-gray-400">
                    <Bell size={28} className="mx-auto mb-2 text-gray-300" />
                    {t("notifications.empty")}
                </div>
            ) : (
                <div className="space-y-3">
                    {notifications.map((notif) => (
                        <div
                            key={notif.id}
                            onClick={() => handleMarkSingleRead(notif.id, notif.isRead)}
                            className={`card p-4 transition-all hover:bg-gray-50/50 cursor-pointer border-l-4 relative group flex justify-between items-start gap-4 ${notif.isRead ? "border-l-gray-300 bg-white" : "border-l-green-800 bg-green-50/30"
                                }`}
                        >
                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-start gap-4 mb-1">
                                    <h3 className={`text-sm ${notif.isRead ? "font-semibold text-gray-800" : "font-bold text-gray-900"}`}>
                                        {notif.title}
                                    </h3>
                                    <span className="text-[10px] text-gray-400 whitespace-nowrap">{formatDateTime(notif.createdAt, locale)}</span>
                                </div>
                                <p className="text-xs text-gray-500 leading-relaxed">{notif.body}</p>
                            </div>
                            <button
                                onClick={(e) => handleDeleteSingle(e, notif.id)}
                                className="text-gray-300 hover:text-red-600 p-1 rounded-md transition-colors self-start shrink-0"
                                title={t("notifications.clear")}
                            >
                                <X size={16} />
                            </button>
                        </div>
                    ))}

                    {totalPages > 1 && (
                        <div className="p-4 bg-white card flex items-center justify-between">
                            <button disabled={page === 1} onClick={() => setPage(page - 1)} className="btn-secondary py-1 px-3 text-xs">{t("notifications.prev")}</button>
                            <span className="text-xs text-gray-500 font-semibold">{page} / {totalPages} {t("notifications.page")}</span>
                            <button disabled={page === totalPages} onClick={() => setPage(page + 1)} className="btn-secondary py-1 px-3 text-xs">{t("notifications.next")}</button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
