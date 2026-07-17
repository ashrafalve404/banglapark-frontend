import { api } from "./client";

export interface QuizCategoryItem {
    id: string;
    name: string;
    imageUrl: string;
    isActive?: boolean;
    sortOrder?: number;
    levels?: QuizLevelItem[];
    _count?: { questions: number };
    createdAt?: string;
    updatedAt?: string;
}

export interface QuizLevelItem {
    id: string;
    categoryId: string;
    name: string;
    sortOrder: number;
    _count?: { questions: number };
    createdAt?: string;
}

export interface QuizQuestion {
    id: string;
    categoryId?: string;
    question: string;
    options: string[];
    correctIndex?: number;
    sortOrder?: number;
    level?: { id: string; name: string } | null;
    createdAt?: string;
}

export interface QuizPurchaseInfo {
    id: string;
    userId: string;
    categoryId: string;
    questionCount: number;
    totalPrice: number;
    status: "PURCHASED" | "COMPLETED";
    currentIndex: number;
    paymentMethod: string;
    purchasedAt: string;
    startedAt?: string;
    completedAt?: string;
    category?: { id: string; name: string; imageUrl: string };
    _count?: { answers: number };
    answers?: QuizAnswerInfo[];
}

export interface QuizAnswerInfo {
    id: string;
    purchaseId: string;
    questionId: string;
    selectedIndex?: number;
    isCorrect?: boolean;
    answeredAt: string;
    question?: {
        question: string;
        options: string[];
        correctIndex: number;
    };
}

export interface QuizAttemptData {
    purchaseId: string;
    category: { id: string; name: string; imageUrl: string };
    questionCount: number;
    questions: { id: string; question: string; options: string[] }[];
    currentIndex: number;
    startedAt: string;
}

export interface QuizNextQuestion {
    status: "IN_PROGRESS" | "COMPLETED";
    question?: { id: string; question: string; options: string[] };
    currentIndex?: number;
    totalQuestions?: number;
    answeredCount?: number;
    score?: number;
    completed?: boolean;
}

export interface QuizSubmitResult {
    status: "IN_PROGRESS" | "COMPLETED";
    currentIndex?: number;
    score?: number;
    totalQuestions?: number;
    isLast: boolean;
    netReward?: number;
}

export const quizApi = {
    // Categories
    getCategories: async (): Promise<QuizCategoryItem[]> => {
        const res = await api.get("/quiz-categories");
        return res.data;
    },

    getAllCategories: async (): Promise<QuizCategoryItem[]> => {
        const res = await api.get("/quiz-categories/all");
        return res.data;
    },

    getCategory: async (id: string): Promise<QuizCategoryItem> => {
        const res = await api.get(`/quiz-categories/${id}`);
        return res.data;
    },

    // Admin: Category CRUD
    adminCreateCategory: async (data: { name: string; imageUrl: string; sortOrder?: number }): Promise<QuizCategoryItem> => {
        const res = await api.post("/quiz-categories", data);
        return res.data;
    },

    adminUpdateCategory: async (id: string, data: { name?: string; imageUrl?: string; isActive?: boolean; sortOrder?: number }): Promise<QuizCategoryItem> => {
        const res = await api.patch(`/quiz-categories/${id}`, data);
        return res.data;
    },

    adminDeleteCategory: async (id: string): Promise<void> => {
        const res = await api.delete(`/quiz-categories/${id}`);
        return res.data;
    },

    // Levels
    getLevels: async (categoryId: string): Promise<QuizLevelItem[]> => {
        const res = await api.get(`/quiz-levels/${categoryId}`);
        return res.data;
    },

    createLevel: async (categoryId: string, data: { name: string; sortOrder?: number }): Promise<QuizLevelItem> => {
        const res = await api.post(`/quiz-levels/${categoryId}`, data);
        return res.data;
    },

    updateLevel: async (id: string, data: { name?: string; sortOrder?: number }): Promise<QuizLevelItem> => {
        const res = await api.patch(`/quiz-levels/${id}`, data);
        return res.data;
    },

    deleteLevel: async (id: string): Promise<void> => {
        const res = await api.delete(`/quiz-levels/${id}`);
        return res.data;
    },

    // Admin: Questions
    adminAddQuestions: async (categoryId: string, questions: { question: string; options: string[]; correctIndex: number }[], levelId?: string): Promise<any> => {
        const params = levelId ? { levelId } : undefined;
        const res = await api.post(`/quiz/admin/questions/${categoryId}`, questions, { params });
        return res.data;
    },

    adminGetQuestions: async (categoryId: string, page?: number): Promise<{ questions: QuizQuestion[]; total: number; page: number; totalPages: number }> => {
        const res = await api.get(`/quiz/admin/questions/${categoryId}`, { params: { page, limit: 50 } });
        return res.data;
    },

    adminDeleteQuestion: async (id: string): Promise<void> => {
        const res = await api.delete(`/quiz/admin/questions/${id}`);
        return res.data;
    },

    // User: Purchase
    getCategoryCount: async (categoryId: string): Promise<{ total: number }> => {
        const res = await api.get(`/quiz/category/${categoryId}/count`);
        return res.data;
    },

    purchase: async (categoryId: string, data: { questionCount: number; paymentMethod?: string }): Promise<QuizPurchaseInfo> => {
        const res = await api.post(`/quiz/purchase/${categoryId}`, data);
        return res.data;
    },

    getPurchased: async (): Promise<QuizPurchaseInfo[]> => {
        const res = await api.get("/quiz/purchased");
        return res.data;
    },

    // User: Attempt
    startAttempt: async (purchaseId: string): Promise<QuizAttemptData> => {
        const res = await api.post(`/quiz/attempt/${purchaseId}/start`);
        return res.data;
    },

    submitAnswer: async (purchaseId: string, data: { questionId: string; selectedIndex: number }): Promise<QuizSubmitResult> => {
        const res = await api.post(`/quiz/attempt/${purchaseId}/submit`, data);
        return res.data;
    },

    getNextQuestion: async (purchaseId: string): Promise<QuizNextQuestion> => {
        const res = await api.get(`/quiz/attempt/${purchaseId}/next`);
        return res.data;
    },

    getResult: async (purchaseId: string): Promise<QuizPurchaseInfo> => {
        const res = await api.get(`/quiz/attempt/${purchaseId}/result`);
        return res.data;
    },
};

export const importCsv = async (categoryId: string, file: File): Promise<{ imported: number; errors: { row: number; message: string }[]; total: number }> => {
    const form = new FormData();
    form.append("file", file);
    const res = await api.post(`/quiz/admin/import-csv/${categoryId}`, form, {
        headers: { "Content-Type": null },
    });
    return res.data;
};

export const uploadImage = async (file: File): Promise<string> => {
    const form = new FormData();
    form.append("file", file);
    const res = await api.post("/uploads", form, {
        headers: { "Content-Type": null },
    });
    return res.data.url;
};
