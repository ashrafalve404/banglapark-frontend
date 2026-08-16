"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    Plus,
    Trash2,
    Edit2,
    ExternalLink,
    Loader2,
    CheckCircle,
    XCircle,
    Search,
    DollarSign,
    Link as LinkIcon,
    AlertCircle,
    FileText,
} from "lucide-react";
import { cpaApi, type CpaTaskAdmin, type CreateCpaTaskInput } from "@/lib/api/cpa";
import { useLocale } from "@/lib/i18n";
import { formatCurrency } from "@/lib/utils";

export default function AdminCpaMarketingPage() {
    const { t, locale } = useLocale();
    const queryClient = useQueryClient();
    const [searchTerm, setSearchTerm] = useState("");
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [editingTask, setEditingTask] = useState<CpaTaskAdmin | null>(null);

    // Form state
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [price, setPrice] = useState<number>(10);
    const [redirectLink, setRedirectLink] = useState("");
    const [isActive, setIsActive] = useState(true);
    const [formError, setFormError] = useState<string | null>(null);

    const { data: tasks = [], isLoading } = useQuery<CpaTaskAdmin[]>({
        queryKey: ["admin-cpa-tasks"],
        queryFn: () => cpaApi.adminGetTasks(),
    });

    const createMutation = useMutation({
        mutationFn: (data: CreateCpaTaskInput) => cpaApi.adminCreateTask(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin-cpa-tasks"] });
            resetForm();
            setIsCreateModalOpen(false);
        },
        onError: (err: any) => {
            setFormError(err?.response?.data?.message || err?.message || "Failed to create CPA task");
        },
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<CreateCpaTaskInput> }) =>
            cpaApi.adminUpdateTask(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin-cpa-tasks"] });
            resetForm();
            setEditingTask(null);
        },
        onError: (err: any) => {
            setFormError(err?.response?.data?.message || err?.message || "Failed to update CPA task");
        },
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => cpaApi.adminDeleteTask(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin-cpa-tasks"] });
        },
    });

    const resetForm = () => {
        setTitle("");
        setDescription("");
        setPrice(10);
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
        setPrice(Number(task.price));
        setRedirectLink(task.redirectLink);
        setIsActive(task.isActive);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setFormError(null);

        if (!title.trim() || !description.trim() || !redirectLink.trim()) {
            setFormError("Title, Description, and Redirect Link are required.");
            return;
        }

        if (editingTask) {
            updateMutation.mutate({
                id: editingTask.id,
                data: { title, description, price, redirectLink, isActive },
            });
        } else {
            createMutation.mutate({ title, description, price, redirectLink, isActive });
        }
    };

    const filteredTasks = tasks.filter((t) =>
        t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.description.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6 max-w-6xl mx-auto">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">CPA Marketing Management</h1>
                    <p className="text-sm text-slate-500 mt-1">
                        Add CPA tasks with prices and destination links for users to buy and perform in Daily Work.
                    </p>
                </div>
                <button
                    onClick={handleOpenCreate}
                    className="btn-primary flex items-center gap-2 text-sm px-4 py-2.5 rounded-lg shadow-sm"
                >
                    <Plus size={18} /> Add New CPA Task
                </button>
            </div>

            {/* Filter Search */}
            <div className="card p-4 bg-white">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search tasks by title or description..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="input pl-10 w-full text-sm"
                    />
                </div>
            </div>

            {/* Task List */}
            {isLoading ? (
                <div className="flex justify-center py-16">
                    <Loader2 size={32} className="animate-spin text-slate-400" />
                </div>
            ) : filteredTasks.length === 0 ? (
                <div className="card p-12 bg-white text-center text-slate-400 space-y-3">
                    <FileText size={48} className="mx-auto text-slate-300" />
                    <p className="text-sm font-semibold">No CPA tasks found.</p>
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
                                        {task.isActive ? "Active" : "Inactive"}
                                    </span>
                                    <span className="text-xs font-semibold text-purple-700 bg-purple-50 px-2.5 py-1 rounded-full">
                                        Purchases: {task._count?.purchases ?? 0}
                                    </span>
                                </div>

                                <div>
                                    <h3 className="font-bold text-slate-900 text-base leading-snug line-clamp-1">{task.title}</h3>
                                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">{task.description}</p>
                                </div>

                                <div className="pt-2 border-t border-slate-100 space-y-2">
                                    <div className="flex items-center justify-between text-xs">
                                        <span className="text-slate-500 font-medium">Task Price:</span>
                                        <span className="text-base font-extrabold text-emerald-700">
                                            {formatCurrency(Number(task.price), locale)}
                                        </span>
                                    </div>

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
                                    title="Edit Task"
                                >
                                    <Edit2 size={16} />
                                </button>
                                <button
                                    onClick={() => {
                                        if (confirm(`Are you sure you want to delete CPA Task "${task.title}"?`)) {
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

            {/* Create / Edit Modal */}
            {(isCreateModalOpen || editingTask) && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 fade-in">
                    <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl space-y-5">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <h2 className="text-lg font-bold text-slate-900">
                                {editingTask ? "Edit CPA Task" : "Add New CPA Task"}
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
                                <label className="block text-slate-700 font-bold mb-1">Task Title *</label>
                                <input
                                    type="text"
                                    placeholder="e.g., Complete App Registration"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    className="input w-full"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-slate-700 font-bold mb-1">Task Description *</label>
                                <textarea
                                    rows={3}
                                    placeholder="Describe the instructions for this CPA task..."
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    className="input w-full"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-slate-700 font-bold mb-1">Task Price (BDT) *</label>
                                <input
                                    type="number"
                                    min={0}
                                    step={1}
                                    placeholder="20"
                                    value={price}
                                    onChange={(e) => setPrice(Number(e.target.value))}
                                    className="input w-full"
                                    required
                                />
                                <p className="text-[11px] text-slate-400 mt-1">Amount user pays from wallet to unlock/buy this task.</p>
                            </div>

                            <div>
                                <label className="block text-slate-700 font-bold mb-1">Secret Redirect Link (Target URL) *</label>
                                <input
                                    type="url"
                                    placeholder="https://example.com/cpa-offer"
                                    value={redirectLink}
                                    onChange={(e) => setRedirectLink(e.target.value)}
                                    className="input w-full font-mono text-[11px]"
                                    required
                                />
                                <p className="text-[11px] text-amber-600 mt-1 font-medium">
                                    🔒 Hidden from unpurchased users. Only revealed on Daily Work after purchase!
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
                                    Is Active (visible for purchase in user dashboard)
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
                                    {editingTask ? "Update Task" : "Create Task"}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsCreateModalOpen(false);
                                        setEditingTask(null);
                                    }}
                                    className="btn-outline-primary py-2.5 text-sm font-semibold"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
