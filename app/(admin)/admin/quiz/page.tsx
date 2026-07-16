"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Plus, Trash2, Loader2, ChevronDown, ChevronUp, X } from "lucide-react";
import { quizApi, type Quiz } from "@/lib/api/quiz";
import { useLocale } from "@/lib/i18n";

interface QuestionForm {
    question: string;
    options: string[];
    correctIndex: number;
}

const emptyQuestion = (): QuestionForm => ({
    question: "",
    options: ["", "", "", ""],
    correctIndex: 0,
});

export default function AdminQuizPage() {
    const { t } = useLocale();
    const queryClient = useQueryClient();
    const [showForm, setShowForm] = useState(false);
    const [title, setTitle] = useState("");
    const [price, setPrice] = useState("");
    const [timeLimit, setTimeLimit] = useState("2");
    const [questions, setQuestions] = useState<QuestionForm[]>([emptyQuestion()]);
    const [expanded, setExpanded] = useState<string | null>(null);

    const { data: quizzes = [], isLoading } = useQuery<Quiz[]>({
        queryKey: ["admin-quizzes"],
        queryFn: () => quizApi.adminFindAll(),
    });

    const createMutation = useMutation({
        mutationFn: (data: { title: string; price: number; timeLimit: number; questions: { question: string; options: string[]; correctIndex: number }[] }) =>
            quizApi.adminCreate(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin-quizzes"] });
            resetForm();
        },
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => quizApi.adminDelete(id),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-quizzes"] }),
    });

    const resetForm = () => {
        setShowForm(false);
        setTitle("");
        setPrice("");
        setTimeLimit("2");
        setQuestions([emptyQuestion()]);
    };

    const updateOption = (qIdx: number, optIdx: number, value: string) => {
        const copy = [...questions];
        copy[qIdx] = { ...copy[qIdx], options: [...copy[qIdx].options] };
        copy[qIdx].options[optIdx] = value;
        setQuestions(copy);
    };

    const addQuestion = () => setQuestions([...questions, emptyQuestion()]);
    const removeQuestion = (idx: number) => {
        if (questions.length <= 1) return;
        setQuestions(questions.filter((_, i) => i !== idx));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim() || !price) return;
        const validQuestions = questions.filter((q) => q.question.trim() && q.options.some((o) => o.trim()));
        if (validQuestions.length === 0) return;
        createMutation.mutate({
            title,
            price: Number(price),
            timeLimit: Number(timeLimit),
            questions: validQuestions.map((q, i) => ({
                question: q.question,
                options: q.options,
                correctIndex: q.correctIndex,
                sortOrder: i,
            })),
        });
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">{t("nav.quiz")}</h1>
                    <p className="text-sm text-slate-500">Create and manage quizzes</p>
                </div>
                <button onClick={() => setShowForm(!showForm)} className="btn-primary text-sm flex items-center gap-2">
                    <Plus size={16} /> New Quiz
                </button>
            </div>

            {showForm && (
                <form onSubmit={handleSubmit} className="card p-6 bg-white space-y-4">
                    <h2 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-2">Create New Quiz</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-slate-600 mb-1">Title</label>
                            <input value={title} onChange={(e) => setTitle(e.target.value)} className="input w-full" required />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-600 mb-1">Price (BDT)</label>
                            <input type="number" min="0" value={price} onChange={(e) => setPrice(e.target.value)} className="input w-full" required />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-600 mb-1">Time Limit (minutes)</label>
                            <input type="number" min="1" value={timeLimit} onChange={(e) => setTimeLimit(e.target.value)} className="input w-full" required />
                        </div>
                    </div>

                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-slate-600">Questions</span>
                            <button type="button" onClick={addQuestion} className="text-xs text-green-700 hover:text-green-800 font-semibold">+ Add Question</button>
                        </div>
                        {questions.map((q, qIdx) => (
                            <div key={qIdx} className="border border-slate-200 rounded-lg p-4 space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-semibold text-slate-500">Question {qIdx + 1}</span>
                                    {questions.length > 1 && (
                                        <button type="button" onClick={() => removeQuestion(qIdx)} className="text-red-500 hover:text-red-700">
                                            <X size={14} />
                                        </button>
                                    )}
                                </div>
                                <input
                                    value={q.question}
                                    onChange={(e) => {
                                        const copy = [...questions];
                                        copy[qIdx] = { ...copy[qIdx], question: e.target.value };
                                        setQuestions(copy);
                                    }}
                                    placeholder="Enter question"
                                    className="input w-full text-sm"
                                    required
                                />
                                {q.options.map((opt, optIdx) => (
                                    <div key={optIdx} className="flex items-center gap-2">
                                        <input
                                            type="radio"
                                            name={`correct-${qIdx}`}
                                            checked={q.correctIndex === optIdx}
                                            onChange={() => {
                                                const copy = [...questions];
                                                copy[qIdx] = { ...copy[qIdx], correctIndex: optIdx };
                                                setQuestions(copy);
                                            }}
                                        />
                                        <input
                                            value={opt}
                                            onChange={(e) => updateOption(qIdx, optIdx, e.target.value)}
                                            placeholder={`Option ${optIdx + 1}`}
                                            className="input flex-1 text-sm"
                                            required
                                        />
                                        {q.correctIndex === optIdx && (
                                            <span className="text-[10px] text-green-700 font-semibold">Correct</span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ))}
                    </div>

                    <div className="flex gap-3">
                        <button type="submit" disabled={createMutation.isPending} className="btn-primary text-sm">
                            {createMutation.isPending ? <span className="flex items-center gap-2"><Loader2 size={14} className="animate-spin" /> Creating...</span> : "Save Quiz"}
                        </button>
                        <button type="button" onClick={resetForm} className="btn-outline-primary text-sm">Cancel</button>
                    </div>
                </form>
            )}

            {isLoading ? (
                <div className="flex justify-center py-10"><Loader2 className="animate-spin" size={24} /></div>
            ) : quizzes.length === 0 ? (
                <div className="card p-12 bg-white text-center text-sm text-slate-400">No quizzes created yet.</div>
            ) : (
                <div className="space-y-3">
                    {quizzes.map((quiz) => (
                        <div key={quiz.id} className="card bg-white overflow-hidden">
                            <div className="p-4 flex items-center justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3">
                                        <h3 className="text-sm font-bold text-slate-800">{quiz.title}</h3>
                                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${quiz.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-500"}`}>
                                            {quiz.isActive ? "Active" : "Inactive"}
                                        </span>
                                    </div>
                                    <div className="flex gap-4 mt-1 text-[10px] text-slate-400">
                                        <span>{quiz._count?.questions ?? 0} questions</span>
                                        <span>৳{Number(quiz.price).toLocaleString()}</span>
                                        <span>{quiz.timeLimit} min</span>
                                        <span>{quiz._count?.purchases ?? 0} purchases</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setExpanded(expanded === quiz.id ? null : quiz.id)}
                                        className="p-1.5 text-slate-400 hover:text-slate-600"
                                    >
                                        {expanded === quiz.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                    </button>
                                    <button
                                        onClick={() => { if (confirm("Delete this quiz?")) deleteMutation.mutate(quiz.id); }}
                                        className="p-1.5 text-red-400 hover:text-red-600"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                            {expanded === quiz.id && quiz.questions && (
                                <div className="border-t border-slate-100 p-4 space-y-3">
                                    {quiz.questions.map((q, i) => (
                                        <div key={q.id} className="text-xs text-slate-600">
                                            <p className="font-semibold">{i + 1}. {q.question}</p>
                                            <div className="ml-4 mt-1 space-y-0.5">
                                                {(q.options as string[]).map((opt, oi) => (
                                                    <p key={oi} className={q.correctIndex === oi ? "text-green-700 font-semibold" : "text-slate-500"}>
                                                        {String.fromCharCode(97 + oi)}) {opt} {q.correctIndex === oi && "✓"}
                                                    </p>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
