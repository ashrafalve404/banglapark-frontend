"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { travelApi } from "@/lib/api/travel";
import {
    Plane, Plus, Trash2, Save, ChevronLeft, ChevronRight,
    MapPin, Users, CheckCircle2, XCircle, Loader2, Info
} from "lucide-react";

const TIER_CONFIG = [
    {
        tierNumber: 1,
        minMembers: 500,
        label: "Tier 1 — Bronze",
        badgeColor: "bg-amber-100 text-amber-800 border-amber-200",
        iconBg: "bg-amber-50",
        iconColor: "text-amber-600",
        borderColor: "border-amber-200",
        headerBg: "bg-gradient-to-r from-amber-50 to-orange-50",
    },
    {
        tierNumber: 2,
        minMembers: 5000,
        label: "Tier 2 — Silver",
        badgeColor: "bg-slate-100 text-slate-700 border-slate-200",
        iconBg: "bg-slate-50",
        iconColor: "text-slate-500",
        borderColor: "border-slate-200",
        headerBg: "bg-gradient-to-r from-slate-50 to-gray-50",
    },
    {
        tierNumber: 3,
        minMembers: 20000,
        label: "Tier 3 — Gold",
        badgeColor: "bg-yellow-100 text-yellow-800 border-yellow-200",
        iconBg: "bg-yellow-50",
        iconColor: "text-yellow-600",
        borderColor: "border-yellow-200",
        headerBg: "bg-gradient-to-r from-yellow-50 to-amber-50",
    },
];

const MONTHS = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
];

