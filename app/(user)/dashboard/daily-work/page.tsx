"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Download, Copy, Check, Loader2, ImageIcon } from "lucide-react";
import { bannersApi, type Banner } from "@/lib/api/banners";
import { useLocale } from "@/lib/i18n";

export default function DailyWorkPage() {
    const { t } = useLocale();
    const [copied, setCopied] = useState(false);
    const [userLink, setUserLink] = useState("");

    const { data: dailyWork, isLoading } = useQuery<Banner | null>({
        queryKey: ["daily-work"],
        queryFn: () => bannersApi.findDailyWork(),
    });

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(userLink);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            const ta = document.createElement("textarea");
            ta.value = userLink;
            document.body.appendChild(ta);
            ta.select();
            document.execCommand("copy");
            document.body.removeChild(ta);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const handleDownload = () => {
        if (!dailyWork) return;
        const link = document.createElement("a");
        link.href = dailyWork.imageUrl;
        link.download = "daily-work.jpg";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (isLoading) {
        return (
            <div className="flex justify-center py-20">
                <Loader2 className="animate-spin" size={32} />
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-800">{t("nav.dailyWork")}</h1>
                <p className="text-sm text-gray-500">{t("dashboard.dailyWork.description")}</p>
            </div>

            {!dailyWork ? (
                <div className="card p-12 bg-white flex flex-col items-center gap-3 text-gray-400">
                    <ImageIcon size={48} />
                    <p className="text-sm">{t("dashboard.dailyWork.noImage")}</p>
                </div>
            ) : (
                <>
                    <div className="card bg-white overflow-hidden">
                        <img
                            src={dailyWork.imageUrl}
                            alt="Daily Work"
                            className="w-full h-auto object-contain"
                        />
                    </div>

                    <div className="card p-5 bg-white space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                {t("dashboard.dailyWork.yourLink")}
                            </label>
                            <input
                                type="text"
                                value={userLink}
                                onChange={(e) => setUserLink(e.target.value)}
                                className="input w-full"
                            />
                        </div>

                        <div className="flex gap-3">
                            <button onClick={handleDownload} className="btn-primary flex items-center gap-2">
                                <Download size={16} />
                                {t("dashboard.dailyWork.download")}
                            </button>
                            <button
                                onClick={handleCopy}
                                className="btn-outline-primary flex items-center gap-2"
                            >
                                {copied ? <Check size={16} /> : <Copy size={16} />}
                                {copied ? t("dashboard.dailyWork.copied") : t("dashboard.dailyWork.copyLink")}
                            </button>
                        </div>

                        <p className="text-xs text-gray-400">{t("dashboard.dailyWork.shareHint")}</p>
                    </div>
                </>
            )}
        </div>
    );
}
