import { useState, useEffect } from 'react';
import Header from '../Layout/Header';
import { listStudentExams } from '../api/studentExams';
import { useNavigate } from 'react-router-dom'

function StudentApp() {
  const navigate = useNavigate();
  const [exams, setExams] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [page, setPage] = useState(0)
  const [size, setSize] = useState(5)
  const [hasMore, setHasMore] = useState(true)

  // Controlled search input
  const [searchTerm, setSearchTerm] = useState('')
  // activeQuery is the value actually sent to the server
  const [activeQuery, setActiveQuery] = useState('')

  // loadExams now accepts optional `query` to send to backend
  async function loadExams(currentPage = page, currentSize = size, query = activeQuery) {
    setLoading(true)
    setError('')
    try {
      const body = { page: currentPage, size: currentSize }
      if (query) body.query = query

      console.log('Request POST /api/student-exams/lists body:', body)


      const responseData = await listStudentExams(body)
      console.log('listStudentExams response:', responseData)

      if (!responseData) {
        console.warn('Empty response from /student-exams/lists')
        setExams([])
        setHasMore(false)
        setError('No data returned from server (check backend or auth).')
        return
      }

      const data = responseData
      let list = []
      if (Array.isArray(data)) list = data
      else if (Array.isArray(data.data)) list = data.data
      else if (Array.isArray(data.content)) list = data.content
      else if (Array.isArray(data.exams)) list = data.exams
      else {
        const maybeArray = Object.values(data || {}).find((v) => Array.isArray(v))
        if (Array.isArray(maybeArray)) list = maybeArray
      }

      setExams(list)
      setHasMore(list.length === currentSize)

      // debug: log first item so we can confirm field names in browser console
      if (list.length > 0) console.log('Student exams - first item:', list[0])
    } catch (err) {
      console.error('Error fetching student exams (detailed):', {
        message: err.message,
        response: err.response?.data ?? err.response,
        request: err.request ?? null,
      })
      setError(err.response?.data?.message || err.message || 'Failed to load exams')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // load when page, size, or activeQuery changes
    loadExams(page, size, activeQuery)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, size, activeQuery])

  // Called when user clicks Search or presses Enter
  function handleSearch() {
    const q = searchTerm.trim()
    setActiveQuery(q)
    setPage(0)
    // loadExams(0, size, q) is not required because effect watches activeQuery & page
  }
  function handleRowClick(exam) {
    const startTimeStr=formatStart(exam);
    const examStart=new Date(startTimeStr);
    const now=new Date();
    if(isNaN(examStart.getTime()) || examStart>now){
     alert(`Exam "${exam.title}" starts at ${startTimeStr}. You cannot enroll yet.`);
    return; 
  }
  navigate(`/singleExam`, { state: { exam } });
}

  // Pressing Enter triggers search
  function onInputKeyDown(e) {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleSearch()
    }
  }

  // Helper: find a value under many common keys
  function findKey(exam, keys) {
    for (const k of keys) {
      if (exam == null) break;
      if (Object.prototype.hasOwnProperty.call(exam, k) && exam[k] != null) return exam[k];
    }
    return undefined;
  }

  // Format start time robustly (added 'StartTime' and variants)
  function formatStart(exam) {
    const raw = findKey(exam, [
      'StartTime',
      'start_time',
      'started_time',
      'startedAt',
      'staeted_time',
      'startTime',
      'startDate',
      'start',
      'starting_time',
      'startingTime',
      'scheduledAt',
      'scheduled_time'
    ]);

    if (!raw) return '—';

    if (typeof raw === 'object' && raw !== null && ('seconds' in raw || 'sec' in raw)) {
      const seconds = raw.seconds ?? raw.sec ?? 0;
      return new Date(seconds * 1000).toLocaleString();
    }

    if (typeof raw === 'number') {
      if (raw > 1e11) return new Date(raw).toLocaleString();
      return `${raw} min`;
    }

    if (typeof raw === 'string') {
      const parsed = Date.parse(raw);
      if (!Number.isNaN(parsed)) return new Date(parsed).toLocaleString();
      const parsed2 = Date.parse(raw.replace(' ', 'T'));
      if (!Number.isNaN(parsed2)) return new Date(parsed2).toLocaleString();
      return raw;
    }

    return '—';
  }


  function formatDuration(exam) {
    const raw = findKey(exam, [
      'ExamDuration',
      'duration',
      'examDuration',
      'time',
      'durationMinutes',
      'duration_min',
      'exam_duration',
      'duration_in_minutes'
    ]);
    if (raw == null || raw === '') return '—';

    // Helper to format minutes -> "Xh Ym" or "Zm"
    const fmtFromMinutes = (minutes) => {
      const hrs = Math.floor(minutes / 60);
      const mins = minutes % 60;
      if (hrs > 0 && mins > 0) return `${hrs}h ${mins}m`;
      if (hrs > 0) return `${hrs}h`;
      return `${mins} min`;
    };

    // Numeric value: could be minutes or milliseconds
    if (typeof raw === 'number') {
      // If looks like milliseconds (>= 60000), convert to minutes
      if (raw >= 60000) {
        const minutes = Math.round(raw / 60000);
        return fmtFromMinutes(minutes);
      }
      // treat as minutes
      return fmtFromMinutes(Math.round(raw));
    }

    // String value
    if (typeof raw === 'string') {
      // Common "HH:MM" or "H:MM:SS" -> convert to hours/min
      if (/^\d+:\d{2}(:\d{2})?$/.test(raw)) {
        const parts = raw.split(':').map(Number);
        if (parts.length === 3) {
          const mins = parts[0] * 60 + parts[1] + Math.round(parts[2] / 60);
          return fmtFromMinutes(mins);
        }
        if (parts.length === 2) {
          const mins = parts[0] * 60 + parts[1];
          return fmtFromMinutes(mins);
        }
      }
      // Numeric string
      const asNum = Number(raw);
      if (!Number.isNaN(asNum)) {
        if (asNum >= 60000) return fmtFromMinutes(Math.round(asNum / 60000));
        return fmtFromMinutes(Math.round(asNum));
      }
      // Unknown format -> return raw
      return raw;
    }

    return '—';
  }


  const filteredExams = activeQuery
    ? exams.filter((ex) => (ex.title || '').toLowerCase().includes(activeQuery.toLowerCase()))
    : exams

  return (
    <>
      <Header />

      <div className="mt-8 mx-30">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center">
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={onInputKeyDown}
              type="text"
              className="border-2 border-gray-300 rounded-sm p-2 mr-2"
              placeholder="Search..."
            />
            <button
              onClick={handleSearch}
              className="bg-indigo-500 font-medium text-white px-5 py-2 rounded-sm"
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

        <table className="min-w-full border border-gray-200">
          <thead className="border-2 border-gray-300">
            <tr className="bg-blue-100">
              <th className="border-2 border-gray-300 px-4 py-2 text-left">Exam</th>
              <th className="border-2 border-gray-300 px-4 py-2 text-left">Starting Time</th>
              <th className="border-2 border-gray-300 px-4 py-2 text-left">Exam Duration</th>
              <th className="border-2 border-gray-300 px-4 py-2 text-left">Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredExams.map((exam, idx) => (
              <tr key={exam.id ?? idx}
                className='cursor-pointer hover:bg-blue-50'
                onClick={() => handleRowClick(exam)}>
                <td className="border px-4 py-2">{exam.title ?? '—'}</td>
                <td className="border px-4 py-2">{formatStart(exam)}</td>
                <td className="border px-4 py-2">{formatDuration(exam)}</td>
                <td className="border px-4 py-2">{exam.status ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="flex items-center justify-between mt-4">
          <button
            className="px-4 py-2 bg-gray-300 rounded disabled:opacity-50"
            disabled={page === 0}
            onClick={() => setPage((prev) => Math.max(prev - 1, 0))}
          >
            Previous
          </button>

          <span className="text-sm text-gray-600">Page {page + 1}</span>

          <button
            className="px-4 py-2 bg-gray-300 rounded disabled:opacity-50"
            disabled={!hasMore}
            onClick={() => setPage((prev) => prev + 1)}
          >
            Next
          </button>
        </div>
      </div>
    </>
  )
}

export default StudentApp
