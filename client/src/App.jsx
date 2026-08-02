// import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
// import { useEffect, useState } from 'react';
// import { Toaster } from 'react-hot-toast';
// import useAuthStore from './store/useAuthStore';
// import axiosInstance from './api/axiosInstance';
// import Login from './pages/Login';
// import Register from './pages/Register';
// import ForgotPassword from './pages/ForgotPassword';
// import ResetPassword from './pages/ResetPassword';
// import Dashboard from './pages/Dashboard';
// import Workspace from './pages/Workspace';
// import Board from './pages/Board';
// import Chart from './pages/Chart';

// const ProtectedRoute = ({ children }) => {
//   const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
//   return isAuthenticated ? children : <Navigate to="/login" replace />;
// };

// function App() {
//   // Only block on the bootstrap request if there's actually a token to verify.
//   const [isLoading, setIsLoading] = useState(!!localStorage.getItem('accessToken'));
//   const { accessToken, login, logout } = useAuthStore();

//   useEffect(() => {
//     if (!accessToken) return;

//     axiosInstance
//       .get('/users/getCurrentUser')
//       .then((res) => {
//         // Read the token back from storage rather than using the `accessToken`
//         // captured at mount: if this request 401'd, the interceptor has already
//         // refreshed and stored a new one, and the stale closure value would
//         // overwrite it.
//         login(res.data.data, localStorage.getItem('accessToken'));
//       })
//       .catch((err) => {
//         // Only drop the session on a real auth failure. A network error or a
//         // cold-starting backend must not log the user out.
//         if (err.response?.status === 401) {
//           logout();
//         }
//       })
//       .finally(() => {
//         setIsLoading(false);
//       });
//   }, []);

//   if (isLoading) {
//     return (
//       <div className="h-screen flex items-center justify-center bg-gray-950">
//         <p className="text-white text-lg">Loading...</p>
//       </div>
//     );
//   }

//   return (
//     <BrowserRouter>
//       <Toaster position="top-right" />
//       <Routes>
//         <Route path="/login" element={<Login />} />
//         <Route path="/register" element={<Register />} />
//         <Route path="/forgot-password" element={<ForgotPassword />} />
//         <Route path="/reset-password/:resetToken" element={<ResetPassword />} />
//         <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
//         <Route path="/links/:linkId" element={<ProtectedRoute><Workspace /></ProtectedRoute>} />
//         <Route path="/links/:linkId/boards/:boardId" element={<ProtectedRoute><Board /></ProtectedRoute>} />
//         <Route path="/links/:linkId/boards/:boardId/charts/:chartId" element={<ProtectedRoute><Chart /></ProtectedRoute>} />
//         <Route path="/" element={<Navigate to="/dashboard" replace />} />
//       </Routes>
//     </BrowserRouter>
//   );
// }

// export default App;

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import useAuthStore from './store/useAuthStore';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Dashboard from './pages/Dashboard';
import Workspace from './pages/Workspace';
import Board from './pages/Board';
import Chart from './pages/Chart';

// Protected Route checks Zustand's state
const ProtectedRoute = ({ children }) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

function App() {
  // Grab the checkAuth function and initialization flag from your updated Zustand store
  const { checkAuth, isInitializing } = useAuthStore();

  useEffect(() => {
    // Run the authentication check once when the app mounts.
    // This hits the backend to check if valid cookies are present.
    checkAuth();
  }, [checkAuth]);

  // If the app is still figuring out if the user has a valid cookie, show a loading screen
  // This prevents unauthenticated users from seeing the dashboard for a split second (flickering)
  if (isInitializing) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-950">
        <p className="text-white text-lg">Loading secure session...</p>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Toaster position="top-right" />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:resetToken" element={<ResetPassword />} />
        
        {/* Protected Routes */}
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