export default function AdminTravelPage() {
    const now = new Date();
    const [month, setMonth] = useState(now.getMonth() + 1);
    const [year, setYear] = useState(now.getFullYear());
    const [editingTier, setEditingTier] = useState<number | null>(null);
    const [destinationInputs, setDestinationInputs] = useState<Record<number, string[]>>({});
    const [newDest, setNewDest] = useState<Record<number, string>>({});
    const [successMsg, setSuccessMsg] = useState<string | null>(null);

    const queryClient = useQueryClient();

    const { data: tiers = [], isLoading } = useQuery({
        queryKey: ["admin-travel-tiers", month, year],
        queryFn: () => travelApi.adminGetTiers(month, year),
    });

    const upsertMutation = useMutation({
        mutationFn: (payload: { tierNumber: number; destinations: string[]; month: number; year: number }) =>
            travelApi.adminUpsertTier(payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin-travel-tiers"] });
            setEditingTier(null);
            setSuccessMsg("Destinations saved successfully!");
            setTimeout(() => setSuccessMsg(null), 3500);
        },
    });

    const clearMutation = useMutation({
        mutationFn: ({ tierNumber }: { tierNumber: number }) =>
            travelApi.adminClearTier(tierNumber, month, year),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin-travel-tiers"] });
            setSuccessMsg("Tier cleared.");
            setTimeout(() => setSuccessMsg(null), 3500);
        },
    });

    const startEdit = (tierNumber: number, currentDests: string[]) => {
        setEditingTier(tierNumber);
        setDestinationInputs((prev) => ({ ...prev, [tierNumber]: [...currentDests] }));
        setNewDest((prev) => ({ ...prev, [tierNumber]: "" }));
    };

    const addDest = (tierNumber: number) => {
        const val = (newDest[tierNumber] ?? "").trim();
        if (!val) return;
        setDestinationInputs((prev) => ({
            ...prev,
            [tierNumber]: [...(prev[tierNumber] ?? []), val],
        }));
        setNewDest((prev) => ({ ...prev, [tierNumber]: "" }));
    };

    const removeDest = (tierNumber: number, idx: number) => {
        setDestinationInputs((prev) => ({
            ...prev,
            [tierNumber]: (prev[tierNumber] ?? []).filter((_, i) => i !== idx),
        }));
    };

    const saveEdit = (tierNumber: number) => {
        upsertMutation.mutate({
            tierNumber,
            destinations: destinationInputs[tierNumber] ?? [],
            month,
            year,
        });
    };

    const prevMonth = () => {
        if (month === 1) { setMonth(12); setYear((y) => y - 1); }
        else setMonth((m) => m - 1);
    };

    const nextMonth = () => {
        if (month === 12) { setMonth(1); setYear((y) => y + 1); }
        else setMonth((m) => m + 1);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 p-4 md:p-8">
            {/* Header */}
            <div className="mb-8">
                <div className="flex items-center gap-3 mb-2">
                    <div className="p-2.5 rounded-xl bg-indigo-600 shadow-lg shadow-indigo-200">
                        <Plane size={22} className="text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800">Travel Management</h1>
                        <p className="text-sm text-slate-500 mt-0.5">
                            Set monthly travel reward destinations for each eligibility tier
                        </p>
                    </div>
                </div>
            </div>

            {/* Success Toast */}
            {successMsg && (
                <div className="mb-6 flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl text-sm font-medium animate-pulse">
                    <CheckCircle2 size={16} />
                    {successMsg}
                </div>
            )}

            {/* Month/Year Selector */}
            <div className="mb-8 flex items-center justify-center gap-4">
                <button
                    onClick={prevMonth}
                    className="p-2 rounded-full bg-white border border-slate-200 shadow-sm hover:bg-slate-50 transition-colors"
                >
                    <ChevronLeft size={18} className="text-slate-600" />
                </button>
                <div className="bg-white border border-slate-200 rounded-2xl px-8 py-3 shadow-sm text-center min-w-[180px]">
                    <p className="text-lg font-bold text-slate-800">{MONTHS[month - 1]}</p>
                    <p className="text-sm text-slate-500">{year}</p>
                </div>
                <button
                    onClick={nextMonth}
                    className="p-2 rounded-full bg-white border border-slate-200 shadow-sm hover:bg-slate-50 transition-colors"
                >
                    <ChevronRight size={18} className="text-slate-600" />
                </button>
            </div>

            {/* Info Box */}
            <div className="mb-6 flex gap-2 items-start bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 text-sm text-blue-700">
                <Info size={15} className="mt-0.5 shrink-0" />
                <span>
                    Eligibility is based on <strong>direct referrals</strong> who activated their account for the first time this month.
                    Set destinations below for each tier. Users who qualify will see their rewards in their dashboard.
                </span>
            </div>

            {/* Tiers */}
            {isLoading ? (
                <div className="flex justify-center py-20">
                    <Loader2 size={32} className="animate-spin text-indigo-500" />
                </div>
            ) : (
                <div className="grid gap-6 md:grid-cols-3">
                    {TIER_CONFIG.map((config) => {
                        const tierData = tiers.find((t) => t.tierNumber === config.tierNumber);
                        const currentDests = tierData?.destinations ?? [];
                        const isEditing = editingTier === config.tierNumber;
                        const editDests = destinationInputs[config.tierNumber] ?? currentDests;

                        return (
                            <div
                                key={config.tierNumber}
                                className={`bg-white rounded-2xl border ${config.borderColor} shadow-sm overflow-hidden`}
                            >
                                {/* Card header */}
                                <div className={`${config.headerBg} px-5 py-4 border-b ${config.borderColor}`}>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className={`p-2 rounded-lg ${config.iconBg}`}>
                                                <Plane size={18} className={config.iconColor} />
                                            </div>
                                            <div>
                                                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                                                    {config.label}
                                                </p>
                                                <div className="flex items-center gap-1.5 mt-0.5">
                                                    <Users size={13} className="text-slate-400" />
                                                    <span className="text-sm font-bold text-slate-700">
                                                        {config.minMembers.toLocaleString()}+ members/month
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        {currentDests.length > 0 ? (
                                            <span className="flex items-center gap-1 text-xs font-medium text-green-600 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full">
                                                <CheckCircle2 size={11} /> Active
                                            </span>
                                        ) : (
                                            <span className="flex items-center gap-1 text-xs font-medium text-slate-400 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-full">
                                                <XCircle size={11} /> Empty
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Card body */}
                                <div className="p-5">
                                    {!isEditing ? (
                                        <>
                                            {currentDests.length === 0 ? (
                                                <p className="text-sm text-slate-400 italic mb-4">
                                                    No destinations set for this month.
                                                </p>
                                            ) : (
                                                <ul className="space-y-2 mb-4">
                                                    {currentDests.map((d, i) => (
                                                        <li
                                                            key={i}
                                                            className="flex items-center gap-2 text-sm text-slate-700"
                                                        >
                                                            <MapPin size={13} className={config.iconColor} />
                                                            {d}
                                                        </li>
                                                    ))}
                                                </ul>
                                            )}
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => startEdit(config.tierNumber, currentDests)}
                                                    className="flex-1 flex items-center justify-center gap-1.5 text-sm font-medium bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-2 rounded-lg transition-colors"
                                                >
                                                    <Plus size={14} /> Edit Destinations
                                                </button>
                                                {currentDests.length > 0 && (
                                                    <button
                                                        onClick={() => clearMutation.mutate({ tierNumber: config.tierNumber })}
                                                        disabled={clearMutation.isPending}
                                                        className="p-2 rounded-lg text-red-500 hover:bg-red-50 border border-red-100 transition-colors"
                                                    >
                                                        {clearMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                                                    </button>
                                                )}
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            {/* Destination pills editor */}
                                            <div className="space-y-2 mb-3">
                                                {editDests.map((d, i) => (
                                                    <div
                                                        key={i}
                                                        className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5"
                                                    >
                                                        <span className="text-sm text-slate-700 flex items-center gap-1.5">
                                                            <MapPin size={12} className={config.iconColor} /> {d}
                                                        </span>
                                                        <button
                                                            onClick={() => removeDest(config.tierNumber, i)}
                                                            className="text-red-400 hover:text-red-600"
                                                        >
                                                            <XCircle size={14} />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                            {/* Add new destination */}
                                            <div className="flex gap-2 mb-4">
                                                <input
                                                    type="text"
                                                    value={newDest[config.tierNumber] ?? ""}
                                                    onChange={(e) =>
                                                        setNewDest((prev) => ({
                                                            ...prev,
                                                            [config.tierNumber]: e.target.value,
                                                        }))
                                                    }
                                                    onKeyDown={(e) => e.key === "Enter" && addDest(config.tierNumber)}
                                                    placeholder="Enter destination name..."
                                                    className="flex-1 text-sm border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
                                                />
                                                <button
                                                    onClick={() => addDest(config.tierNumber)}
                                                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-medium"
                                                >
                                                    <Plus size={14} />
                                                </button>
                                            </div>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => saveEdit(config.tierNumber)}
                                                    disabled={upsertMutation.isPending}
                                                    className="flex-1 flex items-center justify-center gap-1.5 text-sm font-semibold bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg transition-colors"
                                                >
                                                    {upsertMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                                                    Save
                                                </button>
                                                <button
                                                    onClick={() => setEditingTier(null)}
                                                    className="px-3 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-lg text-sm font-medium"
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
