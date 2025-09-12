import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Header from '../Layout/Header'
import { getAllExams } from '../api/exams'

function TeacherApp() {
  const navigate = useNavigate()

  const [exams, setExams] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [page, setPage] = useState(0)
  const [size, setSize] = useState(5)
  const [hasMore, setHasMore] = useState(true)

  

  // searchTerm: controlled input while typing
  const [searchTerm, setSearchTerm] = useState('')
  // activeQuery: used when making requests (set when user clicks Search or presses Enter)
  const [activeQuery, setActiveQuery] = useState('')

  async function loadExams(currentPage = page, currentSize = size, query = activeQuery) {
    setLoading(true)
    setError('')
    try {
      const body = { page: currentPage, size: currentSize }
      if (query) body.query = query

      // Use the shared api helper so Authorization header from apiClient is applied
      const responseData = await getAllExams(body)
      console.log('getAllExams response:', responseData)

      // robust parsing (common shapes)
      let list = []
      const data = responseData

      if (Array.isArray(data)) {
        list = data
      } else if (Array.isArray(data.data)) {
        list = data.data
      } else if (Array.isArray(data.content)) {
        list = data.content
      } else if (Array.isArray(data.exams)) {
        list = data.exams
      } else {
        const maybeArray = Object.values(data || {}).find((v) => Array.isArray(v))
        if (Array.isArray(maybeArray)) list = maybeArray
      }

      setExams(list)
      setHasMore(list.length === currentSize)
    } catch (err) {
      console.error('Error fetching exams:', {
        message: err.message,
        response: err.response?.data ?? err.response,
        request: err.request ?? null,
      })
      setError(err.response?.data?.message || err.message || 'Failed to load exams')
    } finally {
      setLoading(false)
    }
  }

  

  // load when page/size/activeQuery change
  useEffect(() => {
    loadExams(page, size, activeQuery)
  }, [page, size, activeQuery])

  function handleSearch() {
    const q = searchTerm.trim()
    setActiveQuery(q)
    setPage(0)
    // Force an immediate load so repeated searches with same query still refresh results
    loadExams(0, size, q)
  }

  function onInputKeyDown(e) {
    if (e.key === 'Enter') {
      e.preventDefault() // stop any default browser behavior
      handleSearch()
    }
  }

  return (
    <>
      <Header />

      <div className="mt-8 mx-30">
        {/* Search + New Exam bar */}
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

          <div>
            <button
              onClick={() => navigate('/addExam')}
              className="bg-emerald-500 font-medium text-white px-5 py-2 rounded-sm"
            >
              New Exam
            </button>
          </div>
        </div>

        {/* Loading / Error / Empty states */}
        {loading && <div className="mb-4 text-sm text-gray-600">Loading exams...</div>}
        {error && <div className="mb-4 text-sm text-red-600">Error: {error}</div>}
        {!loading && !error && exams.length === 0 && (
          <div className="mb-4 text-sm text-gray-500">No exams found.</div>
        )}

        {/* Exam Table */}
        <table className="min-w-full border border-gray-200">
          <thead className="border-2 border-gray-300">
            <tr className="bg-blue-100">
              <th className="border-2 border-gray-300 px-4 py-2 text-left">Exam</th>
              <th className="border-2 border-gray-300 px-4 py-2 text-left">Last Updated</th>
              <th className="border-2 border-gray-300 px-4 py-2 text-left">Status</th>
             
            </tr>
          </thead>
          <tbody>
            {exams.map((exam, idx) => {
              const id = exam.id ?? exam._id ?? idx
              
              return (
                <tr key={id}>
                  <td className="border px-4 py-2">{exam.title ?? '—'}</td>
                  <td className="border px-4 py-2">
                    {exam.lastUpdated ? new Date(exam.lastUpdated).toLocaleString() : '—'}
                  </td>
                  <td className="border px-4 py-2">{exam.status ?? '—'}</td>
                  
                </tr>
              )
            })}
          </tbody>
        </table>

        {/* Pagination Controls */}
        <div className="flex items-center justify-between mt-4">
          <button
            className="px-4 py-2 bg-gray-300 rounded disabled:opacity-50"
            disabled={page === 0}
            onClick={() => {
              const prev = Math.max(page - 1, 0)
              setPage(prev)
            }}
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

export default TeacherApp
