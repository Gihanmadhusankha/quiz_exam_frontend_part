import api from "./apiClient";

//teacher monitor the exam
export async function monitorExam({ examId }, token) {
  try {
    const res = await api.post(
      "/exam/monitor",
      { examId }, 
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    
    return res?.data?.data ?? res?.data;
  } catch (error) {
    
    throw error;
  }
}
    
//techer End Exam
export async function endExam({examId},token){
    try{
        const res=await api.post(
            "/exam/monitor/end",
            {examId},
            {
                headers:{
                    Authorization:`Bearer ${token}`,
                },

            }
        );
         return res?.data?.data ?? res?.data;
    }catch(error){
        throw error;
    }
}