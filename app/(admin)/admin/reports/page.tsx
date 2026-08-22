"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import {
    Download,
    FileSpreadsheet,
    Loader2,
    Search,
    User as UserIcon,
    Calendar,
    Phone,
    Mail,
    ArrowUpRight,
    ArrowDownLeft,
    Wallet,
    ShoppingBag,
    Gift,
    HelpCircle,
    Printer,
    Sparkles,
    CheckCircle,
    Clock,
    AlertCircle,
    X,
} from "lucide-react";
import { adminApi } from "@/lib/api/admin";
import { ordersApi } from "@/lib/api/orders";
import { reportsApi, type UserStatementResponse, type UserStatementParams } from "@/lib/api/reports";
import { formatCurrency } from "@/lib/utils";
import { useLocale } from "@/lib/i18n";

export default function AdminReportsPage() {
    const { t, locale } = useLocale();

    const [activeTab, setActiveTab] = useState<"statement" | "export">("statement");
    const [downloading, setDownloading] = useState<string | null>(null);

    // Statement Filters
    const [userQuery, setUserQuery] = useState("");
    const [searchSubmitted, setSearchSubmitted] = useState("");
    const [period, setPeriod] = useState<"this_week" | "this_month" | "last_month" | "custom">("this_month");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");

    // User Suggestions Query
    const { data: usersData } = useQuery({
        queryKey: ["admin-users-search", userQuery],
        queryFn: () => adminApi.users({ page: 1, limit: 10 }),
        enabled: activeTab === "statement" && userQuery.length >= 2,
    });

    const suggestions = (usersData?.users || []).filter((u: any) =>
        u.name?.toLowerCase().includes(userQuery.toLowerCase()) ||
        u.phone?.includes(userQuery) ||
        u.email?.toLowerCase().includes(userQuery.toLowerCase())
    );

    // User Statement Report Query
    const {
        data: statementData,
        isLoading: isStatementLoading,
        error: statementError,
    } = useQuery<UserStatementResponse>({
        queryKey: ["admin-user-statement", searchSubmitted, period, startDate, endDate],
        queryFn: () =>
            reportsApi.getUserStatement({
                userQuery: searchSubmitted,
                period,
                startDate: period === "custom" ? startDate : undefined,
                endDate: period === "custom" ? endDate : undefined,
            }),
        enabled: !!searchSubmitted.trim(),
    });

    const handleSearchSubmit = (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (userQuery.trim()) {
            setSearchSubmitted(userQuery.trim());
        }
    };

    const handlePrint = () => {
        window.print();
    };

    // CSV Download Functionality for Export tab
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
        <div className="space-y-6 max-w-6xl mx-auto">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 print:hidden">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">{t("admin.reports.heading")}</h1>
                    <p className="text-sm text-slate-500 mt-0.5">
                        {locale === "bn"
                            ? "নির্দিষ্ট ব্যবহারকারীর সাপ্তাহিক ও মাসিক খরচ, আয় এবং লেনদেন বিবরণী রিপোর্ট দেখুন।"
                            : "View user weekly/monthly expenditure, earnings, and financial statement reports."}
                    </p>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex border-b border-slate-200 gap-6 print:hidden">
                <button
                    onClick={() => setActiveTab("statement")}
                    className={`pb-3 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
                        activeTab === "statement" ? "border-fuchsia-600 text-fuchsia-700" : "border-transparent text-slate-500 hover:text-slate-700"
                    }`}
                >
                    <UserIcon size={16} /> {locale === "bn" ? "ব্যবহারকারী খরচ ও স্টেটমেন্ট রিপোর্ট" : "User Statement & Expenditure"}
                </button>
                <button
                    onClick={() => setActiveTab("export")}
                    className={`pb-3 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
                        activeTab === "export" ? "border-fuchsia-600 text-fuchsia-700" : "border-transparent text-slate-500 hover:text-slate-700"
                    }`}
                >
                    <FileSpreadsheet size={16} /> {locale === "bn" ? "প্ল্যাটফর্ম সিএসভি এক্সপোর্ট (CSV Export)" : "CSV Data Export"}
                </button>
            </div>

            {/* TAB 1: USER STATEMENT REPORT */}
            {activeTab === "statement" && (
                <div className="space-y-6">
                    {/* User Search & Period Filters Box */}
                    <div className="card p-5 bg-white border border-slate-200 space-y-4 print:hidden shadow-xs">
                        <form onSubmit={handleSearchSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                    {locale === "bn" ? "ব্যবহারকারী খুঁজুন (নাম, মোবাইল নম্বর বা ইমেইল) *" : "Search User (Name, Mobile, or Email) *"}
                                </label>
                                <div className="relative">
                                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                    <input
                                        type="text"
                                        placeholder={locale === "bn" ? "যেমন: 018XXXXXXXX বা নাম লিখুন..." : "Search user by name, phone or email..."}
                                        value={userQuery}
                                        onChange={(e) => setUserQuery(e.target.value)}
                                        className="input pl-10 pr-24 w-full text-sm font-medium"
                                        required
                                    />
                                    <button
                                        type="submit"
                                        className="absolute right-1.5 top-1/2 -translate-y-1/2 bg-fuchsia-600 hover:bg-fuchsia-700 text-white font-bold text-xs px-4 py-1.5 rounded-lg shadow-xs transition-colors cursor-pointer"
                                    >
                                        {locale === "bn" ? "রিপোর্ট দেখুন" : "View Report"}
                                    </button>
                                </div>

                                {/* Autocomplete Suggestions */}
                                {userQuery.length >= 2 && suggestions.length > 0 && !searchSubmitted && (
                                    <div className="mt-1 bg-white border border-slate-200 rounded-xl shadow-lg divide-y divide-slate-100 overflow-hidden z-20 relative max-h-48 overflow-y-auto">
                                        {suggestions.map((s: any) => (
                                            <button
                                                key={s.id}
                                                type="button"
                                                onClick={() => {
                                                    setUserQuery(s.phone || s.name);
                                                    setSearchSubmitted(s.id);
                                                }}
                                                className="w-full p-2.5 text-left hover:bg-fuchsia-50/60 transition-colors flex items-center justify-between text-xs cursor-pointer"
                                            >
                                                <span className="font-bold text-slate-800">{s.name}</span>
                                                <span className="font-mono text-slate-500">{s.phone}</span>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Period Filter Selector */}
                            <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-100">
                                <span className="text-xs font-bold text-slate-600 mr-2">{locale === "bn" ? "সময়কাল:" : "Timeframe:"}</span>
                                {[
                                    { key: "this_week", label: locale === "bn" ? "এই সপ্তাহ (7 Days)" : "This Week" },
                                    { key: "this_month", label: locale === "bn" ? "এই মাস (This Month)" : "This Month" },
                                    { key: "last_month", label: locale === "bn" ? "গত মাস (Last Month)" : "Last Month" },
                                    { key: "custom", label: locale === "bn" ? "কাস্টম সময়কাল" : "Custom Range" },
                                ].map((p) => (
                                    <button
                                        key={p.key}
                                        type="button"
                                        onClick={() => setPeriod(p.key as any)}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                            period === p.key ? "bg-fuchsia-600 text-white shadow-xs" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                                        }`}
                                    >
                                        {p.label}
                                    </button>
                                ))}
                            </div>

                            {/* Custom Date Inputs if selected */}
                            {period === "custom" && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                                    <div>
                                        <label className="block text-[11px] font-bold text-slate-600 mb-1">{locale === "bn" ? "শুরু তারিখ:" : "Start Date:"}</label>
                                        <input
                                            type="date"
                                            value={startDate}
                                            onChange={(e) => setStartDate(e.target.value)}
                                            className="input w-full text-xs"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-bold text-slate-600 mb-1">{locale === "bn" ? "শেষ তারিখ:" : "End Date:"}</label>
                                        <input
                                            type="date"
                                            value={endDate}
                                            onChange={(e) => setEndDate(e.target.value)}
                                            className="input w-full text-xs"
                                        />
                                    </div>
                                </div>
                            )}
                        </form>
                    </div>

                    {/* Report Output Content */}
                    {isStatementLoading ? (
                        <div className="flex justify-center py-20">
                            <Loader2 size={32} className="animate-spin text-fuchsia-600" />
                        </div>
                    ) : statementError ? (
                        <div className="card p-8 bg-red-50 border border-red-200 text-red-700 text-center space-y-2 rounded-2xl">
                            <AlertCircle size={36} className="mx-auto text-red-500" />
                            <p className="text-sm font-bold">
                                {(statementError as any)?.response?.data?.message || (statementError as any)?.message || (locale === "bn" ? "ব্যবহারকারী পাওয়া যায়নি।" : "User report not found.")}
                            </p>
                        </div>
                    ) : !statementData ? (
                        <div className="card p-12 bg-white text-center text-slate-400 space-y-3 rounded-2xl border border-slate-100">
                            <Search size={48} className="mx-auto text-slate-300" />
                            <p className="text-sm font-semibold">
                                {locale === "bn" ? "ব্যবহারকারীর ফোন নম্বর বা নাম দিয়ে অনুসন্ধান করে রিপোর্ট দেখুন।" : "Search for a user by phone or name above to generate the statement report."}
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-6 print:space-y-4">
                            {/* Printable Header Bar */}
                            <div className="hidden print:flex items-center justify-between border-b pb-4">
                                <div>
                                    <h1 className="text-xl font-bold">Bangla Park Limited</h1>
                                    <p className="text-xs text-gray-500">User Financial Statement & Expenditure Report</p>
                                </div>
                                <span className="text-xs text-gray-400">{new Date().toLocaleDateString()}</span>
                            </div>

                            {/* User Profile Card */}
                            <div className="card p-5 bg-white border border-slate-200 rounded-2xl shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase ${statementData.user.status === "ACTIVE" ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-600"}`}>
                                            {statementData.user.status}
                                        </span>
                                        <h2 className="text-lg font-extrabold text-slate-900">{statementData.user.name}</h2>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-1">
                                        <span className="flex items-center gap-1">
                                            <Phone size={13} className="text-slate-400" /> <span className="font-bold text-slate-800">{statementData.user.phone}</span>
                                        </span>
                                        {statementData.user.email && (
                                            <span className="flex items-center gap-1">
                                                <Mail size={13} className="text-slate-400" /> {statementData.user.email}
                                            </span>
                                        )}
                                        {statementData.user.sponsor && (
                                            <span className="text-slate-600 font-medium bg-slate-50 px-2 py-0.5 rounded border border-slate-150">
                                                {locale === "bn" ? "রেফারকারী:" : "Sponsor:"} {statementData.user.sponsor.name} ({statementData.user.sponsor.phone})
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 print:hidden">
                                    <button
                                        onClick={handlePrint}
                                        className="btn-outline-primary py-2 px-4 text-xs font-bold flex items-center gap-1.5"
                                    >
                                        <Printer size={15} /> {locale === "bn" ? "প্রিন্ট/PDF প্রিন্ট" : "Print PDF Statement"}
                                    </button>
                                </div>
                            </div>

                            {/* Minimalist Summary Analytics Cards */}
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                <div className="card p-4 bg-white border border-fuchsia-100 rounded-2xl shadow-xs">
                                    <div className="flex items-center justify-between text-fuchsia-600 mb-1">
                                        <span className="text-xs font-bold text-slate-500">{locale === "bn" ? "মোট খরচ (Total Spent)" : "Total Spent"}</span>
                                        <ArrowUpRight size={18} />
                                    </div>
                                    <h3 className="text-lg sm:text-xl font-extrabold text-fuchsia-700">
                                        {formatCurrency(statementData.summary.totalSpent, locale)}
                                    </h3>
                                </div>

                                <div className="card p-4 bg-white border border-emerald-100 rounded-2xl shadow-xs">
                                    <div className="flex items-center justify-between text-emerald-600 mb-1">
                                        <span className="text-xs font-bold text-slate-500">{locale === "bn" ? "মোট আয় (Total Earned)" : "Total Earned"}</span>
                                        <ArrowDownLeft size={18} />
                                    </div>
                                    <h3 className="text-lg sm:text-xl font-extrabold text-emerald-700">
                                        {formatCurrency(statementData.summary.totalEarned, locale)}
                                    </h3>
                                </div>

                                <div className="card p-4 bg-white border border-indigo-100 rounded-2xl shadow-xs">
                                    <div className="flex items-center justify-between text-indigo-600 mb-1">
                                        <span className="text-xs font-bold text-slate-500">{locale === "bn" ? "বর্তমান ওয়ালেট ব্যালেন্স" : "Wallet Balance"}</span>
                                        <Wallet size={18} />
                                    </div>
                                    <h3 className="text-lg sm:text-xl font-extrabold text-indigo-700">
                                        {formatCurrency(statementData.summary.currentWalletBalance, locale)}
                                    </h3>
                                </div>

                                <div className="card p-4 bg-white border border-amber-100 rounded-2xl shadow-xs">
                                    <div className="flex items-center justify-between text-amber-600 mb-1">
                                        <span className="text-xs font-bold text-slate-500">{locale === "bn" ? "মোট উত্তোলনকৃত (Withdrawn)" : "Total Withdrawn"}</span>
                                        <CheckCircle size={18} />
                                    </div>
                                    <h3 className="text-lg sm:text-xl font-extrabold text-amber-700">
                                        {formatCurrency(statementData.summary.totalWithdrawn, locale)}
                                    </h3>
                                </div>
                            </div>

                            {/* Expenditure Breakdown Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="card p-4 bg-white border border-slate-200 rounded-xl space-y-2">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                                            <ShoppingBag size={15} className="text-fuchsia-600" />
                                            {locale === "bn" ? "প্রোডাক্ট ই-কমার্স অর্ডার" : "Product Orders"}
                                        </span>
                                        <span className="text-xs font-extrabold text-fuchsia-700">
                                            {formatCurrency(statementData.expenditureBreakdown.orders.totalAmount, locale)}
                                        </span>
                                    </div>
                                    <p className="text-[11px] text-slate-400">
                                        {statementData.expenditureBreakdown.orders.count} {locale === "bn" ? "টি অর্ডার সম্পন্ন হয়েছে" : "orders placed"}
                                    </p>
                                </div>

                                <div className="card p-4 bg-white border border-slate-200 rounded-xl space-y-2">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                                            <Gift size={15} className="text-purple-600" />
                                            {locale === "bn" ? "গিফট কার্ড ক্রয়" : "Gift Card Purchases"}
                                        </span>
                                        <span className="text-xs font-extrabold text-purple-700">
                                            {formatCurrency(statementData.expenditureBreakdown.giftCards.totalAmount, locale)}
                                        </span>
                                    </div>
                                    <p className="text-[11px] text-slate-400">
                                        {statementData.expenditureBreakdown.giftCards.count} {locale === "bn" ? "টি কার্ড ক্রয় করা হয়েছে" : "cards purchased"}
                                    </p>
                                </div>

                                <div className="card p-4 bg-white border border-slate-200 rounded-xl space-y-2">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                                            <HelpCircle size={15} className="text-indigo-600" />
                                            {locale === "bn" ? "কুইজ এন্ট্রি ফি" : "Quiz Entry Fees"}
                                        </span>
                                        <span className="text-xs font-extrabold text-indigo-700">
                                            {formatCurrency(statementData.expenditureBreakdown.quizzes.totalAmount, locale)}
                                        </span>
                                    </div>
                                    <p className="text-[11px] text-slate-400">
                                        {statementData.expenditureBreakdown.quizzes.count} {locale === "bn" ? "টি কুইজ ক্যাটাগরি সম্পন্ন" : "quiz attempts"}
                                    </p>
                                </div>
                            </div>

                            {/* Itemized Transaction Statement Table */}
                            <div className="card bg-white overflow-hidden shadow-xs border border-slate-200 rounded-2xl">
                                <div className="p-4 bg-slate-50/70 border-b border-slate-200 flex items-center justify-between">
                                    <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                                        <FileSpreadsheet size={16} className="text-fuchsia-600" />
                                        {locale === "bn" ? "বিস্তারিত লেনদেন ও খরচ স্টেটমেন্ট হিস্টোরি" : "Itemized Transaction & Expenditure Ledger"}
                                    </h3>
                                    <span className="text-xs font-semibold text-slate-500">
                                        {statementData.itemizedLogs.length} {locale === "bn" ? "টি লেনদেন" : "records"}
                                    </span>
                                </div>

                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse text-xs">
                                        <thead>
                                            <tr className="bg-slate-100/60 border-b border-slate-200 text-slate-600 uppercase font-bold tracking-wider">
                                                <th className="py-3 px-4">{locale === "bn" ? "তারিখ" : "Date"}</th>
                                                <th className="py-3 px-4">{locale === "bn" ? "ক্যাটাগরি" : "Category"}</th>
                                                <th className="py-3 px-4">{locale === "bn" ? "বিবরণ" : "Description"}</th>
                                                <th className="py-3 px-4">{locale === "bn" ? "পেমেন্ট মাধ্যম" : "Method"}</th>
                                                <th className="py-3 px-4 text-right">{locale === "bn" ? "পরিমাণ (BDT)" : "Amount (BDT)"}</th>
                                                <th className="py-3 px-4 text-center">{locale === "bn" ? "অবস্থা" : "Status"}</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {statementData.itemizedLogs.length === 0 ? (
                                                <tr>
                                                    <td colSpan={6} className="py-8 text-center text-slate-400 font-medium">
                                                        {locale === "bn" ? "এই সময়কালে কোনো লেনদেন পাওয়া যায়নি।" : "No financial transactions found for this period."}
                                                    </td>
                                                </tr>
                                            ) : (
                                                statementData.itemizedLogs.map((log) => (
                                                    <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                                                        <td className="py-3 px-4 text-slate-500 font-medium whitespace-nowrap">
                                                            {new Date(log.date).toLocaleDateString(locale === "bn" ? "bn-BD" : "en-US", {
                                                                month: "short",
                                                                day: "numeric",
                                                                year: "numeric",
                                                            })}
                                                        </td>
                                                        <td className="py-3 px-4 font-bold text-slate-800">
                                                            {log.category}
                                                        </td>
                                                        <td className="py-3 px-4 text-slate-600 max-w-xs truncate">
                                                            {log.description}
                                                        </td>
                                                        <td className="py-3 px-4">
                                                            <span className="text-[10px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded uppercase">
                                                                {log.paymentMethod}
                                                            </span>
                                                        </td>
                                                        <td className="py-3 px-4 text-right font-extrabold">
                                                            <span className={log.type === "DEBIT" ? "text-fuchsia-700" : "text-emerald-700"}>
                                                                {log.type === "DEBIT" ? "-" : "+"}{formatCurrency(log.amount, locale)}
                                                            </span>
                                                        </td>
                                                        <td className="py-3 px-4 text-center">
                                                            <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                                                log.status === "COMPLETED" || log.status === "DELIVERED" || log.status === "APPROVED"
                                                                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                                                    : log.status === "PENDING"
                                                                    ? "bg-amber-50 text-amber-800 border border-amber-200"
                                                                    : "bg-slate-100 text-slate-600"
                                                            }`}>
                                                                {log.status}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* TAB 2: PLATFORM CSV EXPORT */}
            {activeTab === "export" && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="card p-6 bg-white space-y-4 md:col-span-2 shadow-xs">
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
                                <div key={btn.type} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border border-slate-150 bg-slate-50/50 hover:bg-slate-50 transition-colors">
                                    <div>
                                        <h4 className="text-xs font-bold text-slate-800">{btn.title}</h4>
                                        <p className="text-[10px] text-gray-500 mt-0.5">{btn.desc}</p>
                                    </div>
                                    <button
                                        onClick={() => downloadCSV(btn.type as any)}
                                        disabled={downloading !== null}
                                        className="btn-primary py-2 px-4 text-xs font-bold flex items-center gap-1.5 whitespace-nowrap shadow-xs cursor-pointer"
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
            )}
        </div>
    );
}
