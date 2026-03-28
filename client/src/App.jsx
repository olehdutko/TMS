import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './components/Toast';
import Header from './components/Header';

import Login from './pages/Login';
import Register from './pages/Register';
import TestSuites from './pages/TestSuites/TestSuites';
import TestCases from './pages/TestSuites/TestCases';
import TestCaseDetail from './pages/TestSuites/TestCaseDetail';
import TestRuns from './pages/TestRuns/TestRuns';
import TestRunNew from './pages/TestRuns/TestRunNew';
import TestRunDetail from './pages/TestRuns/TestRunDetail';
import TestRunExecution from './pages/TestRuns/TestRunExecution';
import Reports from './pages/Reports/Reports';
import ReportDetail from './pages/Reports/ReportDetail';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="loading-spinner" style={{ height: '100vh' }}>
        <div className="spinner" />
        <span>Loading...</span>
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function AppLayout({ children }) {
  return (
    <div className="app-layout">
      <Header />
      <main className="main-content">
        {children}
      </main>
    </div>
  );
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route
        path="/testsuites"
        element={
          <ProtectedRoute>
            <AppLayout><TestSuites /></AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/testsuites/:suiteId/testcases"
        element={
          <ProtectedRoute>
            <AppLayout><TestCases /></AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/testsuites/:suiteId/testcases/new"
        element={
          <ProtectedRoute>
            <AppLayout><TestCaseDetail /></AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/testsuites/:suiteId/testcases/:testcaseId"
        element={
          <ProtectedRoute>
            <AppLayout><TestCaseDetail /></AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/testruns"
        element={
          <ProtectedRoute>
            <AppLayout><TestRuns /></AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/testruns/new"
        element={
          <ProtectedRoute>
            <AppLayout><TestRunNew /></AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/testruns/:testrunId"
        element={
          <ProtectedRoute>
            <AppLayout><TestRunDetail /></AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/testruns/:testrunId/testcases/:testrunCaseId"
        element={
          <ProtectedRoute>
            <AppLayout><TestRunExecution /></AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/reports"
        element={
          <ProtectedRoute>
            <AppLayout><Reports /></AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/reports/:testrunId"
        element={
          <ProtectedRoute>
            <AppLayout><ReportDetail /></AppLayout>
          </ProtectedRoute>
        }
      />
      <Route path="/" element={<Navigate to="/testsuites" replace />} />
      <Route path="*" element={<Navigate to="/testsuites" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <ToastProvider>
            <AppRoutes />
          </ToastProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}
