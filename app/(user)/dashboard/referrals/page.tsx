"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Users, Copy, Check, Search } from "lucide-react";
import { referralApi } from "@/lib/api/categories";
import { useAuthStore } from "@/store/auth";
import { formatDate } from "@/lib/utils";
import { useLocale } from "@/lib/i18n";

export default function ReferralsPage() {
    const { user } = useAuthStore();
    const { t, locale } = useLocale();
    const [copied, setCopied] = useState(false);
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState("");

    const { data: stats, isLoading: statsLoading } = useQuery({
        queryKey: ["referral-stats"],
        queryFn: () => referralApi.teamStats(),
        refetchOnWindowFocus: true,
    });

    const { data: teamData, isLoading: teamLoading } = useQuery({
        queryKey: ["direct-team", page],
        queryFn: () => referralApi.directTeam({ page, limit: 10 }),
    });

    const referrals = teamData?.data ?? [];
    const total = teamData?.total ?? 0;
    const totalPages = Math.ceil(total / 10) || 1;

    const referralCode = user?.referralCode ?? "";
    const referralLink = typeof window !== "undefined"
        ? `${window.location.origin}/register?ref=${referralCode}`
        : `https://banglapark.com/register?ref=${referralCode}`;

    const handleCopyLink = () => {
        navigator.clipboard.writeText(referralLink);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const filteredReferrals = referrals.filter(
        (item: any) =>
            item.name.toLowerCase().includes(search.toLowerCase()) ||
            item.phone.includes(search)
    );

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">{t("referrals.heading")}</h1>
                <p className="text-sm text-gray-500">{t("referrals.subheading")}</p>
            </div>

            <div className="card p-6 bg-white space-y-4">
                <h2 className="text-base font-bold text-gray-900">{t("referrals.referralLink.heading")}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                        <span className="text-xs text-gray-500 font-semibold uppercase block">{t("referrals.referralLink.linkLabel")}</span>
                        <div className="flex border border-gray-250 rounded-lg overflow-hidden bg-gray-50 w-full">
                            <input type="text" readOnly className="flex-1 bg-transparent px-3 py-2 text-xs font-semibold text-gray-600 outline-none text-left select-all" value={referralLink} />
                            <button onClick={handleCopyLink} className="bg-green-800 text-white px-3 flex items-center justify-center gap-1.5 hover:bg-green-950 transition-colors text-xs font-semibold">
                                {copied ? <Check size={14} /> : <Copy size={14} />} Copy
                            </button>
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <span className="text-xs text-gray-500 font-semibold uppercase block">{t("referrals.referralLink.codeLabel")}</span>
                        <div className="border border-gray-250 rounded-lg px-3 py-2 bg-gray-50 text-sm font-bold text-green-900 tracking-wider flex items-center justify-between">
                            <span>{referralCode}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="card p-5 text-center">
                    <span className="text-xs text-gray-500 font-bold block mb-1">{t("referrals.stats.total")}</span>
                    <span className="text-3xl font-extrabold text-blue-900">
                        {statsLoading ? "..." : stats?.totalTeam ?? 0}
                    </span>
                </div>

                <div className="card p-5 text-center border-l-4 border-l-green-600">
                    <span className="text-xs text-green-700 font-bold block mb-1">{t("referrals.stats.active")}</span>
                    <span className="text-3xl font-extrabold text-green-800">
                        {statsLoading ? "..." : stats?.activeTeam ?? 0}
                    </span>
                </div>

                <div className="card p-5 text-center border-l-4 border-l-red-500">
                    <span className="text-xs text-green-650 font-bold block mb-1">{t("referrals.stats.inactive")}</span>
                    <span className="text-3xl font-extrabold text-green-750">
                        {statsLoading ? "..." : stats?.inactiveTeam ?? 0}
                    </span>
                </div>
            </div>

            <div className="card overflow-hidden">
                <div className="p-5 border-b border-gray-100 bg-white flex flex-col sm:flex-row items-center justify-between gap-3">
                    <h3 className="text-base font-bold text-gray-800">{t("referrals.table.heading")}</h3>
                    <div className="relative w-full sm:w-60">
                        <input type="text" className="input py-1.5 pl-9 text-xs" placeholder={t("referrals.table.searchPlaceholder")} value={search} onChange={(e) => setSearch(e.target.value)} />
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    </div>
                </div>

                {teamLoading ? (
                    <div className="py-16 text-center text-gray-400">{t("referrals.table.loading")}</div>
                ) : filteredReferrals.length === 0 ? (
                    <div className="py-16 text-center text-gray-400">{t("referrals.table.empty")}</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50 border-b border-gray-150">
                                    <th className="p-4 text-xs font-bold text-gray-650">{t("referrals.table.colName")}</th>
                                    <th className="p-4 text-xs font-bold text-gray-655">{t("referrals.table.colContact")}</th>
                                    <th className="p-4 text-xs font-bold text-gray-660">{t("referrals.table.colDate")}</th>
                                    <th className="p-4 text-xs font-bold text-gray-665 text-center">{t("referrals.table.colStatus")}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 bg-white">
                                {filteredReferrals.map((member: any) => (
                                    <tr key={member.id} className="hover:bg-gray-50/50">
                                        <td className="p-4 text-sm font-semibold text-gray-800">{member.name}</td>
                                        <td className="p-4 text-xs text-gray-500">
                                            <div>{member.phone}</div>
                                            <div className="text-[10px] text-gray-405">{member.email}</div>
                                        </td>
                                        <td className="p-4 text-xs text-gray-550">{formatDate(member.createdAt, locale)}</td>
                                        <td className="p-4 text-center">
                                            <span className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${member.status === "ACTIVE" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-550"
                                                }`}>
                                                {member.status === "ACTIVE" ? t("referrals.table.statusActive") : t("referrals.table.statusInactive")}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {totalPages > 1 && (
                    <div className="p-4 bg-gray-50/50 border-t border-gray-100 flex items-center justify-between">
                        <button disabled={page === 1} onClick={() => setPage(page - 1)} className="btn-secondary py-1 px-3 text-xs">{t("referrals.prev")}</button>
                        <span className="text-xs text-gray-500 font-semibold">{page} / {totalPages} {t("referrals.page")}</span>
                        <button disabled={page === totalPages} onClick={() => setPage(page + 1)} className="btn-secondary py-1 px-3 text-xs">{t("referrals.next")}</button>
                    </div>
                )}
            </div>
        </div>
    );
}
