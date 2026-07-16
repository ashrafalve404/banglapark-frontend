"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader2, Clock, CheckCircle, XCircle, AlertTriangle, Award, ArrowRight, ChevronLeft } from "lucide-react";
import { quizApi, type QuizAttemptData } from "@/lib/api/quiz";
import { useLocale } from "@/lib/i18n";

export default function QuizAttemptPage() {
    const params = useParams<{ purchaseId: string }>();
    const router = useRouter();
    const queryClient = useQueryClient();
    const { t } = useLocale();
    const [selected, setSelected] = useState<Record<string, number>>({});
    const [currentIdx, setCurrentIdx] = useState(0);
    const [submitted, setSubmitted] = useState(false);
    const [timeLeft, setTimeLeft] = useState<number | null>(null);
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const submittingRef = useRef(false);

    const { data: attempt, isLoading, error } = useQuery<QuizAttemptData>({
        queryKey: ["quiz-attempt", params.purchaseId],
        queryFn: () => quizApi.startAttempt(params.purchaseId),
        enabled: !!params.purchaseId,
    });

    const submitMutation = useMutation({
        mutationFn: (answers: { questionId: string; selectedIndex: number }[]) =>
            quizApi.submitAttempt(params.purchaseId, answers),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["quiz-purchases"] });
            setSubmitted(true);
        },
    });

    const questions = attempt?.questions ?? [];
    const totalQuestions = questions.length;
    const currentQ = questions[currentIdx];
    const isLast = currentIdx === totalQuestions - 1;
    const allAnswered = questions.every((q) => selected[q.id] !== undefined);

    const doSubmit = () => {
        if (submittingRef.current) return;
        submittingRef.current = true;
        if (timerRef.current) clearInterval(timerRef.current);
        const answers = Object.entries(selected).map(([questionId, selectedIndex]) => ({
            questionId,
            selectedIndex,
        }));
        submitMutation.mutate(answers);
    };

    // Initialize timer
    useEffect(() => {
        if (!attempt || submitted || submitMutation.isSuccess) return;
        const timeLimitMs = attempt.quiz.timeLimit * 60 * 1000;
        const started = new Date(attempt.startedAt).getTime();
        const elapsed = Date.now() - started;
        const remaining = Math.max(0, timeLimitMs - elapsed);

        if (remaining <= 0) {
            doSubmit();
            return;
        }

        setTimeLeft(Math.floor(remaining / 1000));

        timerRef.current = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev === null || prev <= 1) {
                    if (timerRef.current) clearInterval(timerRef.current);
                    doSubmit();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [attempt?.startedAt, submitted]);

    const handleSelect = (qId: string, optIdx: number) => {
        if (submitted) return;
        const next = { ...selected, [qId]: optIdx };
        setSelected(next);

        // Auto-advance after a brief delay so user sees the selection
        setTimeout(() => {
            if (isLast) {
                // On last question, submit automatically
                doSubmit();
            } else {
                setCurrentIdx((prev) => prev + 1);
            }
        }, 300);
    };

    const goTo = (idx: number) => {
        if (idx >= 0 && idx < totalQuestions) setCurrentIdx(idx);
    };

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s.toString().padStart(2, "0")}`;
    };

    if (isLoading) {
        return <div className="flex justify-center py-20"><Loader2 className="animate-spin" size={32} /></div>;
    }

    if (error || !attempt) {
        return (
            <div className="max-w-2xl mx-auto text-center py-20">
                <AlertTriangle size={48} className="mx-auto text-red-400 mb-3" />
                <p className="text-sm text-gray-500">Failed to load quiz</p>
                <button onClick={() => router.push("/dashboard/quiz")} className="btn-outline-primary text-sm mt-4">{t("dashboard.quiz.backToQuizzes")}</button>
            </div>
        );
    }

    // Show result view
    if (submitted || submitMutation.isSuccess || attempt.purchase.status !== "PURCHASED") {
        const purchase = attempt.purchase;
        const isTimeout = purchase.status === "TIMEOUT" || (submitted && timeLeft === 0);
        const score = purchase.score ?? submitMutation.data?.score ?? 0;
        const total = purchase.totalQuestions ?? submitMutation.data?.totalQuestions ?? totalQuestions;

        return (
            <div className="max-w-lg mx-auto space-y-6">
                <div className="card p-8 bg-white text-center space-y-4">
                    {isTimeout ? (
                        <XCircle size={48} className="mx-auto text-red-500" />
                    ) : (
                        <Award size={48} className="mx-auto text-green-600" />
                    )}
                    <h2 className="text-xl font-bold text-gray-800">
                        {isTimeout ? t("dashboard.quiz.timedOut") : t("dashboard.quiz.result")}
                    </h2>
                    <div className="text-4xl font-bold text-green-700">{score} / {total}</div>
                    <p className="text-sm text-gray-500">
                        {score >= total / 2 ? t("dashboard.quiz.correct") : t("dashboard.quiz.wrong")}
                    </p>
                    <button onClick={() => router.push("/dashboard/quiz")} className="btn-primary text-sm">
                        {t("dashboard.quiz.backToQuizzes")}
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto space-y-4">
            {/* Timer + Progress bar */}
            <div className="sticky top-0 z-10 bg-white rounded-lg border border-gray-200 p-3 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                        <Clock size={18} className={timeLeft !== null && timeLeft < 30 ? "text-red-500" : "text-green-600"} />
                        <span>{timeLeft !== null ? formatTime(timeLeft) : "--:--"}</span>
                    </div>
                    <span className="text-xs text-gray-400">Q{currentIdx + 1}/{totalQuestions}</span>
                </div>
                {/* Progress bar */}
                <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-green-600 rounded-full transition-all duration-300"
                        style={{ width: `${((currentIdx + 1) / totalQuestions) * 100}%` }}
                    />
                </div>
                {/* Question dots */}
                <div className="flex gap-1 mt-2">
                    {Array.from({ length: totalQuestions }).map((_, i) => (
                        <button
                            key={i}
                            onClick={() => goTo(i)}
                            className={`h-2 flex-1 rounded-full transition-colors ${
                                selected[questions[i]?.id] !== undefined
                                    ? "bg-green-600"
                                    : i === currentIdx
                                        ? "bg-green-300"
                                        : "bg-gray-200"
                            }`}
                        />
                    ))}
                </div>
            </div>

            {/* Current question */}
            {currentQ && (
                <div className="card p-6 bg-white space-y-4">
                    <p className="text-base font-semibold text-gray-800">
                        {currentIdx + 1}. {currentQ.question}
                    </p>
                    <div className="space-y-2">
                        {currentQ.options.map((opt, oi) => {
                            const isSelected = selected[currentQ.id] === oi;
                            return (
                                <button
                                    key={oi}
                                    onClick={() => handleSelect(currentQ.id, oi)}
                                    className={`w-full flex items-center gap-3 p-4 rounded-lg border text-sm text-left transition-all ${
                                        isSelected
                                            ? "border-green-600 bg-green-50 ring-1 ring-green-600"
                                            : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                                    }`}
                                >
                                    <span className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                                        isSelected ? "border-green-600 bg-green-600" : "border-gray-300"
                                    }`}>
                                        {isSelected && <CheckCircle size={14} className="text-white" />}
                                    </span>
                                    <span className="text-gray-700">{opt}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Navigation */}
            <div className="flex items-center justify-between">
                <button
                    onClick={() => goTo(currentIdx - 1)}
                    disabled={currentIdx === 0}
                    className="btn-outline-primary text-sm flex items-center gap-1 disabled:opacity-30"
                >
                    <ChevronLeft size={16} /> Previous
                </button>
                {!isLast ? (
                    <button
                        onClick={() => goTo(currentIdx + 1)}
                        disabled={currentIdx === totalQuestions - 1}
                        className="btn-outline-primary text-sm flex items-center gap-1 disabled:opacity-30"
                    >
                        Next <ArrowRight size={16} />
                    </button>
                ) : (
                    <button
                        onClick={doSubmit}
                        disabled={!allAnswered || submitMutation.isPending}
                        className="btn-primary text-sm flex items-center gap-2"
                    >
                        {submitMutation.isPending ? (
                            <Loader2 size={16} className="animate-spin" />
                        ) : (
                            <CheckCircle size={16} />
                        )}
                        {submitMutation.isPending ? t("dashboard.quiz.submitting") : t("dashboard.quiz.submit")}
                    </button>
                )}
            </div>
        </div>
    );
}
