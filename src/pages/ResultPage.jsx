import  { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { getStudentResults } from "../api/studentExams";
import Header from "../Layout/Header";

function ResultPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  // Get studentExamId from navigation state
  const studentExamId = location.state?.studentExamId;

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    

    async function fetchResults() {
      try {
        const data = await getStudentResults(studentExamId, token);
        setResult(data);
      } catch (err) {
        console.error("Failed to fetch results:", err);
        setError(err.response?.data?.message || err.message || "Failed to fetch results");
      } finally {
        setLoading(false);
      }
    }

    fetchResults();
  }, [studentExamId, token]);

  if (loading) return <p className="p-4 text-center">Loading results...</p>;
  if (error) return <p className="p-4 text-center text-red-600">{error}</p>;
  if (!result) return null;

  const data = result.data;

  return (
    
      <div className="min-h-screen bg-gray-100">
      <Header />

  <div className="max-w-6xl mx-auto p-6">
    <div className="flex items-center justify-between mb-6">
      <h1 className="text-lg font-semibold">{result.title}</h1>
    </div>


      {/* Result Summary */}
      <div className="flex-1 flex flex-col items-center justify-start mt-10">
        <div className=" border-2 border-gray-400  bg-white p-6 w-[400px]  mb-6">
          <p className="text-gray-600 font-semibold ">Exam completed</p>
          <h2
            className={`text-3xl font-bold mt-2 text-center ${
              result.passFail === "Passed" ? "text-teal-500" : "text-red-500"
            }`}
          >
            {result.passFail}
          </h2>
          <p className="mt-2 text-gray-700 font-semibold text-center">
            {result.grade} – {result.obtainedPoints}  points
          </p>
         
        </div>

        {/* Questions Review */}
        <div className=" border-2 border-gray-400 shadow bg-white p-6 w-[500px]">
          <h3 className="font-semibold mb-4">Questions</h3>
          <div className="space-y-3">
            {result.question.map((q, idx) => (
              <div
                key={q.questionId}
                className="flex justify-between items-center  border-2 border-gray-400 p-2 rounded"
              >
                <span>
                  Q{idx + 1}: {q.title}
                </span>
                <span
                  className={`font-medium ${
                    q.verdictText === "Correct"
                      ? "text-teal-500"
                      : q.verdictText === "Wrong"
                      ? "text-red-500"
                      : "text-gray-400"
                  }`}
                >
                  {q.verdictText}
                </span>
              </div>
              
            ))}
          </div>
        </div>
       
      </div>
       <div className="flex justify-center mt-5 ml-100">
        <button
         onClick={() =>{
          const role=localStorage.getItem('role');
          if(role=='TEACHER'){
             navigate(-1);
          }
          navigate('/student') }}
        className=" bg-gray-400  px-3 py-2 items-center ">Cancel</button>
      </div>
    </div>
    </div>
  );
}

export default ResultPage;
