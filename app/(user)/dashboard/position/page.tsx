"use client";

import { useLocale } from "@/lib/i18n";
import { Award, Star } from "lucide-react";

export default function PositionPage() {
    const { t } = useLocale();

    const positions = [
        { id: 1, name: "Executive Officer" },
        { id: 2, name: "Executive Manager" },
        { id: 3, name: "Marketing Manager" },
        { id: 4, name: "District Manager" },
        { id: 5, name: "Regional Manager" },
        { id: 6, name: "Executive Vice President" },
        { id: 7, name: "Additional General Manager" },
        { id: 8, name: "Divisional General Manager" },
        { id: 9, name: "General Manager" },
        { id: 10, name: "Executive Director" }
    ];

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                    <Award className="text-green-700" size={28} />
                    {t("nav.position")}
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                    Your position details and achievements will be displayed here as you unlock new tiers.
                </p>
            </div>

            <div className="card bg-white p-6 space-y-4">
                <div className="border-b border-gray-100 pb-3 flex items-center justify-between">
                    <h2 className="text-sm font-bold text-gray-800">Available Rankings</h2>
                    <span className="text-[10px] bg-green-50 text-green-700 font-semibold px-2 py-0.5 rounded">
                        10 Levels
                    </span>
                </div>

                <div className="divide-y divide-gray-100">
                    {positions.map((pos) => (
                        <div key={pos.id} className="flex items-center justify-between py-3.5 first:pt-0 last:pb-0 group">
                            <div className="flex items-center gap-3">
                                <div className="h-8 w-8 rounded-full bg-green-50 text-green-700 flex items-center justify-center font-bold text-xs ring-2 ring-green-100">
                                    {pos.id}
                                </div>
                                <span className="text-sm font-medium text-gray-700 group-hover:text-green-800 transition-colors">
                                    {pos.name}
                                </span>
                            </div>
                            <div className="flex items-center text-xs text-gray-400 gap-1">
                                <Star size={14} className="text-gray-300" />
                                Locked
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
