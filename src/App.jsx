import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./components/Login";
import TeacherApp from "./pages/TeacherApp";
import StudentApp from "./pages/StudentApp";
import AddExam from "./Exams/AddExams";
import SingleExam from "./pages/SingleExam";


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
          path="/singleExam"
          element={
            <ProtectedRoute allowedRoles={["STUDENT"]}>
              <SingleExam />
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
