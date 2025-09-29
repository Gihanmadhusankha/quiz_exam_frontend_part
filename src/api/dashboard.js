import api from './apiClient'

export async function getTeacherDashboard(token){
    try{
        const res=await api.post(
            "/dashboard/progess",
            {},
            {
               headers:{
                Authorization:`Bearer${token}`,
               },
            }
        );
        return res?.data?.data;
    }catch(error){
        console.error("getTeacherDashboard error:",error.response?.data||error.message);
        throw error;
    }
}