import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../Layout/Header";
import api from "../api/apiClient";
import { publishExam } from "../api/exams";

function AddExam() {
  const navigate = useNavigate();
  const [examTitle, setExamTitle] = useState("");
  const [questions, setQuestions] = useState([]);
  const [questionName, setQuestionName] = useState("");
  const [answers, setAnswers] = useState(["", "", "", ""]);
  const [correctIndex, setCorrectIndex] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // exam scheduling fields
  const [examDate, setExamDate] = useState(""); // value for <input type="datetime-local">
  const [examDuration, setExamDuration] = useState(""); // duration in minutes

  const canAddQuestion = () => {
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
      question: questionName.trim(),
      answers: answers.map((a) => a.trim()),
      correct: correctIndex,
    };

    setQuestions((q) => [...q, newQuestion]);
    // reset inputs after adding
    setQuestionName("");
    setAnswers(["", "", "", ""]);
    setCorrectIndex(null);
    setError("");
  };

  function removeQuestion(index) {
    setQuestions((q) => q.filter((_, i) => i !== index));
  }

  async function handlePublish() {
    // validations
    if (!examTitle || !examTitle.trim()) {
      setError("Exam title is required");
      return;
    }
    if (!examDate) {
      setError("Exam date/time is required");
      return;
    }
    if (
      !examDuration ||
      Number.isNaN(Number(examDuration)) ||
      Number(examDuration) <= 0
    ) {
      setError("Exam duration (minutes) must be a positive number");
      return;
    }
    if (questions.length === 0) {
      setError("Add at least one question before publishing");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const minutes = Number(examDuration);
      const startIso = new Date(examDate).toISOString();
      const endIso = new Date(new Date(examDate).getTime() + minutes * 60000).toISOString();

      const payload = {
        title: examTitle.trim(),
        date: startIso,
        startedTime: startIso,
        endTime: endIso,
        questions: questions.map((q) => ({
          questionId: null,
          questionText: q.question,
          optionA: q.answers[0] || "",
          optionB: q.answers[1] || "",
          optionC: q.answers[2] || "",
          optionD: q.answers[3] || "",
          correctOption: ["A", "B", "C", "D"][q.correct] ?? null,
          isNew: true,
          isUpdate: false,
          isRemove: false,
        })),
        examId: null,
        isNew: true,
        isUpdate: false,
        isRemove: false,
      };

      console.log("Publish payload:", payload);

      // use shared api client (it attaches Authorization header)
      await api.post("/exams/teacher", payload);

      // navigate on success
      navigate("/teacher");
    } catch (err) {
      console.error("Publish error:", err);
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
                onClick={addQuestion}
                disabled={!canAddQuestion()}
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

          {/* Question Table */}
          <table className="w-full border text-left">
            <thead className="bg-blue-100">
              <tr>
                <th className="border px-2 py-1">Question</th>
                <th className="border px-2 py-1">Answers</th>
                <th className="border px-2 py-1">Actions</th>
              </tr>
            </thead>
            <tbody>
              {questions.length === 0 ? (
                <tr>
                  <td colSpan="3" className="text-center py-3 text-gray-400">
                    No questions added yet
                  </td>
                </tr>
              ) : (
                questions.map((q, i) => (
                  <tr key={i}>
                    <td className="border px-2 py-1 align-top">{q.question}</td>
                    <td className="border px-2 py-1">
                      {q.answers.map((ans, idx) => (
                        <span
                          key={idx}
                          className={`mr-3 ${
                            idx === q.correct ? "text-green-600 font-medium" : "text-gray-700"
                          }`}
                        >
                          {ans || <em className="text-gray-400">(empty)</em>}
                        </span>
                      ))}
                    </td>
                    <td className="border px-2 py-1">
                      <button
                        onClick={() => removeQuestion(i)}
                        className="text-sm text-red-600 px-2 py-1 border rounded"
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {/* Controls under the table */}
          <div className="flex items-center justify-between mt-4">
            <div className="flex items-center gap-3">
              <label className="text-sm text-gray-600">Date/time</label>
              <input
                type="datetime-local"
                value={examDate}
                onChange={(e) => setExamDate(e.target.value)}
                className="border rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-200"
              />
              <label className="text-sm text-gray-600 ml-2">Duration (min)</label>
              <input
                type="number"
                min="1"
                value={examDuration}
                onChange={(e) => setExamDuration(e.target.value)}
                className="w-24 border rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                placeholder="Minutes"
              />
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
              <button onClick={() => navigate(-1)} className={"px-3 py-1 rounded border " + buttonFocusClasses}>
                Cancel
              </button>
            </div>
          </div>

          {error && <div className="mt-3 text-sm text-red-600">{error}</div>}
        </div>

        {/* Right Side - Question title + Answers */}
        <div className="w-1/3 ml-4 bg-white shadow-md p-4 rounded-lg">
          <div className="mb-2">
            <label className="block text-sm text-gray-600 mb-1">Question Title</label>
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
                className={`flex items-center justify-between border rounded p-2 cursor-pointer ${
                  correctIndex === i ? "bg-green-100 border-green-400" : ""
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
                  placeholder={`Answer ${i + 1}`}
                  className="flex-1 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                />
                {correctIndex === i && <span className="text-green-600 font-semibold ml-2">Correct</span>}
              </div>
            ))}
          </div>

          <div className="mt-2">
            <button
              onClick={addQuestion}
              disabled={!canAddQuestion()}
              className={
                "bg-emerald-500 text-white px-4 py-2 rounded w-full disabled:opacity-50 disabled:cursor-not-allowed " +
                buttonFocusClasses
              }
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

export default AddExam;
