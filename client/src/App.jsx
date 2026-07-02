import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Toaster } from 'react-hot-toast';
import useAuthStore from './store/useAuthStore';
import axiosInstance from './api/axiosInstance';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Workspace from './pages/Workspace';
import Board from './pages/Board';
import Chart from './pages/Chart';

const ProtectedRoute = ({ children }) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

function App() {
  const [isLoading, setIsLoading] = useState(true);
  const { accessToken, login, logout } = useAuthStore();

  useEffect(() => {
    if (!accessToken) {
      setIsLoading(false);
      return;
    }
    axiosInstance
      .get('/users/getCurrentUser')
      .then((res) => {
        login(res.data.data, accessToken);
      })
      .catch(() => {
        logout();
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-950">
        <p className="text-white text-lg">Loading...</p>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Toaster position="top-right" />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/links/:linkId" element={<ProtectedRoute><Workspace /></ProtectedRoute>} />
        <Route path="/links/:linkId/boards/:boardId" element={<ProtectedRoute><Board /></ProtectedRoute>} />
        <Route path="/links/:linkId/boards/:boardId/charts/:chartId" element={<ProtectedRoute><Chart /></ProtectedRoute>} />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
