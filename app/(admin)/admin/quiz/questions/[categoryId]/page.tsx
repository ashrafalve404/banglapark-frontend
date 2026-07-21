"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2, ArrowLeft, Trash2, CheckSquare, Square } from "lucide-react";
import { quizApi, type QuizQuestion } from "@/lib/api/quiz";

export default function QuizQuestionsPage() {
    const { categoryId } = useParams<{ categoryId: string }>();
    const router = useRouter();
    const queryClient = useQueryClient();

    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [toast, setToast] = useState<{ type: "success" | "error"; text: string } | null>(null);

    const showToast = (type: "success" | "error", text: string) => {
        setToast({ type, text });
        setTimeout(() => setToast(null), 3500);
    };

    const { data, isLoading } = useQuery({
        queryKey: ["admin-quiz-questions", categoryId],
        queryFn: () => quizApi.adminGetQuestions(categoryId, 1),
    });

    const { data: categories = [] } = useQuery({
        queryKey: ["admin-quiz-categories"],
        queryFn: () => quizApi.getAllCategories(),
    });

    const cat = categories.find((c) => c.id === categoryId);
    const questions: QuizQuestion[] = data?.questions ?? [];

    const invalidate = () => {
        queryClient.invalidateQueries({ queryKey: ["admin-quiz-questions", categoryId] });
        queryClient.invalidateQueries({ queryKey: ["admin-quiz-categories"] });
    };

    // ── Single delete ──────────────────────────────────────────────────────────
    const deleteOneMutation = useMutation({
        mutationFn: (id: string) => quizApi.adminDeleteQuestion(id),
        onSuccess: (_, id) => {
            setSelectedIds((prev) => prev.filter((x) => x !== id));
            invalidate();
            showToast("success", "Question deleted.");
        },
        onError: () => showToast("error", "Failed to delete question."),
    });

    // ── Bulk delete ────────────────────────────────────────────────────────────
    const bulkDeleteMutation = useMutation({
        mutationFn: (ids: string[]) => quizApi.adminBulkDeleteQuestions(ids),
        onSuccess: (res) => {
            setSelectedIds([]);
            invalidate();
            showToast("success", `${res.count} question(s) deleted.`);
        },
        onError: () => showToast("error", "Bulk delete failed."),
    });

    // ── Delete all ─────────────────────────────────────────────────────────────
    const deleteAllMutation = useMutation({
        mutationFn: () => quizApi.adminDeleteAllQuestions(categoryId),
        onSuccess: (res) => {
            setSelectedIds([]);
            invalidate();
            showToast("success", `All ${res.count} questions deleted.`);
        },
        onError: () => showToast("error", "Failed to delete all questions."),
    });

    // ── Selection helpers ──────────────────────────────────────────────────────
    const allSelected = questions.length > 0 && questions.every((q) => selectedIds.includes(q.id));

    const toggleAll = () => {
        if (allSelected) setSelectedIds([]);
        else setSelectedIds(questions.map((q) => q.id));
    };

    const toggleOne = (id: string) =>
        setSelectedIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);

    const handleBulkDelete = () => {
        if (selectedIds.length === 0) return;
        if (confirm(`Delete ${selectedIds.length} selected question(s)? This cannot be undone.`)) {
            bulkDeleteMutation.mutate(selectedIds);
        }
    };

    const handleDeleteAll = () => {
        if (confirm(`Delete ALL ${questions.length} questions in "${cat?.name}"? This cannot be undone.`)) {
            deleteAllMutation.mutate();
        }
    };

    const isBusy = bulkDeleteMutation.isPending || deleteAllMutation.isPending || deleteOneMutation.isPending;

    if (isLoading) {
        return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-slate-500" size={32} /></div>;
    }

    return (
        <div className="space-y-5">
            {/* Toast */}
            {toast && (
                <div className={`fixed top-5 right-5 z-50 px-4 py-3 rounded-xl shadow-lg text-sm font-semibold transition-all
                    ${toast.type === "success" ? "bg-green-600 text-white" : "bg-red-600 text-white"}`}>
                    {toast.text}
                </div>
            )}

            {/* Header */}
            <div className="flex flex-wrap items-center gap-3">
                <button
                    onClick={() => router.push("/admin/quiz")}
                    className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
                >
                    <ArrowLeft size={18} />
                </button>
                <div className="flex-1 min-w-0">
                    <h1 className="text-xl font-bold text-slate-800 truncate">{cat?.name ?? "Questions"}</h1>
                    <p className="text-xs text-slate-400">{data?.total ?? 0} total questions</p>
                </div>
                {cat?.imageUrl && (
                    <img src={cat.imageUrl} alt="" className="h-10 w-10 rounded-lg object-cover border border-slate-200" />
                )}

                {/* Delete All button — always visible when there are questions */}
                {questions.length > 0 && (
                    <button
                        onClick={handleDeleteAll}
                        disabled={isBusy}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-colors shadow-sm disabled:opacity-60"
                    >
                        {deleteAllMutation.isPending
                            ? <Loader2 size={13} className="animate-spin" />
                            : <Trash2 size={13} />}
                        Delete All ({questions.length})
                    </button>
                )}
            </div>

            {/* Bulk action bar — appears when ≥1 selected */}
            {selectedIds.length > 0 && (
                <div className="flex items-center gap-3 bg-red-50 border border-red-200 px-4 py-2.5 rounded-xl">
                    <span className="text-xs font-bold text-red-700">
                        {selectedIds.length} selected
                    </span>
                    <button
                        onClick={handleBulkDelete}
                        disabled={isBusy}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-colors disabled:opacity-60"
                    >
                        {bulkDeleteMutation.isPending
                            ? <Loader2 size={12} className="animate-spin" />
                            : <Trash2 size={12} />}
                        Delete Selected
                    </button>
                    <button
                        onClick={() => setSelectedIds([])}
                        className="text-xs text-slate-500 hover:text-slate-700 underline underline-offset-2"
                    >
                        Cancel
                    </button>
                </div>
            )}

            {/* Questions table */}
            {questions.length === 0 ? (
                <div className="card p-12 bg-white text-center text-sm text-slate-400">
                    No questions in this category yet.
                </div>
            ) : (
                <div className="bg-white rounded-xl overflow-hidden border border-slate-200">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-200">
                                    {/* Select-all checkbox */}
                                    <th className="px-4 py-3 w-10 text-center">
                                        <button
                                            type="button"
                                            onClick={toggleAll}
                                            className="text-slate-400 hover:text-green-600 transition-colors"
                                            title={allSelected ? "Deselect all" : "Select all"}
                                        >
                                            {allSelected
                                                ? <CheckSquare size={16} className="text-green-600" />
                                                : <Square size={16} />}
                                        </button>
                                    </th>
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 w-8">#</th>
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500">Question</th>
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500">Options</th>
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500">Correct Answer</th>
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500">Level</th>
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 w-16">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {questions.map((q: QuizQuestion, i: number) => {
                                    const isSelected = selectedIds.includes(q.id);
                                    return (
                                        <tr
                                            key={q.id}
                                            className={`border-b border-slate-100 transition-colors ${isSelected ? "bg-red-50/50" : "hover:bg-slate-50"}`}
                                        >
                                            {/* Row checkbox */}
                                            <td className="px-4 py-3 text-center">
                                                <button
                                                    type="button"
                                                    onClick={() => toggleOne(q.id)}
                                                    className="text-slate-400 hover:text-green-600 transition-colors"
                                                >
                                                    {isSelected
                                                        ? <CheckSquare size={15} className="text-green-600" />
                                                        : <Square size={15} />}
                                                </button>
                                            </td>
                                            <td className="px-4 py-3 text-xs text-slate-400">{i + 1}</td>
                                            <td className="px-4 py-3 text-sm font-medium text-slate-800 max-w-xs">
                                                <span className="line-clamp-2">{q.question}</span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex flex-wrap gap-1">
                                                    {(q.options as string[]).map((opt, oi) => (
                                                        <span
                                                            key={oi}
                                                            className={`text-[10px] px-1.5 py-0.5 rounded ${q.correctIndex === oi
                                                                ? "bg-green-100 text-green-700 font-semibold"
                                                                : "bg-slate-100 text-slate-500"}`}
                                                        >
                                                            {opt}
                                                        </span>
                                                    ))}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-xs text-green-700 font-semibold">
                                                {(q.options as string[])[q.correctIndex ?? 0]}
                                            </td>
                                            <td className="px-4 py-3">
                                                {q.level ? (
                                                    <span className="text-[10px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded font-semibold">
                                                        {q.level.name}
                                                    </span>
                                                ) : (
                                                    <span className="text-[10px] text-slate-400">—</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3">
                                                <button
                                                    onClick={() => {
                                                        if (confirm("Delete this question?")) deleteOneMutation.mutate(q.id);
                                                    }}
                                                    disabled={isBusy}
                                                    className="p-1 text-red-400 hover:text-red-600 disabled:opacity-40 transition-colors"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
