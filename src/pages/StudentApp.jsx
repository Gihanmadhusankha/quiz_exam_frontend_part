import { useState, useEffect } from 'react';
import Header from '../Layout/Header';
import { listStudentExams, loadSingleExam, getStudentResults } from '../api/studentExams';
import { useNavigate } from 'react-router-dom';

function StudentApp() {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [page, setPage] = useState(0);
  const [size] = useState(5);
  const [hasMore, setHasMore] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeQuery, setActiveQuery] = useState('');

  // Load exams from backend
  async function loadExams(currentPage = page, query = activeQuery, reset = false) {
    setLoading(true);
    setError('');

    try {
      if (!token) {
        navigate('/login');
        throw new Error('No token found. Please log in.');
      }

      const body = { page: currentPage, size };
      if (query) body.query = query;

      const responseData = await listStudentExams(body, token);
      const list = responseData.content || [];
      setExams((prev) => (reset ? list : [...prev, ...list]));
      setHasMore(!responseData.last);
    } catch (err) {
      console.error('Error fetching student exams:', err);
      setError(err.response?.data?.message || err.message || 'Failed to load exams');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadExams(page, activeQuery, page === 0);
  }, [page, activeQuery]);

  // Search handler
  function handleSearch() {
    const q = searchTerm.trim();
    setPage(0);
    setActiveQuery(q);
  }

  function onInputKeyDown(e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSearch();
    }
  }

  // Handle row click
  async function handleRowClick(exam) {
    if (!exam?.examId) {
      alert('Invalid exam data.');
      return;
    }

    const startTimeStr = formatStart(exam);
    const examStart = new Date(startTimeStr);
    const now = new Date();

    if (isNaN(examStart.getTime()) || examStart > now) {
      alert(`Exam "${exam.title}" starts at ${startTimeStr}. You cannot enrol yet.`);
      return;
    }

    try {
      // If attended, fetch results
      if (exam.status === 'ATTENDED' || exam.status ==='ENDED') {
        if (!exam.studentExamId) {
          alert("Student exam record not found");
          return;
        }

        const results = await getStudentResults(exam.studentExamId, token);
        if (!results || Object.keys(results).length === 0) {
          alert("Result not available yet. Please try again later.");
          return;
        }
        navigate('/results', { state: { studentExamId: exam.studentExamId, results } },{replace:true});
        return;
      }

      // If pending or new, load exam to find first unanswered
      const res = await loadSingleExam({ examId: exam.examId }, token);
      const examData = res?.data || res;

      //Determine starting question
      let startIndex = 0;

      if (examData.status === 'NEW') {
        startIndex = 0;
      } else if (examData.status === 'PENDING') {
        const lastId = examData.lastAnsweredQuestionId;
        if (lastId) {
          const lastIndex = examData.questions.findIndex(q => q.id === lastId);
          startIndex = lastIndex !== -1 ? Math.min(lastIndex + 1, examData.questions.length - 1) : 0;
        } else {
          startIndex = 0;
        }
      }

      navigate(`/singleExam/${examData.examId}`, {
        state: { exam: examData },
      });
    } catch (err) {
      console.error('Error handling exam click:', err);
      alert('Failed to load exam. Try again.');
    }
  }


  function findKey(exam, keys) {
    for (const k of keys) {
      if (!exam) break;
      if (Object.prototype.hasOwnProperty.call(exam, k) && exam[k] != null) return exam[k];
    }
    return undefined;
  }

  function formatStart(exam) {
    const raw = findKey(exam, [
      'StartTime', 'start_time', 'started_time', 'startedAt', 'startTime',
      'startDate', 'start', 'scheduledAt', 'scheduled_time'
    ]);
    if (!raw) return '—';
    const parsed = new Date(raw);
    return isNaN(parsed.getTime()) ? raw : parsed.toLocaleString();
  }

 function formatDuration(exam) {
  const raw = findKey(exam, ['ExamDuration', 'duration', 'examDuration', 'time']);
  if (!raw) return '—';

  
  if (typeof raw === 'number') {
    let totalMinutes = raw;
    const days = Math.floor(totalMinutes / (24 * 60));
    totalMinutes %= 24 * 60;
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    let result = '';
    if (days > 0) result += `${days} day${days > 1 ? 's' : ''} `;
    if (hours > 0) result += `${hours} hour${hours > 1 ? 's' : ''} `;
    if (minutes > 0) result += `${minutes} min`;

    return result.trim();
  }

  
  const match = raw.match(/(\d+)h\s*(\d+)min/);
  if (match) {
    let hours = parseInt(match[1], 10);
    const minutes = parseInt(match[2], 10);

    const days = Math.floor(hours / 24);
    hours = hours % 24;

    let result = '';
    if (days > 0) result += `${days} day${days > 1 ? 's' : ''} `;
    if (hours > 0) result += `${hours} hour${hours > 1 ? 's' : ''} `;
    if (minutes > 0) result += `${minutes} min`;

    return result.trim();
  }

  return raw.toString();
}


  const filteredExams = activeQuery
    ? exams.filter((ex) => (ex.title || '').toLowerCase().includes(activeQuery.toLowerCase()))
    : exams;

  return (
    <>
      <Header />
      <div className="mt-8 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Search */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={onInputKeyDown}
              type="text"
              className="border-2 border-gray-300 rounded-md p-2 mr-2 w-64"
              placeholder="Search exams..."
            />
            <button
              onClick={handleSearch}
              className="bg-indigo-500 font-medium text-white px-5 py-2 rounded-md hover:bg-indigo-600"
            >
              Search
            </button>
          </div>
        </div>

        {loading && <div className="mb-4 text-sm text-gray-600">Loading exams...</div>}
        {error && <div className="mb-4 text-sm text-red-600">Error: {error}</div>}
        {!loading && !error && exams.length === 0 && (
          <div className="mb-4 text-sm text-gray-500">No exams found.</div>
        )}

        {/* Exams table */}
        <table className="min-w-full border border-gray-200">
          <thead className="border-2 border-gray-300 bg-blue-100">
            <tr>
              <th className="border-2 border-gray-300 px-4 py-2 text-left">Exam</th>
              <th className="border-2 border-gray-300 px-4 py-2 text-left">Starting Time</th>
              <th className="border-2 border-gray-300 px-4 py-2 text-left">Duration</th>
              <th className="border-2 border-gray-300 px-4 py-2 text-left">Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredExams.map((exam, idx) => (
              <tr
                key={exam.examId ?? idx}
                className="cursor-pointer hover:bg-blue-50"
                onClick={() => handleRowClick(exam)}
              >
                <td className="border px-4 py-2">{exam.title ?? '—'}</td>
                <td className="border px-4 py-2">{formatStart(exam)}</td>
                <td className="border px-4 py-2">{formatDuration(exam)}</td>
                <td className="border px-4 py-2">{exam.status ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Pagination */}
        <div className="flex items-center justify-between mt-4">
          <button
            className="px-4 py-2 bg-gray-300 rounded disabled:opacity-50 hover:bg-gray-400"
            disabled={page === 0}
            onClick={() => setPage((prev) => Math.max(prev - 1, 0))}
          >
            Previous
          </button>
          <span className="text-sm text-gray-600">Page {page + 1}</span>
          <button
            className="px-4 py-2 bg-gray-300 rounded disabled:opacity-50 hover:bg-gray-400"
            disabled={!hasMore}
            onClick={() => setPage((prev) => prev + 1)}
          >
            Next
          </button>
        </div>
      </div>
    </>
  );
}

export default StudentApp;
