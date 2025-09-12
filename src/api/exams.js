import api from "./apiClient";


//teacher Get All Exams
export async function getAllExams(teacherExamList){
    const res=await api.post("/exams/teacher",teacherExamList);
    return res.data.data;
}


//create update or delete exam
export async function manageExam(req){
    const res=await api.post("/exams/manage",req);
    return res.data.data;
}
//load single Exam
export async function loadSingleExam(examId){
    const res=await api.get("/exams/load" ,{examId});
    return res.data.data;
}

//publish an exam(teacher)
export async function publishExam(examId){
    const payload = typeof examId === 'object' && examId !== null ? examId : { examId };
    const res = await api.post("/exams/publish", payload);
    return res?.data?.data ?? res?.data;
}
// List published exams (for students)
export const listPublishedExams = async (teacherExamList) => {
  const res = await api.post("/exams/published", teacherExamList);
  return res.data.data;
};