import { Link, useNavigate } from 'react-router-dom';
import { Brain, LogOut, User } from 'lucide-react';
import toast from 'react-hot-toast';
import useAuthStore from '../store/useAuthStore';
import axiosInstance from '../api/axiosInstance';

const Navbar = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await axiosInstance.post('/users/logout');
    } catch {
      // ignore — server-side cookie clear failing doesn't block logout
    } finally {
      logout();
      navigate('/login');
      toast.success('Logged out');
    }
  };

  return (
    <nav className="bg-gray-900 border-b border-gray-800 px-6 py-3 flex items-center justify-between flex-shrink-0">
      <Link to="/dashboard" className="flex items-center gap-2">
        <Brain className="text-indigo-400 w-6 h-6" />
        <span className="text-white font-bold text-lg">SynapseAI</span>
      </Link>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center">
            <User className="w-4 h-4 text-white" />
          </div>
          <span className="text-gray-300 text-sm">{user?.username}</span>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 text-gray-400 hover:text-white transition text-sm"
        >
          <LogOut className="w-4 h-4" />
          Logout
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
