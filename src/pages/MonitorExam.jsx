import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Header from "../Layout/Header";
import { monitorExam, endExam } from "../api/examMonitor";



const pad = (n) => String(n).padStart(2, "0");

function formatCountdownFromSeconds(totalSeconds) {
  if (totalSeconds <= 0) return "00:00 mins";
  const hrs = Math.floor(totalSeconds / 3600);
  const mins = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;


  if (hrs > 0) return `${hrs}:${pad(mins)}:${pad(secs)}`;
  return `${pad(mins)}:${pad(secs)} mins`;
}

function computeSecondsLeftFromIso(endIso) {
  if (!endIso) return null;
  const end = new Date(endIso).getTime();
  const diff = Math.max(0, end - Date.now());
  return Math.floor(diff / 1000);
}

function formatDateTime(iso) {
  if (!iso) return "-";
  const d = new Date(iso);
  return d.toLocaleString();
}

export default function MonitorExam(props) {
  const {examId} = useParams();
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const [exam, setExam] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [secondsLeft, setSecondsLeft] = useState(null);

  // refs for intervals
  const pollRef = useRef(null);
  const tickRef = useRef(null);

  const load = async () => {
    if (!examId) {
      setError("No exam id provided.");
      return;
    }
    try {
      setLoading(true);
      const data = await monitorExam({ examId }, token); 
      setExam(data);
      // prefer end time from backend
      const sec = computeSecondsLeftFromIso(data?.examEndTime);
      if (sec !== null) setSecondsLeft(sec);
      else if (data?.remainingTime) {
        
        const parts = String(data.remainingTime).split(":").map(Number);
        let seconds = 0;
        if (parts.length === 3) seconds = parts[0] * 3600 + parts[1] * 60 + parts[2];
        else if (parts.length === 2) seconds = parts[0] * 60 + parts[1];
        else seconds = Number(data.remainingTime) || 0;
        setSecondsLeft(seconds);
      } else {
        setSecondsLeft(null);
      }
      setLoading(false);
    } catch (err) {
      console.error(err);
      setError("Failed to load exam data.");
      setLoading(false);
    }
  };

  
  useEffect(() => {
    load();
    
    pollRef.current = setInterval(load, 10000);
    return () => clearInterval(pollRef.current);

  }, [examId]);

  // countdown tick every second
  useEffect(() => {
    // clear previous tick
    if (tickRef.current) clearInterval(tickRef.current);
    if (secondsLeft === null) return;
    tickRef.current = setInterval(() => {
      setSecondsLeft((s) => {
        if (!s || s <= 1) {
          clearInterval(tickRef.current);
        
          load();
          return 0;
        }
        return s - 1;
      });
    }, 1000);

    return () => clearInterval(tickRef.current);
    
  }, [secondsLeft]);

  const handleEndExam = async () => {
    if (!examId) return;
    if (!window.confirm("End this exam now?")) return;
    try {
      await endExam({ examId }, token);
      await load();
      
      
      navigate('/teacher');
    } catch (err) {
      console.error(err);
      alert("Failed to end exam.");
    }
  };
  const handleStudentClick =(student)=>{
    if(!student.studentExamId){
      alert("Student exam record not found");
      return ;
    }if(student.status ==='ATTENDED'){
    navigate("/results", { state: { studentExamId: student.studentExamId } });
    }
  };

  if (loading) return <div className="p-6">Loading...</div>;
  if (error) return <div className="p-6 text-red-600">{error}</div>;
  if (!exam) return <div className="p-6">No exam data.</div>;

  const completed = exam?.completedCount ?? 0;
  const total = exam?.totalCount ?? 0;
  const countdown = secondsLeft !== null ? formatCountdownFromSeconds(secondsLeft) : (exam?.remainingTime ?? "-");

  return (
   <div className="min-h-screen bg-gray-100">
  <Header />

  <div className="max-w-6xl mx-auto p-6">
    <div className="flex items-center justify-between mb-6">
      <h1 className="text-lg font-semibold">{exam?.examName ?? exam?.title ?? "Exam Monitor"}</h1>
    </div>

    <div className="grid grid-cols-3 gap-4"> {/* reduce gap */}
      {/* Left: main cards (span 2) */}
      <div className="col-span-2 space-y-3"> {/* reduce space-y */}
        <div className="border rounded-lg p-4 flex flex-col  bg-white">
          <div className="text-sm text-gray-500 font-bold">Exam completed</div>
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
                onClick={()=>handleStudentClick(s)}              >
                <div>{s.name}</div>
                <div className="text-xs">
                  {s.status === "ATTENDED" ? (
                    <span className="text-green-600 font-medium">{s.status}</span>
                  ) : s.status === "PENDING" ? (
                    <span className="text-gray-500">{s.status}</span>
                  ) : (
                    <span className="text-gray-500">{s.status}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
     </div>
        <div className="fixed bottom-6 right-6">
          <button
            onClick={handleEndExam}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded"
          >
            End Exam
          </button>
        </div>
      </div>
    </div>
  </div>

  )}
