import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../Layout/Header';
import { getAllExams } from '../api/exams';

function TeacherApp() {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(5);
  const [hasMore, setHasMore] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeQuery, setActiveQuery] = useState('');

  async function loadExams(currentPage = page, reset = false, query = activeQuery) {
    setLoading(true);
    setError('');
    try {
      if (!token) {
        navigate('/login');
        throw new Error('No token found. Please log in.');
      }
      const body = { page: currentPage, size };
      if (query) body.search = query;
      const responseData = await getAllExams(body, token);
      let list = [];
      if (Array.isArray(responseData?.data)) {
        list = responseData.data;
      } else {
        const maybeArray = Object.values(responseData || {}).find((v) => Array.isArray(v));
        if (Array.isArray(maybeArray)) list = maybeArray;
        else throw new Error('Unexpected response format');
      }


      setExams((prev) => (reset ? list : [...prev, ...list]));
      setHasMore(!responseData.last);
    } catch (err) {
      console.error('Error fetching exams:', {
        message: err.message,
        response: err.response?.data ?? err.response,
        request: err.request ?? null,
        status: err.response?.status,
      });
      setError(err.response?.data?.message || err.message || 'Failed to load exams. Please check the server.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadExams(page, page ===0, activeQuery);
  }, [page, activeQuery]);

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

  function handleRowClick(exam) {
    const id = exam.examId ?? exam.id ?? exam._id;
    if (!id) {
      console.error('Exam ID not found for:', exam);
      setError('Cannot navigate: Exam ID not found');
      return;
    }
    if (exam.status?.toLowerCase() === 'draft') {
      navigate(`/addExam/${id}`);
    }
    if (exam.status?.toLowerCase() == "published" || exam.status?.toLowerCase() == "ended") {
      navigate(`/monitorExam/${id}`);
    }
  }

  return (
    <>
      <Header />
      <div className="mt-8 mx-30">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center mr-170">
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={onInputKeyDown}
              type="text"
              className="border-2 border-gray-300 rounded-sm p-2 mr-2"
              placeholder="Search by exam title..."
            />
            <button
              onClick={handleSearch}
              className="bg-indigo-500 font-medium text-white px-5 py-2 rounded-sm disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading}
            >
              {loading ? 'Searching...' : 'Search'}
            </button>
          </div>
          <div>
            <button
              onClick={() => navigate('/teacher/dashboard')}
              className="bg-red-500 font-medium text-white px-5 py-2 rounded-sm items-end"
            >
              Dashboard
            </button>
          </div>
          <div>
            <button
              onClick={() => navigate('/addExam')}
              className="bg-emerald-500 font-medium text-white px-5 py-2 rounded-sm"
            >
              New Exam
            </button>
          </div>
        </div>

        {loading && <div className="mb-4 text-sm text-gray-600">Loading exams...</div>}
        {error && <div className="mb-4 text-sm text-red-600">Error: {error}</div>}
        {!loading && !error && exams.length === 0 && (
          <div className="mb-4 text-sm text-gray-500">
            {activeQuery ? `No exams found for "${activeQuery}".` : 'No exams found.'}
          </div>
        )}

        <table className="min-w-full border border-gray-200">
          <thead className="border-2 border-gray-300">
            <tr className="bg-blue-100">
              <th className="border-2 border-gray-300 px-4 py-2 text-left">Exam</th>
              <th className="border-2 border-gray-300 px-4 py-2 text-left">Last Updated</th>
              <th className="border-2 border-gray-300 px-4 py-2 text-left">Status</th>
            </tr>
          </thead>
          <tbody>
            {exams.map((exam) => {
              const id = exam.examId ?? exam.id ?? exam._id;
              return (
                <tr
                  key={id}
                  onClick={() => handleRowClick(exam)}
                  className={`${['draft', 'published'].includes(exam.status?.toLowerCase()) ? 'cursor-pointer hover:bg-blue-50' : ''
                    }`}
                >
                  <td className="border px-4 py-2">{exam.title ?? '—'}</td>
                  <td className="border px-4 py-2">
                    {exam.lastUpdated
                      ? new Date(exam.lastUpdated).toLocaleString('en-GB', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: false, 
                      }).replace(',', '')
                      : '—'}
                  </td>
                  <td className="border px-4 py-2">{exam.status ?? '—'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>

        <div className="flex items-center justify-between mt-4">
          <button
            className="px-4 py-2 bg-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={page === 0 || loading}
            onClick={() => setPage((prev) => Math.max(prev - 1, 0))}
          >
            Previous
          </button>
          <span className="text-sm text-gray-600">Page {page + 1}</span>
          <button
            className="px-4 py-2 bg-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={!hasMore || loading}
            onClick={() => setPage((prev) => prev + 1)}
          >
            Next
          </button>
        </div>
      </div>
    </>
  );
}

export default TeacherApp;