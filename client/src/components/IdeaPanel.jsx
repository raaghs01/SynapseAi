import { useState, useEffect } from 'react';
import { Loader2, Save, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import axiosInstance from '../api/axiosInstance';
import Modal from './Modal';

// Detail panel for a node's Idea. Create mode when the node has no ideaRef yet,
// edit mode when it does. Talks to /ideas under the given chart basePath.
const IdeaPanel = ({ node, basePath, onCreated, onDeleted, onClose }) => {
  const ideaId = node.data.ideaRef || null;
  const isEdit = !!ideaId;

  const [loading, setLoading] = useState(isEdit); // only edit mode fetches
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [form, setForm] = useState({
    topic: node.data.label || '',
    description: '',
    progress: 0,
    github_link: '',
  });

  // Load the existing idea when editing
  useEffect(() => {
    if (!isEdit) return;
    let active = true;
    (async () => {
      try {
        const res = await axiosInstance.get(`${basePath}/ideas/${ideaId}`);
        const d = res.data.data;
        if (!active) return;
        setForm({
          topic: d.topic || '',
          description: d.description || '',
          progress: d.progress ?? 0,
          github_link: d.github_link || '',
        });
      } catch {
        toast.error('Failed to load idea');
        onClose();
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ideaId]);

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const buildPayload = () => {
    const payload = {
      topic: form.topic.trim(),
      description: form.description.trim(),
      progress: Number(form.progress) || 0,
    };
    // github_link is validated with isURL on the server, so only send it when
    // non-empty — an empty string would fail validation.
    const gh = form.github_link.trim();
    if (gh) payload.github_link = gh;
    return payload;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.topic.trim()) return toast.error('Topic is required');
    setSaving(true);
    try {
      const payload = buildPayload();
      if (isEdit) {
        await axiosInstance.patch(`${basePath}/ideas/${ideaId}`, payload);
        toast.success('Idea updated');
      } else {
        const res = await axiosInstance.post(`${basePath}/ideas`, {
          ...payload,
          nodeId: node.id,
        });
        onCreated(node.id, res.data.data._id);
        toast.success('Idea created');
      }
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(
      'Delete this idea? This also removes the node and its connections from the graph.'
    )) return;
    setDeleting(true);
    try {
      await axiosInstance.delete(`${basePath}/ideas/${ideaId}`);
      toast.success('Idea deleted');
      onDeleted(node.id);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed');
      setDeleting(false);
    }
  };

  const inputClass =
    'w-full bg-gray-800 text-white rounded-lg px-4 py-2.5 outline-none border border-gray-700 focus:border-indigo-500 transition';

  return (
    <Modal isOpen onClose={onClose} title={isEdit ? 'Idea details' : 'Add idea'}>
      {loading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="w-6 h-6 animate-spin text-indigo-400" />
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1.5">Topic</label>
            <input
              type="text"
              value={form.topic}
              onChange={(e) => set('topic', e.target.value)}
              placeholder="e.g. Real-time sync layer"
              className={inputClass}
              autoFocus
              required
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1.5">Description</label>
            <textarea
              rows={4}
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
              placeholder="What is this concept about?"
              className={`${inputClass} resize-none`}
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1.5">
              Progress: <span className="text-indigo-400">{form.progress}%</span>
            </label>
            <input
              type="range"
              min={0}
              max={100}
              value={form.progress}
              onChange={(e) => set('progress', e.target.value)}
              className="w-full accent-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1.5">GitHub link</label>
            <input
              type="url"
              value={form.github_link}
              onChange={(e) => set('github_link', e.target.value)}
              placeholder="https://github.com/user/repo"
              className={inputClass}
            />
          </div>

          <div className="flex gap-2 pt-1">
            <button
              type="submit"
              disabled={saving || deleting}
              className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold py-2.5 rounded-lg transition"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {isEdit ? 'Save changes' : 'Create idea'}
            </button>
            {isEdit && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={saving || deleting}
                title="Delete idea and node"
                className="flex items-center justify-center px-3 bg-red-600/90 hover:bg-red-500 disabled:opacity-50 text-white rounded-lg transition"
              >
                {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              </button>
            )}
          </div>
        </form>
      )}
    </Modal>
  );
};

export default IdeaPanel;
