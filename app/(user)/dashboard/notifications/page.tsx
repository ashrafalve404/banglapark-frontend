"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Bell, CheckSquare, Loader2, RefreshCw } from "lucide-react";
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
                    <button
                        onClick={handleMarkAllRead}
                        disabled={actionLoading}
                        className="btn-secondary py-2 px-3 self-start text-xs font-semibold flex items-center gap-1.5"
                    >
                        <CheckSquare size={14} /> {t("notifications.markAllRead")}
                    </button>
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
                            className={`card p-4 transition-all hover:bg-gray-50/50 cursor-pointer border-l-4 ${notif.isRead ? "border-l-gray-300 bg-white" : "border-l-green-800 bg-green-50/30"
                                }`}
                        >
                            <div className="flex justify-between items-start gap-4 mb-1">
                                <h3 className={`text-sm ${notif.isRead ? "font-semibold text-gray-800" : "font-bold text-gray-900"}`}>
                                    {notif.title}
                                </h3>
                                <span className="text-[10px] text-gray-400 whitespace-nowrap">{formatDateTime(notif.createdAt, locale)}</span>
                            </div>
                            <p className="text-xs text-gray-500 leading-relaxed">{notif.body}</p>
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
