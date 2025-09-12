import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { loadSingleExam, finishExam, submitExam } from "../api/studentExams";

function SingleExam() {
  const location = useLocation();
  const navigate = useNavigate();

  // exam object comes from StudentApp -> navigate
  const exam = location.state?.exam;

  const [examData, setExamData] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const token = localStorage.getItem("token"); // JWT token

  // Load exam when component mounts
  useEffect(() => {
    if (!exam?.id) {
      setError("No exam selected. Redirecting...");
      setTimeout(() => navigate("/student"), 3000);
      return;
    }

    async function fetchExam() {
      try {
        const data = await loadSingleExam({ examId: exam.id }, token);
        console.log("SingleExam loaded:", data);

        setExamData(data);
        setQuestions(data.questions || []);

        // set timer from backend endTime
        const now = new Date();
        const examEnd = new Date(data.endTime);
        setTimeLeft(Math.max(0, Math.floor((examEnd - now) / 1000)));
      } catch (err) {
        console.error(err);
        setError(err.response?.data?.message || "Failed to load exam");
      } finally {
        setLoading(false);
      }
    }

    fetchExam();
  }, [exam, navigate, token]);

  // Timer countdown
  useEffect(() => {
    if (timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  // Format timer
  const formatTime = (seconds) => {
    const min = Math.floor(seconds / 60).toString().padStart(2, "0");
    const sec = (seconds % 60).toString().padStart(2, "0");
    return `${min}:${sec}`;
  };

  // Answer change
  const handleAnswerChange = async (questionId, optionKey) => {
    const newAnswers = { ...selectedAnswers, [questionId]: optionKey };
    setSelectedAnswers(newAnswers);

    try {
      await submitExam(
        { examId: exam.id, questionId, selectedOption: optionKey },
        token
      );
    } catch (err) {
      console.error("Submit error:", err);
    }
  };

  // Complete exam
  const handleComplete = async () => {
    try {
      await finishExam({ examId: exam.id }, token);
      navigate("/student"); // go back to student dashboard
    } catch (err) {
      setError(err.response?.data?.message || "Failed to complete exam");
    }
  };

  if (loading) return <div className="p-4 text-center">Loading exam...</div>;
  if (error)
    return <div className="p-4 text-center text-red-600">{error}</div>;
  if (!examData) return null;

  const currentQuestion = questions[currentQuestionIndex];
  const options = [
    { key: "optionA", value: currentQuestion?.optionA },
    { key: "optionB", value: currentQuestion?.optionB },
    { key: "optionC", value: currentQuestion?.optionC },
    { key: "optionD", value: currentQuestion?.optionD },
  ];

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-4xl mx-auto mt-8 p-6 bg-white rounded-lg shadow-md">
        {/* Header */}
        <div className="flex justify-between items-center mb-6 border-b pb-2">
          <h1 className="text-xl font-bold">{examData.title}</h1>
          <span className="text-gray-700">
            Time Left: {formatTime(timeLeft)}
          </span>
        </div>

        {/* Question */}
        <div className="mb-6">
          <p className="font-bold mb-2">
            Q. {currentQuestion?.questionText}
          </p>
        </div>

        {/* Options */}
        <div className="space-y-2 mb-6">
          {options.map(
            (opt, index) =>
              opt.value && (
                <label key={index} className="flex items-center">
                  <input
                    type="radio"
                    name={`question-${currentQuestion.id}`}
                    checked={selectedAnswers[currentQuestion.id] === opt.key}
                    onChange={() =>
                      handleAnswerChange(currentQuestion.id, opt.key)
                    }
                    className="mr-2"
                  />
                  {opt.value}
                </label>
              )
          )}
        </div>

        {/* Navigation */}
        <div className="flex justify-between mb-8">
          <button
            onClick={() => setCurrentQuestionIndex((prev) => prev - 1)}
            disabled={currentQuestionIndex === 0}
            className="px-4 py-2 bg-gray-300 text-gray-700 rounded disabled:bg-gray-200"
          >
            Prev
          </button>
          <span>
            Question {currentQuestionIndex + 1} / {questions.length}
          </span>
          <button
            onClick={() => setCurrentQuestionIndex((prev) => prev + 1)}
            disabled={currentQuestionIndex === questions.length - 1}
            className="px-4 py-2 bg-gray-300 text-gray-700 rounded disabled:bg-gray-200"
          >
            Next
          </button>
        </div>

        {/* Complete Button */}
        <div className="flex justify-end">
          <button
            onClick={handleComplete}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Complete
          </button>
        </div>
      </div>
    </div>
  );
}

export default SingleExam;
