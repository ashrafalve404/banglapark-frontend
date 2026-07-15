"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useRef, useEffect } from "react";
import { Loader2, ImagePlus, X, Image as ImageIcon } from "lucide-react";
import { adminApi } from "@/lib/api/admin";
import { bannersApi, type Banner } from "@/lib/api/banners";
import { uploadsApi } from "@/lib/api/uploads";
import { useLocale } from "@/lib/i18n";

export default function AdminDailyWorkPage() {
    const { t } = useLocale();
    const queryClient = useQueryClient();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [imageUrl, setImageUrl] = useState("");
    const [uploading, setUploading] = useState(false);

    const { data: dailyWork, isLoading } = useQuery<Banner | null>({
        queryKey: ["admin-daily-work"],
        queryFn: () => bannersApi.findDailyWork(),
    });

    useEffect(() => {
        if (dailyWork) setImageUrl(dailyWork.imageUrl);
    }, [dailyWork]);

    const createMutation = useMutation({
        mutationFn: (data: { section: string; imageUrl: string; isActive: boolean }) =>
            adminApi.createBanner(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin-daily-work"] });
        },
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: { imageUrl?: string } }) =>
            adminApi.updateBanner(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin-daily-work"] });
        },
    });

    const handleFileUpload = async (file: File) => {
        setUploading(true);
        try {
            const { url } = await uploadsApi.upload(file);
            setImageUrl(url);
        } catch {
            alert("Upload failed");
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    };

    const handleSave = async () => {
        if (!imageUrl.trim()) return;
        if (dailyWork) {
            updateMutation.mutate({ id: dailyWork.id, data: { imageUrl } });
        } else {
            createMutation.mutate({ section: "DAILY_WORK", imageUrl, isActive: true });
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-slate-800">{t("nav.dailyWork")}</h1>
                <p className="text-sm text-slate-500">Upload or update the daily work image shown to all users.</p>
            </div>

            <div className="card p-6 bg-white space-y-4">
                <div className="space-y-2">
                    <label className="block text-xs font-semibold text-slate-600">Daily Work Image</label>
                    <p className="text-[10px] text-gray-400">Recommended size: 800 × 800 px (square) or 1080 × 1080 px.</p>

                    {imageUrl ? (
                        <div className="relative w-full max-w-md rounded-lg border border-slate-200 overflow-hidden bg-slate-50">
                            <img src={imageUrl} alt="Daily work preview" className="w-full h-auto object-contain" />
                            <button
                                type="button"
                                onClick={() => setImageUrl("")}
                                className="absolute top-2 right-2 flex h-6 w-6 items-center justify-center rounded-full bg-red-600/80 text-white hover:bg-red-600"
                            >
                                <X size={14} />
                            </button>
                        </div>
                    ) : (
                        <div
                            onClick={() => fileInputRef.current?.click()}
                            className="flex flex-col items-center justify-center w-full max-w-md h-48 rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 cursor-pointer hover:bg-slate-100 transition"
                        >
                            <ImageIcon size={32} className="text-slate-300" />
                            <span className="text-xs text-slate-400 mt-2">Click to upload</span>
                        </div>
                    )}

                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleFileUpload(file);
                        }}
                    />
                    {uploading && (
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                            <Loader2 size={14} className="animate-spin" /> Uploading...
                        </div>
                    )}
                </div>

                <div className="flex gap-3">
                    <button
                        onClick={handleSave}
                        disabled={!imageUrl.trim() || uploading || createMutation.isPending || updateMutation.isPending}
                        className="btn-primary text-sm"
                    >
                        {createMutation.isPending || updateMutation.isPending ? (
                            <span className="flex items-center gap-2"><Loader2 size={14} className="animate-spin" /> Saving...</span>
                        ) : (
                            dailyWork ? "Update Image" : "Save Image"
                        )}
                    </button>
                </div>

                {(createMutation.isSuccess || updateMutation.isSuccess) && (
                    <p className="text-xs text-green-600">Daily work image saved successfully!</p>
                )}
            </div>

            {isLoading && (
                <div className="flex justify-center py-10">
                    <Loader2 className="animate-spin" size={24} />
                </div>
            )}
        </div>
    );
}
