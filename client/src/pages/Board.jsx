import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { Plus, GitBranch, Trash2, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import Navbar from '../components/Navbar';
import Modal from '../components/Modal';
import axiosInstance from '../api/axiosInstance';

const Board = () => {
  // Both linkId and boardId are available because the route is /links/:linkId/boards/:boardId
  const { linkId, boardId } = useParams();
  const navigate = useNavigate();

  const [board, setBoard] = useState(null);
  const [charts, setCharts] = useState([]);
  const [workspace, setWorkspace] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [createModal, setCreateModal] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const loadAll = async () => {
      try {
        // getBoardById populates charts array with title/description/createdAt
        // We also fetch workspace name for the breadcrumb
        const [boardRes, wsRes] = await Promise.all([
          axiosInstance.get(`/links/${linkId}/boards/${boardId}`),
          axiosInstance.get(`/links/${linkId}`),
        ]);
        setBoard(boardRes.data.data);
        setCharts(boardRes.data.data.charts || []);
        setWorkspace(wsRes.data.data.link);
      } catch {
        toast.error('Failed to load board');
        navigate(`/links/${linkId}`);
      } finally {
        setIsLoading(false);
      }
    };
    loadAll();
  }, [linkId, boardId, navigate]);

  const handleCreate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await axiosInstance.post(
        `/links/${linkId}/boards/${boardId}/charts`,
        { title, description }
      );
      setCharts((prev) => [res.data.data, ...prev]);
      setCreateModal(false);
      setTitle('');
      setDescription('');
      toast.success('Chart created!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create chart');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (chartId, e) => {
    e.stopPropagation();
    if (!confirm('Delete this chart?')) return;
    try {
      await axiosInstance.delete(`/links/${linkId}/boards/${boardId}/charts/${chartId}`);
      setCharts((prev) => prev.filter((c) => c._id !== chartId));
      toast.success('Chart deleted');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete');
    }
  };

  return (
    <div className="min-h-screen bg-gray-950">
      <Navbar />

      <div className="max-w-6xl mx-auto px-6 py-10">

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-6 flex-wrap">
          <Link to="/dashboard" className="hover:text-indigo-400 transition">Dashboard</Link>
          <ChevronRight className="w-3 h-3" />
          <Link to={`/links/${linkId}`} className="hover:text-indigo-400 transition">
            {workspace?.name || '...'}
          </Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-gray-300">{board?.title || '...'}</span>
        </div>

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">{board?.title}</h1>
            {board?.description && (
              <p className="text-gray-400 mt-1 text-sm">{board.description}</p>
            )}
          </div>
          <button
            onClick={() => setCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition text-sm"
          >
            <Plus className="w-4 h-4" /> New Chart
          </button>
        </div>

        {/* Chart list */}
        {isLoading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : charts.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 rounded-full bg-gray-800 flex items-center justify-center mx-auto mb-4">
              <GitBranch className="w-8 h-8 text-gray-600" />
            </div>
            <p className="text-gray-500">No charts yet. Create your first concept map.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {charts.map((chart, i) => (
              <motion.div
                key={chart._id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() =>
                  navigate(`/links/${linkId}/boards/${boardId}/charts/${chart._id}`)
                }
                className="bg-gray-900 border border-gray-800 hover:border-indigo-500/50 rounded-xl p-5 cursor-pointer group transition"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <GitBranch className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                    <h3 className="text-white font-semibold text-lg truncate group-hover:text-indigo-300 transition">
                      {chart.title}
                    </h3>
                  </div>
                  <button
                    onClick={(e) => handleDelete(chart._id, e)}
                    className="text-gray-600 hover:text-red-400 transition ml-2 flex-shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                {chart.description && (
                  <p className="text-gray-500 text-sm line-clamp-2 mb-3">{chart.description}</p>
                )}
                <div className="flex items-center justify-end text-indigo-400 mt-2">
                  <ChevronRight className="w-4 h-4" />
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <Modal isOpen={createModal} onClose={() => setCreateModal(false)} title="New Chart">
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1.5">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Chart title"
              className="w-full bg-gray-800 text-white rounded-lg px-4 py-2.5 outline-none border border-gray-700 focus:border-indigo-500 transition"
              required
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1.5">Description (optional)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What concepts will this chart explore?"
              rows={3}
              className="w-full bg-gray-800 text-white rounded-lg px-4 py-2.5 outline-none border border-gray-700 focus:border-indigo-500 transition resize-none"
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold py-2.5 rounded-lg transition"
          >
            {submitting ? 'Creating...' : 'Create Chart'}
          </button>
        </form>
      </Modal>
    </div>
  );
};

export default Board;
