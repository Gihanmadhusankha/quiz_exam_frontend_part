import React, { useState, useEffect } from "react";
import { replace, useLocation, useNavigate, useParams } from "react-router-dom";
import { listStudentExams, loadSingleExam, submitExam, finishExam } from "../api/studentExams";
import Header from "../Layout/Header";

function SingleExam() {
  const location = useLocation();
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const { examId, questionIndex } = useParams();

  const passedExam = location.state?.exam;

  const [examData, setExamData] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(
    questionIndex ? parseInt(questionIndex, 10) : 0
  );
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Format timer
  const formatTime = (totalSeconds) => {
    const pad = (n) => String(n).padStart(2, "0");
    if (totalSeconds <= 0) return "00:00";

    const days = Math.floor(totalSeconds / 86400);
    const hrs = Math.floor((totalSeconds % 86400) / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;

    let result = "";
    if (days > 0) result += `${days} day${days > 1 ? "s" : ""} `;
    if (hrs > 0) result += `${hrs} hour${hrs > 1 ? "s" : ""} `;
    if (mins > 0) result += `${mins} min${mins > 1 ? "s" : ""} `;
    if (secs > 0 && days === 0) result += `${secs} sec${secs > 1 ? "s" : ""}`;

    return result.trim();
  };

  // Fetch exam data
  useEffect(() => {
    const fetchExamData = async () => {
      if (!token) {
        navigate("/login");
        return;
      }

      setLoading(true);

      try {
        let examToLoad = passedExam || { examId };

        if (!examToLoad?.examId && examId) {

          examToLoad = { examId };
        }

        if (!examToLoad?.examId) {
          const res = await listStudentExams({ page: 0, size: 1 }, token);
          examToLoad = res?.content?.[0];
          if (!examToLoad?.examId) throw new Error("No exams available");
        }

        const data = await loadSingleExam({ examId: examToLoad.examId }, token);
        setExamData(data);
        setQuestions(data.questions || []);

        const saved = localStorage.getItem(`answers_exam_${data.studentExamId}`);
        if (saved) {
          setSelectedAnswers(JSON.parse(saved));
        }

        // Pre-fill previous answers
        const prevAnswers = {};
        (data.answers || []).forEach((a) => {
          prevAnswers[a.questionId] = a.selectedOption;
        });
        setSelectedAnswers(prev => ({ ...prev, ...prevAnswers }));

        let targetIndex = 0;

        const lastId = data.lastAnsweredQuestionId;

        if (lastId) {
          // Find index of the last answered question
          const lastIndex = data.questions.findIndex(q => q.id === lastId);
          targetIndex = lastIndex !== -1
            ? Math.min(lastIndex + 1, data.questions.length - 1)
            : 0;
        }

        setCurrentQuestionIndex(targetIndex);

        // Calculate timeLeft
        const now = new Date();
        const endTime = new Date(data.endTime);
        setTimeLeft(Math.max(0, Math.floor((endTime - now) / 1000)));

      } catch (err) {
        console.error(err);
        setError(err.response?.data?.message || err.message || "Failed to load exam");
      } finally {
        setLoading(false);
      }
    };

    fetchExamData();
  }, [token, navigate, examId, questionIndex]);



  useEffect(() => {
    if (!examData) return;


    const timer = setInterval(() => {
      setTimeLeft(prev => {
        const newTime = prev - 1;

        if (newTime <= 0) {
          clearInterval(timer);
          alert("Time is over! Auto-submitting the exam.");
          navigate("/results", { state: { studentExamId: examData.studentExamId } });
          return 0;
        }

        return newTime;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [examData, navigate]);



  const handleAnswerChange = (questionId, optionKey) => {
    setSelectedAnswers(prev => {
      const updated = { ...prev, [questionId]: optionKey };
      if (examData?.examId) {
        localStorage.setItem(`answers_exam_${examData.studentExamId}`, JSON.stringify(updated));
      }
      return updated;
    });
  };

  useEffect(() => {
    // Prevent back button
    const handleBackButton = (event) => {
      event.preventDefault();
      window.history.pushState(null, "", window.location.href);
    };

    window.history.pushState(null, "", window.location.href);
    window.addEventListener("popstate", handleBackButton);

    return () => {
      window.removeEventListener("popstate", handleBackButton);
    };
  }, []);

  const handleNext = async () => {
    const currentQuestion = questions[currentQuestionIndex];
    const selectedOption = selectedAnswers[currentQuestion.id];
    try {
      if (selectedOption) {
        await submitExam({ examId: examData.examId, questionId: currentQuestion.id, selectedOption }, token);
      }

      console.log("check")

      const nextIndex = Math.min(currentQuestionIndex + 1, questions.length - 1);
      setCurrentQuestionIndex(nextIndex);
    } catch (err) {
      if (err.response?.status === 400 || err.response?.data?.message === "EXAM_HAS_ENDED_AUTOCOMPLETED") {
        alert("Teacher ended the exam");
        navigate("/results", { state: { studentExamId: examData.studentExamId } });
      } else {
        setError(err.response?.data?.message || err.message || "Failed to save exam");
      }
    }
  };

  const handlePrev = async () => {

    const currentQuestion = questions[currentQuestionIndex];
    const selectedOption = selectedAnswers[currentQuestion.id];
    try {
      if (selectedOption) {
        await submitExam({ examId: examData.examId, questionId: currentQuestion.id, selectedOption }, token);
      }

      const prevIndex = Math.max(currentQuestionIndex - 1, 0);
      setCurrentQuestionIndex(prevIndex);
    } catch (err) {

      if (err.response?.status === 400 || err.response?.data?.message === "EXAM_HAS_ENDED_AUTOCOMPLETED") {
        alert("Teacher ended the exam");
        navigate("/results", { state: { studentExamId: examData.studentExamId } });
      } else {
        setError(err.response?.data?.message || err.message || "Failed to save exam");
      }
    }
  };

  const handleSave = async () => {
    const currentQuestion = questions[currentQuestionIndex];
    const selectedOption = selectedAnswers[currentQuestion.id];

    try {
      if (selectedOption) {
        await submitExam({ examId: examData.examId, questionId: currentQuestion.id, selectedOption }, token);
      }

      alert("Exam saved as pending. Redirecting to exam list.");
      navigate("/results", { state: { studentExamId: examData.studentExamId } });
    } catch (err) {

      if (err.response?.status === 400 || err.response?.data?.message === "EXAM_HAS_ENDED_AUTOCOMPLETED") {
        alert("Teacher ended the exam");
        navigate("/results", { state: { studentExamId: examData.studentExamId } });
      } else {
        setError(err.response?.data?.message || err.message || "Failed to save exam");
      }
    }
  };

  const handleComplete = async () => {
    const allAnswered = questions.every(q => selectedAnswers[q.id]);
    if (!allAnswered) {
      alert("You must answer all questions before completing the exam.");
      return;
    }

    const currentQuestion = questions[currentQuestionIndex];
    const selectedOption = selectedAnswers[currentQuestion.id];

    try {
      if (selectedOption) {
        await submitExam({ examId: examData.examId, questionId: currentQuestion.id, selectedOption }, token);
        await finishExam({ examId: examData.examId }, token);
        localStorage.removeItem(`answers_exam_${examData.examId}`);

        alert("Exam completed! Redirecting to results.");
        navigate("/results", { state: { studentExamId: examData.studentExamId } }, { replace: true });
      }

    } catch (err) {

      if (err.response?.status === 400 || err.response?.data?.message === "EXAM_HAS_ENDED_AUTOCOMPLETED") {
        alert("Teacher ended the exam");
        navigate("/results", { state: { studentExamId: examData.studentExamId } });
      } else {
        setError(err.response?.data?.message || err.message || "Failed to save exam");
      }
    }
  };

  if (loading) return <div className="p-4 text-center">Loading exam...</div>;
  if (error) return <div className="p-4 text-center text-red-600">{error}</div>;
  if (!examData || !questions.length) return <div className="p-4 text-center text-red-600">No exam or questions available.</div>;

  const currentQuestion = questions[currentQuestionIndex];
  const options = [
    { key: "A", value: currentQuestion.optionA },
    { key: "B", value: currentQuestion.optionB },
    { key: "C", value: currentQuestion.optionC },
    { key: "D", value: currentQuestion.optionD },
  ].filter((opt) => opt.value);


  const isExamCompleted = examData?.status === "ATTENDED";
  const allAnswered = questions.length > 0 && questions.every(q => selectedAnswers[q.id]);


  return (
    <div className="min-h-screen bg-gray-100">
      <Header />
      <div className="flex items-center justify-between px-6 py-3 relative">
        <h1 className="text-lg font-semibold absolute left-50">{examData.title}</h1>
        <div className="mx-auto text-gray-700 font-medium">Time Left: {formatTime(timeLeft)}</div>
      </div>

      <div className="max-w-2xl mx-auto mt-10 p-6 bg-white rounded shadow">
        <div className="mb-4">
          <p className="font-medium">Q{currentQuestionIndex + 1}. {currentQuestion.questionText}</p>
        </div>

        <div className="border-2 border-gray-300 p-4 mb-6">
          {options.map((opt, index) => (
            <label key={index} className="flex items-center mb-2 cursor-pointer">
              <input
                type="radio"
                name={`question-${currentQuestion.id}`}
                checked={selectedAnswers[currentQuestion.id] === opt.key}
                onChange={() => handleAnswerChange(currentQuestion.id, opt.key)}
                className="mr-2"
                disabled={isExamCompleted}
              />
              {opt.value}
            </label>
          ))}
        </div>

        <div className="flex justify-between items-center mb-8">
          <button
            onClick={handlePrev}
            disabled={currentQuestionIndex === 0}
            className="px-4 py-2 bg-gray-300 text-gray-700 rounded disabled:bg-gray-200"
          >
            Prev
          </button>
          <span>Question {currentQuestionIndex + 1} / {questions.length}</span>
          <button
            onClick={handleNext}
            disabled={isExamCompleted || currentQuestionIndex >= questions.length}
            className="px-4 py-2 bg-gray-300 text-gray-700 rounded disabled:bg-gray-200"
          >
            Next
          </button>
        </div>
      </div>

      <div className="flex justify-end gap-5 max-w-2xl mx-auto px-6 py-5">
        <button
          onClick={handleSave}

          className="px-5 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-green-300"
        >
          Save
        </button>
        <button
          onClick={handleComplete}
          disabled={isExamCompleted || !allAnswered}
          className="px-5 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-blue-300"
        >
          Complete
        </button>
      </div>
    </div>
  );
}

export default SingleExam;

