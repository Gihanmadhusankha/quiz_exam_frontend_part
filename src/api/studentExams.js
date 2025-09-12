import api from "./apiClient"; 

import api from "./api"; // your axios instance or base api

export async function loadSingleExam({ examId }, token) {
  try {
    const res = await api.post(
      "/student-exams/start",   // backend endpoint
      { examId },               // matches StartExamRequest
      {
        headers: {
          Authorization: `Bearer ${token}`, // send JWT token
        },
      }
    );
    console.log("loadSingleExam response:", res.data);
    return res?.data?.data ?? res?.data;
  } catch (error) {
    console.error("loadSingleExam error:", error.response?.data || error.message);
    throw error;
  }
}


// submit the answers
export async function submitExam(req){
    const res = await api.post("/student-exams/submit", req);
    return res?.data?.data ?? res?.data;
}

// finish the exam
export async function finishExam(req){
    const res = await api.post("/student-exams/finish", req);
    return res?.data?.data ?? res?.data;
}

// List student exams (for students)
export const listStudentExams = async (studentExamList) => {
  const res = await api.post("/student-exams/lists", studentExamList);
  return res?.data?.data ?? res?.data;
};

// Get student results
export async function getStudentResults(studentExamId){
    const res = await api.get("/student-exams/results", { params: { studentExamId } });
    return res?.data?.data ?? res?.data;
}