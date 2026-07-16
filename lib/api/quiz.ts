import { api } from "./client";

export interface Quiz {
    id: string;
    title: string;
    price: number;
    timeLimit: number;
    isActive?: boolean;
    questions?: QuizQuestion[];
    _count?: { questions: number; purchases: number };
    createdAt?: string;
    updatedAt?: string;
}

export interface QuizQuestion {
    id: string;
    question: string;
    options: string[];
    correctIndex?: number;
    sortOrder?: number;
}

export interface QuizPurchase {
    id: string;
    userId: string;
    quizId: string;
    status: "PURCHASED" | "COMPLETED" | "TIMEOUT";
    score?: number;
    totalQuestions?: number;
    answers?: { questionId: string; selectedIndex: number }[];
    paymentMethod: string;
    purchasedAt: string;
    startedAt?: string;
    completedAt?: string;
    quiz?: Pick<Quiz, "id" | "title" | "price" | "timeLimit"> & { _count?: { questions: number } };
}

export interface QuizAttemptData {
    purchase: QuizPurchase;
    quiz: { title: string; timeLimit: number };
    questions: { id: string; question: string; options: string[] }[];
    startedAt: string;
}

export const quizApi = {
    // Public
    findActive: async (): Promise<Quiz[]> => {
        const res = await api.get("/quiz");
        return res.data;
    },

    findOne: async (id: string): Promise<Quiz> => {
        const res = await api.get(`/quiz/${id}`);
        return res.data;
    },

    // User (authed)
    purchase: async (id: string, method = "WALLET"): Promise<QuizPurchase> => {
        const res = await api.post(`/quiz/${id}/purchase?method=${method}`);
        return res.data;
    },

    getPurchased: async (): Promise<QuizPurchase[]> => {
        const res = await api.get("/quiz/user/purchased");
        return res.data;
    },

    startAttempt: async (purchaseId: string): Promise<QuizAttemptData> => {
        const res = await api.get(`/quiz/attempt/${purchaseId}`);
        return res.data;
    },

    submitAttempt: async (purchaseId: string, answers: { questionId: string; selectedIndex: number }[]): Promise<{ status: string; score: number; totalQuestions: number; timedOut: boolean }> => {
        const res = await api.post(`/quiz/attempt/${purchaseId}/submit`, { answers });
        return res.data;
    },

    // Admin
    adminFindAll: async (): Promise<Quiz[]> => {
        const res = await api.get("/quiz/admin");
        return res.data;
    },

    adminFindOne: async (id: string): Promise<Quiz> => {
        const res = await api.get(`/quiz/admin/${id}`);
        return res.data;
    },

    adminCreate: async (data: { title: string; price: number; timeLimit?: number; isActive?: boolean; questions: { question: string; options: string[]; correctIndex: number; sortOrder?: number }[] }): Promise<Quiz> => {
        const res = await api.post("/quiz/admin", data);
        return res.data;
    },

    adminUpdate: async (id: string, data: { title?: string; price?: number; timeLimit?: number; isActive?: boolean }): Promise<Quiz> => {
        const res = await api.patch(`/quiz/admin/${id}`, data);
        return res.data;
    },

    adminDelete: async (id: string): Promise<void> => {
        const res = await api.delete(`/quiz/admin/${id}`);
        return res.data;
    },
};
