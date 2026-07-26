"use client";

import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useCallback, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader2, Clock, Award, ArrowRight } from "lucide-react";
import { quizApi, type QuizNextQuestion } from "@/lib/api/quiz";

const QUESTION_TIME = 15; // seconds per question

type QuizResult = {
    score: number;
    totalQuestions: number;
    netReward?: number;
    wrongCount?: number;
    skippedCount?: number;
};

export default function QuizAttemptPage() {
    const { purchaseId } = useParams<{ purchaseId: string }>();
    const router = useRouter();

    const [phase, setPhase] = useState<"loading" | "question" | "submitting" | "done">("loading");
    const [currentQuestion, setCurrentQuestion] = useState<QuizNextQuestion | null>(null);
    const [selectedOption, setSelectedOption] = useState<number | null>(null);
    const [timeLeft, setTimeLeft] = useState(QUESTION_TIME);
    const [result, setResult] = useState<QuizResult | null>(null);
    const [tabSwitchCount, setTabSwitchCount] = useState(0);
    const [showTabWarning, setShowTabWarning] = useState(false);

    // Guards — never cause re-renders
    const activeQuestionIdRef = useRef<string | null>(null); // prevents double-submit
    const isFinishedRef = useRef(false);

    // ── Core: submit answer then load next question ───────────────────────────
    const submitAndAdvance = useCallback(async (selectedIndex: number, questionId: string) => {
        // Guard: stale timer call for an already-moved-past question
        if (activeQuestionIdRef.current !== questionId) return;
        activeQuestionIdRef.current = null; // lock — no other call for this question

        setPhase("submitting");

        // Submit the answer (or -1 for timed out)
        let isLastQuestion = false;
        try {
            const res = await quizApi.submitAnswer(purchaseId, { questionId, selectedIndex });

            if (res.isLast) {
                isFinishedRef.current = true;
                setPhase("done");
                setResult({
                    score: res.score ?? 0,
                    totalQuestions: res.totalQuestions ?? 0,
                    netReward: res.netReward,
                    wrongCount: res.wrongCount,
                    skippedCount: res.skippedCount,
                });
                return;
            }
        } catch {
            // Submit failed — still advance to avoid the user getting stuck
        }

        // Load the next question
        try {
            const data = await quizApi.getNextQuestion(purchaseId);

            if (data.completed) {
                isFinishedRef.current = true;
                setPhase("done");
                setResult({
                    score: data.score ?? 0,
                    totalQuestions: data.totalQuestions ?? 0,
                    netReward: data.netReward,
                    wrongCount: data.wrongCount,
                    skippedCount: data.skippedCount,
                });
                return;
            }

            // Set the new question — this changes currentQuestion?.question?.id
            // which triggers the timer useEffect to reset the countdown automatically
            activeQuestionIdRef.current = data.question?.id ?? null;
            setCurrentQuestion(data);
            setSelectedOption(null);
            setTimeLeft(QUESTION_TIME);   // reset displayed timer
            setPhase("question");
        } catch {
            router.push("/dashboard/quiz");
        }
    }, [purchaseId, router]);

    // ── Timer: resets automatically whenever the question ID changes ──────────
    // This is the KEY design: the effect depends on currentQuestion?.question?.id.
    // When a new question is loaded, the old interval is cleared and a fresh one starts.
    useEffect(() => {
        if (phase !== "question" || !currentQuestion?.question?.id) return;

        const questionId = currentQuestion.question.id;
        let remaining = QUESTION_TIME;

        const interval = setInterval(() => {
            remaining -= 1;
            setTimeLeft(remaining);

            if (remaining <= 0) {
                clearInterval(interval);
                // questionId is captured — will match activeQuestionIdRef only if not already submitted
                submitAndAdvance(-1, questionId);
            }
        }, 1000);

        return () => clearInterval(interval); // cleanup on question change or unmount
    }, [phase, currentQuestion?.question?.id, submitAndAdvance]);

    // ── Start attempt ─────────────────────────────────────────────────────────
    const { data: attemptData, isLoading: startLoading, error: startError } = useQuery({
        queryKey: ["quiz-attempt", purchaseId],
        queryFn: () => quizApi.startAttempt(purchaseId),
        retry: false,
    });

    // If already completed (startAttempt throws), load final result
    useEffect(() => {
        if (!startError) return;
        quizApi.getResult(purchaseId).then((data: any) => {
            isFinishedRef.current = true;
            setPhase("done");
            setResult({
                score: data.score ?? 0,
                totalQuestions: data.questionCount ?? 0,
                netReward: data.netReward,
                wrongCount: data.wrongCount,
                skippedCount: data.skippedCount,
            });
        }).catch(() => router.push("/dashboard/quiz"));
    }, [startError, purchaseId, router]);

    // Load first question once attempt data arrives
    useEffect(() => {
        if (!attemptData) return;
        quizApi.getNextQuestion(purchaseId).then((data) => {
            if (data.completed) {
                isFinishedRef.current = true;
                setPhase("done");
                setResult({ score: data.score ?? 0, totalQuestions: data.totalQuestions ?? 0, netReward: data.netReward, wrongCount: data.wrongCount, skippedCount: data.skippedCount });
                return;
            }
            activeQuestionIdRef.current = data.question?.id ?? null;
            setCurrentQuestion(data);
            setSelectedOption(null);
            setTimeLeft(QUESTION_TIME);
            setPhase("question");
        }).catch(() => router.push("/dashboard/quiz"));
    }, [attemptData, purchaseId, router]);

    // ── Abandon on SPA navigation (component unmounts) ───────────────────────
    useEffect(() => {
        return () => {
            if (!isFinishedRef.current) {
                quizApi.abandon(purchaseId).catch(() => { /* best effort */ });
            }
        };
    }, [purchaseId]);

    // ── Abandon on browser close / refresh (keepalive fetch) ─────────────────
    useEffect(() => {
        const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000/v1";

        const handleBeforeUnload = () => {
            if (isFinishedRef.current) return;
            const token = document.cookie
                .split("; ")
                .find((row) => row.startsWith("access_token="))
                ?.split("=")[1];

            fetch(`${BASE_URL}/quiz/attempt/${purchaseId}/abandon`, {
                method: "POST",
                keepalive: true,
                headers: {
                    "Content-Type": "application/json",
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
            });
        };

        window.addEventListener("beforeunload", handleBeforeUnload);
        return () => window.removeEventListener("beforeunload", handleBeforeUnload);
    }, [purchaseId]);

    // ── Anti-cheating: tab switch detection ───────────────────────────────────
    useEffect(() => {
        if (phase === "done") return;

        const handleVisibilityChange = () => {
            if (!document.hidden) return;
            setTabSwitchCount((prev) => {
                const next = prev + 1;
                if (next >= 2 && activeQuestionIdRef.current) {
                    // 2nd violation — forfeit current question immediately
                    submitAndAdvance(-1, activeQuestionIdRef.current);
                }
                return next;
            });
            setShowTabWarning(true);
        };

        document.addEventListener("visibilitychange", handleVisibilityChange);
        return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
    }, [phase, submitAndAdvance]);

    // ── Submit selected answer ─────────────────────────────────────────────────
    const handleSubmit = () => {
        if (selectedOption === null || !currentQuestion?.question?.id) return;
        submitAndAdvance(selectedOption, currentQuestion.question.id);
    };

    // ─────────────────────────────────────────────────────────────────────────
    // RENDER
    // ─────────────────────────────────────────────────────────────────────────

    if (startLoading || phase === "loading") {
        return <div className="flex justify-center items-center min-h-[60vh]"><Loader2 className="animate-spin" size={32} /></div>;
    }

    if (phase === "done" && result) {
        const percentage = result.totalQuestions > 0 ? Math.round((result.score / result.totalQuestions) * 100) : 0;
        const wrongCount = result.wrongCount ?? 0;
        const skippedCount = result.skippedCount ?? 0;
        const correctReward = result.score * 2;
        const wrongDeduction = wrongCount;
        return (
            <div className="max-w-md mx-auto py-10">
                <div className="card bg-white p-8 text-center space-y-4 shadow-sm border border-gray-100">
                    <div className="flex justify-center">
                        <div className={`rounded-full p-4 ${percentage >= 60 ? "bg-green-100" : "bg-red-100"}`}>
                            <Award size={48} className={percentage >= 60 ? "text-green-700" : "text-red-600"} />
                        </div>
                    </div>
                    <div className="text-sm text-gray-500">Thanks for completing the quiz!</div>
                    <div className="text-5xl font-extrabold text-green-700">{result.score}<span className="text-2xl text-gray-400">/{result.totalQuestions}</span></div>

                    <div className="space-y-2 text-sm text-left bg-gray-50 p-4 rounded-xl border border-gray-100">
                        {result.score > 0 && (
                            <p className="text-green-700 font-semibold">
                                You answered {result.score} questions correctly and earned {correctReward} tk.
                            </p>
                        )}
                        {wrongCount > 0 && (
                            <p className="text-red-600 font-semibold">
                                You answered {wrongCount} questions wrong so {wrongDeduction} tk deducted.
                            </p>
                        )}
                        {skippedCount > 0 && (
                            <p className="text-gray-600 font-medium">
                                You missed {skippedCount} questions (time up) — no deduction.
                            </p>
                        )}
                    </div>

                    {result.netReward !== undefined && (
                        <div className={`rounded-lg p-3 text-sm font-bold ${result.netReward > 0 ? "bg-green-50 text-green-800 border border-green-200" : result.netReward < 0 ? "bg-red-50 text-red-800 border border-red-200" : "bg-gray-50 text-gray-600 border border-gray-200"}`}>
                            {result.netReward > 0 ? "+" : ""}{result.netReward} tk {result.netReward > 0 ? "earned" : result.netReward < 0 ? "deducted" : "no change"}
                        </div>
                    )}
                    <button onClick={() => router.push("/dashboard/quiz")} className="btn-primary text-sm w-full py-2.5 mt-2">Back to Quiz</button>
                </div>
            </div>
        );
    }

    if (phase === "submitting") {
        return <div className="flex justify-center items-center min-h-[60vh]"><Loader2 className="animate-spin" size={24} /></div>;
    }

    if (!currentQuestion?.question) {
        return <div className="flex justify-center py-10"><Loader2 className="animate-spin" size={24} /></div>;
    }

    const q = currentQuestion.question;
    const currentAnswered = currentQuestion.answeredCount ?? 0;

    return (
        <div
            className="max-w-2xl mx-auto space-y-4 py-6 select-none"
            onContextMenu={(e) => e.preventDefault()}
            onCopy={(e) => e.preventDefault()}
            onCut={(e) => e.preventDefault()}
        >
            {/* Tab Switch Warning Banner */}
            {showTabWarning && (
                <div className={`rounded-lg p-3.5 flex items-center justify-between text-xs font-semibold shadow-xs transition-colors ${
                    tabSwitchCount >= 2 ? "bg-red-50 border border-red-300 text-red-900" : "bg-amber-50 border border-amber-300 text-amber-900 animate-pulse"
                }`}>
                    <div className="flex items-center gap-2">
                        <span className="text-base">{tabSwitchCount >= 2 ? "🚨" : "⚠️"}</span>
                        <span>
                            {tabSwitchCount >= 2
                                ? `Strict Violation: Tab switched ${tabSwitchCount} times! Question forfeited.`
                                : `Warning: Tab switching detected (1/2). Switching again will forfeit this question!`}
                        </span>
                    </div>
                    <button onClick={() => setShowTabWarning(false)} className="text-gray-700 hover:text-black font-bold px-2 py-0.5">✕</button>
                </div>
            )}

            {/* Progress */}
            <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>Question {Math.min(currentAnswered + 1, currentQuestion.totalQuestions ?? 1)} of {currentQuestion.totalQuestions}</span>
                    <span className="flex items-center gap-1.5 font-bold">
                        <Clock size={14} className={timeLeft <= 5 ? "text-red-600 animate-spin" : "text-red-700"} />
                        <span className={`px-2 py-0.5 rounded text-xs transition-all ${
                            timeLeft <= 5
                                ? "bg-red-100 text-red-700 font-black animate-pulse border border-red-300"
                                : "bg-red-50 text-red-700 font-bold border border-red-200"
                        }`}>
                            {timeLeft.toString().padStart(2, "0")}s
                        </span>
                    </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1.5">
                    <div
                        className="bg-green-700 h-1.5 rounded-full transition-all duration-300"
                        style={{ width: `${(currentAnswered / (currentQuestion.totalQuestions ?? 1)) * 100}%` }}
                    />
                </div>
                <div className="flex gap-1 flex-wrap">
                    {Array.from({ length: currentQuestion.totalQuestions ?? 0 }).map((_, i) => (
                        <div
                            key={i}
                            className={`w-2.5 h-2.5 rounded-full ${i < currentAnswered ? "bg-green-700" : i === currentAnswered ? "bg-green-700 ring-2 ring-green-300" : "bg-gray-300"}`}
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
                    disabled={phase !== "question" || selectedOption === null}
                    className="btn-primary w-full text-sm py-2.5 flex items-center justify-center gap-2"
                >
                    <ArrowRight size={16} /> {currentAnswered + 1 >= (currentQuestion.totalQuestions ?? 0) ? "Finish" : "Next"}
                </button>
            </div>
        </div>
    );
}
