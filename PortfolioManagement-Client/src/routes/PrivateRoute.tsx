import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthProvider";
import React from "react";

interface PrivateRouteProps {
  children: React.ReactNode;
}

const PrivateRoute = ({ children }: PrivateRouteProps) => {
  const { accessToken, loading } = useAuth();

  if (loading) return <div>Loading...</div>; // me() bitene kadar bekle

  if (!accessToken) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

export default PrivateRoute;
