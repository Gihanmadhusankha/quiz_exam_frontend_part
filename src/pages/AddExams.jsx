import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Header from "../Layout/Header";
import { manageExam, publishExam, loadExam } from "../api/exams";

function AddExam() {
  const navigate = useNavigate();
  const { examId } = useParams();
  const [examTitle, setExamTitle] = useState("");
  const [questions, setQuestions] = useState([]);
  const [questionName, setQuestionName] = useState("");
  const [answers, setAnswers] = useState(["", "", "", ""]);
  const [correctIndex, setCorrectIndex] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [examDate, setExamDate] = useState("");
  const [examHours, setExamHours] = useState(0);
  const [examMinutes, setExamMinutes] = useState(0);
  const [isQuestionPanelOpen, setIsQuestionPanelOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(null);



  useEffect(() => {
    if (examId) {
      async function fetchExam() {
        setLoading(true);
        setError("");

        setExamTitle("");
        setQuestions([]);
        setExamDate("");
        setExamHours(0);
        setExamMinutes(0);
        try {
          const examData = await loadExam(examId);
          setExamTitle(examData.title || "");
          setQuestions(
            examData.questions?.map((q) => ({
              questionId: q.questionId || null,
              question: q.questionText || q.question || "",
              answers: [
                q.optionA || "",
                q.optionB || "",
                q.optionC || "",
                q.optionD || "",
              ],
              correct: ["A", "B", "C", "D"].indexOf(q.correctOption),
              isRemoved: false,
            })) || []
          );
          if (examData.startedTime || examData.date) {
            const startTime = examData.startedTime || examData.date;
            setExamDate(startTime);
            const start = new Date(startTime);
            const end = new Date(examData.endTime || examData.endDate);
            if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
              const durationMs = end - start;
              setExamHours(Math.floor(durationMs / 3600000));
              setExamMinutes(Math.round((durationMs % 3600000) / 60000));
            }
          }
        } catch (err) {
          console.error("Load exam error:", {
            message: err.message,
            response: err.response?.data,
            status: err.response?.status,
          });
          const errorMessage =
            err.response?.status === 404
              ? "Exam not found. It may have been deleted or you lack permission."
              : err.response?.data?.message ||
              err.message ||
              "Failed to load exam. Please try again or contact support.";
          setError(errorMessage);
        } finally {
          setLoading(false);
        }
      }
      fetchExam();
    }
  }, [examId]);

  const canSaveQuestion = () => {
    return (
      questionName.trim() &&
      correctIndex !== null &&
      answers.some((a) => a && a.trim().length > 0)
    );
  };

  const addQuestion = () => {
    if (!questionName.trim()) {
      setError("Question text is required");
      return;
    }
    if (correctIndex === null) {
      setError("Select the correct answer");
      return;
    }
    if (!answers.some((a) => a && a.trim().length > 0)) {
      setError("Add at least one answer");
      return;
    }

    const newQuestion = {
      questionId: null,
      question: questionName.trim(),
      answers: answers.map((a) => a.trim()),
      correct: correctIndex,
      isRemoved: false,
    };

    // Check for duplicate questions
    if (questions.some((q) => q.question === newQuestion.question && !q.isRemoved)) {
      setError("This question already exists");
      return;
    }

    setQuestions((q) => [...q, newQuestion]);
    resetQuestionForm();
    setIsQuestionPanelOpen(false);
    setError("");
  };
  const handleCancel = () => {
    const hasUnsaved =
      examTitle.trim() !== "" ||
      questions.length > 0 ||
      examDate !== "" ||
      examHours > 0 ||
      examMinutes > 0;

    if (hasUnsaved) {
      const confirmCancel = window.confirm(
        "Are you sure you want to cancel? Any unsaved progress will be lost."
      );
      if (confirmCancel) {
        navigate(-1);
      }

    } else {
      navigate(-1);
    }
  };
  const updateQuestion = () => {
    if (!questionName.trim()) {
      setError("Question text is required");
      return;
    }
    if (correctIndex === null) {
      setError("Select the correct answer");
      return;
    }
    if (!answers.some((a) => a && a.trim().length > 0)) {
      setError("Add at least one answer");
      return;
    }

    const updatedQuestion = {
      questionId: questions[selectedIndex]?.questionId || null,
      question: questionName.trim(),
      answers: answers.map((a) => a.trim()),
      correct: correctIndex,
      isRemoved: false,
    };


    if (
      questions.some(
        (q, i) => i !== selectedIndex && q.question === updatedQuestion.question && !q.isRemoved
      )
    ) {
      setError("This question already exists");
      return;
    }

    setQuestions((q) =>
      q.map((question, i) =>
        i === selectedIndex ? updatedQuestion : question
      )
    );
    resetQuestionForm();
    setIsQuestionPanelOpen(false);
    setError("");
  };

  const deleteQuestion = () => {
    setQuestions((q) =>
      q.map((question, i) =>
        i === selectedIndex ? { ...question, isRemoved: true } : question
      )
    );
    resetQuestionForm();
    setIsQuestionPanelOpen(false);
    setError("");
  };

  const resetQuestionForm = () => {
    setQuestionName("");
    setAnswers(["", "", "", ""]);
    setCorrectIndex(null);
    setEditMode(false);
    setSelectedIndex(null);
  };

  const handleRowClick = (q, i) => {
    if (q.isRemoved) return;
    setQuestionName(q.question);
    setAnswers([...q.answers]);
    setCorrectIndex(q.correct);
    setSelectedIndex(i);
    setEditMode(true);
    setIsQuestionPanelOpen(true);
    setError("");
  };

  // Convert local datetime-local input to backend UTC format: 'YYYY-MM-DDTHH:mm'
  const formatDateToApi = (localDateTimeString) => {
    if (!localDateTimeString) return null;

    const localDate = new Date(localDateTimeString);
    const yyyy = localDate.getFullYear();
    const mm = String(localDate.getMonth() + 1).padStart(2, "0");
    const dd = String(localDate.getDate()).padStart(2, "0");
    const hh = String(localDate.getHours()).padStart(2, "0");
    const min = String(localDate.getMinutes()).padStart(2, "0");

    return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
  };



  async function saveExam() {
    setLoading(true);
    setError("");
    try {
      const startIso = formatDateToApi(examDate);
      const totalMinutes = Number(examHours) * 60 + Number(examMinutes);
      const endIso =
        startIso && !Number.isNaN(totalMinutes) && totalMinutes > 0
          ? formatDateToApi(
            new Date(new Date(examDate).getTime() + totalMinutes * 60000)
          )
          : null;

      const payload = {
        title: examTitle.trim() || null,
        date: startIso,
        startedTime: startIso,
        endTime: endIso,
        isNew: !examId,
        isUpdate: !!examId,
        isRemove: false,
        examId: examId || null,
        questions: questions.map((q) => ({
          questionId: q.questionId || null,
          questionText: q.question,
          optionA: q.answers[0] || "",
          optionB: q.answers[1] || "",
          optionC: q.answers[2] || "",
          optionD: q.answers[3] || "",
          correctOption: ["A", "B", "C", "D"][q.correct] ?? null,
          isNew: !q.questionId && !q.isRemoved,
          isUpdate: !!q.questionId && !q.isRemoved,
          isRemove: q.isRemoved,
        })),
      };

      console.log("Save payload:", payload);

      await manageExam(payload);

      alert("Exam saved Successfully.....")
      navigate("/teacher")
    } catch (err) {
      console.error("Save error:", {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
      });
      setError(err.response?.data?.message || err.message || "Failed to save exam");
    } finally {
      setLoading(false);
    }
  }

  async function handlePublish() {
    if (!questions || questions.length === 0) {
    alert("You cannot publish an exam without questions.");
    return;
  }
    setLoading(true);
    setError("");
    try {
      const startIso = formatDateToApi(examDate);
      const totalMinutes = Number(examHours) * 60 + Number(examMinutes);
      const endIso =
        startIso && !Number.isNaN(totalMinutes) && totalMinutes > 0
          ? formatDateToApi(
            new Date(new Date(examDate).getTime() + totalMinutes * 60000)
          )
          : null;

      const payload = {
        title: examTitle.trim() || null,
        date: startIso,
        startedTime: startIso,
        endTime: endIso,
        isNew: !examId,
        isUpdate: !!examId,
        isRemove: false,
        examId: examId || null,
        questions: questions.map((q) => ({
          questionId: q.questionId || null,
          questionText: q.question,
          optionA: q.answers[0] || "",
          optionB: q.answers[1] || "",
          optionC: q.answers[2] || "",
          optionD: q.answers[3] || "",
          correctOption: ["A", "B", "C", "D"][q.correct] ?? null,
          isNew: !q.questionId && !q.isRemoved,
          isUpdate: !!q.questionId && !q.isRemoved,
          isRemove: q.isRemoved,
        })),
      };

      console.log("Save payload for publish:", payload);

      const response = await manageExam(payload);
      const savedExamId = response?.examId || response?.data?.examId;

      if (!savedExamId) {
        throw new Error("Exam ID not returned after saving");
      }

      await publishExam({ examId: savedExamId });

      navigate("/teacher");
    } catch (err) {
      console.error("Publish error:", {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
      });
      setError(err.response?.data?.message || err.message || "Failed to publish exam");
    } finally {
      setLoading(false);
    }
  }

  const buttonFocusClasses =
    "focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-indigo-300 active:scale-95 transition-transform";

  return (
    <>
      <Header />
      <div className="flex w-full min-h-screen bg-gray-100 p-4">
        <div className="flex-1 bg-white shadow-md p-4 rounded-lg">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-lg font-semibold">Exam</h2>
              <div className="mt-2">
                <label className="block text-sm text-gray-600 mb-1">Exam Title</label>
                <input
                  type="text"
                  value={examTitle}
                  onChange={(e) => setExamTitle(e.target.value)}
                  placeholder="Enter exam title"
                  className="w-full border rounded p-2 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  resetQuestionForm();
                  setIsQuestionPanelOpen(true);
                }}
                className={
                  "bg-red-500 text-white px-3 py-2 rounded disabled:opacity-50 disabled:cursor-not-allowed " +
                  buttonFocusClasses
                }
              >
                Add Question
              </button>
            </div>
          </div>

          <h3 className="font-medium mb-3">Question List</h3>

          <table className="w-full border text-left">
            <thead className="bg-blue-100">
              <tr>
                <th className="border px-2 py-1">Question</th>
                <th className="border px-2 py-1">Answers</th>
              </tr>
            </thead>
            <tbody>
              {questions.filter((q) => !q.isRemoved).length === 0 ? (
                <tr>
                  <td colSpan="2" className="text-center py-3 text-gray-400">
                    No questions added yet
                  </td>
                </tr>
              ) : (
                questions
                  .filter((q) => !q.isRemoved)
                  .map((q, i) => (
                    <tr
                      key={q.questionId || `question-${i}`}
                      onClick={() => handleRowClick(q, i)}
                      className="cursor-pointer hover:bg-gray-100"
                    >
                      <td className="border px-2 py-1 align-top">{q.question}</td>
                      <td className="border px-2 py-1">
                        {q.answers.map((ans, idx) => (
                          <span
                            key={idx}
                            className={`mr-3 ${idx === q.correct
                              ? "text-green-600 font-medium"
                              : "text-gray-700"
                              }`}
                          >
                            {String.fromCharCode(65 + idx)}: {ans || <em className="text-gray-400">(empty)</em>}
                          </span>
                        ))}
                      </td>
                    </tr>
                  ))
              )}
            </tbody>
          </table>

          <div className="flex items-center justify-between mt-4">
            <div className="flex items-center gap-3">
              <label className="text-sm text-gray-600">Date/time</label>
              <input
                type="datetime-local"
                value={examDate}
                onChange={(e) => setExamDate(e.target.value)}
                className="border rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-200"
              />

              <label className="text-sm text-gray-600 ml-2">Duration</label>
              <input
                type="number"
                min="0"
                value={examHours}
                onChange={(e) => setExamHours(e.target.value)}
                className="w-20 border rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                placeholder="Hours"
              />
              <span className="text-sm text-gray-600">h</span>
              <input
                type="number"
                min="0"
                max="59"
                value={examMinutes}
                onChange={(e) => setExamMinutes(e.target.value)}
                className="w-20 border rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                placeholder="Minutes"
              />
              <span className="text-sm text-gray-600">min</span>
              <button
                onClick={handlePublish}
                disabled={loading}
                className={
                  "bg-purple-600 text-white px-3 py-1 rounded disabled:opacity-50 disabled:cursor-not-allowed ml-3 " +
                  buttonFocusClasses
                }
              >
                {loading ? "Publishing..." : "Publish Paper"}
              </button>
            </div>
            <div>
              <button
                onClick={saveExam}
                disabled={loading}
                className={
                  "bg-blue-500 text-white px-3 py-1 rounded disabled:opacity-50 disabled:cursor-not-allowed mr-2 " +
                  buttonFocusClasses
                }
              >
                {loading ? "Saving..." : "Save"}
              </button>
              <button
                onClick={handleCancel}
                className={"text-gray-600 px-3 py-1 rounded " + buttonFocusClasses}
              >
                Cancel
              </button>
            </div>
          </div>

          {error && <div className="mt-3 text-sm text-red-600">{error}</div>}
        </div>

        {isQuestionPanelOpen && (
          <div className="w-1/3 ml-4 bg-white shadow-md p-4 rounded-lg">
            <div className="mb-2">
              <label className="block text-sm text-gray-600 mb-1">
                {editMode ? "Edit Question Title" : "Question Title"}
              </label>
              <input
                type="text"
                value={questionName}
                onChange={(e) => setQuestionName(e.target.value)}
                placeholder="Enter question title here"
                className="w-full border rounded p-2 focus:outline-none focus:ring-2 focus:ring-indigo-200"
              />
            </div>
            <p className="text-sm text-gray-600 mb-2">Answers</p>
            <div className="space-y-2">
              {answers.map((ans, i) => (
                <div
                  key={i}
                  onClick={() => setCorrectIndex(i)}
                  className={`flex items-center justify-between border rounded p-2 cursor-pointer ${correctIndex === i ? "bg-green-100 border-green-400" : ""
                    }`}
                >
                  <input
                    type="text"
                    value={ans}
                    onChange={(e) => {
                      const updated = [...answers];
                      updated[i] = e.target.value;
                      setAnswers(updated);
                    }}
                    placeholder={`Answer ${String.fromCharCode(65 + i)}`}
                    className="flex-1 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                  />
                  {correctIndex === i && (
                    <span className="text-green-600 font-semibold ml-2">Correct</span>
                  )}
                </div>
              ))}
            </div>
            <div className="mt-4 flex gap-2">
              {editMode ? (
                <>
                  <button
                    onClick={updateQuestion}
                    disabled={!canSaveQuestion()}
                    className={
                      "bg-emerald-500 text-white px-4 py-2 rounded flex-1 disabled:opacity-50 disabled:cursor-not-allowed " +
                      buttonFocusClasses
                    }
                  >
                    Update
                  </button>
                  <button
                    onClick={deleteQuestion}
                    className={
                      "bg-red-500 text-white px-4 py-2 rounded flex-1 " +
                      buttonFocusClasses
                    }
                  >
                    Delete
                  </button>
                </>
              ) : (
                <button
                  onClick={addQuestion}
                  disabled={!canSaveQuestion()}
                  className={
                    "bg-emerald-500 text-white px-4 py-2 rounded flex-1 disabled:opacity-50 disabled:cursor-not-allowed " +
                    buttonFocusClasses
                  }
                >
                  Add
                </button>
              )}
              <button
                onClick={() => {
                  resetQuestionForm();
                  setIsQuestionPanelOpen(false);
                }}
                className={
                  "bg-gray-500 text-white px-4 py-2 rounded flex-1 " +
                  buttonFocusClasses
                }
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

export default AddExam;