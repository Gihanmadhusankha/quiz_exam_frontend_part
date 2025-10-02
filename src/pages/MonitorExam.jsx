import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Header from "../Layout/Header";
import { monitorExam, endExam } from "../api/examMonitor";

// Pads numbers like 1 -> 01
const pad = (n) => String(n).padStart(2, "0");

// Format seconds into days, hours, minutes, seconds
function formatCountdownFromSeconds(totalSeconds) {
  if (totalSeconds <= 0) return "Ended";

  const days = Math.floor(totalSeconds / (24 * 3600));
  const hrs = Math.floor((totalSeconds % (24 * 3600)) / 3600);
  const mins = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;

  let result = "";
  if (days > 0) result += `${days} day${days > 1 ? "s" : ""} `;
  if (hrs > 0) result += `${hrs} hour${hrs > 1 ? "s" : ""} `;
  if (mins > 0) result += `${mins} min `;
  result += `${pad(secs)} sec`;

  return result.trim();
}

// Compute seconds until a start ISO datetime
function computeSecondsUntilStart(startIso) {
  if (!startIso) return null;
  const start = new Date(startIso).getTime();
  const diff = start - Date.now();
  return diff > 0 ? Math.floor(diff / 1000) : 0;
}

// Compute seconds left until an end ISO datetime
function computeSecondsLeftFromIso(endIso) {
  if (!endIso) return null;
  const end = new Date(endIso).getTime();
  const diff = Math.max(0, end - Date.now());
  return Math.floor(diff / 1000);
}

// Parse backend duration string like "288h 00min"
function parseDuration(durationStr) {
  if (!durationStr) return 0;

  const dayMatch = durationStr.match(/(\d+)d/);
  const hourMatch = durationStr.match(/(\d+)h/);
  const minMatch = durationStr.match(/(\d+)min/);

  const days = dayMatch ? parseInt(dayMatch[1], 10) : 0;
  const hours = hourMatch ? parseInt(hourMatch[1], 10) : 0;
  const mins = minMatch ? parseInt(minMatch[1], 10) : 0;

  return days * 24 * 3600 + hours * 3600 + mins * 60;
}

// Format ISO datetime
function formatDateTime(iso) {
  if (!iso) return "-";
  const d = new Date(iso);
  return d.toLocaleString();
}

