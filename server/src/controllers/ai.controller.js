import { GoogleGenerativeAI } from '@google/generative-ai';
import { asyncHandler } from '../utils/asynchandler.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
// new GoogleGenerativeAI(...) — initializes the Gemini client once at module level. 
// Reused across all three controllers — no need to reinitialize per request.

const expandNode = asyncHandler(async (req, res) => {
  const { nodeLabel, chartContext } = req.body;

  if (!nodeLabel?.trim()) {
    throw new ApiError(400, 'Node label is required');
  }

  const existingLabels = req.chart.graphNodes.map((n) => n.label);

  const prompt = `You are a concept mapping assistant.
Given the concept "${nodeLabel}"${chartContext ? ` in the context of "${chartContext}"` : ''}, suggest exactly 5 related concepts worth exploring.

Already existing concepts (do not suggest these): ${existingLabels.join(', ')}

Return ONLY a valid JSON array of 5 strings. No explanation, no markdown.
Example: ["concept1", "concept2", "concept3", "concept4", "concept5"]`;

  const result = await model.generateContent(prompt);
  const raw = result.response.text().replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

  const suggestions = JSON.parse(raw);

  return res
    .status(200)
    .json(new ApiResponse(200, { suggestions }, 'Node expansion suggestions generated'));
});

const suggestConnections = asyncHandler(async (req, res) => {
  const nodes = req.chart.graphNodes;

  if (nodes.length < 2) {
    throw new ApiError(400, 'At least 2 nodes are needed to suggest connections');
  }

  const existingEdgePairs = req.chart.graphEdges.map(
    (e) => `${e.source}||${e.target}`
  );

  const nodeList = nodes
    .map((n) => `id: "${n.nodeId}", label: "${n.label}"`)
    .join('\n');

  const prompt = `You are a concept mapping assistant.
Given these concepts:
${nodeList}

Suggest meaningful connections between them. Return ONLY a valid JSON array with this exact shape:
[{"source": "nodeId", "target": "nodeId", "label": "short relationship", "confidence": 0.9}]

Rules:
- Use ONLY the nodeIds from the list above — do not invent new ones
- "label" must be 2 to 5 words describing the relationship
- "confidence" is a number from 0 to 1 — how confident you are in this connection
- Suggest maximum 6 connections
- No markdown, no explanation, only the JSON array`;

  const result = await model.generateContent(prompt);
  const raw = result.response.text().replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

  const suggestions = JSON.parse(raw);

  const filtered = suggestions.filter((s) => {
    const forward = `${s.source}||${s.target}`;
    const backward = `${s.target}||${s.source}`;
    return !existingEdgePairs.includes(forward) && !existingEdgePairs.includes(backward);
  });

  return res
    .status(200)
    .json(new ApiResponse(200, { suggestions: filtered }, 'Connection suggestions generated'));
});


const summarizeCluster = asyncHandler(async (req, res) => {
  const { nodeIds } = req.body;

  if (!nodeIds || !Array.isArray(nodeIds) || nodeIds.length < 2) {
    throw new ApiError(400, 'At least 2 node IDs are required to summarize a cluster');
  }

  const selectedNodes = req.chart.graphNodes.filter((n) =>
    nodeIds.includes(n.nodeId)
  );

  if (selectedNodes.length < 2) {
    throw new ApiError(404, 'Could not find enough matching nodes in this chart');
  }

  const labels = selectedNodes.map((n) => n.label);

  const prompt = `You are a concept mapping assistant.
A user has selected these concepts from their concept map:
${labels.map((l, i) => `${i + 1}. ${l}`).join('\n')}

In 2 to 3 sentences:
- What is the central theme connecting these concepts?
- What do they collectively represent?

Write directly and clearly. No bullet points, no headers, just plain paragraph text.`;

  const result = await model.generateContent(prompt);
  const summary = result.response.text().trim();

  return res
    .status(200)
    .json(
      new ApiResponse(200, { summary, concepts: labels }, 'Cluster summarized successfully')
    );
});

export { expandNode, suggestConnections, summarizeCluster };

