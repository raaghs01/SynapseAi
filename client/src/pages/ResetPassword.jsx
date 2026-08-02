import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Brain, Check, X } from 'lucide-react';
import toast from 'react-hot-toast';
import axiosInstance from '../api/axiosInstance';

// Mirrors userResetForgotPasswordValidator on the server so the user sees the
// rules before submitting rather than getting a 422 back.
const rules = [
  { label: 'At least 6 characters', test: (v) => v.length >= 6 },
  { label: 'One uppercase letter', test: (v) => /[A-Z]/.test(v) },
  { label: 'One number', test: (v) => /[0-9]/.test(v) },
];

const ResetPassword = () => {
  const { resetToken } = useParams();
  const navigate = useNavigate();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const passesAll = rules.every((r) => r.test(newPassword));
  const matches = newPassword.length > 0 && newPassword === confirmPassword;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!matches) {
      toast.error('Passwords do not match');
      return;
    }
    setIsLoading(true);
    try {
      await axiosInstance.post(`/users/reset-password/${resetToken}`, { newPassword });
      toast.success('Password reset — please log in');
      navigate('/login');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Reset failed');
    } finally {
      setIsLoading(false);
    }
  };

  const inputClass =
    'w-full bg-gray-800 text-white rounded-lg px-4 py-3 outline-none border border-gray-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition';

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="flex items-center gap-2 justify-center mb-8">
          <Brain className="text-indigo-400 w-8 h-8" />
          <span className="text-white font-bold text-2xl">SynapseAI</span>
        </div>

        <div className="bg-gray-900 rounded-2xl p-8 shadow-xl border border-gray-800">
          <h1 className="text-2xl font-bold text-white mb-1">Set a new password</h1>
          <p className="text-gray-400 text-sm mb-7">Choose something you haven't used here before</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">New password</label>
              <input
                type="password"
                name="newPassword"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                className={inputClass}
                required
              />
            </div>

            {newPassword.length > 0 && (
              <ul className="space-y-1.5">
                {rules.map((rule) => {
                  const ok = rule.test(newPassword);
                  return (
                    <li
                      key={rule.label}
                      className={`flex items-center gap-2 text-xs ${
                        ok ? 'text-green-400' : 'text-gray-500'
                      }`}
                    >
                      {ok ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                      {rule.label}
                    </li>
                  );
                })}
              </ul>
            )}

            <div>
              <label className="block text-sm text-gray-400 mb-1.5">Confirm password</label>
              <input
                type="password"
                name="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className={inputClass}
                required
              />
              {confirmPassword.length > 0 && !matches && (
                <p className="text-red-400 text-xs mt-1.5">Passwords do not match</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading || !passesAll || !matches}
              className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-lg transition"
            >
              {isLoading ? 'Resetting...' : 'Reset password'}
            </button>
          </form>

          <p className="text-gray-400 text-sm text-center mt-6">
            <Link to="/login" className="text-indigo-400 hover:underline">
              Back to log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
