import api from "./apiClient";

export async function loginRequest(credentials) {
    try {
        const res = await api.post("/auth/login", credentials);
        // Return whichever payload the backend uses:
        return res?.data?.data ?? res?.data;
    } catch (err) {
        
        if (err?.response?.data) {
            const message = err.response.data.message ?? err.response.data;
            const e = new Error(typeof message === "string" ? message : JSON.stringify(message));
            e.response = err.response;
            throw e;
        }
        throw err;
    }
};

export async function logOut(token){
    try{
        const res=await api.post(
            "/auth/logout",
            {},
            {
               headers:{
                Authorization:`Bearer${token}`,
               },
            }
        );
        return res?.data?.data;
    }catch(error){
        console.error("logout error:",error.response?.data||error.message);
        throw error;
    }
}