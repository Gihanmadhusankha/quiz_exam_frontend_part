import api from "./apiClient";

// Teacher Get All Exams
export async function getAllExams(teacherExamList,token) {
  try {
    const res = await api.post("/exams/teacher", teacherExamList,
       {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return res.data.data;
  } catch (error) {
    console.error('Error fetching exams:', error.response?.data || error.message);
    throw error;
  }
}

// Create, update, or delete exam
export async function manageExam(req) {
  try {
    
    const res = await api.post("/exams/manage", req);
    return res.data.data;
  } catch (error) {
    console.error('Error managing exam:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
    });
    throw error;
  }
}

// Publish an exam (teacher)
export async function publishExam(examId) {
  try {
    const payload = typeof examId === 'object' && examId !== null ? examId : { examId };
  
    const res = await api.post("/exams/publish", payload);
    
    return res?.data?.data ?? res?.data;
  } catch (error) {
    console.error('Error publishing exam:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
    });
    throw error;
  }
}

// Load a single exam
export async function loadExam(examId) {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('No authentication token found');
    }

    
    const response = await api.post(
      '/exams/loadExam', 
      { examId },
      {
        headers: {
          Authorization: `Bearer ${token}`, 
        },
      }
    );

   

    // Handle StandResponseDto
    if (response.data.code !== 200) {
      throw new Error(response.data.message || response.data.error || 'Failed to load exam');
    }

    return response.data.data; 
  } catch (error) {
    console.error('Error loading exam:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
    });
    throw error; 
  }
}