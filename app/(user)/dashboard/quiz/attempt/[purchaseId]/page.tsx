"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader2, Clock, CheckCircle, XCircle, Award, ArrowRight } from "lucide-react";
import { quizApi, type QuizNextQuestion } from "@/lib/api/quiz";
import { useLocale } from "@/lib/i18n";
import { formatCurrency } from "@/lib/utils";
import { useState } from "react";

export default function QuizAttemptPage() {
    const { purchaseId } = useParams<{ purchaseId: string }>();
    const router = useRouter();
    const { t, locale } = useLocale();
    const queryClient = useQueryClient();
    const [currentQuestion, setCurrentQuestion] = useState<QuizNextQuestion | null>(null);
    const [selectedOption, setSelectedOption] = useState<number | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [finished, setFinished] = useState(false);
    const [result, setResult] = useState<{ score: number; totalQuestions: number; netReward?: number } | null>(null);
    const [timeLeft, setTimeLeft] = useState(60);
    const [answeredQuestions, setAnsweredQuestions] = useState(0);

    const timerRef = useRef<NodeJS.Timeout | null>(null);

    // Load result if already completed
    const { data: existingResult } = useQuery({
        queryKey: ["quiz-result", purchaseId],
        queryFn: () => quizApi.getResult(purchaseId),
        enabled: false, // only used on error
    });

    // Start the attempt
    const { data: attemptData, isLoading: startLoading, error: startError } = useQuery({
        queryKey: ["quiz-attempt", purchaseId],
        queryFn: () => quizApi.startAttempt(purchaseId),
        retry: false,
    });

    // If already completed, load result
    useEffect(() => {
        if (startError) {
            // Attempt may be completed - try loading result
            quizApi.getResult(purchaseId).then((data: any) => {
                setFinished(true);
                setResult({ score: data.score ?? 0, totalQuestions: data.questionCount ?? 0, netReward: data.netReward });
            }).catch(() => {
                router.push("/dashboard/quiz");
            });
        }
    }, [startError]);

    // Load first question
    useEffect(() => {
        if (attemptData) {
            loadNextQuestion();
        }
    }, [attemptData]);

    const loadNextQuestion = useCallback(async () => {
        try {
            const data = await quizApi.getNextQuestion(purchaseId);
            if (data.completed) {
                setFinished(true);
                setResult({ score: data.score ?? 0, totalQuestions: data.totalQuestions ?? 0 });
                return;
            }
            setCurrentQuestion(data);
            setSelectedOption(null);
            setTimeLeft(60);
        } catch {
            router.push("/dashboard/quiz");
        }
    }, [purchaseId, router]);

    // Timer
    useEffect(() => {
        if (finished || currentQuestion?.completed) return;
        if (timeLeft <= 0) {
            handleAutoAdvance();
            return;
        }
        timerRef.current = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    if (timerRef.current) clearInterval(timerRef.current);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [timeLeft, finished, currentQuestion?.question?.id]);

    const handleAutoAdvance = async () => {
        if (submitting || !currentQuestion?.question) return;
        setSubmitting(true);
        try {
            await quizApi.submitAnswer(purchaseId, {
                questionId: currentQuestion.question.id,
                selectedIndex: -1, // no answer (timed out)
            });
            setAnsweredQuestions((prev) => prev + 1);
            await loadNextQuestion();
        } catch { /* ignore */ } finally { setSubmitting(false); }
    };

    const handleSubmit = async () => {
        if (submitting || selectedOption === null || !currentQuestion?.question) return;
        setSubmitting(true);
        try {
            const res = await quizApi.submitAnswer(purchaseId, {
                questionId: currentQuestion.question.id,
                selectedIndex: selectedOption,
            });
            setAnsweredQuestions((prev) => prev + 1);

            if (res.isLast) {
                setFinished(true);
                setResult({ score: res.score ?? 0, totalQuestions: res.totalQuestions ?? 0, netReward: (res as any).netReward });
            } else {
                await loadNextQuestion();
            }
        } catch { /* ignore */ } finally { setSubmitting(false); }
    };

    if (startLoading) {
        return <div className="flex justify-center items-center min-h-[60vh]"><Loader2 className="animate-spin" size={32} /></div>;
    }

    if (finished && result) {
        const percentage = result.totalQuestions > 0 ? Math.round((result.score / result.totalQuestions) * 100) : 0;
        const wrongCount = result.totalQuestions - result.score;
        const correctReward = result.score * 2;
        const wrongDeduction = wrongCount * 1;
        return (
            <div className="max-w-md mx-auto py-10">
                <div className="card bg-white p-8 text-center space-y-4">
                    <div className="flex justify-center">
                        <div className={`rounded-full p-4 ${percentage >= 60 ? "bg-green-100" : "bg-red-100"}`}>
                            <Award size={48} className={percentage >= 60 ? "text-green-700" : "text-red-600"} />
                        </div>
                    </div>
                    <div className="text-sm text-gray-500">Thanks for completing the quiz!</div>
                    <div className="text-5xl font-extrabold text-green-700">{result.score}<span className="text-2xl text-gray-400">/{result.totalQuestions}</span></div>
                    <div className="space-y-2 text-sm">
                        {result.score > 0 && (
                            <p className="text-green-700 font-semibold">
                                You have answered {result.score} questions correctly so you earned {correctReward} tk.
                            </p>
                        )}
                        {wrongCount > 0 && (
                            <p className="text-red-600 font-semibold">
                                You have answered {wrongCount} questions wrong so {wrongDeduction} tk deducted.
                            </p>
                        )}
                    </div>
                    {result.netReward !== undefined && (
                        <div className={`rounded-lg p-3 text-sm font-bold ${result.netReward > 0 ? "bg-green-50 text-green-800" : result.netReward < 0 ? "bg-red-50 text-red-800" : "bg-gray-50 text-gray-600"}`}>
                            {result.netReward > 0 ? "+" : ""}{result.netReward} tk {result.netReward > 0 ? "earned" : result.netReward < 0 ? "deducted" : "no change"}
                        </div>
                    )}
                    <button onClick={() => router.push("/dashboard/quiz")} className="btn-primary text-sm mt-4">Back to Quiz</button>
                </div>
            </div>
        );
    }

    if (!currentQuestion?.question) {
        return <div className="flex justify-center py-10"><Loader2 className="animate-spin" size={24} /></div>;
    }

    const q = currentQuestion.question;

    return (
        <div className="max-w-2xl mx-auto space-y-4 py-6">
            {/* Progress bar */}
            <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>Question {answeredQuestions + 1} of {currentQuestion.totalQuestions}</span>
                    <span className="flex items-center gap-1">
                        <Clock size={12} />
                        <span className={timeLeft <= 10 ? "text-red-600 font-bold" : ""}>
                            {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, "0")}
                        </span>
                    </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1.5">
                    <div
                        className="bg-green-700 h-1.5 rounded-full transition-all duration-300"
                        style={{ width: `${((answeredQuestions) / (currentQuestion.totalQuestions ?? 1)) * 100}%` }}
                    />
                </div>
                {/* Progress dots */}
                <div className="flex gap-1 flex-wrap">
                    {Array.from({ length: currentQuestion.totalQuestions ?? 0 }).map((_, i) => (
                        <div
                            key={i}
                            className={`w-2.5 h-2.5 rounded-full ${i < answeredQuestions ? "bg-green-700" : i === answeredQuestions ? "bg-green-700 ring-2 ring-green-300" : "bg-gray-300"}`}
                        />
                    ))}
                </div>
            </div>

            {/* Question card */}
            <div className="card bg-white p-6 space-y-5">
                <h2 className="text-base font-bold text-gray-900">{q.question}</h2>

                <div className="space-y-2">
                    {q.options.map((opt, idx) => (
                        <button
                            key={idx}
                            onClick={() => setSelectedOption(selectedOption === idx ? null : idx)}
                            className={`w-full text-left p-3.5 rounded-lg border text-sm transition-colors ${selectedOption === idx ? "border-green-600 bg-green-50 text-green-800 font-semibold" : "border-gray-200 text-gray-700 hover:border-gray-300"}`}
                        >
                            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-gray-100 text-xs font-bold text-gray-500 mr-3">
                                {String.fromCharCode(65 + idx)}
                            </span>
                            {opt}
                        </button>
                    ))}
                </div>

                <button
                    onClick={handleSubmit}
                    disabled={submitting || selectedOption === null}
                    className="btn-primary w-full text-sm flex items-center justify-center gap-2"
                >
                    {submitting ? <Loader2 size={14} className="animate-spin" /> : <><ArrowRight size={16} /> {answeredQuestions + 1 >= (currentQuestion.totalQuestions ?? 0) ? "Finish" : "Next"}</>}
                </button>
            </div>
        </div>
    );
}
