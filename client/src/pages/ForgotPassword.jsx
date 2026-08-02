import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Brain, MailCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import axiosInstance from '../api/axiosInstance';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await axiosInstance.post('/users/forgot-password', { email });
      setIsSent(true);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not send reset email');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="flex items-center gap-2 justify-center mb-8">
          <Brain className="text-indigo-400 w-8 h-8" />
          <span className="text-white font-bold text-2xl">SynapseAI</span>
        </div>

        <div className="bg-gray-900 rounded-2xl p-8 shadow-xl border border-gray-800">
          {isSent ? (
            <div className="text-center">
              <MailCheck className="text-indigo-400 w-12 h-12 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-white mb-2">Check your inbox</h1>
              <p className="text-gray-400 text-sm mb-7">
                If an account exists for <span className="text-gray-300">{email}</span>, we've
                sent a link to reset your password. The link expires shortly.
              </p>
              <Link
                to="/login"
                className="inline-block w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3 rounded-lg transition"
              >
                Back to log in
              </Link>
            </div>
          ) : (
            <>
              <h1 className="text-2xl font-bold text-white mb-1">Forgot password?</h1>
              <p className="text-gray-400 text-sm mb-7">
                Enter your email and we'll send you a reset link
              </p>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm text-gray-400 mb-1.5">Email</label>
                  <input
                    type="email"
                    name="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full bg-gray-800 text-white rounded-lg px-4 py-3 outline-none border border-gray-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-lg transition"
                >
                  {isLoading ? 'Sending...' : 'Send reset link'}
                </button>
              </form>

              <p className="text-gray-400 text-sm text-center mt-6">
                Remembered it?{' '}
                <Link to="/login" className="text-indigo-400 hover:underline">
                  Log in
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
