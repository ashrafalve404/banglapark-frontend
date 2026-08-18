"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    Plus,
    Trash2,
    Edit2,
    Loader2,
    CheckCircle,
    XCircle,
    Search,
    Link as LinkIcon,
    AlertCircle,
    FileText,
    Users,
    Layers,
    Calendar,
    Phone,
    Mail,
    User as UserIcon,
} from "lucide-react";
import { cpaApi, type CpaTaskAdmin, type CreateCpaTaskInput, type CpaAdminStats, type CpaAdminPurchaseLog } from "@/lib/api/cpa";
import { useLocale } from "@/lib/i18n";

export default function AdminCpaMarketingPage() {
    const { t, locale } = useLocale();
    const queryClient = useQueryClient();

    const [activeTab, setActiveTab] = useState<"tasks" | "purchases">("tasks");
    const [searchTerm, setSearchTerm] = useState("");
    const [purchaseSearch, setPurchaseSearch] = useState("");
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [editingTask, setEditingTask] = useState<CpaTaskAdmin | null>(null);

    // Form state
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [redirectLink, setRedirectLink] = useState("");
    const [isActive, setIsActive] = useState(true);
    const [formError, setFormError] = useState<string | null>(null);

    // Stats Query
    const { data: stats } = useQuery<CpaAdminStats>({
        queryKey: ["admin-cpa-stats"],
        queryFn: () => cpaApi.adminGetStats(),
    });

    // Tasks Query
    const { data: tasks = [], isLoading: isTasksLoading } = useQuery<CpaTaskAdmin[]>({
        queryKey: ["admin-cpa-tasks"],
        queryFn: () => cpaApi.adminGetTasks(),
    });

    // Purchases Log Query
    const { data: purchases = [], isLoading: isPurchasesLoading } = useQuery<CpaAdminPurchaseLog[]>({
        queryKey: ["admin-cpa-purchases"],
        queryFn: () => cpaApi.adminGetPurchases(),
    });

    const createMutation = useMutation({
        mutationFn: (data: CreateCpaTaskInput) => cpaApi.adminCreateTask(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin-cpa-tasks"] });
            queryClient.invalidateQueries({ queryKey: ["admin-cpa-stats"] });
            resetForm();
            setIsCreateModalOpen(false);
        },
        onError: (err: any) => {
            setFormError(err?.response?.data?.message || err?.message || (locale === "bn" ? "টাস্ক তৈরি ব্যর্থ হয়েছে" : "Failed to create CPA task"));
        },
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<CreateCpaTaskInput> }) =>
            cpaApi.adminUpdateTask(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin-cpa-tasks"] });
            queryClient.invalidateQueries({ queryKey: ["admin-cpa-stats"] });
            resetForm();
            setEditingTask(null);
        },
        onError: (err: any) => {
            setFormError(err?.response?.data?.message || err?.message || (locale === "bn" ? "টাস্ক আপডেট ব্যর্থ হয়েছে" : "Failed to update CPA task"));
        },
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => cpaApi.adminDeleteTask(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin-cpa-tasks"] });
            queryClient.invalidateQueries({ queryKey: ["admin-cpa-stats"] });
        },
    });

    const resetForm = () => {
        setTitle("");
        setDescription("");
        setRedirectLink("");
        setIsActive(true);
        setFormError(null);
    };

    const handleOpenCreate = () => {
        resetForm();
        setEditingTask(null);
        setIsCreateModalOpen(true);
    };

    const handleOpenEdit = (task: CpaTaskAdmin) => {
        setFormError(null);
        setEditingTask(task);
        setTitle(task.title);
        setDescription(task.description);
        setRedirectLink(task.redirectLink);
        setIsActive(task.isActive);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setFormError(null);

        if (!title.trim() || !description.trim() || !redirectLink.trim()) {
            setFormError(locale === "bn" ? "শিরোনাম, বিবরণ এবং রিডাইরেক্ট লিংক আবশ্যক।" : "Title, Description, and Redirect Link are required.");
            return;
        }

        if (editingTask) {
            updateMutation.mutate({
                id: editingTask.id,
                data: { title, description, price: 0, redirectLink, isActive },
            });
        } else {
            createMutation.mutate({ title, description, price: 0, redirectLink, isActive });
        }
    };

    const filteredTasks = tasks.filter((t) =>
        t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.description.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const filteredPurchases = purchases.filter((p) =>
        p.user?.fullName.toLowerCase().includes(purchaseSearch.toLowerCase()) ||
        p.user?.phone.toLowerCase().includes(purchaseSearch.toLowerCase()) ||
        p.user?.email.toLowerCase().includes(purchaseSearch.toLowerCase()) ||
        p.cpaTask?.title.toLowerCase().includes(purchaseSearch.toLowerCase())
    );

    return (
        <div className="space-y-6 max-w-6xl mx-auto">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">{t("cpa.adminTitle")}</h1>
                    <p className="text-sm text-slate-500 mt-1">
                        {t("cpa.adminDesc")}
                    </p>
                </div>
                <button
                    onClick={handleOpenCreate}
                    className="btn-primary flex items-center gap-2 text-sm px-4 py-2.5 rounded-lg shadow-sm cursor-pointer"
                >
                    <Plus size={18} /> {t("cpa.addNewTask")}
                </button>
            </div>

            {/* Clean Important Summary Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="card p-5 bg-white border border-purple-100 flex items-center gap-4 shadow-sm">
                    <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center shrink-0">
                        <Layers size={24} />
                    </div>
                    <div>
                        <p className="text-xs text-slate-500 font-medium">{locale === "bn" ? "মোট সিপিএ টাস্ক" : "Total CPA Tasks"}</p>
                        <h3 className="text-xl font-extrabold text-slate-900 mt-0.5 flex items-center gap-2">
                            {stats?.totalTasks ?? tasks.length}
                            <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                                {stats?.activeTasks ?? tasks.filter(t => t.isActive).length} {t("cpa.active")}
                            </span>
                        </h3>
                    </div>
                </div>

                <div className="card p-5 bg-white border border-indigo-100 flex items-center gap-4 shadow-sm">
                    <div className="w-12 h-12 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
                        <Users size={24} />
                    </div>
                    <div>
                        <p className="text-xs text-slate-500 font-medium">{locale === "bn" ? "মোট ব্যবহারকারী টাস্ক শুরু" : "Total User Task Starts"}</p>
                        <h3 className="text-xl font-extrabold text-slate-900 mt-0.5">
                            {stats?.totalPurchases ?? purchases.length}
                        </h3>
                    </div>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex border-b border-slate-200 gap-6">
                <button
                    onClick={() => setActiveTab("tasks")}
                    className={`pb-3 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
                        activeTab === "tasks" ? "border-purple-600 text-purple-700" : "border-transparent text-slate-500 hover:text-slate-700"
                    }`}
                >
                    <FileText size={16} /> {locale === "bn" ? "টাস্ক ক্যাটালগ" : "Tasks Catalog"} ({tasks.length})
                </button>
                <button
                    onClick={() => setActiveTab("purchases")}
                    className={`pb-3 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
                        activeTab === "purchases" ? "border-purple-600 text-purple-700" : "border-transparent text-slate-500 hover:text-slate-700"
                    }`}
                >
                    <Users size={16} /> {locale === "bn" ? "ব্যবহারকারী টাস্ক হিস্টোরি" : "User Task Activity Logs"} ({purchases.length})
                </button>
            </div>

            {/* TAB 1: TASKS MANAGEMENT */}
            {activeTab === "tasks" && (
                <div className="space-y-4">
                    {/* Filter Search */}
                    <div className="card p-4 bg-white">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input
                                type="text"
                                placeholder={t("cpa.searchPlaceholder")}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="input pl-10 w-full text-sm"
                            />
                        </div>
                    </div>

                    {/* Task List Grid */}
                    {isTasksLoading ? (
                        <div className="flex justify-center py-16">
                            <Loader2 size={32} className="animate-spin text-slate-400" />
                        </div>
                    ) : filteredTasks.length === 0 ? (
                        <div className="card p-12 bg-white text-center text-slate-400 space-y-3">
                            <FileText size={48} className="mx-auto text-slate-300" />
                            <p className="text-sm font-semibold">{t("cpa.noTasks")}</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                            {filteredTasks.map((task) => (
                                <div
                                    key={task.id}
                                    className={`card p-5 bg-white border-2 flex flex-col justify-between transition-all ${
                                        task.isActive ? "border-slate-100 hover:border-purple-200" : "border-slate-200 bg-slate-50/50 opacity-75"
                                    }`}
                                >
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between gap-2">
                                            <span
                                                className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                                                    task.isActive ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"
                                                }`}
                                            >
                                                {task.isActive ? <CheckCircle size={12} /> : <XCircle size={12} />}
                                                {task.isActive ? t("cpa.active") : t("cpa.inactive")}
                                            </span>
                                            <span className="text-xs font-semibold text-purple-700 bg-purple-50 px-2.5 py-1 rounded-full border border-purple-100">
                                                {locale === "bn" ? "অংশগ্রহণ:" : "User Starts:"} {task._count?.purchases ?? 0}
                                            </span>
                                        </div>

                                        <div>
                                            <h3 className="font-bold text-slate-900 text-base leading-snug line-clamp-1">{task.title}</h3>
                                            <p className="text-xs text-slate-500 mt-1 line-clamp-2">{task.description}</p>
                                        </div>

                                        <div className="pt-2 border-t border-slate-100">
                                            <div className="bg-slate-50 rounded-lg p-2 flex items-center gap-2 text-xs text-slate-600 border border-slate-100">
                                                <LinkIcon size={14} className="text-purple-600 shrink-0" />
                                                <span className="truncate font-mono text-[11px] text-purple-700" title={task.redirectLink}>
                                                    {task.redirectLink}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-end gap-2 pt-4 mt-4 border-t border-slate-100">
                                        <button
                                            onClick={() => handleOpenEdit(task)}
                                            className="p-2 rounded-lg text-slate-600 hover:bg-slate-100 hover:text-purple-700 transition-colors"
                                            title={t("cpa.editTask")}
                                        >
                                            <Edit2 size={16} />
                                        </button>
                                        <button
                                            onClick={() => {
                                                if (confirm(`${t("cpa.deleteConfirm")} "${task.title}"?`)) {
                                                    deleteMutation.mutate(task.id);
                                                }
                                            }}
                                            className="p-2 rounded-lg text-slate-600 hover:bg-red-50 hover:text-red-600 transition-colors"
                                            title="Delete Task"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* TAB 2: USER TASK ACTIVITY LOGS TABLE */}
            {activeTab === "purchases" && (
                <div className="space-y-4">
                    {/* Search Activity Logs */}
                    <div className="card p-4 bg-white">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input
                                type="text"
                                placeholder={locale === "bn" ? "ব্যবহারকারীর নাম, মোবাইল বা ইমেইল দিয়ে খুঁজুন..." : "Search by user name, phone, email, or task..."}
                                value={purchaseSearch}
                                onChange={(e) => setPurchaseSearch(e.target.value)}
                                className="input pl-10 w-full text-sm"
                            />
                        </div>
                    </div>

                    {/* Activity Log Table */}
                    {isPurchasesLoading ? (
                        <div className="flex justify-center py-16">
                            <Loader2 size={32} className="animate-spin text-slate-400" />
                        </div>
                    ) : filteredPurchases.length === 0 ? (
                        <div className="card p-12 bg-white text-center text-slate-400 space-y-3">
                            <Users size={48} className="mx-auto text-slate-300" />
                            <p className="text-sm font-semibold">{locale === "bn" ? "কোনো ব্যবহারকারী টাস্ক হিস্টোরি পাওয়া যায়নি।" : "No user activity logs found."}</p>
                        </div>
                    ) : (
                        <div className="card bg-white overflow-hidden shadow-xs border border-slate-200">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse text-xs">
                                    <thead>
                                        <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-bold tracking-wider">
                                            <th className="py-3.5 px-4">{locale === "bn" ? "ব্যবহারকারী" : "User Info"}</th>
                                            <th className="py-3.5 px-4">{locale === "bn" ? "সিপিএ টাস্ক" : "CPA Task"}</th>
                                            <th className="py-3.5 px-4">{locale === "bn" ? "শুরু করার তারিখ" : "Start Date"}</th>
                                            <th className="py-3.5 px-4 text-center">{locale === "bn" ? "অবস্থা" : "Status"}</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {filteredPurchases.map((log) => (
                                            <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                                                <td className="py-3 px-4">
                                                    <div className="space-y-0.5">
                                                        <p className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                                                            <UserIcon size={14} className="text-purple-600 shrink-0" />
                                                            {log.user.fullName}
                                                        </p>
                                                        <div className="flex items-center gap-3 text-[11px] text-slate-500">
                                                            <span className="flex items-center gap-1">
                                                                <Phone size={12} className="text-slate-400" /> {log.user.phone}
                                                            </span>
                                                            {log.user.email && (
                                                                <span className="flex items-center gap-1">
                                                                    <Mail size={12} className="text-slate-400" /> {log.user.email}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="py-3 px-4">
                                                    <p className="font-bold text-slate-800 text-xs">{log.cpaTask.title}</p>
                                                </td>
                                                <td className="py-3 px-4 text-slate-500 text-xs whitespace-nowrap">
                                                    <span className="flex items-center gap-1">
                                                        <Calendar size={12} className="text-slate-400" />
                                                        {new Date(log.purchasedAt).toLocaleString(locale === "bn" ? "bn-BD" : "en-US", {
                                                            dateStyle: "medium",
                                                            timeStyle: "short",
                                                        })}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-4 text-center">
                                                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">
                                                        <CheckCircle size={12} /> {locale === "bn" ? "সক্রিয়" : "ACTIVE"}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Create / Edit Task Modal */}
            {(isCreateModalOpen || editingTask) && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 fade-in">
                    <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl space-y-5">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <h2 className="text-lg font-bold text-slate-900">
                                {editingTask ? t("cpa.editTask") : t("cpa.createTask")}
                            </h2>
                            <button
                                onClick={() => {
                                    setIsCreateModalOpen(false);
                                    setEditingTask(null);
                                }}
                                className="text-slate-400 hover:text-slate-600"
                            >
                                ✕
                            </button>
                        </div>

                        {formError && (
                            <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-lg text-xs font-semibold">
                                <AlertCircle size={16} />
                                <span>{formError}</span>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
                            <div>
                                <label className="block text-slate-700 font-bold mb-1">{t("cpa.taskTitleLabel")}</label>
                                <input
                                    type="text"
                                    placeholder={t("cpa.taskTitlePlaceholder")}
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    className="input w-full"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-slate-700 font-bold mb-1">{t("cpa.taskDescLabel")}</label>
                                <textarea
                                    rows={3}
                                    placeholder={t("cpa.taskDescPlaceholder")}
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    className="input w-full"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-slate-700 font-bold mb-1">{t("cpa.redirectLinkLabel")}</label>
                                <input
                                    type="url"
                                    placeholder="https://example.com/cpa-offer"
                                    value={redirectLink}
                                    onChange={(e) => setRedirectLink(e.target.value)}
                                    className="input w-full font-mono text-[11px]"
                                    required
                                />
                                <p className="text-[11px] text-amber-600 mt-1 font-medium">
                                    {t("cpa.targetUrlHint")}
                                </p>
                            </div>

                            <div className="flex items-center gap-2 pt-1">
                                <input
                                    type="checkbox"
                                    id="isActiveTask"
                                    checked={isActive}
                                    onChange={(e) => setIsActive(e.target.checked)}
                                    className="rounded text-purple-600 focus:ring-purple-500 h-4 w-4"
                                />
                                <label htmlFor="isActiveTask" className="text-slate-700 font-semibold cursor-pointer">
                                    {t("cpa.isActiveLabel")}
                                </label>
                            </div>

                            <div className="flex items-center gap-3 pt-3">
                                <button
                                    type="submit"
                                    disabled={createMutation.isPending || updateMutation.isPending}
                                    className="btn-primary flex-1 py-2.5 text-sm font-bold flex items-center justify-center gap-2"
                                >
                                    {(createMutation.isPending || updateMutation.isPending) && (
                                        <Loader2 size={16} className="animate-spin" />
                                    )}
                                    {editingTask ? t("cpa.updateTaskBtn") : t("cpa.createTaskBtn")}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsCreateModalOpen(false);
                                        setEditingTask(null);
                                    }}
                                    className="btn-outline-primary py-2.5 text-sm font-semibold"
                                >
                                    {t("cpa.cancel")}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
