import React from "react";
import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ children, allowedRoles, allowRoles }) {
  // accept both prop names so callers using either spelling work
  const roles = allowedRoles ?? allowRoles;

  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");

  if (!token) return <Navigate to="/login" replace />;

  if (roles && !roles.includes(role)) return <Navigate to="/unauthorized" replace />;

  return children;
}