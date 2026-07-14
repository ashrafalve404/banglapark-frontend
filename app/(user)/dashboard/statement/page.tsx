"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Download, Loader2, FileText, Wallet, TrendingUp, Gift, Award, ArrowDownToLine, Users, ShoppingBag } from "lucide-react";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { statementApi, type StatementData } from "@/lib/api/statement";
import { formatCurrency } from "@/lib/utils";
import { useLocale } from "@/lib/i18n";

export default function StatementPage() {
    const { t, locale } = useLocale();
    const [downloading, setDownloading] = useState(false);
    const isBn = locale === "bn";

    const { data, isLoading } = useQuery({
        queryKey: ["statement"],
        queryFn: () => statementApi.get(),
    });

    const downloadPdf = async () => {
        if (!data) return;
        setDownloading(true);

        try {
            const doc = new jsPDF();
            const pageW = doc.internal.pageSize.getWidth();
            const margin = 14;
            const contentW = pageW - margin * 2;
            let y = margin;

            const boldFont = "bold";
            const normalFont = "normal";
            const headerBg: [number, number, number] = [22, 163, 74];
            const lightBg: [number, number, number] = [240, 253, 244];

            const txt = (text: string, x: number, yPos: number, opts?: { font?: string; size?: number; color?: number[]; align?: string }) => {
                doc.setFont("helvetica", opts?.font || normalFont);
                if (opts?.size) doc.setFontSize(opts.size);
                if (opts?.color) doc.setTextColor(opts.color[0], opts.color[1], opts.color[2]);
                const align = opts?.align || "left";
                if (align === "center") doc.text(text, x, yPos, { align: "center" });
                else doc.text(text, x, yPos);
            };

            const sectionHeading = (label: string) => {
                doc.setFillColor(headerBg[0], headerBg[1], headerBg[2]);
                doc.rect(margin, y, contentW, 8, "F");
                txt(label, pageW / 2, y + 5.5, { font: boldFont, size: 10, color: [255, 255, 255], align: "center" });
                y += 12;
            };

            const labelValue = (label: string, value: string) => {
                txt(label, margin, y, { font: boldFont, size: 9, color: [55, 65, 81] });
                txt(value, margin + 65, y, { size: 9, color: [31, 41, 55] });
                y += 5.5;
            };

            // â”€â”€ Header â”€â”€
            txt("BANGLA PARK LIMITED", pageW / 2, y, { font: boldFont, size: 16, color: [22, 163, 74], align: "center" });
            y += 8;
            txt(t("dashboard.statement.heading"), pageW / 2, y, { size: 11, color: [107, 114, 128], align: "center" });
            y += 12;

            // â”€â”€ Account Information â”€â”€
            sectionHeading(t("dashboard.statement.accountSection"));
            const ac = data.account;
            labelValue(t("dashboard.statement.memberId"), ac.memberId ? `#${ac.memberId}` : "-");
            labelValue(t("dashboard.statement.name"), ac.name);
            labelValue(t("dashboard.statement.email"), ac.email);
            labelValue(t("dashboard.statement.phone"), ac.phone);
            labelValue(t("dashboard.statement.status"), ac.status === "ACTIVE" ? t("dashboard.statement.active") : t("dashboard.statement.inactive"));
            labelValue(t("dashboard.statement.referralCode"), ac.referralCode);
            labelValue(t("dashboard.statement.usedReferralCode"), ac.usedReferralCode || t("dashboard.statement.none"));
            labelValue(t("dashboard.statement.activeFrom"), ac.activeFrom ? new Date(ac.activeFrom).toLocaleDateString() : t("dashboard.statement.none"));
            labelValue(t("dashboard.statement.activeUntil"), ac.activeUntil ? new Date(ac.activeUntil).toLocaleDateString() : t("dashboard.statement.none"));
            labelValue(t("dashboard.statement.joinDate"), new Date(ac.createdAt).toLocaleDateString());
            y += 4;

            // â”€â”€ Wallet Summary â”€â”€
            sectionHeading(t("dashboard.statement.walletSection"));
            labelValue(t("dashboard.statement.totalBalance"), formatCurrency(ac.walletBalance, locale));
            labelValue(t("dashboard.statement.dailyReward"), formatCurrency(ac.dailyReward, locale));
            labelValue(t("dashboard.statement.tierBonus"), formatCurrency(ac.tierBonus, locale));
            labelValue(t("dashboard.statement.generationIncome"), formatCurrency(ac.generationIncome, locale));
            labelValue(t("dashboard.statement.pendingWithdrawal"), formatCurrency(ac.pendingWithdrawal, locale));
            labelValue(t("dashboard.statement.withdrawable"), formatCurrency(ac.withdrawable, locale));
            y += 4;

            // â”€â”€ Transaction History â”€â”€
            sectionHeading(t("dashboard.statement.transactionSection"));
            if (data.transactions.length === 0) {
                txt(t("dashboard.statement.noTransactions"), margin, y, { size: 9, color: [156, 163, 175] });
                y += 8;
            } else {
                const txRows = data.transactions.map((tx) => [
                    new Date(tx.createdAt).toLocaleDateString(),
                    t(`dashboard.statement.transactionType.${tx.type}` as any, undefined, tx.type),
                    (tx.benefitCategory === "BASE" ? `${t("dashboard.statement.dailyReward")} - ` : tx.benefitCategory === "TIER" ? `${t("dashboard.statement.tierBonus")} - ` : "") + tx.description,
                    `${formatCurrency(tx.amount, locale)}`,
                    `${formatCurrency(tx.balanceAfter, locale)}`,
                ]);
                autoTable(doc, {
                    startY: y,
                    head: [[t("dashboard.statement.date"), t("dashboard.statement.type"), t("dashboard.statement.description"), t("dashboard.statement.amount"), t("dashboard.statement.balanceAfter")]],
                    body: txRows,
                    margin: { left: margin, right: margin },
                    styles: { fontSize: 7, cellPadding: 1.5 },
                    headStyles: { fillColor: [22, 163, 74] as [number, number, number], textColor: 255, fontStyle: boldFont },
                    alternateRowStyles: { fillColor: lightBg as [number, number, number] },
                });
                y = (doc as any).lastAutoTable.finalY + 6;
            }

            // â”€â”€ Withdrawal History â”€â”€
            sectionHeading(t("dashboard.statement.withdrawalSection"));
            if (data.withdrawals.length === 0) {
                txt(t("dashboard.statement.noWithdrawals"), margin, y, { size: 9, color: [156, 163, 175] });
                y += 8;
            } else {
                const wdRows = data.withdrawals.map((w) => [
                    new Date(w.createdAt).toLocaleDateString(),
                    formatCurrency(w.amount, locale),
                    w.method,
                    (w.accountDetails as any)?.number || "-",
                    t(`dashboard.statement.withdrawStatus.${w.status}` as any, undefined, w.status),
                ]);
                autoTable(doc, {
                    startY: y,
                    head: [[t("dashboard.statement.date"), t("dashboard.statement.amount"), t("dashboard.statement.method"), t("dashboard.statement.account"), t("dashboard.statement.status")]],
                    body: wdRows,
                    margin: { left: margin, right: margin },
                    styles: { fontSize: 7, cellPadding: 1.5 },
                    headStyles: { fillColor: [22, 163, 74] as [number, number, number], textColor: 255, fontStyle: boldFont },
                    alternateRowStyles: { fillColor: lightBg as [number, number, number] },
                });
                y = (doc as any).lastAutoTable.finalY + 6;
            }

            // â”€â”€ Team Summary â”€â”€
            sectionHeading(t("dashboard.statement.teamSection"));
            labelValue(t("dashboard.statement.totalTeam"), `${data.team.totalTeam}`);
            y += 4;

            // â”€â”€ Order Summary â”€â”€
            sectionHeading(t("dashboard.statement.orderSection"));
            labelValue(t("dashboard.statement.totalOrders"), `${data.orders.totalOrders}`);
            labelValue(t("dashboard.statement.totalSpent"), formatCurrency(data.orders.totalSpent, locale));

            // â”€â”€ Footer â”€â”€
            const pageCount = doc.getNumberOfPages();
            for (let i = 1; i <= pageCount; i++) {
                doc.setPage(i);
                doc.setFontSize(7);
                doc.setTextColor(156, 163, 175);
                doc.text(`Page ${i} of ${pageCount}`, pageW - margin, doc.internal.pageSize.getHeight() - 8, { align: "right" });
                doc.text("Bangla Park Limited", margin, doc.internal.pageSize.getHeight() - 8);
            }

            doc.save(`statement-${ac.memberId || ac.id}.pdf`);
        } finally {
            setDownloading(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 size={32} className="animate-spin text-green-700" />
            </div>
        );
    }

    if (!data) return null;

    const ac = data.account;

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">{t("dashboard.statement.heading")}</h1>
                    <p className="text-sm text-gray-500">{t("dashboard.statement.subheading")}</p>
                </div>
                <button
                    onClick={downloadPdf}
                    disabled={downloading}
                    className="btn-primary bg-green-700 hover:bg-green-800 flex items-center gap-2 px-5 py-2.5 text-sm font-bold self-start"
                >
                    {downloading ? (
                        <Loader2 size={16} className="animate-spin" />
                    ) : (
                        <Download size={16} />
                    )}
                    {downloading ? t("dashboard.statement.downloadLoading") : t("dashboard.statement.downloadBtn")}
                </button>
            </div>

            {/* Account Info Card */}
            <div className="card p-5">
                <h3 className="text-sm font-bold text-gray-900 mb-4 pb-2 border-b border-gray-100 flex items-center gap-2">
                    <FileText size={16} className="text-green-700" />
                    {t("dashboard.statement.accountSection")}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
                    <div><span className="text-gray-500 font-semibold">{t("dashboard.statement.memberId")}:</span> <span className="font-bold text-gray-800">{ac.memberId ? `#${ac.memberId}` : "-"}</span></div>
                    <div><span className="text-gray-500 font-semibold">{t("dashboard.statement.name")}:</span> <span className="font-bold text-gray-800">{ac.name}</span></div>
                    <div><span className="text-gray-500 font-semibold">{t("dashboard.statement.email")}:</span> <span className="font-bold text-gray-800">{ac.email}</span></div>
                    <div><span className="text-gray-500 font-semibold">{t("dashboard.statement.phone")}:</span> <span className="font-bold text-gray-800">{ac.phone}</span></div>
                    <div><span className="text-gray-500 font-semibold">{t("dashboard.statement.status")}:</span>
                        <span className={`font-bold ${ac.status === "ACTIVE" ? "text-green-700" : "text-green-600"}`}> {ac.status === "ACTIVE" ? t("dashboard.statement.active") : t("dashboard.statement.inactive")}</span>
                    </div>
                    <div><span className="text-gray-500 font-semibold">{t("dashboard.statement.referralCode")}:</span> <span className="font-bold text-gray-800">{ac.referralCode}</span></div>
                    <div><span className="text-gray-500 font-semibold">{t("dashboard.statement.usedReferralCode")}:</span> <span className="font-bold text-gray-800">{ac.usedReferralCode || t("dashboard.statement.none")}</span></div>
                    <div><span className="text-gray-500 font-semibold">{t("dashboard.statement.joinDate")}:</span> <span className="font-bold text-gray-800">{new Date(ac.createdAt).toLocaleDateString()}</span></div>
                </div>
            </div>

            {/* Wallet Summary */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                {[
                    { label: t("dashboard.statement.totalBalance"), value: ac.walletBalance, icon: Wallet, color: "text-green-700 bg-green-50" },
                    { label: t("dashboard.statement.dailyReward"), value: ac.dailyReward, icon: Gift, color: "text-amber-700 bg-amber-50" },
                    { label: t("dashboard.statement.tierBonus"), value: ac.tierBonus, icon: Award, color: "text-blue-700 bg-blue-50" },
                    { label: t("dashboard.statement.generationIncome"), value: ac.generationIncome, icon: TrendingUp, color: "text-purple-700 bg-purple-50" },
                    { label: t("dashboard.statement.pendingWithdrawal"), value: ac.pendingWithdrawal, icon: ArrowDownToLine, color: "text-orange-700 bg-orange-50" },
                    { label: t("dashboard.statement.withdrawable"), value: ac.withdrawable, icon: Wallet, color: "text-green-700 bg-green-50" },
                ].map((item) => (
                    <div key={item.label} className="card p-3 text-center">
                        <div className={`inline-flex rounded-lg p-2 ${item.color} mb-2`}>
                            <item.icon size={16} />
                        </div>
                        <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-wide">{item.label}</p>
                        <p className="text-sm font-extrabold text-gray-800">{formatCurrency(item.value, locale)}</p>
                    </div>
                ))}
            </div>

            {/* Transaction History */}
            <div className="card p-5">
                <h3 className="text-sm font-bold text-gray-900 mb-4 pb-2 border-b border-gray-100 flex items-center gap-2">
                    <Wallet size={16} className="text-green-700" />
                    {t("dashboard.statement.transactionSection")}
                </h3>
                {data.transactions.length === 0 ? (
                    <p className="text-sm text-gray-400 py-4 text-center">{t("dashboard.statement.noTransactions")}</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                            <thead>
                                <tr className="bg-green-700 text-white">
                                    <th className="text-left px-3 py-2 font-bold">{t("dashboard.statement.date")}</th>
                                    <th className="text-left px-3 py-2 font-bold">{t("dashboard.statement.type")}</th>
                                    <th className="text-left px-3 py-2 font-bold">{t("dashboard.statement.description")}</th>
                                    <th className="text-right px-3 py-2 font-bold">{t("dashboard.statement.amount")}</th>
                                    <th className="text-right px-3 py-2 font-bold">{t("dashboard.statement.balanceAfter")}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.transactions.map((tx, i) => (
                                    <tr key={tx.id} className={i % 2 === 0 ? "bg-green-50/30" : ""}>
                                        <td className="px-3 py-2 text-gray-600">{new Date(tx.createdAt).toLocaleDateString()}</td>
                                        <td className="px-3 py-2 font-semibold text-gray-800">
                                            {t(`dashboard.statement.transactionType.${tx.type}` as any, undefined, tx.type)}
                                        </td>
                                        <td className="px-3 py-2 text-gray-500 max-w-[200px] truncate">
                                            {(tx.benefitCategory === "BASE" ? `${t("dashboard.statement.dailyReward")} - ` : tx.benefitCategory === "TIER" ? `${t("dashboard.statement.tierBonus")} - ` : "")}{tx.description}
                                        </td>
                                        <td className={`px-3 py-2 text-right font-bold ${Number(tx.amount) >= 0 ? "text-green-700" : "text-green-600"}`}>
                                            {formatCurrency(tx.amount, locale)}
                                        </td>
                                        <td className="px-3 py-2 text-right font-semibold text-gray-800">{formatCurrency(tx.balanceAfter, locale)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Withdrawal History */}
            <div className="card p-5">
                <h3 className="text-sm font-bold text-gray-900 mb-4 pb-2 border-b border-gray-100 flex items-center gap-2">
                    <ArrowDownToLine size={16} className="text-green-700" />
                    {t("dashboard.statement.withdrawalSection")}
                </h3>
                {data.withdrawals.length === 0 ? (
                    <p className="text-sm text-gray-400 py-4 text-center">{t("dashboard.statement.noWithdrawals")}</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                            <thead>
                                <tr className="bg-green-700 text-white">
                                    <th className="text-left px-3 py-2 font-bold">{t("dashboard.statement.date")}</th>
                                    <th className="text-right px-3 py-2 font-bold">{t("dashboard.statement.amount")}</th>
                                    <th className="text-left px-3 py-2 font-bold">{t("dashboard.statement.method")}</th>
                                    <th className="text-left px-3 py-2 font-bold">{t("dashboard.statement.account")}</th>
                                    <th className="text-left px-3 py-2 font-bold">{t("dashboard.statement.status")}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.withdrawals.map((w, i) => (
                                    <tr key={w.id} className={i % 2 === 0 ? "bg-green-50/30" : ""}>
                                        <td className="px-3 py-2 text-gray-600">{new Date(w.createdAt).toLocaleDateString()}</td>
                                        <td className="px-3 py-2 text-right font-bold text-gray-800">{formatCurrency(w.amount, locale)}</td>
                                        <td className="px-3 py-2 font-semibold text-gray-800">{w.method}</td>
                                        <td className="px-3 py-2 text-gray-500">{(w.accountDetails as any)?.number || "-"}</td>
                                        <td className="px-3 py-2">
                                            <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                                w.status === "APPROVED" ? "bg-green-100 text-green-800" :
                                                w.status === "REJECTED" ? "bg-green-100 text-green-800" :
                                                "bg-amber-100 text-amber-800"
                                            }`}>
                                                {t(`dashboard.statement.withdrawStatus.${w.status}` as any, undefined, w.status)}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Team & Order Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="card p-5 flex items-center gap-4">
                    <div className="rounded-lg bg-green-50 p-3 text-green-700">
                        <Users size={24} />
                    </div>
                    <div>
                        <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide">{t("dashboard.statement.totalTeam")}</p>
                        <p className="text-xl font-extrabold text-gray-800">{data.team.totalTeam}</p>
                    </div>
                </div>
                <div className="card p-5 flex items-center gap-4">
                    <div className="rounded-lg bg-purple-50 p-3 text-purple-700">
                        <ShoppingBag size={24} />
                    </div>
                    <div>
                        <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide">{t("dashboard.statement.totalOrders")}</p>
                        <p className="text-xl font-extrabold text-gray-800">{data.orders.totalOrders} ({formatCurrency(data.orders.totalSpent, locale)})</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
