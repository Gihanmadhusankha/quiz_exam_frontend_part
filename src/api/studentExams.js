import api from "./apiClient";

// Start/load a single exam
export async function loadSingleExam({ examId }, token) {
  try {
    const res = await api.post(
      "/student-exams/start",
      { examId },
      {
        headers: {
          Authorization: `Bearer ${token}`,
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

// Submit the answers
export async function submitExam(req, token) {
  try {
    const res = await api.post("/student-exams/submit", req, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return res?.data?.data ?? res?.data;
  } catch (error) {
    console.error("submitExam error:", error.response?.data || error.message);
    throw error;
  }
}

// Finish the exam
export async function finishExam(req, token) {
  try {
    const res = await api.post("/student-exams/finish", req, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return res?.data?.data ?? res?.data;
  } catch (error) {
    console.error("finishExam error:", error.response?.data || error.message);
    throw error;
  }
}

// List student exams
export const listStudentExams = async (studentExamList, token) => {
  try {
    const res = await api.post("/student-exams/lists", studentExamList, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return res?.data?.data ?? res?.data;
  } catch (error) {
    console.error("listStudentExams error:", error.response?.data || error.message);
    throw error;
  }
};

// Get student results
export async function getStudentResults(studentExamId, token) {
  
  try {
    const res = await api.post(
      "/student-exams/result",
      { studentExamId: studentExamId },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return res?.data?.data ;
  } catch (error) {
    console.error("getStudentResults error:", error.response?.data || error.message);
    throw error;
  }
}
