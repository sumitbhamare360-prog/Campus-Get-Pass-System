import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export function Home() {
  const { user } = useAuth();

  if (user) {
    if (user.role === 'admin') return <Navigate to="/admin" replace />;
    if (user.role === 'security') return <Navigate to="/security" replace />;
    if (user.role === 'host') return <Navigate to="/host" replace />;
  }

  return <Navigate to="/login" replace />;
}
