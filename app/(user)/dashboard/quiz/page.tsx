"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, HelpCircle, Clock, DollarSign, CheckCircle, Award, Wallet, ArrowLeft, ShoppingCart } from "lucide-react";
import { quizApi, type QuizCategoryItem, type QuizPurchaseInfo, type QuizLevelItem } from "@/lib/api/quiz";
import { walletApi } from "@/lib/api/wallet";
import { useLocale } from "@/lib/i18n";
import { formatCurrency } from "@/lib/utils";

const PRICE_PER_QUESTION = 1;

export default function QuizPage() {
    const { t, locale } = useLocale();
    const router = useRouter();
    const searchParams = useSearchParams();
    const queryClient = useQueryClient();
    const categoryFilter = searchParams.get("category");
    const [questionCount, setQuestionCount] = useState(10);
    const [payMethod, setPayMethod] = useState<"WALLET" | "BKASH">("WALLET");
    const [selectedLevelId, setSelectedLevelId] = useState<string | null>(null);
    const [purchaseModal, setPurchaseModal] = useState<{ categoryId: string; name: string; maxQuestions: number; levelId?: string | null; levelName?: string } | null>(null);
    const [purchaseError, setPurchaseError] = useState<string | null>(null);

    const { data: categories = [] } = useQuery<QuizCategoryItem[]>({
        queryKey: ["quiz-categories"],
        queryFn: () => quizApi.getCategories(),
    });

    const activeCategory = categoryFilter ? categories.find((c) => c.id === categoryFilter) : null;

    const { data: countData } = useQuery({
        queryKey: ["quiz-category-count", categoryFilter],
        queryFn: () => (categoryFilter ? quizApi.getCategoryCount(categoryFilter) : null),
        enabled: !!categoryFilter,
    });

    const totalQuestions = countData?.total ?? 0;

    const { data: purchases = [], isLoading: pLoading } = useQuery<QuizPurchaseInfo[]>({
        queryKey: ["quiz-purchases"],
        queryFn: () => quizApi.getPurchased(),
    });

    const { data: wallet } = useQuery({
        queryKey: ["wallet"],
        queryFn: () => walletApi.balance(),
    });

    const purchaseMutation = useMutation({
        mutationFn: ({ categoryId, questionCount, method, levelId }: { categoryId: string; questionCount: number; method: string; levelId?: string }) =>
            quizApi.purchase(categoryId, { questionCount, paymentMethod: method, levelId }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["quiz-purchases"] });
            queryClient.invalidateQueries({ queryKey: ["wallet"] });
            setPurchaseModal(null);
            setSelectedLevelId(null);
            setPurchaseError(null);
            // Do NOT auto-start — user must click Start Quiz
        },
        onError: (err: any) => {
            setPurchaseError(err?.response?.data?.message || err?.message || "Purchase failed");
        },
    });

    const catPurchases = categoryFilter ? purchases.filter((p) => p.categoryId === categoryFilter && p.status === "PURCHASED") : [];
    const hasActivePurchase = catPurchases.length > 0;
    const selectedLevelObj = selectedLevelId ? activeCategory?.levels?.find(l => l.id === selectedLevelId) : null;
    const maxQuestionsForLevel = selectedLevelObj ? (selectedLevelObj._count?.questions ?? 0) : totalQuestions;

    if (pLoading) {
        return <div className="flex justify-center py-20"><Loader2 className="animate-spin" size={32} /></div>;
    }

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            {/* Header */}
            <div>
                <div className="flex items-center gap-3 mb-1">
                    {categoryFilter && activeCategory ? (
                        <button onClick={() => router.push("/dashboard/quiz")} className="p-1 text-gray-400 hover:text-gray-600">
                            <ArrowLeft size={18} />
                        </button>
                    ) : null}
                    <h1 className="text-2xl font-bold text-gray-800">
                        {activeCategory ? activeCategory.name : t("dashboard.quiz.title")}
                    </h1>
                </div>
            </div>

            {/* Category grid (no filter) */}
            {!categoryFilter ? (
                categories.length === 0 ? (
                    <div className="card p-12 bg-white flex flex-col items-center gap-3 text-gray-400">
                        <HelpCircle size={48} />
                        <p className="text-sm">{t("dashboard.quiz.noQuizzes")}</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                        {categories.map((cat) => (
                            <button
                                key={cat.id}
                                onClick={() => router.push(`/dashboard/quiz?category=${cat.id}`)}
                                className="group rounded-xl overflow-hidden border border-gray-200 bg-white hover:-translate-y-0.5 transition-transform text-left"
                            >
                                <div className="aspect-[4/3] bg-gray-100">
                                    <img src={cat.imageUrl} alt={cat.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                                </div>
                                <div className="p-3">
                                    <p className="text-sm font-bold text-gray-800 truncate">{cat.name}</p>
                                    <p className="text-[10px] text-gray-400">{cat._count?.questions ?? 0} questions available</p>
                                    {purchases.some((p) => p.categoryId === cat.id && p.status === "PURCHASED") && (
                                        <span className="inline-block mt-1 text-[9px] text-green-700 font-semibold bg-green-50 px-2 py-0.5 rounded-full">Purchased</span>
                                    )}
                                </div>
                            </button>
                        ))}
                    </div>
                )
            ) : !activeCategory ? (
                <div className="card p-12 bg-white text-center text-sm text-gray-400">Category not found</div>
            ) : (
                /* Category detail page */
                <div className="space-y-6">
                    {/* Category hero */}
                    <div className="card bg-white overflow-hidden">
                        <div className="aspect-[3/1] bg-gray-100">
                            <img src={activeCategory.imageUrl} alt={activeCategory.name} className="w-full h-full object-cover" />
                        </div>
                        <div className="p-5">
                            <h2 className="text-lg font-bold text-gray-900">{activeCategory.name}</h2>
                            <p className="text-xs text-gray-400 mt-1">{totalQuestions} questions available</p>
                        </div>
                    </div>

                    {/* Level cards */}
                    {activeCategory.levels && activeCategory.levels.length > 0 && (
                        <div>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                {activeCategory.levels.map((level) => (
                                    <button
                                        key={level.id}
                                        onClick={() => {
                                            setSelectedLevelId(selectedLevelId === level.id ? null : level.id);
                                        }}
                                        className={`card p-4 bg-white text-left border-2 transition-all ${selectedLevelId === level.id ? "border-green-600 bg-green-50" : "border-transparent hover:border-gray-200"}`}
                                    >
                                        <p className="text-sm font-bold text-gray-800">{level.name}</p>
                                        <p className="text-[10px] text-gray-400 mt-0.5">{level._count?.questions ?? 0} questions</p>
                                    </button>
                                ))}
                                {selectedLevelId && (
                                    <button
                                        onClick={() => setSelectedLevelId(null)}
                                        className="card p-4 bg-white text-left border-2 border-green-600 bg-green-50"
                                    >
                                        <p className="text-sm font-bold text-gray-800">All Questions</p>
                                        <p className="text-[10px] text-gray-400 mt-0.5">{totalQuestions} questions</p>
                                    </button>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Purchase section */}
                    <div className="card p-5 bg-white">
                        <h3 className="text-sm font-bold text-gray-800 mb-3">Purchase Quiz Questions</h3>

                        {selectedLevelId && (
                            <div className="mb-3 flex items-center gap-2 text-xs text-green-700 bg-green-50 rounded-lg px-3 py-2">
                                <CheckCircle size={14} />
                                Selected level: {activeCategory.levels?.find(l => l.id === selectedLevelId)?.name ?? "All Questions"}
                            </div>
                        )}

                        <div className="flex items-center gap-4 mb-4">
                            <div className="flex-1">
                                <label className="text-xs text-gray-500 font-semibold block mb-1">Number of Questions</label>
                                <div className="flex items-center gap-2">
                                    <button onClick={() => setQuestionCount(Math.max(1, questionCount - 5))} className="btn-outline-primary text-xs px-2 py-1">-5</button>
                                    <input
                                        type="number"
                                        min={1}
                                        max={maxQuestionsForLevel}
                                        value={questionCount}
                                        onChange={(e) => setQuestionCount(Math.min(maxQuestionsForLevel, Math.max(1, Number(e.target.value) || 1)))}
                                        className="input w-24 text-center text-sm"
                                    />
                                    <button onClick={() => setQuestionCount(Math.min(maxQuestionsForLevel, questionCount + 5))} className="btn-outline-primary text-xs px-2 py-1">+5</button>
                                </div>
                            </div>
                            <div className="text-right">
                                <label className="text-xs text-gray-500 font-semibold block mb-1">Total Price</label>
                                <p className="text-2xl font-extrabold text-green-700">{formatCurrency(questionCount * PRICE_PER_QUESTION, locale)}</p>
                                <p className="text-[10px] text-gray-400">{PRICE_PER_QUESTION} tk/question</p>
                            </div>
                        </div>

                        {hasActivePurchase ? (
                            <div className="space-y-2">
                                <p className="text-xs text-green-700 font-semibold flex items-center gap-1"><CheckCircle size={14} /> You have an active purchase for this category</p>
                                {catPurchases.map((p) => {
                                    const isStarted = (p.answers?.length ?? 0) > 0;
                                    return (
                                        <button
                                            key={p.id}
                                            onClick={() => router.push(`/dashboard/quiz/attempt/${p.id}`)}
                                            className="btn-primary text-sm w-full"
                                        >
                                            {isStarted
                                                ? `Continue Quiz — ${p.answers!.length}/${p.questionCount} answered`
                                                : `▶ Start Quiz (${p.questionCount} questions)`
                                            }
                                        </button>
                                    );
                                })}
                            </div>
                        ) : (
                            <button
                                onClick={() => {
                                    const levelName = selectedLevelId ? activeCategory.levels?.find(l => l.id === selectedLevelId)?.name : undefined;
                                    setPurchaseModal({ categoryId: categoryFilter, name: activeCategory.name, maxQuestions: maxQuestionsForLevel, levelId: selectedLevelId, levelName });
                                }}
                                disabled={totalQuestions === 0}
                                className="btn-primary text-sm w-full flex items-center justify-center gap-2"
                            >
                                <ShoppingCart size={16} /> Buy Quiz Questions
                            </button>
                        )}
                    </div>

                    {/* Past purchases */}
                    {purchases.filter((p) => p.categoryId === categoryFilter && p.status === "COMPLETED").length > 0 && (
                        <div>
                            <h3 className="text-sm font-bold text-gray-800 mb-2">Results</h3>
                            <div className="space-y-2">
                                {purchases.filter((p) => p.categoryId === categoryFilter && p.status === "COMPLETED").map((p) => (
                                    <button
                                        key={p.id}
                                        onClick={() => router.push(`/dashboard/quiz/result/${p.id}`)}
                                        className="card p-3 bg-white flex items-center justify-between w-full text-left"
                                    >
                                        <div className="text-xs">
                                            <span className="font-semibold text-gray-800">{p.questionCount} questions</span>
                                            {p.level && <span className="ml-1.5 text-blue-600">({p.level.name})</span>}
                                            <span className="ml-2 text-green-700 font-semibold">
                                                <Award size={12} className="inline mr-0.5" />
                                                {p.answers?.filter((a) => a.isCorrect).length ?? 0}/{p.questionCount}
                                            </span>
                                        </div>
                                        <span className="text-[10px] text-green-700 hover:underline font-semibold">View Result</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Purchase Modal */}
            {purchaseModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
                    <div className="bg-white rounded-xl p-6 w-full max-w-sm mx-4 space-y-4">
                        <h3 className="text-sm font-bold text-gray-800">Complete Purchase</h3>
                        <p className="text-xs text-gray-500">{purchaseModal.name}</p>
                        {purchaseModal.levelName && (
                            <p className="text-xs text-blue-600 font-semibold">Level: {purchaseModal.levelName}</p>
                        )}
                        <p className="text-lg font-extrabold text-green-700">{questionCount} questions = {formatCurrency(questionCount * PRICE_PER_QUESTION, locale)}</p>

                        <div className="space-y-2">
                            <div className="w-full flex items-center gap-3 p-3 rounded-lg border border-green-600 bg-green-50 text-sm">
                                <Wallet size={18} />
                                <div className="text-left">
                                    <p className="font-semibold text-gray-800">{t("dashboard.quiz.payWallet")}</p>
                                    <p className="text-[10px] text-gray-400">{wallet ? formatCurrency(Number(wallet.balance), locale) : "..."}</p>
                                </div>
                                <CheckCircle size={16} className="ml-auto text-green-700" />
                            </div>
                        </div>

                        {wallet && Number(wallet.balance) < questionCount * PRICE_PER_QUESTION && (
                            <p className="text-xs text-red-600 text-center">Insufficient balance</p>
                        )}

                        {purchaseError && (
                            <p className="text-xs text-red-600 text-center bg-red-50 rounded-lg p-2">{purchaseError}</p>
                        )}
                        <div className="flex gap-3">
                            <button
                                onClick={() => {
                                    setPurchaseError(null);
                                    purchaseMutation.mutate({ categoryId: purchaseModal.categoryId, questionCount, method: payMethod, levelId: purchaseModal.levelId ?? undefined });
                                }}
                                disabled={purchaseMutation.isPending}
                                className="btn-primary flex-1 text-sm"
                            >
                                {purchaseMutation.isPending ? <Loader2 size={14} className="animate-spin mx-auto" /> : "Buy Now"}
                            </button>
                            <button onClick={() => { setPurchaseModal(null); setPurchaseError(null); }} className="btn-outline-primary text-sm">Cancel</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
