"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Loader2, X, ImageIcon, FolderOpen, Eye, AlertCircle, Edit2, Layers, Upload, TrendingUp, DollarSign, Wallet, ShoppingCart, HelpCircle, BarChart3 } from "lucide-react";
import { quizApi, uploadImage, importCsv, type QuizCategoryItem, type QuizLevelItem, type QuizAdminStats } from "@/lib/api/quiz";
import { useLocale } from "@/lib/i18n";
import { formatCurrency } from "@/lib/utils";

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
    const { t, locale } = useLocale();
    const router = useRouter();
    const queryClient = useQueryClient();
    const [tab, setTab] = useState<"categories" | "quizzes">("categories");
    const fileInputRef = useRef<HTMLInputElement>(null);

    const { data: stats } = useQuery<QuizAdminStats>({
        queryKey: ["admin-quiz-stats"],
        queryFn: () => quizApi.adminGetStats(),
    });

    // Category form
    const [showCatForm, setShowCatForm] = useState(false);
    const [editCatId, setEditCatId] = useState<string | null>(null);
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

    // Level management
    const [manageLevelCatId, setManageLevelCatId] = useState<string | null>(null);
    const [levels, setLevels] = useState<QuizLevelItem[]>([]);
    const [newLevelName, setNewLevelName] = useState("");
    const [editingLevelId, setEditingLevelId] = useState<string | null>(null);
    const [editingLevelName, setEditingLevelName] = useState("");
    const [levelLoading, setLevelLoading] = useState(false);
    const [levelError, setLevelError] = useState<string | null>(null);

    // CSV import
    const [csvImportCatId, setCsvImportCatId] = useState<string | null>(null);
    const [csvFile, setCsvFile] = useState<File | null>(null);
    const [csvUploading, setCsvUploading] = useState(false);
    const [csvResult, setCsvResult] = useState<{ imported: number; errors: { row: number; message: string }[]; total: number } | null>(null);
    const csvFileRef = useRef<HTMLInputElement>(null);

    const { data: categories = [] } = useQuery<QuizCategoryItem[]>({
        queryKey: ["admin-quiz-categories"],
        queryFn: () => quizApi.getAllCategories(),
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

    const updateCatMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: { name?: string; imageUrl?: string; sortOrder?: number } }) =>
            quizApi.adminUpdateCategory(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin-quiz-categories"] });
            resetCatForm();
            setCatError(null);
        },
        onError: (err: any) => {
            setCatError(err?.response?.data?.message || err?.message || "Failed to update category");
        },
    });

    const deleteCatMutation = useMutation({
        mutationFn: (id: string) => quizApi.adminDeleteCategory(id),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-quiz-categories"] }),
    });

    const addQuestionsMutation = useMutation({
        mutationFn: ({ categoryId, questions, levelId }: { categoryId: string; questions: { question: string; options: string[]; correctIndex: number }[]; levelId?: string }) =>
            quizApi.adminAddQuestions(categoryId, questions, levelId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin-quiz-questions", activeCategory] });
            queryClient.invalidateQueries({ queryKey: ["admin-quiz-categories"] });
            resetQuestionForm();
        },
    });

    const resetCatForm = () => {
        setShowCatForm(false);
        setEditCatId(null);
        setCatName("");
        setCatSortOrder(0);
        setCatImage(null);
        setCatImagePreview("");
        setCatError(null);
    };

    const resetQuestionForm = () => {
        setShowQuestionForm(false);
        setQuestions([emptyQuestion()]);
        setSelectedLevelId(null);
    };

    // ── Level management ─────────────────────────────────────────────────────

    const openLevelManager = async (catId: string) => {
        setManageLevelCatId(catId);
        setLevelError(null);
        setLevelLoading(true);
        try {
            const data = await quizApi.getLevels(catId);
            setLevels(data);
            queryClient.invalidateQueries({ queryKey: ["admin-quiz-categories"] });
        } catch { setLevelError("Failed to load levels"); }
        finally { setLevelLoading(false); }
    };

    const addLevel = async () => {
        if (!manageLevelCatId || !newLevelName.trim()) return;
        setLevelError(null);
        try {
            const level = await quizApi.createLevel(manageLevelCatId, { name: newLevelName.trim() });
            setLevels([...levels, level]);
            setNewLevelName("");
            queryClient.invalidateQueries({ queryKey: ["admin-quiz-categories"] });
        } catch (err: any) {
            setLevelError(err?.response?.data?.message || "Failed to add level");
        }
    };

    const startEditLevel = (level: QuizLevelItem) => {
        setEditingLevelId(level.id);
        setEditingLevelName(level.name);
    };

    const saveEditLevel = async () => {
        if (!editingLevelId || !editingLevelName.trim()) return;
        setLevelError(null);
        try {
            const updated = await quizApi.updateLevel(editingLevelId, { name: editingLevelName.trim() });
            setLevels(levels.map((l) => l.id === updated.id ? updated : l));
            setEditingLevelId(null);
            queryClient.invalidateQueries({ queryKey: ["admin-quiz-categories"] });
            setEditingLevelName("");
        } catch (err: any) {
            setLevelError(err?.response?.data?.message || "Failed to update level");
        }
    };

    const removeLevel = async (levelId: string) => {
        if (!confirm("Delete this level? Questions will remain in the category.")) return;
        setLevelError(null);
        try {
            await quizApi.deleteLevel(levelId);
            setLevels(levels.filter((l) => l.id !== levelId));
            queryClient.invalidateQueries({ queryKey: ["admin-quiz-categories"] });
        } catch (err: any) {
            setLevelError(err?.response?.data?.message || "Failed to delete level");
        }
    };

    const closeLevelManager = () => {
        setManageLevelCatId(null);
        setLevels([]);
        setNewLevelName("");
        setEditingLevelId(null);
        setLevelError(null);
    };

    const handleCatImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setCatImage(file);
            setCatImagePreview(URL.createObjectURL(file));
        }
    };

    const handleEditCategory = (cat: QuizCategoryItem) => {
        setEditCatId(cat.id);
        setCatName(cat.name);
        setCatSortOrder(cat.sortOrder ?? 0);
        setCatImage(null);
        setCatImagePreview(cat.imageUrl);
        setShowCatForm(true);
        setCatError(null);
    };

    const handleSaveCategory = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!catName.trim()) return;
        setCatError(null);
        setCatUploading(true);
        try {
            if (editCatId) {
                if (catImage) {
                    const url = await uploadImage(catImage);
                    updateCatMutation.mutate({ id: editCatId, data: { name: catName.trim(), imageUrl: url, sortOrder: catSortOrder } });
                } else {
                    updateCatMutation.mutate({ id: editCatId, data: { name: catName.trim(), sortOrder: catSortOrder } });
                }
            } else {
                if (!catImage) { setCatError("Please select an image"); setCatUploading(false); return; }
                const url = await uploadImage(catImage);
                createCatMutation.mutate({ name: catName.trim(), imageUrl: url, sortOrder: catSortOrder });
            }
        } catch (err: any) {
            setCatError(err?.response?.data?.message || err?.message || "Save failed");
        } finally { setCatUploading(false); }
    };

    const [selectedLevelId, setSelectedLevelId] = useState<string | null>(null);

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
            levelId: selectedLevelId ?? undefined,
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
                        <form onSubmit={handleSaveCategory} className="card p-6 bg-white space-y-4">
                            <h2 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-2">{editCatId ? "Edit Category" : "Create New Category"}</h2>
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
                                        {editCatId && !catImage && catImagePreview && <span className="text-[10px] text-slate-400">(current)</span>}
                                    </div>
                                </div>
                            </div>
                            {catError && (
                                <div className="text-xs text-red-600 bg-red-50 rounded-lg p-3 border border-red-200">
                                    <AlertCircle size={14} className="inline mr-1.5" />{catError}
                                </div>
                            )}
                            <div className="flex gap-3">
                                <button type="submit" disabled={catUploading || createCatMutation.isPending || updateCatMutation.isPending} className="btn-primary text-sm">
                                    {catUploading || createCatMutation.isPending || updateCatMutation.isPending ? <span className="flex items-center gap-2"><Loader2 size={14} className="animate-spin" /> Saving...</span> : editCatId ? "Update Category" : "Save Category"}
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
                                            <div className="flex gap-1">
                                                <button onClick={() => handleEditCategory(cat)} className="p-1.5 text-slate-400 hover:text-blue-600"><Edit2 size={16} /></button>
                                                <button onClick={() => { if (confirm("Delete this category and all its questions?")) deleteCatMutation.mutate(cat.id); }} className="p-1.5 text-red-400 hover:text-red-600"><Trash2 size={16} /></button>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap lg:flex-nowrap">
                                            <button onClick={() => { setActiveCategory(cat.id); setShowQuestionForm(true); setQuestions([emptyQuestion()]); setSelectedLevelId(null); }} className="btn-primary text-xs flex items-center gap-1 sm:flex-1 justify-center py-2 px-1">
                                                <Plus size={12} /> Add Questions
                                            </button>
                                            <button onClick={() => { setCsvImportCatId(cat.id); setCsvFile(null); setCsvResult(null); }} className="btn-outline-primary text-xs flex items-center gap-1 justify-center py-2 px-1">
                                                <Upload size={12} /> CSV
                                            </button>
                                            <button onClick={() => openLevelManager(cat.id)} className="btn-outline-primary text-xs flex items-center gap-1 justify-center py-2 px-1">
                                                <Layers size={12} /> Levels
                                            </button>
                                            <button onClick={() => router.push(`/admin/quiz/questions/${cat.id}`)} className="btn-outline-primary text-xs flex items-center gap-1 justify-center py-2 px-1">
                                                <Eye size={12} /> View All
                                            </button>
                                        </div>


                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* ── Quiz Sales & Financial Analytics ── */}
                    <div className="pt-6 border-t border-slate-200 space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                    <BarChart3 size={20} className="text-emerald-700" />
                                    Quiz Sales & Financial Overview
                                </h2>
                                <p className="text-xs text-slate-500">Live sales performance, user reward payouts, and net profit analytics</p>
                            </div>
                        </div>

                        {/* Financial Metric Cards */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                            <div className="card p-5 bg-white border border-slate-200 shadow-sm">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Total Quizzes Sold</span>
                                    <ShoppingCart size={18} className="text-blue-600" />
                                </div>
                                <span className="text-2xl font-bold text-slate-800">{stats?.totalQuizzesSold ?? 0}</span>
                                <span className="text-[10px] text-slate-400 block mt-1">({stats?.completedQuizzes ?? 0} completed)</span>
                            </div>

                            <div className="card p-5 bg-white border border-slate-200 shadow-sm">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Questions Sold</span>
                                    <HelpCircle size={18} className="text-purple-600" />
                                </div>
                                <span className="text-2xl font-bold text-purple-700">{stats?.totalQuestionsSold ?? 0}</span>
                                <span className="text-[10px] text-slate-400 block mt-1">questions answered</span>
                            </div>

                            <div className="card p-5 bg-white border border-slate-200 shadow-sm">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Total Quiz Revenue</span>
                                    <TrendingUp size={18} className="text-emerald-600" />
                                </div>
                                <span className="text-2xl font-bold text-emerald-700">{formatCurrency(stats?.totalRevenue ?? 0, locale)}</span>
                                <span className="text-[10px] text-slate-400 block mt-1">sales amount</span>
                            </div>

                            <div className="card p-5 bg-white border border-slate-200 shadow-sm">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Rewards Paid Out</span>
                                    <Wallet size={18} className="text-rose-600" />
                                </div>
                                <span className="text-2xl font-bold text-rose-700">- {formatCurrency(stats?.totalUserRewardsPaid ?? 0, locale)}</span>
                                <span className="text-[10px] text-slate-400 block mt-1">user score payouts</span>
                            </div>

                            <div className="card p-5 bg-slate-900 text-white border border-slate-800 shadow-sm">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Quiz Net Profit</span>
                                    <DollarSign size={18} className={(stats?.netProfit ?? 0) >= 0 ? "text-emerald-400" : "text-rose-400"} />
                                </div>
                                <span className={`text-2xl font-bold ${(stats?.netProfit ?? 0) >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                                    {(stats?.netProfit ?? 0) >= 0 ? "+ " : "- "}
                                    {formatCurrency(Math.abs(stats?.netProfit ?? 0), locale)}
                                </span>
                                <span className="text-[10px] text-slate-400 block mt-1">revenue - rewards</span>
                            </div>
                        </div>

                        {/* Category Sales Breakdown Table */}
                        {stats?.categoryStats && stats.categoryStats.length > 0 && (
                            <div className="card bg-white border border-slate-200 overflow-hidden shadow-sm">
                                <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                                    <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Category Sales & Revenue Breakdown</h3>
                                    <span className="text-[11px] text-slate-500 font-semibold">{stats.categoryStats.length} Categories</span>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-xs">
                                        <thead className="bg-slate-100 text-slate-600 font-bold border-b border-slate-200">
                                            <tr>
                                                <th className="p-3">Category</th>
                                                <th className="p-3 text-center">Total Questions</th>
                                                <th className="p-3 text-center">Quizzes Sold</th>
                                                <th className="p-3 text-center">Questions Sold</th>
                                                <th className="p-3 text-right">Total Revenue</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 text-slate-700">
                                            {stats.categoryStats.map((c) => (
                                                <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                                                    <td className="p-3 flex items-center gap-2 font-semibold text-slate-800">
                                                        <img src={c.imageUrl} alt={c.name} className="w-7 h-7 rounded object-cover border border-slate-200" />
                                                        {c.name}
                                                    </td>
                                                    <td className="p-3 text-center font-medium">{c.totalQuestions}</td>
                                                    <td className="p-3 text-center font-bold text-blue-700">{c.totalSold}</td>
                                                    <td className="p-3 text-center font-medium text-purple-700">{c.totalQuestionsSold}</td>
                                                    <td className="p-3 text-right font-bold text-emerald-700">{formatCurrency(c.totalRevenue, locale)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {/* Recent User Quiz Purchase & Score Logs */}
                        {stats?.userPurchaseLogs && stats.userPurchaseLogs.length > 0 && (
                            <div className="card bg-white border border-slate-200 overflow-hidden shadow-sm">
                                <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                                    <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">User Quiz Attempts & Profit/Loss History</h3>
                                    <span className="text-[11px] text-slate-500 font-semibold">{stats.userPurchaseLogs.length} Recent Attempts</span>
                                </div>
                                <div className="overflow-x-auto max-h-96 overflow-y-auto">
                                    <table className="w-full text-left text-xs">
                                        <thead className="bg-slate-100 text-slate-600 font-bold border-b border-slate-200 sticky top-0">
                                            <tr>
                                                <th className="p-3">User</th>
                                                <th className="p-3">Quiz Category</th>
                                                <th className="p-3 text-center">Questions</th>
                                                <th className="p-3 text-center">Correct / Wrong</th>
                                                <th className="p-3 text-right">Price Paid</th>
                                                <th className="p-3 text-right">User Reward</th>
                                                <th className="p-3 text-right">Platform Net Profit</th>
                                                <th className="p-3 text-center">Status</th>
                                                <th className="p-3 text-right">Date</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 text-slate-700">
                                            {stats.userPurchaseLogs.map((log) => (
                                                <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                                                    <td className="p-3 font-semibold text-slate-800">
                                                        <div>{log.user.name}</div>
                                                        <div className="text-[10px] text-slate-400 font-normal">{log.user.phone || log.user.email}</div>
                                                    </td>
                                                    <td className="p-3 font-medium text-slate-700">
                                                        {log.category.name}
                                                    </td>
                                                    <td className="p-3 text-center font-bold text-slate-700">{log.questionCount}</td>
                                                    <td className="p-3 text-center">
                                                        {log.status === "COMPLETED" ? (
                                                            <div className="flex justify-center gap-1.5 font-bold">
                                                                <span className="text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">✓ {log.correctCount}</span>
                                                                <span className="text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">✗ {log.wrongCount}</span>
                                                            </div>
                                                        ) : (
                                                            <span className="text-[10px] text-slate-400">In Progress</span>
                                                        )}
                                                    </td>
                                                    <td className="p-3 text-right font-bold text-slate-800">{formatCurrency(log.pricePaid, locale)}</td>
                                                    <td className="p-3 text-right font-bold text-rose-700">
                                                        {log.userReward > 0 ? `- ${formatCurrency(log.userReward, locale)}` : "৳0"}
                                                    </td>
                                                    <td className={`p-3 text-right font-bold ${log.platformProfit >= 0 ? "text-emerald-700" : "text-rose-700"}`}>
                                                        {log.platformProfit >= 0 ? "+ " : "- "}
                                                        {formatCurrency(Math.abs(log.platformProfit), locale)}
                                                    </td>
                                                    <td className="p-3 text-center">
                                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${log.status === "COMPLETED" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}`}>
                                                            {log.status}
                                                        </span>
                                                    </td>
                                                    <td className="p-3 text-right text-[10px] text-slate-500">
                                                        {new Date(log.purchasedAt).toLocaleDateString()}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Level Manager Modal */}
                    {manageLevelCatId && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
                            <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4 space-y-4">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-sm font-bold text-slate-800">Manage Levels</h2>
                                    <button onClick={closeLevelManager} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
                                </div>

                                {levelError && (
                                    <div className="text-xs text-red-600 bg-red-50 rounded-lg p-3 border border-red-200">
                                        <AlertCircle size={14} className="inline mr-1.5" />{levelError}
                                    </div>
                                )}

                                <div className="flex gap-2">
                                    <input value={newLevelName} onChange={(e) => setNewLevelName(e.target.value)} placeholder="Level name (e.g. Easy)" className="input flex-1 text-sm" />
                                    <button onClick={addLevel} disabled={!newLevelName.trim()} className="btn-primary text-sm"><Plus size={14} /> Add</button>
                                </div>

                                {levelLoading ? (
                                    <div className="py-8 text-center text-slate-400"><Loader2 size={20} className="animate-spin inline" /> Loading...</div>
                                ) : levels.length === 0 ? (
                                    <div className="py-8 text-center text-slate-400 text-sm">No levels yet. Add one above.</div>
                                ) : (
                                    <div className="space-y-2 max-h-64 overflow-y-auto">
                                        {levels.map((level) => (
                                            <div key={level.id} className="flex items-center justify-between gap-2 p-3 rounded-lg border border-slate-100">
                                                {editingLevelId === level.id ? (
                                                    <div className="flex-1 flex gap-2">
                                                        <input value={editingLevelName} onChange={(e) => setEditingLevelName(e.target.value)} className="input flex-1 text-sm py-1" autoFocus />
                                                        <button onClick={saveEditLevel} className="btn-primary text-xs py-1">Save</button>
                                                        <button onClick={() => setEditingLevelId(null)} className="btn-outline-primary text-xs py-1">Cancel</button>
                                                    </div>
                                                ) : (
                                                    <>
                                                        <div>
                                                            <span className="text-sm font-semibold text-slate-700">{level.name}</span>
                                                            <span className="text-[10px] text-slate-400 ml-2">{level._count?.questions ?? 0} questions</span>
                                                        </div>
                                                        <div className="flex gap-1">
                                                            <button onClick={() => startEditLevel(level)} className="p-1 text-slate-400 hover:text-blue-600"><Edit2 size={14} /></button>
                                                            <button onClick={() => removeLevel(level.id)} className="p-1 text-red-400 hover:text-red-600"><Trash2 size={14} /></button>
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* CSV Import Modal */}
                    {csvImportCatId && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
                            <div className="bg-white rounded-xl p-6 w-full max-w-lg mx-4 space-y-4">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-sm font-bold text-slate-800">Import Questions from CSV</h2>
                                    <button onClick={() => { setCsvImportCatId(null); setCsvFile(null); setCsvResult(null); }} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
                                </div>

                                <p className="text-xs text-slate-500">
                                    CSV columns: <code className="bg-slate-100 px-1 rounded">question, option1, option2, option3, option4, correctIndex, level</code>
                                    <br />correctIndex: 0-3. level: optional, must match existing level name.
                                </p>

                                {!csvResult && (
                                    <div className="space-y-3">
                                        <input ref={csvFileRef} type="file" accept=".csv" onChange={(e) => setCsvFile(e.target.files?.[0] ?? null)} className="block w-full text-sm text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100" />
                                        <button
                                            onClick={async () => {
                                                if (!csvFile) return;
                                                setCsvUploading(true);
                                                setCsvResult(null);
                                                try {
                                                    const result = await importCsv(csvImportCatId, csvFile);
                                                    setCsvResult(result);
                                                    queryClient.invalidateQueries({ queryKey: ["admin-quiz-categories"] });
                                                    queryClient.invalidateQueries({ queryKey: ["admin-quiz-questions", csvImportCatId] });
                                                } catch (err: any) {
                                                    setCsvResult({ imported: 0, errors: [{ row: 0, message: err?.response?.data?.message || err?.message || "Upload failed" }], total: 0 });
                                                } finally { setCsvUploading(false); }
                                            }}
                                            disabled={!csvFile || csvUploading}
                                            className="btn-primary text-sm"
                                        >
                                            {csvUploading ? <span className="flex items-center gap-2"><Loader2 size={14} className="animate-spin" /> Uploading...</span> : "Upload & Import"}
                                        </button>
                                    </div>
                                )}

                                {csvResult && (
                                    <div className="space-y-3">
                                        <div className="flex gap-4 text-sm">
                                            <div className="bg-green-50 text-green-700 rounded-lg p-3 flex-1 text-center">
                                                <p className="text-lg font-bold">{csvResult.imported}</p>
                                                <p className="text-xs">Imported</p>
                                            </div>
                                            <div className="bg-red-50 text-red-600 rounded-lg p-3 flex-1 text-center">
                                                <p className="text-lg font-bold">{csvResult.errors.length}</p>
                                                <p className="text-xs">Errors</p>
                                            </div>
                                        </div>
                                        {csvResult.errors.length > 0 && (
                                            <div className="max-h-40 overflow-y-auto space-y-1">
                                                {csvResult.errors.map((e, i) => (
                                                    <div key={i} className="text-xs text-red-600 bg-red-50 rounded p-2">
                                                        Row {e.row}: {e.message}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                        <button onClick={() => { setCsvFile(null); setCsvResult(null); }} className="btn-outline-primary text-sm">Import Another</button>
                                    </div>
                                )}
                            </div>
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
                                    {/* Level selector */}
                                    {activeCategory && categories.find(c => c.id === activeCategory)?.levels && categories.find(c => c.id === activeCategory)!.levels!.length > 0 && (
                                        <div>
                                            <label className="block text-xs font-semibold text-slate-600 mb-1">Assign to Level (optional)</label>
                                            <select value={selectedLevelId ?? ""} onChange={(e) => setSelectedLevelId(e.target.value || null)} className="input w-full text-sm">
                                                <option value="">No level (general)</option>
                                                {categories.find(c => c.id === activeCategory)!.levels!.map((l) => (
                                                    <option key={l.id} value={l.id}>{l.name} ({l._count?.questions ?? 0} questions)</option>
                                                ))}
                                            </select>
                                        </div>
                                    )}
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
