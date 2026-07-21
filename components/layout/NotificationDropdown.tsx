"use client";

import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Bell, Check, Loader2 } from "lucide-react";
import { notificationsApi } from "@/lib/api/notifications";
import Link from "next/link";
import { useLocale } from "@/lib/i18n";
import { formatDateTime } from "@/lib/utils";

interface NotificationDropdownProps {
    isAdmin?: boolean;
}

export function NotificationDropdown({ isAdmin = false }: NotificationDropdownProps) {
    const { t, locale } = useLocale();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const queryClient = useQueryClient();

    // Query notifications every 10 seconds for instant notification updates
    const { data } = useQuery({
        queryKey: ["notifications-dropdown"],
        queryFn: () => notificationsApi.list({ page: 1, limit: 8 }),
        refetchInterval: 10000,
        staleTime: 5000,
    });

    const notifications = data?.notifications ?? [];
    const unreadCount = data?.unreadCount ?? 0;

    // Pulse state if unread count increases (new notifications)
    const [prevUnreadCount, setPrevUnreadCount] = useState(0);
    const [animatePulse, setAnimatePulse] = useState(false);

    useEffect(() => {
        if (unreadCount > prevUnreadCount) {
            setAnimatePulse(true);
            const timer = setTimeout(() => setAnimatePulse(false), 2000);
            return () => clearTimeout(timer);
        }
        setPrevUnreadCount(unreadCount);
    }, [unreadCount, prevUnreadCount]);

    // Handle clicking outside to close
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const markReadMutation = useMutation({
        mutationFn: (id: string) => notificationsApi.markRead(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["notifications-dropdown"] });
            queryClient.invalidateQueries({ queryKey: ["notifications"] });
        },
    });

    const markAllReadMutation = useMutation({
        mutationFn: () => notificationsApi.markAllRead(),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["notifications-dropdown"] });
            queryClient.invalidateQueries({ queryKey: ["notifications"] });
        },
    });

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`relative p-2 rounded-full hover:bg-slate-100/80 transition-all focus:outline-none ${animatePulse ? "scale-110 rotate-12" : ""
                    }`}
                title={locale === "bn" ? "নোটিফিকেশন" : "Notifications"}
            >
                <Bell className={`h-5 w-5 text-slate-600 transition-colors ${unreadCount > 0 ? "text-green-700" : ""}`} />
                {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white ring-2 ring-white">
                        {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2.5 w-80 rounded-xl border border-slate-100 bg-white shadow-2xl z-50 overflow-hidden divide-y divide-slate-50 transition-all duration-200">
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-slate-50 to-white">
                        <span className="text-sm font-semibold text-slate-800">
                            {locale === "bn" ? "নোটিফিকেশন" : "Notifications"}
                        </span>
                        {unreadCount > 0 && (
                            <button
                                onClick={() => markAllReadMutation.mutate()}
                                className="text-xs text-green-700 hover:text-green-800 font-medium inline-flex items-center gap-1"
                                disabled={markAllReadMutation.isPending}
                            >
                                {markAllReadMutation.isPending ? (
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                    <>
                                        <Check className="h-3 w-3" />
                                        {locale === "bn" ? "সব পঠিত চিহ্নিত করুন" : "Mark all read"}
                                    </>
                                )}
                            </button>
                        )}
                    </div>

                    {/* Notification list */}
                    <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                        {notifications.length === 0 ? (
                            <div className="py-8 text-center text-slate-400 text-xs">
                                {locale === "bn" ? "কোনো নোটিফিকেশন নেই" : "No new notifications"}
                            </div>
                        ) : (
                            notifications.map((notif) => (
                                <div
                                    key={notif.id}
                                    onClick={() => {
                                        if (!notif.isRead) {
                                            markReadMutation.mutate(notif.id);
                                        }
                                    }}
                                    className={`p-3 pr-4 transition-colors cursor-pointer text-left hover:bg-slate-50/50 flex gap-2.5 items-start ${notif.isRead ? "bg-white" : "bg-green-50/20 border-l-2 border-l-green-700"
                                        }`}
                                >
                                    <div className="min-w-0 flex-1">
                                        <div className="flex justify-between items-baseline gap-2 mb-0.5">
                                            <p className={`text-xs truncate ${notif.isRead ? "text-slate-700 font-medium" : "text-slate-900 font-bold"}`}>
                                                {notif.title}
                                            </p>
                                            <span className="text-[9px] text-slate-400 whitespace-nowrap">
                                                {formatDateTime(notif.createdAt, locale)}
                                            </span>
                                        </div>
                                        <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                                            {notif.body}
                                        </p>
                                    </div>
                                    {!notif.isRead && (
                                        <span className="h-2 w-2 rounded-full bg-green-700 self-center shrink-0" />
                                    )}
                                </div>
                            ))
                        )}
                    </div>

                    {/* Footer link to notifications page */}
                    {!isAdmin && (
                        <div className="p-2.5 text-center bg-slate-50/50">
                            <Link
                                href="/dashboard/notifications"
                                onClick={() => setIsOpen(false)}
                                className="text-xs text-indigo-600 hover:text-indigo-700 font-medium transition-colors"
                            >
                                {locale === "bn" ? "সব নোটিফিকেশন দেখুন" : "View all notifications"}
                            </Link>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
