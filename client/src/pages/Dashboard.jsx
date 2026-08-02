import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Users, Trash2, ChevronRight, LogIn } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import Navbar from '../components/Navbar';
import Modal from '../components/Modal';
import axiosInstance from '../api/axiosInstance';
import useAuthStore from '../store/useAuthStore';

const Dashboard = () => {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);

  const [links, setLinks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Two separate modals — create workspace and join via invite code
  const [createModal, setCreateModal] = useState(false);
  const [joinModal, setJoinModal] = useState(false);

  // Controlled inputs for the modals
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [submitting, setSubmitting] = useState(false);

  

  useEffect(() => {
    const fetchLinks = async () => {
    try {
      // GET /links returns all workspaces where the user is a member (via LinkMember)
      // Each item has the link fields + a `role` field injected by getMyLinks controller
      const res = await axiosInstance.get('/links');
      setLinks(res.data.data);
    } catch {
      toast.error('Failed to load workspaces');
    } finally {
      setIsLoading(false);
    }
  };
    fetchLinks();
  }, []);

  

  const handleCreate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await axiosInstance.post('/links', { name, description });
      // Optimistically add to list — server response is the raw link, role defaults to 'owner'
      setLinks((prev) => [...prev, { ...res.data.data, role: 'owner' }]);
      setCreateModal(false);
      setName('');
      setDescription('');
      toast.success('Workspace created!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create workspace');
    } finally {
      setSubmitting(false);
    }
  };

  const handleJoin = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      // joinLink controller returns { link, membership } — we need the link object
      const res = await axiosInstance.post('/links/join', { inviteCode });
      setLinks((prev) => [...prev, { ...res.data.data.link, role: 'member' }]);
      setJoinModal(false);
      setInviteCode('');
      toast.success('Joined workspace!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid invite code');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (linkId, e) => {
    // stopPropagation prevents the card click (navigate) from firing alongside delete
    e.stopPropagation();
    if (!confirm('Delete this workspace? This cannot be undone.')) return;
    try {
      await axiosInstance.delete(`/links/${linkId}`);
      setLinks((prev) => prev.filter((l) => l._id !== linkId));
      toast.success('Workspace deleted');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete');
    }
  };

  return (
    <div className="min-h-screen bg-gray-950">
      <Navbar />

      <div className="max-w-6xl mx-auto px-6 py-10">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">
              Welcome, {user?.fullName?.split(' ')[0] || user?.username}
            </h1>
            <p className="text-gray-400 mt-1 text-sm">Your workspaces</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setJoinModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white rounded-lg transition text-sm"
            >
              <LogIn className="w-4 h-4" /> Join
            </button>
            <button
              onClick={() => setCreateModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition text-sm"
            >
              <Plus className="w-4 h-4" /> New Workspace
            </button>
          </div>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : links.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 rounded-full bg-gray-800 flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-gray-600" />
            </div>
            <p className="text-gray-500">No workspaces yet. Create or join one to get started.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {links.map((link, i) => (
              <motion.div
                key={link._id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => navigate(`/links/${link._id}`)}
                className="bg-gray-900 border border-gray-800 hover:border-indigo-500/50 rounded-xl p-5 cursor-pointer group transition"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-white font-semibold text-lg truncate group-hover:text-indigo-300 transition">
                      {link.name}
                    </h3>
                    {/* Role badge — injected by getMyLinks via LinkMember.role */}
                    <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full mt-1 ${
                      link.role === 'owner'
                        ? 'bg-indigo-500/20 text-indigo-400'
                        : 'bg-gray-700 text-gray-400'
                    }`}>
                      {link.role}
                    </span>
                  </div>
                  {link.role === 'owner' && (
                    <button
                      onClick={(e) => handleDelete(link._id, e)}
                      className="text-gray-600 hover:text-red-400 transition ml-2 flex-shrink-0 mt-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {link.description && (
                  <p className="text-gray-500 text-sm line-clamp-2 mb-3">{link.description}</p>
                )}

                <div className="flex items-center justify-end text-indigo-400 mt-2">
                  <ChevronRight className="w-4 h-4" />
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Create Workspace Modal */}
      <Modal isOpen={createModal} onClose={() => setCreateModal(false)} title="New Workspace">
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1.5">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My Workspace"
              className="w-full bg-gray-800 text-white rounded-lg px-4 py-2.5 outline-none border border-gray-700 focus:border-indigo-500 transition"
              required
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1.5">Description (optional)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What is this workspace for?"
              rows={3}
              className="w-full bg-gray-800 text-white rounded-lg px-4 py-2.5 outline-none border border-gray-700 focus:border-indigo-500 transition resize-none"
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold py-2.5 rounded-lg transition"
          >
            {submitting ? 'Creating...' : 'Create Workspace'}
          </button>
        </form>
      </Modal>

      {/* Join Workspace Modal */}
      <Modal isOpen={joinModal} onClose={() => setJoinModal(false)} title="Join Workspace">
        <form onSubmit={handleJoin} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1.5">Invite Code</label>
            <input
              type="text"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value)}
              placeholder="Enter invite code"
              className="w-full bg-gray-800 text-white rounded-lg px-4 py-2.5 outline-none border border-gray-700 focus:border-indigo-500 transition font-mono tracking-widest"
              required
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold py-2.5 rounded-lg transition"
          >
            {submitting ? 'Joining...' : 'Join Workspace'}
          </button>
        </form>
      </Modal>
    </div>
  );
};

export default Dashboard;
