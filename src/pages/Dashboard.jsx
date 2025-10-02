import React, { useEffect, useState } from 'react'
import { getTeacherDashboard } from '../api/dashboard';
import Header from '../Layout/Header'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell} from "recharts";
import dayjs from "dayjs";
import {motion} from 'framer-motion'
import { useNavigate } from 'react-router-dom';
function Dashboard() {
    const [dashboardData, setDashboardData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const COLORS = ["#0088FE", "#FFBB28", "#FF8042", "#FF1010", "#00C49F"];
    const navigate=useNavigate();
    useEffect(() => {
        const fetchData = async () => {
            try {
                const token = localStorage.getItem("token");
                const data = await getTeacherDashboard(token);
                setDashboardData(data);
            } catch (err) {
                setError("Failed to load dashboard")
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);
    if (loading) return <div className="p-4">Loading dashboard.......</div>;
    if (error) return <div className='p-4 text-red-500'>{error}</div>;
    return (
        <div className='min-h-screen bg-gray-100'>
            <Header />
            <div className="max-w-6xl mx-auto p-6">
                <div className='flex '>
                  <button
            onClick={() => navigate(-1)}
            className=" mr-5 px-1 py-1 bg-gray-400 text-white rounded hover:bg-gray-600"
          >
            ← Back

          </button>
            <h1 className="text-lg font-semibold">Dashboard</h1>
            </div>
    
            <div className="p-6 grid grid-cols-2 gap-6">
                {/*Line Chart*/}
                <motion.div
                   initial={{opacity:0,scale:0.95}}
                   animate={{opacity:1,scale:1}}
                   transition={{dutation:0.6}}
                    
                 className="  border-2 border-gray-300 bg-white p-4  shadow">
                    <h2 className="font-semibold mb-2">Attendance and Results Progress</h2>
                    <ResponsiveContainer width="100%" height={250}>
                        <LineChart data={dashboardData.progressOverTime || []}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis
                                dataKey="examDate"
                                tickFormatter={(d) => dayjs(d).format("HH:mm:ss, MMM D, YYYY")}
                                interval={0} 
                            />
                            <YAxis />
                            <Tooltip
                                labelFormatter={(d) => dayjs(d).format("HH:mm:ss, MMM D, YYYY")}
                            />
                            <Legend />
                            <Line
                                type="monotone"
                                dataKey="averageScore"
                                stroke="#4bc0c0"
                                strokeWidth={2}
                                dot={{ r: 4 }}
                                activeDot={{ r: 6 }}
                                name="Average Score"
                            />
                            <Line
                                type="monotone"
                                dataKey="attendedCount"
                                stroke="#ff6384"
                                strokeWidth={2}
                                dot={{ r: 4 }}
                                activeDot={{ r: 6 }}
                                name="Attended Count"
                            />
                        </LineChart>
                    </ResponsiveContainer>

                </motion.div>
                {/*pie chart*/}
                <div className="border-2 border-gray-300 bg-white p-4  shadow">
                    <h2 className='font-semibold mb-2'> Average Results Grade Percentages</h2>
                    <ResponsiveContainer width="100%" height={250}>
                        
                        <PieChart>
                            <Pie
                                data={dashboardData.gradeDistribution || []}
                                dataKey="percent"
                                nameKey="grade"
                                cx="50%"
                                cy="50%"
                                innerRadius={60}  // This creates the blank hole
                                outerRadius={100} // Outer filled radius
                                paddingAngle={1}
                                labelLine={false}
                                label={({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
                                    const radius = innerRadius + (outerRadius - innerRadius) / 2;
                                    const x = cx + radius * Math.cos(-midAngle * (Math.PI / 180));
                                    const y = cy + radius * Math.sin(-midAngle * (Math.PI / 180));

                                    return (
                                        <text
                                            x={x}
                                            y={y}
                                            fill="white"
                                            textAnchor="middle"
                                            dominantBaseline="central"
                                            fontSize={12}
                                            fontWeight="500"
                                        >{`${name} ${(percent).toFixed(1)}%`}
                                        </text>
                                    );
                                }}>
                                {dashboardData.gradeDistribution?.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip formatter={(val) => `${val.toFixed(1)}%`} />
                            <Legend

                                verticalAlign="bottom"
                                align="center"
                                formatter={(value, entry, index) => (
                                    <span style={{ color: COLORS[index % COLORS.length], fontWeight: "500" }}>
                                        {value}
                                    </span>
                                )}


                            />
                        </PieChart>
                    </ResponsiveContainer>
                    
                </div>
                {/*Top students*/}
                <div className="border-2 border-gray-300 bg-white p-4 shadow">
                    <h2 className='font-semibold mb-2 '>Average Top Results Students</h2>
                    <table className='w-full text-sm border-gray-300'>
                        <thead>
                            <tr className='bg-blue-200'>
                                <th className='border-2 border-gray-300 p-2'>Student Name</th>
                                <th className='border-2 border-gray-300 p-2'>Average</th>
                            </tr>
                        </thead>
                        <tbody>
                            {dashboardData.topStudents?.map((s, i) => (
                                <tr key={i}>
                                    <td className='border-2 border-gray-300 p-2'>{s.studentName}</td>
                                    <td className='border-2 border-gray-300 p-2 '>{s.averageScore.toFixed(2)}</td>
                                </tr>

                            ))}
                        </tbody>
                    </table>
                </div>
                {/*Low students*/}
                <div className="border-2 border-gray-300 bg-white p-4 shadow">
                    <h2 className='font-semibold mb-2 '>Average Low Results Students</h2>
                    <table className='w-full text-sm border-2 border-gray-300 '>
                        <thead>
                            <tr className='bg-blue-200'>
                                <th className='border-2 border-gray-300 p-2'>Student Name</th>
                                <th className='border-2 border-gray-300  p-2'>Average</th>
                            </tr>
                        </thead>
                        <tbody>
                            {dashboardData.lowStudents?.map((s, i) => (
                                <tr key={i}>
                                    <td className='border-2 border-gray-300 p-2'>{s.studentName}</td>
                                    <td className='border-2 border-gray-300 p-2 '>{s.averageScore.toFixed(2)}</td>
                                </tr>

                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
        </div>
        

    )
}


export default Dashboard;