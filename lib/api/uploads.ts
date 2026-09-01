import Cookies from "js-cookie";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000/v1";

export const uploadsApi = {
    upload: async (file: File): Promise<{ url: string }> => {
        const fd = new FormData();
        fd.append("file", file);
        const token = Cookies.get("access_token");

        const response = await fetch(`${BASE_URL}/uploads`, {
            method: "POST",
            headers: token ? { Authorization: `Bearer ${token}` } : {},
            body: fd,
        });

        if (!response.ok) {
            const err = await response.json().catch(() => ({ message: "Upload failed" }));
            throw new Error(err.message || `Upload failed (${response.status})`);
        }

        const data = await response.json();
        const payload = data?.data || data;
        let url: string = payload?.url || "";

        if (url.startsWith("http://api.banglapark.com")) {
            url = url.replace("http://api.banglapark.com", "https://api.banglapark.com");
        }

        return { url };
    },
};
