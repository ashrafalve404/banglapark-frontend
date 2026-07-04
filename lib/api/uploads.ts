import { api } from "./client";

export const uploadsApi = {
    upload: async (file: File): Promise<{ url: string }> => {
        const fd = new FormData();
        fd.append("file", file);
        const res = await api.post("/uploads", fd, {
            headers: { "Content-Type": "multipart/form-data" },
        });
        return res.data;
    },
};
