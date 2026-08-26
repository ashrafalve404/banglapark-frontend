"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Users, Copy, Check, Search, Phone, Mail, Filter } from "lucide-react";
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
    const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "INACTIVE">("ALL");
    const [scope, setScope] = useState<"direct" | "all_levels">("direct");

    const { data: stats, isLoading: statsLoading } = useQuery({
        queryKey: ["referral-stats"],
        queryFn: () => referralApi.teamStats(),
        refetchOnWindowFocus: true,
    });

    const { data: teamData, isLoading: teamLoading } = useQuery({
        queryKey: ["direct-team", page, statusFilter, scope],
        queryFn: () =>
            referralApi.directTeam({
                page,
                limit: 50,
                status: statusFilter !== "ALL" ? statusFilter : undefined,
                scope,
            }),
    });

    const referrals = teamData?.data ?? teamData?.children ?? [];
    const total = teamData?.total ?? 0;
    const totalPages = Math.ceil(total / 50) || 1;

    const referralCode = user?.referralCode ?? "";
    const referralLink = typeof window !== "undefined"
        ? `${window.location.origin}/register?ref=${referralCode}`
        : `https://banglapark.com/register?ref=${referralCode}`;

    const handleCopyLink = () => {
        navigator.clipboard.writeText(referralLink);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleCardClick = (status: "ALL" | "ACTIVE" | "INACTIVE") => {
        setStatusFilter(status);
        setPage(1);
    };

    const filteredReferrals = referrals.filter(
        (item: any) =>
            item.name?.toLowerCase().includes(search.toLowerCase()) ||
            item.phone?.includes(search) ||
            item.email?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="space-y-6 max-w-6xl mx-auto">
            <div>
                <h1 className="text-2xl font-bold text-slate-900">{t("referrals.heading")}</h1>
                <p className="text-sm text-slate-500">{t("referrals.subheading")}</p>
            </div>

            {/* Referral Link & Code Box */}
            <div className="card p-6 bg-white space-y-4 border border-slate-200 shadow-xs">
                <h2 className="text-base font-bold text-slate-900">{t("referrals.referralLink.heading")}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                        <span className="text-xs text-slate-500 font-semibold uppercase block">{t("referrals.referralLink.linkLabel")}</span>
                        <div className="flex border border-slate-250 rounded-lg overflow-hidden bg-slate-50 w-full">
                            <input type="text" readOnly className="flex-1 bg-transparent px-3 py-2 text-xs font-semibold text-slate-600 outline-none text-left select-all" value={referralLink} />
                            <button onClick={handleCopyLink} className="bg-red-700 text-white px-3 flex items-center justify-center gap-1.5 hover:bg-red-800 transition-colors text-xs font-semibold cursor-pointer">
                                {copied ? <Check size={14} /> : <Copy size={14} />} Copy
                            </button>
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <span className="text-xs text-slate-500 font-semibold uppercase block">{t("referrals.referralLink.codeLabel")}</span>
                        <div className="border border-slate-250 rounded-lg px-3 py-2 bg-slate-50 text-sm font-bold text-red-900 tracking-wider flex items-center justify-between">
                            <span>{referralCode}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Interactive Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Total Team Card */}
                <button
                    type="button"
                    onClick={() => handleCardClick("ALL")}
                    className={`card p-5 text-center transition-all cursor-pointer border-l-4 border-l-blue-600 text-left sm:text-center ${
                        statusFilter === "ALL"
                            ? "bg-blue-50/50 ring-2 ring-blue-600 shadow-md"
                            : "bg-white hover:bg-slate-50 hover:shadow-xs"
                    }`}
                >
                    <span className="text-xs text-slate-500 font-bold block mb-1">{t("referrals.stats.total")}</span>
                    <span className="text-3xl font-extrabold text-blue-900 block">
                        {statsLoading ? "..." : stats?.totalTeam ?? 0}
                    </span>
                    <span className="text-[10px] font-semibold text-blue-600 mt-1 block">
                        {locale === "bn" ? "সকল মেম্বার তালিকা দেখুন ➔" : "View all members ➔"}
                    </span>
                </button>

                {/* Active Members Card */}
                <button
                    type="button"
                    onClick={() => handleCardClick("ACTIVE")}
                    className={`card p-5 text-center transition-all cursor-pointer border-l-4 border-l-emerald-600 text-left sm:text-center ${
                        statusFilter === "ACTIVE"
                            ? "bg-emerald-50/50 ring-2 ring-emerald-600 shadow-md"
                            : "bg-white hover:bg-slate-50 hover:shadow-xs"
                    }`}
                >
                    <span className="text-xs text-emerald-700 font-bold block mb-1">{t("referrals.stats.active")}</span>
                    <span className="text-3xl font-extrabold text-emerald-800 block">
                        {statsLoading ? "..." : stats?.activeTeam ?? 0}
                    </span>
                    <span className="text-[10px] font-semibold text-emerald-600 mt-1 block">
                        {locale === "bn" ? "সক্রিয় মেম্বার তালিকা দেখুন ➔" : "View active members ➔"}
                    </span>
                </button>

                {/* Inactive Members Card */}
                <button
                    type="button"
                    onClick={() => handleCardClick("INACTIVE")}
                    className={`card p-5 text-center transition-all cursor-pointer border-l-4 border-l-red-500 text-left sm:text-center ${
                        statusFilter === "INACTIVE"
                            ? "bg-red-50/60 ring-2 ring-red-500 shadow-md"
                            : "bg-white hover:bg-slate-50 hover:shadow-xs"
                    }`}
                >
                    <span className="text-xs text-red-600 font-bold block mb-1">{t("referrals.stats.inactive")}</span>
                    <span className="text-3xl font-extrabold text-red-700 block">
                        {statsLoading ? "..." : stats?.inactiveTeam ?? 0}
                    </span>
                    <span className="text-[10px] font-semibold text-red-600 mt-1 block">
                        {locale === "bn" ? "নিষ্ক্রিয় মেম্বার তালিকা দেখুন ➔" : "View inactive members ➔"}
                    </span>
                </button>
            </div>

            {/* Team Members List Table */}
            <div className="card overflow-hidden bg-white border border-slate-200 rounded-2xl shadow-xs">
                {/* Table Header & Search & Filter Pills */}
                <div className="p-4 sm:p-5 border-b border-slate-100 bg-white space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                            <h3 className="text-base font-bold text-slate-900">
                                {statusFilter === "INACTIVE" ? (
                                    <span className="flex items-center gap-2 text-red-700">
                                        {locale === "bn" ? "নিষ্ক্রিয় মেম্বার তালিকা" : "Inactive Members List"}
                                        <span className="bg-red-100 text-red-800 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">INACTIVE</span>
                                    </span>
                                ) : statusFilter === "ACTIVE" ? (
                                    <span className="flex items-center gap-2 text-emerald-800">
                                        {locale === "bn" ? "সক্রিয় মেম্বার তালিকা" : "Active Members List"}
                                        <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">ACTIVE</span>
                                    </span>
                                ) : (
                                    <span>{t("referrals.table.heading")}</span>
                                )}
                            </h3>
                        </div>

                        <div className="relative w-full sm:w-64">
                            <input
                                type="text"
                                className="input py-1.5 pl-9 pr-3 text-xs w-full"
                                placeholder={t("referrals.table.searchPlaceholder")}
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        </div>
                    </div>

                    {/* Filter Pills */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
                        <div className="flex items-center gap-1.5">
                            <span className="text-[11px] font-bold text-slate-500 mr-1 flex items-center gap-1">
                                <Filter size={12} /> {locale === "bn" ? "ফিল্টার:" : "Filter:"}
                            </span>
                            <button
                                type="button"
                                onClick={() => handleCardClick("ALL")}
                                className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                                    statusFilter === "ALL" ? "bg-slate-800 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                                }`}
                            >
                                {locale === "bn" ? "সকল মেম্বার" : "All Members"} ({stats?.totalTeam ?? 0})
                            </button>
                            <button
                                type="button"
                                onClick={() => handleCardClick("ACTIVE")}
                                className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                                    statusFilter === "ACTIVE" ? "bg-emerald-600 text-white" : "bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
                                }`}
                            >
                                {locale === "bn" ? "সক্রিয় মেম্বার" : "Active"} ({stats?.activeTeam ?? 0})
                            </button>
                            <button
                                type="button"
                                onClick={() => handleCardClick("INACTIVE")}
                                className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                                    statusFilter === "INACTIVE" ? "bg-red-600 text-white" : "bg-red-50 text-red-700 hover:bg-red-100"
                                }`}
                            >
                                {locale === "bn" ? "নিষ্ক্রিয় মেম্বার" : "Inactive"} ({stats?.inactiveTeam ?? 0})
                            </button>
                        </div>

                        {/* Scope Toggle: All Levels vs Direct Only */}
                        <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg text-[11px] font-bold">
                            <button
                                type="button"
                                onClick={() => { setScope("all_levels"); setPage(1); }}
                                className={`px-2 py-0.5 rounded-md transition-all cursor-pointer ${scope === "all_levels" ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-800"}`}
                            >
                                {locale === "bn" ? "সম্পূর্ণ টিম" : "All Levels"}
                            </button>
                            <button
                                type="button"
                                onClick={() => { setScope("direct"); setPage(1); }}
                                className={`px-2 py-0.5 rounded-md transition-all cursor-pointer ${scope === "direct" ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-800"}`}
                            >
                                {locale === "bn" ? "সরাসরি রেফারেল" : "Direct Only"}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Table Content */}
                {teamLoading ? (
                    <div className="py-16 text-center text-slate-400 font-medium">{t("referrals.table.loading")}</div>
                ) : filteredReferrals.length === 0 ? (
                    <div className="py-16 text-center text-slate-400 space-y-1">
                        <Users size={32} className="mx-auto text-slate-300 mb-2" />
                        <p className="text-sm font-semibold">
                            {statusFilter === "INACTIVE"
                                ? (locale === "bn" ? "কোনো নিষ্ক্রিয় মেম্বার পাওয়া যায়নি।" : "No inactive team members found.")
                                : statusFilter === "ACTIVE"
                                ? (locale === "bn" ? "কোনো সক্রিয় মেম্বার পাওয়া যায়নি।" : "No active team members found.")
                                : t("referrals.table.empty")}
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-xs sm:text-sm">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[11px] tracking-wider">
                                    <th className="p-3.5 sm:p-4">{locale === "bn" ? "নাম" : "Name"}</th>
                                    <th className="p-3.5 sm:p-4">{locale === "bn" ? "ফোন নম্বর" : "Phone Number"}</th>
                                    <th className="p-3.5 sm:p-4">{locale === "bn" ? "ইমেইল" : "Email"}</th>
                                    <th className="p-3.5 sm:p-4">{locale === "bn" ? "যোগদানের তারিখ" : "Join Date"}</th>
                                    <th className="p-3.5 sm:p-4 text-center">{locale === "bn" ? "অবস্থা" : "Status"}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 bg-white">
                                {filteredReferrals.map((member: any) => (
                                    <tr key={member.id} className="hover:bg-slate-50/80 transition-colors">
                                        <td className="p-3.5 sm:p-4 font-bold text-slate-900">
                                            {member.name}
                                        </td>
                                        <td className="p-3.5 sm:p-4 font-mono font-bold text-slate-800">
                                            {member.phone || "N/A"}
                                        </td>
                                        <td className="p-3.5 sm:p-4 text-slate-600">
                                            {member.email || "N/A"}
                                        </td>
                                        <td className="p-3.5 sm:p-4 text-xs text-slate-500 whitespace-nowrap">
                                            {formatDate(member.createdAt, locale)}
                                        </td>
                                        <td className="p-3.5 sm:p-4 text-center whitespace-nowrap">
                                            <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                                                member.status === "ACTIVE"
                                                    ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                                                    : "bg-red-50 text-red-700 border border-red-200"
                                            }`}>
                                                {member.status === "ACTIVE" ? (locale === "bn" ? "সক্রিয়" : "ACTIVE") : (locale === "bn" ? "নিষ্ক্রিয়" : "INACTIVE")}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                        <button disabled={page === 1} onClick={() => setPage(page - 1)} className="btn-secondary py-1 px-3 text-xs cursor-pointer disabled:opacity-50">{t("referrals.prev")}</button>
                        <span className="text-xs text-slate-500 font-semibold">{page} / {totalPages} {t("referrals.page")}</span>
                        <button disabled={page === totalPages} onClick={() => setPage(page + 1)} className="btn-secondary py-1 px-3 text-xs cursor-pointer disabled:opacity-50">{t("referrals.next")}</button>
                    </div>
                )}
            </div>
        </div>
    );
}
