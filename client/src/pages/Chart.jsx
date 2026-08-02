import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReactFlow, {
  addEdge,
  useNodesState,
  useEdgesState,
  Controls,
  Background,
  BackgroundVariant,
  MiniMap,
  Handle,
  Position,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { v4 as uuidv4 } from 'uuid';
import {
  Save, Sparkles, X, Check, Plus, Loader2,
  Users, Brain, ChevronLeft,
} from 'lucide-react';
import toast from 'react-hot-toast';
import axiosInstance from '../api/axiosInstance';
import socket from '../utils/socket';
import useAuthStore from '../store/useAuthStore';
import Modal from '../components/Modal';

// ─── Converters ───────────────────────────────────────────────────────────────
// These two functions translate between MongoDB schema shape and ReactFlow shape.
// They live outside the component so they're never re-created on render.

const dbNodeToRF = (n) => ({
  id: n.nodeId,
  type: 'synapse',
  position: { x: n.x, y: n.y },
  data: { label: n.label, color: n.color || '#6366f1', isAIGenerated: n.isAIGenerated },
});

const dbEdgeToRF = (e) => ({
  id: e.edgeId,
  source: e.source,
  target: e.target,
  label: e.label || '',
  // AI-suggested edges that haven't been accepted yet animate to signal they're provisional
  animated: e.isAISuggested && !e.accepted,
  style: { stroke: e.isAISuggested ? '#a78bfa' : '#6366f1', strokeWidth: 1.5 },
  data: { isAISuggested: e.isAISuggested, confidence: e.confidence, accepted: e.accepted },
});

// Convert RF nodes/edges back to the shape syncGraph PATCH endpoint expects
const rfNodesToDB = (nodes) =>
  nodes.map((n) => ({
    nodeId: n.id,
    label: n.data.label,
    x: n.position.x,
    y: n.position.y,
    color: n.data.color || '#6366f1',
    isAIGenerated: n.data.isAIGenerated || false,
  }));

const rfEdgesToDB = (edges) =>
  edges.map((e) => ({
    edgeId: e.id,
    source: e.source,
    target: e.target,
    label: e.label || '',
    isAISuggested: e.data?.isAISuggested || false,
    confidence: e.data?.confidence || 0,
    accepted: true,
  }));

// ─── Custom Node ──────────────────────────────────────────────────────────────
// nodeTypes MUST be defined outside the Chart component.
// If defined inside, React creates a new object reference every render,
// causing ReactFlow to fully unmount and remount all nodes (loses selection, animations).

const SynapseNode = ({ data, selected }) => (
  <div
    style={{ background: data.color || '#6366f1' }}
    className={`px-4 py-2 rounded-full text-white text-sm font-medium min-w-[80px] text-center select-none transition-all ${
      selected ? 'ring-2 ring-white ring-offset-2 ring-offset-gray-950 shadow-lg' : ''
    }`}
  >
    {/* Top handle = receives connections coming in from above */}
    <Handle
      type="target"
      position={Position.Top}
      className="!w-2.5 !h-2.5 !bg-white/70 !border-0"
    />
    {data.label}
    {/* Bottom handle = source for dragging connections out */}
    <Handle
      type="source"
      position={Position.Bottom}
      className="!w-2.5 !h-2.5 !bg-white/70 !border-0"
    />
    {/* Left/Right side handles for horizontal connections */}
    <Handle
      type="target"
      position={Position.Left}
      id="left-target"
      className="!w-2.5 !h-2.5 !bg-white/70 !border-0"
    />
    <Handle
      type="source"
      position={Position.Right}
      id="right-source"
      className="!w-2.5 !h-2.5 !bg-white/70 !border-0"
    />
  </div>
);

const nodeTypes = { synapse: SynapseNode };

// Colour palette for new nodes
const NODE_COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f97316', '#10b981', '#0ea5e9', '#f59e0b'];

// ─── Chart Page ───────────────────────────────────────────────────────────────

const Chart = () => {
  const { linkId, boardId, chartId } = useParams();
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);

  // useNodesState / useEdgesState are ReactFlow hooks that wrap useState + provide
  // the onNodesChange / onEdgesChange handlers ReactFlow needs internally
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  const [chart, setChart] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [aiPanelOpen, setAiPanelOpen] = useState(true);
  const [onlineUsers, setOnlineUsers] = useState([]);

  // Add-node modal (opens on double-click of canvas background)
  const [addNodeModal, setAddNodeModal] = useState(false);
  const [newNodeLabel, setNewNodeLabel] = useState('');
  const [newNodeColor, setNewNodeColor] = useState('#6366f1');
  const [clickPosition, setClickPosition] = useState({ x: 250, y: 250 });

  // AI panel state
  const [aiLoading, setAiLoading] = useState(false);
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [selectedNodeIds, setSelectedNodeIds] = useState([]);
  const [expandSuggestions, setExpandSuggestions] = useState([]);
  const [connectionSuggestions, setConnectionSuggestions] = useState([]);
  const [clusterSummary, setClusterSummary] = useState('');

  // Refs used across callbacks without causing re-renders
  const reactFlowWrapper = useRef(null);
  const reactFlowInstance = useRef(null);
  const broadcastTimer = useRef(null);
  // nodesRef / edgesRef always hold the latest value — used inside socket callbacks
  // and broadcastGraph where the closure would otherwise capture stale state
  const nodesRef = useRef([]);
  const edgesRef = useRef([]);
  // Prevent re-broadcasting an update we just received from another user
  const isRemoteUpdate = useRef(false);

  // Keep refs in sync whenever state changes
  useEffect(() => { nodesRef.current = nodes; }, [nodes]);
  useEffect(() => { edgesRef.current = edges; }, [edges]);

  // ── Load chart data ──────────────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      try {
        const res = await axiosInstance.get(
          `/links/${linkId}/boards/${boardId}/charts/${chartId}`
        );
        const c = res.data.data;
        setChart(c);
        setNodes(c.graphNodes.map(dbNodeToRF));
        setEdges(c.graphEdges.map(dbEdgeToRF));
      } catch {
        toast.error('Failed to load chart');
        navigate(`/links/${linkId}/boards/${boardId}`);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [chartId, linkId, boardId, navigate]);

  // ── Socket setup ─────────────────────────────────────────────────────────
  useEffect(() => {
    // connect() triggers the io.use() auth middleware on the server with the token
    socket.connect();
    // join-chart emits our presence and starts the DB authorization check
    socket.emit('join-chart', chartId);

    socket.on('user-joined', (u) => {
      // Replace any existing entry with same userId then add fresh — handles reconnects
      setOnlineUsers((prev) => [
        ...prev.filter((x) => x.userId !== u.userId),
        u,
      ]);
      toast(`${u.username} joined`, { icon: '👋' });
    });

    socket.on('user-left', (u) => {
      setOnlineUsers((prev) => prev.filter((x) => x.userId !== u.userId));
    });

    socket.on('graph-updated', ({ graphNodes, graphEdges, updatedBy }) => {
      // Ignore if this update came from us — server bounces our own emit to all
      // OTHER clients in the room, but guard here in case socket.id matching fails
      if (updatedBy?.userId?.toString() === user?._id?.toString()) return;

      isRemoteUpdate.current = true;
      setNodes(graphNodes.map(dbNodeToRF));
      setEdges(graphEdges.map(dbEdgeToRF));
      // Reset flag after state flush so our own next change isn't suppressed
      setTimeout(() => { isRemoteUpdate.current = false; }, 100);
    });

    return () => {
      socket.emit('leave-chart', chartId);
      socket.off('user-joined');
      socket.off('user-left');
      socket.off('graph-updated');
      socket.disconnect();
    };
  }, [chartId, user]);

  // ── Broadcast helper ─────────────────────────────────────────────────────
  // Debounced so rapid drags only emit one message after the user stops moving.
  // Reads from refs so the callback never needs to be recreated (stable identity).
  const broadcastGraph = useCallback(() => {
    if (isRemoteUpdate.current) return;
    clearTimeout(broadcastTimer.current);
    broadcastTimer.current = setTimeout(() => {
      socket.emit('graph-updated', {
        chartId,
        graphNodes: rfNodesToDB(nodesRef.current),
        graphEdges: rfEdgesToDB(edgesRef.current),
      });
    }, 400);
  }, [chartId]);

  // ── Connection handler ───────────────────────────────────────────────────
  const onConnect = useCallback((params) => {
    const newEdge = {
      ...params,
      id: uuidv4(),
      label: '',
      style: { stroke: '#6366f1', strokeWidth: 1.5 },
      data: { isAISuggested: false, confidence: 0, accepted: true },
    };
    setEdges((eds) => addEdge(newEdge, eds));
    // Broadcast after state update — broadcastGraph reads edgesRef which is updated
    // by the useEffect above, so we defer by one tick
    setTimeout(broadcastGraph, 0);
  }, [broadcastGraph]);

  // ── Node drag stop ───────────────────────────────────────────────────────
  // Fires once when the user releases a dragged node — cheaper than broadcasting
  // on every pixel of movement during drag
  const onNodeDragStop = useCallback(() => {
    broadcastGraph();
  }, [broadcastGraph]);

  // ── Delete key ───────────────────────────────────────────────────────────
  const onNodesDelete = useCallback(() => {
    setTimeout(broadcastGraph, 0);
  }, [broadcastGraph]);

  const onEdgesDelete = useCallback(() => {
    setTimeout(broadcastGraph, 0);
  }, [broadcastGraph]);

  // ── Double-click on canvas background → open add-node modal ─────────────
  const onDoubleClick = useCallback((event) => {
    // Open the add-node modal for double-clicks on empty canvas only.
    // We can't match the pane class directly — the dotted Background layer sits
    // on top, so event.target is usually the background SVG, not the pane.
    // Instead, ignore double-clicks that land on a node, edge, or the UI overlays.
    if (
      event.target.closest('.react-flow__node') ||
      event.target.closest('.react-flow__edge') ||
      event.target.closest('.react-flow__controls') ||
      event.target.closest('.react-flow__minimap')
    ) {
      return;
    }

    const bounds = reactFlowWrapper.current?.getBoundingClientRect();
    // project() converts screen pixels → flow-graph coordinates (accounts for pan/zoom)
    const flowPos = reactFlowInstance.current?.project({
      x: event.clientX - (bounds?.left || 0),
      y: event.clientY - (bounds?.top || 0),
    });
    setClickPosition(flowPos || { x: 250, y: 250 });
    setAddNodeModal(true);
  }, []);

  const handleAddNode = (e) => {
    e.preventDefault();
    if (!newNodeLabel.trim()) return;

    const id = uuidv4();
    const newNode = {
      id,
      type: 'synapse',
      position: clickPosition,
      data: { label: newNodeLabel.trim(), color: newNodeColor, isAIGenerated: false },
    };
    setNodes((nds) => [...nds, newNode]);
    setTimeout(broadcastGraph, 0);
    setAddNodeModal(false);
    setNewNodeLabel('');
    setNewNodeColor('#6366f1');
  };

  // ── Track selection for AI panel ─────────────────────────────────────────
  const onSelectionChange = useCallback(({ nodes: selected }) => {
    const ids = selected.map((n) => n.id);
    setSelectedNodeIds(ids);
    setSelectedNodeId(ids.length === 1 ? ids[0] : null);
  }, []);

  // ── Save to server ───────────────────────────────────────────────────────
  const handleSave = async () => {
    setIsSaving(true);
    try {
      await axiosInstance.patch(
        `/links/${linkId}/boards/${boardId}/charts/${chartId}/sync`,
        {
          graphNodes: rfNodesToDB(nodesRef.current),
          graphEdges: rfEdgesToDB(edgesRef.current),
        }
      );
      toast.success('Chart saved!');
    } catch {
      toast.error('Failed to save');
    } finally {
      setIsSaving(false);
    }
  };

  // ── AI: Expand Node ──────────────────────────────────────────────────────
  const handleExpandNode = async () => {
    if (!selectedNodeId) return toast.error('Select a node first');
    const selectedNode = nodes.find((n) => n.id === selectedNodeId);
    if (!selectedNode) return;

    setAiLoading(true);
    setExpandSuggestions([]);
    setConnectionSuggestions([]);
    setClusterSummary('');
    try {
      // chartContext is the chart title — gives Gemini more focus on the topic
      const res = await axiosInstance.post(
        `/links/${linkId}/boards/${boardId}/charts/${chartId}/ai/expand-node`,
        { nodeLabel: selectedNode.data.label, chartContext: chart?.title }
      );
      setExpandSuggestions(res.data.data.suggestions);
    } catch (err) {
      toast.error(err.response?.data?.message || 'AI request failed');
    } finally {
      setAiLoading(false);
    }
  };

  // User clicks + next to a suggestion → add as AI-generated node connected to selected
  const acceptExpandSuggestion = (label) => {
    const parentNode = nodes.find((n) => n.id === selectedNodeId);
    // Offset position so the new node doesn't overlap the parent
    const pos = parentNode
      ? {
          x: parentNode.position.x + 200,
          y: parentNode.position.y + (Math.random() - 0.5) * 180,
        }
      : { x: 300, y: 300 };

    const id = uuidv4();
    const newNode = {
      id,
      type: 'synapse',
      position: pos,
      data: { label, color: '#8b5cf6', isAIGenerated: true },
    };
    const newEdge = {
      id: uuidv4(),
      source: selectedNodeId,
      target: id,
      style: { stroke: '#8b5cf6', strokeWidth: 1.5 },
      data: { isAISuggested: false, confidence: 0, accepted: true },
    };
    setNodes((nds) => [...nds, newNode]);
    setEdges((eds) => [...eds, newEdge]);
    setExpandSuggestions((prev) => prev.filter((s) => s !== label));
    setTimeout(broadcastGraph, 0);
    toast.success(`Added "${label}"`);
  };

  // ── AI: Suggest Connections ──────────────────────────────────────────────
  const handleSuggestConnections = async () => {
    setAiLoading(true);
    setExpandSuggestions([]);
    setConnectionSuggestions([]);
    setClusterSummary('');
    try {
      // Server reads req.chart.graphNodes — it uses the last-saved state, not live RF state
      // So Save first if you want the latest nodes included
      const res = await axiosInstance.post(
        `/links/${linkId}/boards/${boardId}/charts/${chartId}/ai/suggest-connections`
      );
      setConnectionSuggestions(res.data.data.suggestions);
    } catch (err) {
      toast.error(err.response?.data?.message || 'AI request failed');
    } finally {
      setAiLoading(false);
    }
  };

  const acceptConnectionSuggestion = (sug) => {
    const newEdge = {
      id: uuidv4(),
      source: sug.source,
      target: sug.target,
      label: sug.label,
      animated: false,
      style: { stroke: '#6366f1', strokeWidth: 1.5 },
      data: { isAISuggested: true, confidence: sug.confidence, accepted: true },
    };
    setEdges((eds) => [...eds, newEdge]);
    setConnectionSuggestions((prev) => prev.filter((s) => s !== sug));
    setTimeout(broadcastGraph, 0);
    toast.success('Connection added!');
  };

  // ── AI: Summarize Cluster ────────────────────────────────────────────────
  const handleSummarizeCluster = async () => {
    if (selectedNodeIds.length < 2) return toast.error('Select at least 2 nodes');
    setAiLoading(true);
    setExpandSuggestions([]);
    setConnectionSuggestions([]);
    setClusterSummary('');
    try {
      const res = await axiosInstance.post(
        `/links/${linkId}/boards/${boardId}/charts/${chartId}/ai/summarize-cluster`,
        { nodeIds: selectedNodeIds }
      );
      setClusterSummary(res.data.data.summary);
    } catch (err) {
      toast.error(err.response?.data?.message || 'AI request failed');
    } finally {
      setAiLoading(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="h-screen bg-gray-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-950 flex flex-col">

      {/* ── Top Bar ──────────────────────────────────────────────────────── */}
      <div className="bg-gray-900 border-b border-gray-800 px-4 py-2.5 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(`/links/${linkId}/boards/${boardId}`)}
            className="text-gray-400 hover:text-white transition"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-white font-semibold text-sm">{chart?.title}</h1>
            <p className="text-gray-500 text-xs hidden sm:block">
              Double-click canvas to add node · Drag handle to connect · Delete key to remove
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Online users avatars */}
          {onlineUsers.length > 0 && (
            <div className="flex items-center gap-1.5 mr-1">
              <Users className="w-4 h-4 text-gray-500" />
              <div className="flex -space-x-1">
                {onlineUsers.map((u) => (
                  <div
                    key={u.userId}
                    title={u.username}
                    className="w-6 h-6 rounded-full bg-indigo-600 border-2 border-gray-900 flex items-center justify-center text-xs text-white font-bold"
                  >
                    {u.username[0].toUpperCase()}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* AI panel toggle */}
          <button
            onClick={() => setAiPanelOpen((p) => !p)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition ${
              aiPanelOpen
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:text-white'
            }`}
          >
            <Brain className="w-4 h-4" /> AI
          </button>

          {/* Save button */}
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-green-700 hover:bg-green-600 disabled:opacity-50 text-white rounded-lg text-sm transition"
          >
            {isSaving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            Save
          </button>
        </div>
      </div>

      {/* ── Main Area ────────────────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">

        {/* ReactFlow Canvas */}
        <div ref={reactFlowWrapper} className="flex-1" onDoubleClick={onDoubleClick}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeDragStop={onNodeDragStop}
            onNodesDelete={onNodesDelete}
            onEdgesDelete={onEdgesDelete}
            onSelectionChange={onSelectionChange}
            onInit={(instance) => { reactFlowInstance.current = instance; }}
            nodeTypes={nodeTypes}
            fitView
            deleteKeyCode="Delete"
            zoomOnDoubleClick={false}
            className="bg-gray-950"
          >
            <Background
              variant={BackgroundVariant.Dots}
              color="#374151"
              gap={24}
              size={1}
            />
            <Controls className="!bg-gray-900 !border-gray-700" />
            <MiniMap
              className="!bg-gray-900 !border-gray-700"
              nodeColor={(n) => n.data?.color || '#6366f1'}
              maskColor="rgba(0,0,0,0.5)"
            />
          </ReactFlow>
        </div>

        {/* ── AI Panel ───────────────────────────────────────────────────── */}
        {aiPanelOpen && (
          <div className="w-72 bg-gray-900 border-l border-gray-800 flex flex-col overflow-hidden flex-shrink-0">
            <div className="px-4 py-3 border-b border-gray-800 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              <h2 className="text-white font-semibold text-sm">AI Assistant</h2>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-3">

              {/* ── Expand Node ────────────────────────────────────────── */}
              <div className="bg-gray-800 rounded-xl p-3">
                <h3 className="text-white text-xs font-semibold mb-1">Expand Node</h3>
                <p className="text-gray-500 text-xs mb-3">
                  {selectedNodeId
                    ? `"${nodes.find((n) => n.id === selectedNodeId)?.data.label}"`
                    : 'Select a single node first'}
                </p>
                <button
                  onClick={handleExpandNode}
                  disabled={!selectedNodeId || aiLoading}
                  className="w-full px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs rounded-lg transition flex items-center justify-center gap-1.5"
                >
                  {aiLoading ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <Sparkles className="w-3 h-3" />
                  )}
                  Expand
                </button>

                {expandSuggestions.length > 0 && (
                  <div className="mt-3 space-y-1.5">
                    {expandSuggestions.map((s) => (
                      <div
                        key={s}
                        className="flex items-center justify-between bg-gray-700 rounded-lg px-2.5 py-1.5"
                      >
                        <span className="text-gray-300 text-xs flex-1 truncate">{s}</span>
                        <button
                          onClick={() => acceptExpandSuggestion(s)}
                          className="text-green-400 hover:text-green-300 ml-2 flex-shrink-0"
                          title="Add to graph"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* ── Suggest Connections ────────────────────────────────── */}
              <div className="bg-gray-800 rounded-xl p-3">
                <h3 className="text-white text-xs font-semibold mb-1">Suggest Connections</h3>
                <p className="text-gray-500 text-xs mb-3">
                  AI finds meaningful links between your saved nodes
                </p>
                <button
                  onClick={handleSuggestConnections}
                  disabled={nodes.length < 2 || aiLoading}
                  className="w-full px-3 py-1.5 bg-purple-600 hover:bg-purple-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs rounded-lg transition flex items-center justify-center gap-1.5"
                >
                  {aiLoading ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <Sparkles className="w-3 h-3" />
                  )}
                  Suggest
                </button>

                {connectionSuggestions.length > 0 && (
                  <div className="mt-3 space-y-1.5">
                    {connectionSuggestions.map((sug, i) => {
                      const srcLabel =
                        nodes.find((n) => n.id === sug.source)?.data.label || sug.source;
                      const tgtLabel =
                        nodes.find((n) => n.id === sug.target)?.data.label || sug.target;
                      return (
                        <div key={i} className="bg-gray-700 rounded-lg px-2.5 py-1.5">
                          <div className="flex items-start justify-between gap-1">
                            <div className="flex-1 min-w-0">
                              <p className="text-gray-300 text-xs truncate">
                                {srcLabel} → {tgtLabel}
                              </p>
                              <p className="text-gray-500 text-xs">
                                {sug.label}{' '}
                                <span className="text-purple-400">
                                  ({Math.round(sug.confidence * 100)}%)
                                </span>
                              </p>
                            </div>
                            <div className="flex gap-1 flex-shrink-0">
                              <button
                                onClick={() => acceptConnectionSuggestion(sug)}
                                className="text-green-400 hover:text-green-300"
                                title="Accept"
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() =>
                                  setConnectionSuggestions((p) => p.filter((s) => s !== sug))
                                }
                                className="text-red-400 hover:text-red-300"
                                title="Dismiss"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* ── Summarize Cluster ──────────────────────────────────── */}
              <div className="bg-gray-800 rounded-xl p-3">
                <h3 className="text-white text-xs font-semibold mb-1">Summarize Cluster</h3>
                <p className="text-gray-500 text-xs mb-3">
                  {selectedNodeIds.length >= 2
                    ? `${selectedNodeIds.length} nodes selected`
                    : 'Hold Shift and select 2+ nodes'}
                </p>
                <button
                  onClick={handleSummarizeCluster}
                  disabled={selectedNodeIds.length < 2 || aiLoading}
                  className="w-full px-3 py-1.5 bg-pink-600 hover:bg-pink-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs rounded-lg transition flex items-center justify-center gap-1.5"
                >
                  {aiLoading ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <Sparkles className="w-3 h-3" />
                  )}
                  Summarize
                </button>

                {clusterSummary && (
                  <div className="mt-3 bg-gray-700 rounded-lg p-2.5">
                    <p className="text-gray-300 text-xs leading-relaxed">{clusterSummary}</p>
                  </div>
                )}
              </div>

            </div>
          </div>
        )}
      </div>

      {/* ── Add Node Modal ────────────────────────────────────────────────── */}
      <Modal
        isOpen={addNodeModal}
        onClose={() => { setAddNodeModal(false); setNewNodeLabel(''); }}
        title="Add Node"
      >
        <form onSubmit={handleAddNode} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1.5">Concept label</label>
            <input
              type="text"
              value={newNodeLabel}
              onChange={(e) => setNewNodeLabel(e.target.value)}
              placeholder="e.g. Machine Learning"
              className="w-full bg-gray-800 text-white rounded-lg px-4 py-2.5 outline-none border border-gray-700 focus:border-indigo-500 transition"
              autoFocus
              required
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-2">Colour</label>
            <div className="flex gap-2 flex-wrap">
              {NODE_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setNewNodeColor(c)}
                  className={`w-7 h-7 rounded-full transition ${
                    newNodeColor === c
                      ? 'ring-2 ring-white ring-offset-2 ring-offset-gray-900'
                      : 'opacity-70 hover:opacity-100'
                  }`}
                  style={{ background: c }}
                />
              ))}
            </div>
          </div>
          <button
            type="submit"
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-2.5 rounded-lg transition"
          >
            Add Node
          </button>
        </form>
      </Modal>
    </div>
  );
};

export default Chart;
