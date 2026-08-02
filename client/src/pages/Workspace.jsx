import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { Plus, Layout, Trash2, ChevronRight, Copy } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import Navbar from '../components/Navbar';
import Modal from '../components/Modal';
import axiosInstance from '../api/axiosInstance';

const Workspace = () => {
  // linkId comes from URL: /links/:linkId  — injected by react-router
  const { linkId } = useParams();
  const navigate = useNavigate();

  const [workspace, setWorkspace] = useState(null);
  const [boards, setBoards] = useState([]);
  const [role, setRole] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [createModal, setCreateModal] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    // Run both requests in parallel — getLinkById for workspace name/inviteCode,
    // getBoards for the board list
    const loadAll = async () => {
      try {
        const [wsRes, boardsRes] = await Promise.all([
          axiosInstance.get(`/links/${linkId}`),
          axiosInstance.get(`/links/${linkId}/boards`),
        ]);
        setWorkspace(wsRes.data.data.link);
        setRole(wsRes.data.data.role);
        setBoards(boardsRes.data.data);
      } catch {
        toast.error('Failed to load workspace');
        navigate('/dashboard');
      } finally {
        setIsLoading(false);
      }
    };
    loadAll();
  }, [linkId]);

  const handleCreate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await axiosInstance.post(`/links/${linkId}/boards`, { title, description });
      setBoards((prev) => [res.data.data, ...prev]);
      setCreateModal(false);
      setTitle('');
      setDescription('');
      toast.success('Board created!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create board');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (boardId, e) => {
    e.stopPropagation();
    if (!confirm('Delete this board?')) return;
    try {
      await axiosInstance.delete(`/links/${linkId}/boards/${boardId}`);
      setBoards((prev) => prev.filter((b) => b._id !== boardId));
      toast.success('Board deleted');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete');
    }
  };

  const copyInviteCode = () => {
    if (workspace?.inviteCode) {
      navigator.clipboard.writeText(workspace.inviteCode);
      toast.success('Invite code copied!');
    }
  };

  return (
    <div className="min-h-screen bg-gray-950">
      <Navbar />

      <div className="max-w-6xl mx-auto px-6 py-10">

        {/* Breadcrumb navigation */}
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
          <Link to="/dashboard" className="hover:text-indigo-400 transition">Dashboard</Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-gray-300">{workspace?.name || '...'}</span>
        </div>

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">{workspace?.name}</h1>
            {workspace?.description && (
              <p className="text-gray-400 mt-1 text-sm">{workspace.description}</p>
            )}
            {/* Invite code — only visible to owner so they can share it */}
            {role === 'owner' && workspace?.inviteCode && (
              <button
                onClick={copyInviteCode}
                className="flex items-center gap-1.5 mt-2 text-xs text-gray-500 hover:text-indigo-400 transition"
              >
                <Copy className="w-3 h-3" />
                Invite code: <span className="font-mono ml-1">{workspace.inviteCode}</span>
              </button>
            )}
          </div>
          <button
            onClick={() => setCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition text-sm"
          >
            <Plus className="w-4 h-4" /> New Board
          </button>
        </div>

        {/* Board list */}
        {isLoading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : boards.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 rounded-full bg-gray-800 flex items-center justify-center mx-auto mb-4">
              <Layout className="w-8 h-8 text-gray-600" />
            </div>
            <p className="text-gray-500">No boards yet. Create one to get started.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {boards.map((board, i) => (
              <motion.div
                key={board._id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => navigate(`/links/${linkId}/boards/${board._id}`)}
                className="bg-gray-900 border border-gray-800 hover:border-indigo-500/50 rounded-xl p-5 cursor-pointer group transition"
              >
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-white font-semibold text-lg truncate group-hover:text-indigo-300 transition flex-1 min-w-0">
                    {board.title}
                  </h3>
                  {role === 'owner' && (
                    <button
                      onClick={(e) => handleDelete(board._id, e)}
                      className="text-gray-600 hover:text-red-400 transition ml-2 flex-shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
                {board.description && (
                  <p className="text-gray-500 text-sm line-clamp-2 mb-3">{board.description}</p>
                )}
                <div className="flex items-center justify-end text-indigo-400 mt-2">
                  <ChevronRight className="w-4 h-4" />
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <Modal isOpen={createModal} onClose={() => setCreateModal(false)} title="New Board">
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1.5">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Board title"
              className="w-full bg-gray-800 text-white rounded-lg px-4 py-2.5 outline-none border border-gray-700 focus:border-indigo-500 transition"
              required
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1.5">Description (optional)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What is this board for?"
              rows={3}
              className="w-full bg-gray-800 text-white rounded-lg px-4 py-2.5 outline-none border border-gray-700 focus:border-indigo-500 transition resize-none"
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold py-2.5 rounded-lg transition"
          >
            {submitting ? 'Creating...' : 'Create Board'}
          </button>
        </form>
      </Modal>
    </div>
  );
};

export default Workspace;
