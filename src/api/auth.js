import api from "./apiClient";

export async function loginRequest(credentials) {
    try {
        const res = await api.post("/auth/login", credentials);
        // Return whichever payload the backend uses:
        return res?.data?.data ?? res?.data;
    } catch (err) {
        // Normalize common axios errors so caller can read a message easily
        if (err?.response?.data) {
            const message = err.response.data.message ?? err.response.data;
            const e = new Error(typeof message === "string" ? message : JSON.stringify(message));
            e.response = err.response;
            throw e;
        }
        throw err;
    }
};
