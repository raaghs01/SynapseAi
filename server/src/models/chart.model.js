import mongoose from 'mongoose';

const graphNodeSchema = new mongoose.Schema({
  nodeId: { type: String, required: true },
  label: { type: String, required: true },
  x: { type: Number, default: 0 },
  y: { type: Number, default: 0 },
  color: { type: String, default: '#6366f1' },
  size: { type: Number, default: 24 },
  ideaRef: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Idea',
    default: null,
  },
  isAIGenerated: { type: Boolean, default: false },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
});

const graphEdgeSchema = new mongoose.Schema({
  edgeId: { type: String, required: true },
  source: { type: String, required: true },
  target: { type: String, required: true },
  label: { type: String, default: '' },
  isAISuggested: { type: Boolean, default: false },
  confidence: { type: Number, default: 0.0 },
  accepted: { type: Boolean, default: false },
});

const chartSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    board: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Board',
      required: true,
    },
    ideas: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Idea',
      },
    ],
    graphNodes: [graphNodeSchema],
    graphEdges: [graphEdgeSchema],
  },
  { timestamps: true }
);

export const Chart = mongoose.model('Chart', chartSchema);
