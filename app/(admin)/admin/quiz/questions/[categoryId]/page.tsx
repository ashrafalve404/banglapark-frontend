"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { Loader2, ArrowLeft, Trash2, X } from "lucide-react";
import { quizApi, type QuizQuestion } from "@/lib/api/quiz";

export default function QuizQuestionsPage() {
    const { categoryId } = useParams<{ categoryId: string }>();
    const router = useRouter();
    const queryClient = useQueryClient();

    const { data, isLoading } = useQuery({
        queryKey: ["admin-quiz-questions", categoryId],
        queryFn: () => quizApi.adminGetQuestions(categoryId, 1),
    });

    const { data: categories = [] } = useQuery({
        queryKey: ["admin-quiz-categories"],
        queryFn: () => quizApi.getAllCategories(),
    });

    const cat = categories.find((c) => c.id === categoryId);

    const deleteQuestionMutation = useMutation({
        mutationFn: (id: string) => quizApi.adminDeleteQuestion(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin-quiz-questions", categoryId] });
            queryClient.invalidateQueries({ queryKey: ["admin-quiz-categories"] });
        },
    });

    if (isLoading) {
        return <div className="flex justify-center py-20"><Loader2 className="animate-spin" size={32} /></div>;
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <button onClick={() => router.push("/admin/quiz")} className="p-1 text-slate-400 hover:text-slate-600">
                    <ArrowLeft size={20} />
                </button>
                <div>
                    <h1 className="text-xl font-bold text-slate-800">{cat?.name ?? "Questions"}</h1>
                    <p className="text-xs text-slate-400">{data?.total ?? 0} total questions</p>
                </div>
                {cat?.imageUrl && (
                    <img src={cat.imageUrl} alt="" className="h-10 w-10 rounded object-cover border ml-auto" />
                )}
            </div>

            {/* Questions table */}
            {!data || data.questions.length === 0 ? (
                <div className="card p-12 bg-white text-center text-sm text-slate-400">
                    No questions in this category yet.
                </div>
            ) : (
                <div className="bg-white rounded-xl overflow-hidden border border-slate-200">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-200">
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 w-10">#</th>
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500">Question</th>
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500">Options</th>
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500">Correct Answer</th>
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500">Level</th>
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 w-16">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.questions.map((q: QuizQuestion, i: number) => (
                                    <tr key={q.id} className="border-b border-slate-100 hover:bg-slate-50">
                                        <td className="px-4 py-3 text-xs text-slate-400">{i + 1}</td>
                                        <td className="px-4 py-3 text-sm font-medium text-slate-800 max-w-xs truncate">{q.question}</td>
                                        <td className="px-4 py-3">
                                            <div className="flex flex-wrap gap-1">
                                                {(q.options as string[]).map((opt, oi) => (
                                                    <span key={oi} className={`text-[10px] px-1.5 py-0.5 rounded ${q.correctIndex === oi ? "bg-green-100 text-green-700 font-semibold" : "bg-slate-100 text-slate-500"}`}>
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
                                                <span className="text-[10px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded font-semibold">{q.level.name}</span>
                                            ) : (
                                                <span className="text-[10px] text-slate-400">—</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3">
                                            <button
                                                onClick={() => { if (confirm("Delete this question?")) deleteQuestionMutation.mutate(q.id); }}
                                                className="p-1 text-red-400 hover:text-red-600"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
