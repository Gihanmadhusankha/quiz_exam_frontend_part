import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./components/Login";
import TeacherApp from "./pages/TeacherApp";
import StudentApp from "./pages/StudentApp";
import AddExam from "./pages/AddExams";
import SingleExam from "./pages/SingleExam";
import ResultPage from "./pages/ResultPage";
import MonitorExam from "./pages/MonitorExam";
import Dashboard from "./pages/Dashboard";


function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Login */}
        <Route path="/login" element={<Login />} />

        {/* Teacher Dashboard */}
        <Route
          path="/teacher"
          element={
            <ProtectedRoute allowedRoles={["TEACHER"]}>
              <TeacherApp />
            </ProtectedRoute>
          }
        />
        {/* Teacher Add exam */}
        <Route
          path="/addExam"
          element={
            <ProtectedRoute allowedRoles={["TEACHER"]}>
              <AddExam />
            </ProtectedRoute>
          }
        />
        {/* Teacher Monitor exam */}
        <Route
          path="/monitorExam/:examId"
          element={
            <ProtectedRoute allowedRoles={["TEACHER"]}>
              <MonitorExam />
            </ProtectedRoute>
          }
        />
        <Route 
           path="/teacher/dashboard"
           element={
            <ProtectedRoute allowedRoles={["TEACHER"]}>
              <Dashboard/>
            </ProtectedRoute>
           }
           />



        {/* Student Dashboard */}
        <Route
          path="/student"
          element={
            <ProtectedRoute allowedRoles={["STUDENT"]}>
              <StudentApp />
            </ProtectedRoute>
          }
        />
        <Route
          path="/results"
          element={

            <ResultPage />

          }
        />
        <Route
          path="/results/:studentExamId"
          element={
            <ResultPage />} />

        {/* <Route
          path="/singleExam"
          element={
            <ProtectedRoute allowedRoles={["STUDENT"]}>
              <SingleExam />
            </ProtectedRoute>
          }
        /> */}
        <Route
          path="/singleExam/:examId"
          element={
            <ProtectedRoute allowedRoles={["STUDENT"]}>
              <SingleExam />
            </ProtectedRoute>
          }
        />
        <Route
          path="/addExam/:examId"
          element={
            <ProtectedRoute allowedRoles={["TEACHER"]}>
              <AddExam />
            </ProtectedRoute>
          }
        />

        {/* Default redirect */}
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* Unauthorized fallback */}
        <Route path="/unauthorized" element={<h1>403 - Unauthorized</h1>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
