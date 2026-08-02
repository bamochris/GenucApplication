/**
 * 🔒 Route privée avec RBAC (Role-Based Access Control)
 * Remplace useProtectedRoute.js avec meilleure architecture
 */
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const PrivateRoute = ({ children, roles = null, fallback = null }) => {
  const { isAuthenticated, isLoading, hasRole } = useAuth();

  if (isLoading) {
    return fallback || (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        background: 'var(--bg-secondary)',
      }}>
        <div className="spinner">Chargement...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Vérifie les rôles requis
  if (roles && !hasRole(roles)) {
    return <Navigate to="/forbidden" replace />;
  }

  return children;
};

export default PrivateRoute;
