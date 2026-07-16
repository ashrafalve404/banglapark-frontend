"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useRef } from "react";
import { Plus, Trash2, Loader2, X, ImageIcon, FolderOpen, ListOrdered, Eye, EyeOff, AlertCircle } from "lucide-react";
import { quizApi, uploadImage, type QuizCategoryItem, type QuizQuestion } from "@/lib/api/quiz";
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
    const [tab, setTab] = useState<"categories" | "quizzes">("categories");
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Category form
    const [showCatForm, setShowCatForm] = useState(false);
    const [catName, setCatName] = useState("");
    const [catSortOrder, setCatSortOrder] = useState(0);
    const [catImage, setCatImage] = useState<File | null>(null);
    const [catImagePreview, setCatImagePreview] = useState("");
    const [catUploading, setCatUploading] = useState(false);
    const [catError, setCatError] = useState<string | null>(null);

    // Question form
    const [activeCategory, setActiveCategory] = useState<string | null>(null);
    const [questions, setQuestions] = useState<QuestionForm[]>([emptyQuestion()]);
    const [showQuestionForm, setShowQuestionForm] = useState(false);

    // Question list
    const [viewQuestions, setViewQuestions] = useState<string | null>(null);

    const { data: categories = [] } = useQuery<QuizCategoryItem[]>({
        queryKey: ["admin-quiz-categories"],
        queryFn: () => quizApi.getAllCategories(),
    });

    const { data: questionData } = useQuery({
        queryKey: ["admin-quiz-questions", viewQuestions],
        queryFn: () => viewQuestions ? quizApi.adminGetQuestions(viewQuestions) : null,
        enabled: !!viewQuestions,
    });

    const createCatMutation = useMutation({
        mutationFn: (data: { name: string; imageUrl: string; sortOrder?: number }) => quizApi.adminCreateCategory(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin-quiz-categories"] });
            resetCatForm();
            setCatError(null);
        },
        onError: (err: any) => {
            setCatError(err?.response?.data?.message || err?.message || "Failed to save category");
        },
    });

    const deleteCatMutation = useMutation({
        mutationFn: (id: string) => quizApi.adminDeleteCategory(id),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-quiz-categories"] }),
    });

    const addQuestionsMutation = useMutation({
        mutationFn: ({ categoryId, questions }: { categoryId: string; questions: { question: string; options: string[]; correctIndex: number }[] }) =>
            quizApi.adminAddQuestions(categoryId, questions),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin-quiz-questions", viewQuestions] });
            queryClient.invalidateQueries({ queryKey: ["admin-quiz-categories"] });
            resetQuestionForm();
        },
    });

    const deleteQuestionMutation = useMutation({
        mutationFn: (id: string) => quizApi.adminDeleteQuestion(id),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-quiz-questions", viewQuestions] }),
    });

    const resetCatForm = () => {
        setShowCatForm(false);
        setCatName("");
        setCatSortOrder(0);
        setCatImage(null);
        setCatImagePreview("");
        setCatError(null);
    };

    const resetQuestionForm = () => {
        setShowQuestionForm(false);
        setQuestions([emptyQuestion()]);
    };

    const handleCatImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setCatImage(file);
            setCatImagePreview(URL.createObjectURL(file));
        }
    };

    const handleCreateCategory = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!catName.trim() || !catImage) return;
        setCatError(null);
        setCatUploading(true);
        try {
            const url = await uploadImage(catImage);
            createCatMutation.mutate({ name: catName.trim(), imageUrl: url, sortOrder: catSortOrder });
        } catch (err: any) {
            setCatError(err?.response?.data?.message || err?.message || "Image upload failed");
        } finally { setCatUploading(false); }
    };

    const handleSubmitQuestions = (e: React.FormEvent) => {
        e.preventDefault();
        if (!activeCategory) return;
        const valid = questions.filter((q) => q.question.trim() && q.options.some((o) => o.trim()));
        if (valid.length === 0) return;
        addQuestionsMutation.mutate({
            categoryId: activeCategory,
            questions: valid.map((q, i) => ({
                question: q.question,
                options: q.options,
                correctIndex: q.correctIndex,
                sortOrder: i,
            })),
        });
    };

    const updateOption = (qIdx: number, optIdx: number, value: string) => {
        const copy = [...questions];
        copy[qIdx] = { ...copy[qIdx], options: [...copy[qIdx].options] };
        copy[qIdx].options[optIdx] = value;
        setQuestions(copy);
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-slate-800">{t("nav.quiz")}</h1>
                <p className="text-sm text-slate-500">Create quiz categories and add questions</p>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 border-b border-slate-200">
                <button onClick={() => setTab("categories")} className={`px-4 py-2 text-sm font-semibold border-b-2 transition-colors ${tab === "categories" ? "border-green-700 text-green-700" : "border-transparent text-slate-500 hover:text-slate-700"}`}>
                    <FolderOpen size={14} className="inline mr-1.5" />Categories
                </button>
            </div>

            {tab === "categories" && (
                <>
                    <div className="flex justify-end">
                        <button onClick={() => setShowCatForm(!showCatForm)} className="btn-primary text-sm flex items-center gap-2">
                            <Plus size={16} /> New Category
                        </button>
                    </div>

                    {showCatForm && (
                        <form onSubmit={handleCreateCategory} className="card p-6 bg-white space-y-4">
                            <h2 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-2">Create New Category</h2>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 mb-1">Category Name</label>
                                    <input value={catName} onChange={(e) => setCatName(e.target.value)} className="input w-full" required />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 mb-1">Sort Order</label>
                                    <input type="number" min="0" value={catSortOrder} onChange={(e) => setCatSortOrder(Number(e.target.value))} className="input w-full" />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 mb-1">Category Image</label>
                                    <input ref={fileInputRef} type="file" accept="image/*" onChange={handleCatImageSelect} className="hidden" />
                                    <div className="flex gap-2 items-center">
                                        <button type="button" onClick={() => fileInputRef.current?.click()} className="btn-outline-primary text-xs flex items-center gap-1.5">
                                            <ImageIcon size={14} /> Choose Image
                                        </button>
                                        {catImagePreview && <img src={catImagePreview} className="h-10 w-10 rounded object-cover border" />}
                                    </div>
                                </div>
                            </div>
                            {catError && (
                                <div className="text-xs text-red-600 bg-red-50 rounded-lg p-3 border border-red-200">
                                    <AlertCircle size={14} className="inline mr-1.5" />{catError}
                                </div>
                            )}
                            <div className="flex gap-3">
                                <button type="submit" disabled={catUploading || createCatMutation.isPending} className="btn-primary text-sm">
                                    {catUploading || createCatMutation.isPending ? <span className="flex items-center gap-2"><Loader2 size={14} className="animate-spin" /> Saving...</span> : "Save Category"}
                                </button>
                                <button type="button" onClick={resetCatForm} className="btn-outline-primary text-sm">Cancel</button>
                            </div>
                        </form>
                    )}

                    {categories.length === 0 ? (
                        <div className="card p-12 bg-white text-center text-sm text-slate-400">No categories created yet.</div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                            {categories.map((cat) => (
                                <div key={cat.id} className="card bg-white overflow-hidden">
                                    <div className="aspect-video bg-slate-100 relative">
                                        <img src={cat.imageUrl} alt={cat.name} className="w-full h-full object-cover" />
                                    </div>
                                    <div className="p-4 space-y-2">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <h3 className="text-sm font-bold text-slate-800">{cat.name}</h3>
                                                <p className="text-[10px] text-slate-400">{cat._count?.questions ?? 0} questions &middot; Order: {cat.sortOrder ?? 0}</p>
                                            </div>
                                            <button onClick={() => { if (confirm("Delete this category and all its questions?")) deleteCatMutation.mutate(cat.id); }} className="p-1.5 text-red-400 hover:text-red-600"><Trash2 size={16} /></button>
                                        </div>
                                        <div className="flex gap-2">
                                            <button onClick={() => { setActiveCategory(cat.id); setShowQuestionForm(true); setQuestions([emptyQuestion()]); }} className="btn-primary text-xs flex items-center gap-1 flex-1 justify-center">
                                                <Plus size={12} /> Add Questions
                                            </button>
                                            <button onClick={() => setViewQuestions(viewQuestions === cat.id ? null : cat.id)} className="btn-outline-primary text-xs flex items-center gap-1">
                                                {viewQuestions === cat.id ? <EyeOff size={12} /> : <Eye size={12} />} {viewQuestions === cat.id ? "Hide" : "View"}
                                            </button>
                                        </div>

                                        {viewQuestions === cat.id && (
                                            <div className="border-t border-slate-100 pt-2 mt-1">
                                                {questionData?.questions.length === 0 ? (
                                                    <p className="text-[10px] text-slate-400 text-center py-2">No questions yet.</p>
                                                ) : (
                                                    <div className="space-y-1 max-h-48 overflow-y-auto">
                                                        {questionData?.questions.map((q, i) => (
                                                            <div key={q.id} className="flex items-start justify-between gap-2 p-1.5 rounded bg-slate-50">
                                                                <div className="min-w-0">
                                                                    <p className="text-[10px] font-semibold text-slate-700 truncate">{i + 1}. {q.question}</p>
                                                                    <p className="text-[9px] text-slate-400">{q.options.length} options</p>
                                                                </div>
                                                                <button onClick={() => { if (confirm("Delete this question?")) deleteQuestionMutation.mutate(q.id); }} className="p-0.5 text-red-300 hover:text-red-500 shrink-0"><X size={10} /></button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Add Questions Modal */}
                    {showQuestionForm && activeCategory && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
                            <div className="bg-white rounded-xl p-6 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto space-y-4">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-sm font-bold text-slate-800">Add Questions</h2>
                                    <button onClick={resetQuestionForm} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
                                </div>
                                <form onSubmit={handleSubmitQuestions} className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-semibold text-slate-600">Questions ({questions.length})</span>
                                        <button type="button" onClick={() => setQuestions([...questions, emptyQuestion()])} className="text-xs text-green-700 hover:text-green-800 font-semibold">+ Add Question</button>
                                    </div>
                                    {questions.map((q, qIdx) => (
                                        <div key={qIdx} className="border border-slate-200 rounded-lg p-4 space-y-3">
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs font-semibold text-slate-500">Question {qIdx + 1}</span>
                                                {questions.length > 1 && (
                                                    <button type="button" onClick={() => setQuestions(questions.filter((_, i) => i !== qIdx))} className="text-red-500 hover:text-red-700"><X size={14} /></button>
                                                )}
                                            </div>
                                            <input value={q.question} onChange={(e) => { const copy = [...questions]; copy[qIdx] = { ...copy[qIdx], question: e.target.value }; setQuestions(copy); }} placeholder="Enter question" className="input w-full text-sm" required />
                                            {q.options.map((opt, optIdx) => (
                                                <div key={optIdx} className="flex items-center gap-2">
                                                    <input type="radio" name={`correct-${qIdx}`} checked={q.correctIndex === optIdx} onChange={() => { const copy = [...questions]; copy[qIdx] = { ...copy[qIdx], correctIndex: optIdx }; setQuestions(copy); }} />
                                                    <input value={opt} onChange={(e) => updateOption(qIdx, optIdx, e.target.value)} placeholder={`Option ${optIdx + 1}`} className="input flex-1 text-sm" required />
                                                    {q.correctIndex === optIdx && <span className="text-[10px] text-green-700 font-semibold">Correct</span>}
                                                </div>
                                            ))}
                                        </div>
                                    ))}
                                    <div className="flex gap-3">
                                        <button type="submit" disabled={addQuestionsMutation.isPending} className="btn-primary text-sm">
                                            {addQuestionsMutation.isPending ? <span className="flex items-center gap-2"><Loader2 size={14} className="animate-spin" /> Adding...</span> : `Add ${questions.filter((q) => q.question.trim()).length} Questions`}
                                        </button>
                                        <button type="button" onClick={resetQuestionForm} className="btn-outline-primary text-sm">Cancel</button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
