import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { apiClient, isAuthenticated } from '@ekusa/api-client';

export function ProtectedRoute() {
  const location = useLocation();

  if (!isAuthenticated()) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
}