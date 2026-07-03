"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Download, FileSpreadsheet, Loader2, Calendar } from "lucide-react";
import { adminApi } from "@/lib/api/admin";
import { ordersApi } from "@/lib/api/orders";
import { formatCurrency } from "@/lib/utils";
import { useLocale } from "@/lib/i18n";

export default function AdminReportsPage() {
    const { t } = useLocale();
    const [downloading, setDownloading] = useState<string | null>(null);

    // Read summary stats
    const { data: stats, isLoading } = useQuery({
        queryKey: ["admin-stats"],
        queryFn: () => adminApi.stats(),
    });

    const downloadCSV = async (type: "orders" | "commissions" | "users") => {
        setDownloading(type);
        try {
            let data: any[] = [];
            let filename = `${type}-report-${new Date().toISOString().split("T")[0]}.csv`;
            let headers: string[] = [];

            if (type === "orders") {
                const res = await ordersApi.adminAll({ page: 1, limit: 1000 });
                data = res.orders;
                headers = ["Order ID", "User Name", "User Phone", "Total Price (BDT)", "Status", "Order Date"];
            } else if (type === "commissions") {
                // Fetch users / commission ledger transactions
                const res = await adminApi.users({ page: 1, limit: 1000 });
                data = res.users;
                headers = ["User ID", "User Name", "User Phone", "Status", "Joined Date"];
            } else if (type === "users") {
                const res = await adminApi.users({ page: 1, limit: 1000 });
                data = res.users;
                headers = ["User ID", "Name", "Email", "Phone", "Status", "Banned", "Referral Code", "Joined Date"];
            }

            if (data.length === 0) {
                alert(t("admin.reports.export.alertEmpty"));
                return;
            }

            // Convert rows to valid flat CSV format arrays
            let csvContent = "data:text/csv;charset=utf-8,\n" + headers.join(",") + "\n";

            data.forEach((row) => {
                let line: string[] = [];
                if (type === "orders") {
                    line = [
                        `"${row.id}"`,
                        `"${row.user?.name || ""}"`,
                        `"${row.user?.phone || ""}"`,
                        `"${row.total}"`,
                        `"${row.status}"`,
                        `"${row.createdAt}"`,
                    ];
                } else if (type === "commissions") {
                    line = [
                        `"${row.id}"`,
                        `"${row.name}"`,
                        `"${row.phone}"`,
                        `"${row.status}"`,
                        `"${row.createdAt}"`,
                    ];
                } else if (type === "users") {
                    line = [
                        `"${row.id}"`,
                        `"${row.name}"`,
                        `"${row.email}"`,
                        `"${row.phone}"`,
                        `"${row.status}"`,
                        `"${row.isBanned ? "Yes" : "No"}"`,
                        `"${row.referralCode}"`,
                        `"${row.createdAt}"`,
                    ];
                }
                csvContent += line.join(",") + "\n";
            });

            // Trigger standard browser UI download action
            const encodedUri = encodeURI(csvContent);
            const link = document.createElement("a");
            link.setAttribute("href", encodedUri);
            link.setAttribute("download", filename);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (err) {
            console.error(err);
            alert(t("admin.reports.export.alertError"));
        } finally {
            setDownloading(null);
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-slate-800">{t("admin.reports.heading")}</h1>
                <p className="text-sm text-slate-500">{t("admin.reports.subheading")}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* CSV export controls card */}
                <div className="card p-6 bg-white space-y-4 md:col-span-2">
                    <h2 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-2">{t("admin.reports.export.heading")}</h2>
                    <p className="text-xs text-slate-500 leading-relaxed">
                        {t("admin.reports.export.desc")}
                    </p>

                    <div className="space-y-3">
                        {[
                            { type: "orders", title: t("admin.reports.export.orders"), desc: t("admin.reports.export.ordersDesc") },
                            { type: "users", title: t("admin.reports.export.users"), desc: t("admin.reports.export.usersDesc") },
                            { type: "commissions", title: t("admin.reports.export.commissions"), desc: t("admin.reports.export.commissionsDesc") },
                        ].map((btn) => (
                            <div key={btn.type} className="flex items-center justify-between p-4 rounded-xl border border-slate-150 bg-slate-50/50 hover:bg-slate-50 transition-colors">
                                <div>
                                    <h4 className="text-xs font-bold text-slate-800">{btn.title}</h4>
                                    <p className="text-[10px] text-gray-500 mt-0.5">{btn.desc}</p>
                                </div>
                                <button
                                    onClick={() => downloadCSV(btn.type as any)}
                                    disabled={downloading !== null}
                                    className="btn-primary py-2 px-4 text-xs font-bold flex items-center gap-1.5 whitespace-nowrap shadow"
                                >
                                    {downloading === btn.type ? (
                                        <>
                                            <Loader2 className="animate-spin" size={14} /> {t("admin.reports.export.downloading")}
                                        </>
                                    ) : (
                                        <>
                                            <Download size={14} /> {t("admin.reports.export.button")}
                                        </>
                                    )}
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Short platform analytics summaries */}
                <div className="card p-6 bg-slate-900 text-white flex flex-col justify-between space-y-4">
                    <div>
                        <h3 className="text-sm font-bold text-amber-500 uppercase tracking-widest mb-3">{t("admin.reports.sidebar.heading")}</h3>
                        <p className="text-xs text-slate-350 leading-relaxed mb-3">
                            {t("admin.reports.sidebar.rule1")}
                        </p>
                        <p className="text-xs text-slate-350 leading-relaxed">
                            {t("admin.reports.sidebar.rule2")}
                        </p>
                    </div>
                    <span className="text-[10px] text-slate-500">{t("admin.reports.footer")}</span>
                </div>
            </div>
        </div>
    );
}