export default function MonitorExam() {
  const { examId } = useParams();
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const [exam, setExam] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [secondsLeft, setSecondsLeft] = useState(null);

  const pollRef = useRef(null);
  const tickRef = useRef(null);

  // Load exam data from backend
  const load = async () => {
    if (!examId) {
      setError("No exam id provided.");
      return;
    }

    try {
      setLoading(true);
      const data = await monitorExam({ examId }, token);
      setExam(data);

      // Compute seconds left
      const sec = data?.examEndTime
        ? computeSecondsLeftFromIso(data.examEndTime)
        : parseDuration(data.ExamDuration || "0h 0min");

      setSecondsLeft(sec);

      setLoading(false);
    } catch (err) {
      console.error(err);
      setError("Failed to load exam data.");
      setLoading(false);
    }
  };

  // Initial load + poll every 10s
  useEffect(() => {
    load();
    pollRef.current = setInterval(load, 10000);
    return () => clearInterval(pollRef.current);
  }, [examId]);

  // Countdown tick every second
  useEffect(() => {
    if (tickRef.current) clearInterval(tickRef.current);
    if (secondsLeft === null || exam?.remainingTime === "Ended") return;

    tickRef.current = setInterval(async () => {
      setSecondsLeft((s) => {
        if (!s || s <= 1) {
          clearInterval(tickRef.current);

          // Auto-end exam when timer is up
          if (exam?.remainingTime!== "Ended") {
            (async () => {
              try {
                await endExam({ examId, isTimerEnd: true }, token);
                await load();
              } catch (err) {
                console.error(err);
              }
            })();
          }

          return 0;
        }
        return s - 1;
      });
    }, 1000);

    return () => clearInterval(tickRef.current);
  }, [secondsLeft, exam?.status]);

  // End exam button
  const handleEndExam = async () => {
    if (!examId) return;
    if (!window.confirm("End this exam now?")) return;
    try {
      await endExam({ examId, isTimerEnd: false }, token);
      await load();
    } catch (err) {
      console.error(err);
      alert("Failed to end exam.");
    }
  };

  const handleStudentClick = (student) => {
    if (!student.studentExamId) {
      alert("Student exam record not found");
      return;
    }
   const isExamEnded = 
      exam?.status === "ENDED" || 
      exam?.remainingTime === "Ended" || 
      secondsLeft === 0;
    if (
      student.status === "COMPLETED" ||isExamEnded)
    {
      navigate("/results", { state: { studentExamId: student.studentExamId } });
    }
  };

  if (loading) return <div className="p-6">Loading...</div>;
  if (error) return <div className="p-6 text-red-600">{error}</div>;
  if (!exam) return <div className="p-6">No exam data.</div>;

  const completed = exam?.completedCount ?? 0;
  const total = exam?.totalCount ?? 0;

  const secondsUntilStart = computeSecondsUntilStart(exam?.examStartTime);

  let countdown = "Ended";
  if (exam?.remainingTime!== "Ended") {
    if (secondsUntilStart > 0) {
      countdown = `Not Started (${formatCountdownFromSeconds(secondsUntilStart)})`;
    } else if (secondsLeft !== null && secondsLeft > 0) {
      countdown = formatCountdownFromSeconds(secondsLeft);
    }
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Header />
      <div className="max-w-6xl mx-auto p-6">
        <div className="flex mb-6">
          <button
            onClick={() => navigate(-1)}
            className=" mr-5 px-1 py-1 bg-gray-400 text-white rounded hover:bg-gray-600"
          >
            ← Back
          </button>
          <h1 className="text-lg font-semibold">
            {exam?.examName ?? exam?.title ?? "Exam Monitor"}
          </h1>
        </div>

        <div className="grid grid-cols-3 gap-4">
          {/* Left: main cards */}
          <div className="col-span-2 space-y-3">
            <div className="border rounded-lg p-4 flex flex-col bg-white">
              <div className="text-sm text-green-600 font-bold">Exam completed</div>
              <div className="text-5xl font-extrabold my-2 text-gray-800 text-center">
                {completed}/{total}
              </div>
              <div className="text-sm text-gray-500 flex justify-center items-center">
                Time Left: <span className="font-medium ml-1">{countdown}</span>
              </div>
            </div>

            <div className="border rounded-lg p-4 min-h-[120px] bg-white">
              <div className="text-sm text-gray-600 mb-2">
                <div className="font-medium">Exam Started time</div>
                <div>{formatDateTime(exam?.examStartTime)}</div>
              </div>
              <div className="text-sm text-gray-600">
                <div className="font-medium">Exam Ending time</div>
                <div>{formatDateTime(exam?.examEndTime)}</div>
              </div>
            </div>
          </div>

          {/* Right: student list */}
          <div className="border rounded-lg p-4 bg-white flex flex-col justify-between h-full">
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium">Attending Students List</h3>
                <div className="text-xs text-gray-500">{exam?.students?.length ?? 0}</div>
              </div>

              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {(exam?.students ?? []).map((s) => (
                  <div
                    key={s.id}
                    className="flex items-center justify-between p-2 border rounded hover:bg-gray-50 cursor-pointer"
                    onClick={() => handleStudentClick(s)}
                  >
                    <div>{s.name}</div>
                    <div className="text-xs">
                      {s.status === "COMPLETED" ? (
                        <span className="text-green-600 font-medium">{s.status}</span>
                      ) : s.status === "NOT_COMPLETED" ? (
                        <span className="text-red-600">{s.status}</span>
                      ) : (
                        <span className="text-gray-500">{s.status}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* End exam button */}
          <div className="fixed bottom-6 right-6">
            <button
              onClick={handleEndExam}
              disabled={exam.remainingTime=== "Ended"}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded"
            >
              End Exam
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
