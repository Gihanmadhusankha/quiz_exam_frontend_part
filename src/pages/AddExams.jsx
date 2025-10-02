import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Header from "../Layout/Header";
import { manageExam, publishExam, loadExam } from "../api/exams";
import { TimeDropdown } from "../components/TimeDropdown";


function AddExam() {
  const navigate = useNavigate();
  const { examId } = useParams();
  const draftKey = examId ? `examDraft-${examId}` : "examDraft-new";


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
  const [examDays, setExamDays] = useState(0);
  const [isQuestionPanelOpen, setIsQuestionPanelOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(null);

  const calculateDuration = (start, end) => {
    if (!start || !end) return { days: 0, hours: 0, minutes: 0 };
    const startTime = new Date(start).getTime();
    const endTime = new Date(end).getTime();
    if (isNaN(startTime) || isNaN(endTime)) return { days: 0, hours: 0, minutes: 0 };

    const totalMinutes = Math.round((endTime - startTime) / 60000);
    const days = Math.floor(totalMinutes / (24 * 60));
    const hours = Math.floor((totalMinutes % (24 * 60)) / 60);
    const minutes = totalMinutes % 60;

    return { days, hours, minutes };
  };

  useEffect(() => {
    if (examId) {
      async function fetchExam() {
        setLoading(true);
        setError("");
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
            const endTime = examData.endTime || examData.endDate || startTime;

            setExamDate(startTime);

            const { days, hours, minutes } = calculateDuration(startTime, endTime);
            setExamDays(days);
            setExamHours(hours);
            setExamMinutes(minutes);
          }
        } catch (err) {
          console.error("Load exam error:", err);
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



  useEffect(() => {
    if (!examId) {
      const draft = localStorage.getItem(draftKey);
      if (draft) {
        try {
          const parsed = JSON.parse(draft);
          setExamTitle(parsed.examTitle || "");
          setExamDate(parsed.examDate || "");
          setExamHours(parsed.examHours || 0);
          setExamMinutes(parsed.examMinutes || 0);
          setExamDays(parsed.examDays || 0);
          setQuestions(parsed.questions || []);
        } catch (err) {
          console.error("Failed to parse draft:", err);
          localStorage.removeItem(draftKey);
        }
      }
    }
  }, [examId, draftKey]);


  useEffect(() => {
    const timeoutId = setTimeout(() => {
      const draft = {
        examTitle,
        examDate,
        examHours,
        examMinutes,
        examDays,
        questions,
      };
      localStorage.setItem(draftKey, JSON.stringify(draft));
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [examTitle, examDate, examHours, examMinutes, examDays, questions, draftKey]);


  useEffect(() => {
    window.history.pushState(null, "", window.location.href);

    const handlePopState = () => {
      window.history.pushState(null, "", window.location.href);
    };

    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, []);

  const canSaveQuestion = () => {
    return (
      questionName.trim() &&
      correctIndex !== null &&
      answers.some((a) => a && a.trim().length > 0)
    );
  };



  const resetQuestionForm = () => {
    setQuestionName("");
    setAnswers(["", "", "", ""]);
    setCorrectIndex(null);
    setEditMode(false);
    setSelectedIndex(null);
    setIsQuestionPanelOpen(false);
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

  const addQuestion = () => {
    if (!canSaveQuestion()) {
      alert("Please enter question text, at least one answer, and select the correct option.");
      return;
    }
    const newQuestion = {
      questionId: null,
      question: questionName.trim(),
      answers: answers.map((a) => a.trim()),
      correct: correctIndex,
      isRemoved: false,
    };

    if (questions.some((q) => q.question === newQuestion.question && !q.isRemoved)) {
      alert("This question already exists");
      return;
    }

    setQuestions((q) => [...q, newQuestion]);
    resetQuestionForm();
    setError("");
  };

  async function saveExam() {
    setLoading(true);
    setError("");
    const totalMinutes = Number(examDays) * 24 * 60 + Number(examHours) * 60 + Number(examMinutes);

    try {
      if (!examTitle || totalMinutes <= 0 || !examDate) {
        alert("You cannot save the exam without a title, date, and duration");
        setLoading(false);
        return;
      }

      const allQuestions = [...questions];

      if (isQuestionPanelOpen && canSaveQuestion()) {
        allQuestions.push({
          questionId: null,
          question: questionName.trim(),
          answers: answers.map((a) => a.trim()),
          correct: correctIndex,
          isRemoved: false,
        });
      }

      const startIso = examDate ? formatDateToApi(examDate) : null;
      const endIso =
        startIso && totalMinutes > 0
          ? formatDateToApi(
            new Date(new Date(examDate).getTime() + totalMinutes * 60000)
          )
          : null;

      const payload = {
        title: examTitle.trim(),
        date: startIso,
        startedTime: startIso,
        endTime: endIso,
        isNew: !examId,
        isUpdate: !!examId,
        isRemove: false,
        examId: examId || null,
        questions: allQuestions.map((q) => ({
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

      alert("Exam saved successfully!");
      sessionStorage.removeItem("examDraft");
      resetQuestionForm();
      navigate("/teacher");
    } catch (err) {
      console.error("Save error:", err);
      setError(err.response?.data?.message || err.message || "Failed to save exam");
    } finally {
      setLoading(false);
    }
  }

  const handlePublish = async () => {
    setLoading(true);
    setError("");
    try {
      const totalMinutes = Number(examDays) * 24 * 60 + Number(examHours) * 60 + Number(examMinutes);

      if (!examTitle || !examDate || totalMinutes <= 0) {
        alert("You cannot publish an exam without required fields");
        setLoading(false);
        return;
      }

      const allQuestions = [...questions];

      if (isQuestionPanelOpen && canSaveQuestion()) {
        allQuestions.push({
          questionId: null,
          question: questionName.trim(),
          answers: answers.map((a) => a.trim()),
          correct: correctIndex,
          isRemoved: false,
        });
      }

      if (allQuestions.length === 0) {
        alert("Add at least one question to publish the exam");
        setLoading(false);
        return;
      }

      const startIso = formatDateToApi(examDate);
      const endIso =
        startIso && totalMinutes > 0
          ? formatDateToApi(
            new Date(new Date(examDate).getTime() + totalMinutes * 60000)
          )
          : null;

      const payload = {
        title: examTitle.trim(),
        date: startIso,
        startedTime: startIso,
        endTime: endIso,
        isNew: !examId,
        isUpdate: !!examId,
        isRemove: false,
        examId: examId || null,
        questions: allQuestions.map((q) => ({
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

      const response = await manageExam(payload);
      const savedExamId = response?.examId || response?.data?.examId;
      if (!savedExamId) throw new Error("Exam ID not returned after saving");

      await publishExam({ examId: savedExamId });
      alert("Exam published successfully!");
      resetQuestionForm();
      navigate("/teacher");
    } catch (err) {
      console.error("Publish error:", err);
      setError(err.response?.data?.message || err.message || "Failed to publish exam");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    const hasUnsaved =
      examTitle.trim() !== "" ||
      questions.length > 0 ||
      examDate !== "" ||
      examHours > 0 ||
      examMinutes > 0;

    if (hasUnsaved) {
      if (window.confirm("Are you sure you want to cancel? Unsaved progress will be lost.")) {
        navigate("/teacher");
      }
    } else {
      navigate("/teacher");
    }
  };

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
              <div className="flex items-center gap-2">
                <TimeDropdown value={examDays} setValue={setExamDays} max={365} unit="day" />
                <TimeDropdown value={examHours} setValue={setExamHours} max={23} unit="hour" />
                <TimeDropdown value={examMinutes} setValue={setExamMinutes} max={59} unit="min" />
              </div>
              <button
                onClick={handlePublish}
                className={
                  "bg-purple-600 text-white px-3 py-1 rounded disabled:opacity-50 disabled:cursor-not-allowed ml-3 " +
                  buttonFocusClasses
                }
              >
                Publish
              </button>
            </div>
            <div>
              <button
                onClick={saveExam}
                className={
                  "bg-blue-500 text-white px-3 py-1 rounded disabled:opacity-50 disabled:cursor-not-allowed mr-2 " +
                  buttonFocusClasses
                }
              >
                Save
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
                  className={`flex items-center justify-between border rounded p-2 cursor-pointer ${correctIndex === i ? "bg-green-100 border-green-400" : ""}`}
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
                    className={"bg-emerald-500 text-white px-4 py-2 rounded flex-1 disabled:opacity-50 disabled:cursor-not-allowed " + buttonFocusClasses}
                  >
                    Update
                  </button>
                  <button
                    onClick={deleteQuestion}
                    className={"bg-red-500 text-white px-4 py-2 rounded flex-1 " + buttonFocusClasses}
                  >
                    Delete
                  </button>
                </>
              ) : (
                <button
                  onClick={addQuestion}
                  disabled={!canSaveQuestion()}
                  className={"bg-emerald-500 text-white px-4 py-2 rounded flex-1 disabled:opacity-50 disabled:cursor-not-allowed " + buttonFocusClasses}
                >
                  Add
                </button>
              )}
              <button
                onClick={() => {
                  resetQuestionForm();
                  setIsQuestionPanelOpen(false);
                }}
                className={"bg-gray-500 text-white px-4 py-2 rounded flex-1 " + buttonFocusClasses}
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
