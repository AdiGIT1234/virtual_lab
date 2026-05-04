// Breadboard electrical connectivity for the 3D ARLab.
//
// Breadboard topology (standard 830-point):
//   Top block:    rows a-e, columns 1-63 — same column = same node
//   Bottom block: rows f-j, columns 1-63 — same column = same node
//   Power rails:  +T (top positive), -T (top negative), +B, -B — all connected within rail
//
// Each drawn wire carries { from, to } = { kind: 'pin'|'hole'|'rail', id }
// This module builds a net map: net-key → Set<endpoint>, then returns
// a function that resolves what Arduino pin (if any) drives a given hole.

const TOP_ROWS = new Set(['a','b','c','d','e']);
const BOT_ROWS = new Set(['f','g','h','i','j']);

// Return the canonical node key for a hole ID.
// Same column, same block (top/bottom) → same key.
export function holeNodeKey(holeId) {
  if (!holeId || typeof holeId !== 'string') return holeId;
  const ch = holeId[0];
  if (ch === '+' || ch === '-') {
    // Power rail: +T10 → '+T', -B5 → '-B' (whole rail is one node)
    return ch + holeId[1];
  }
  if (TOP_ROWS.has(ch)) {
    const col = holeId.slice(1);
    return `top:${col}`;        // a5 b5 c5 d5 e5 all → top:5
  }
  if (BOT_ROWS.has(ch)) {
    const col = holeId.slice(1);
    return `bot:${col}`;        // f5 g5 h5 i5 j5 all → bot:5
  }
  return holeId;
}

// Build a net graph from drawn wires (each must have .from and .to).
// Returns Map<nodeKey, Set<nodeKey>>.
function buildNetGraph(wires) {
  const adj = new Map();
  const link = (a, b) => {
    if (!adj.has(a)) adj.set(a, new Set());
    if (!adj.has(b)) adj.set(b, new Set());
    adj.get(a).add(b);
    adj.get(b).add(a);
  };

  for (const w of wires) {
    if (!w.from || !w.to) continue;
    const fromKey = w.from.kind === 'hole' ? holeNodeKey(w.from.id)
                  : w.from.kind === 'pin'  ? `pin:${w.from.id}`
                  : `rail:${w.from.id}`;
    const toKey   = w.to.kind === 'hole'   ? holeNodeKey(w.to.id)
                  : w.to.kind === 'pin'    ? `pin:${w.to.id}`
                  : `rail:${w.to.id}`;
    link(fromKey, toKey);
  }
  return adj;
}

// BFS from a start node, return all reachable nodes.
function reachable(adj, start) {
  const visited = new Set([start]);
  const queue = [start];
  while (queue.length) {
    const node = queue.shift();
    for (const nb of (adj.get(node) || [])) {
      if (!visited.has(nb)) { visited.add(nb); queue.push(nb); }
    }
  }
  return visited;
}

// Build a map: holeNodeKey → Arduino pin number (if connected via wires).
// Returns Map<nodeKey, pinNumber>.
export function buildHolePinMap(wires) {
  const adj = buildNetGraph(wires);
  const result = new Map();

  // Find all pin nodes
  for (const [node] of adj.entries()) {
    if (!node.startsWith('pin:')) continue;
    const pinNum = parseInt(node.slice(4), 10);
    if (isNaN(pinNum)) continue;

    // BFS to find all holes connected to this pin
    const net = reachable(adj, node);
    for (const nk of net) {
      if (nk.startsWith('top:') || nk.startsWith('bot:')) {
        result.set(nk, pinNum);
      }
    }
  }
  return result;
}

// Given a placed component's scene-group x/z position, return its breadboard node key.
// Uses the inverse of BreadboardModel's hole formula:
//   scene_x = breadboard_group_x + startX + (col-1)*STEP
//           = 1.2 - 1.575 + (col-1)*0.05
//   scene_z (top): -(GAP + nRows*STEP) + row*STEP + STEP/2
//   scene_z (bot): GAP + row*STEP + STEP/2
// We only need to detect col and whether it's top or bottom half.
const BB_STEP = 0.05;
const BB_X_ORIGIN = 1.2 - 63 * BB_STEP / 2;  // left edge of column 1
const BB_GAP_Z    = 0.04;
const BB_NROWS    = 5;
const BB_MAIN_Z   = BB_NROWS * BB_STEP;

export function posToNodeKey(x, z) {
  const col = Math.round((x - BB_X_ORIGIN) / BB_STEP) + 1;
  if (col < 1 || col > 63) return null;
  // top block: z < 0; bottom block: z > 0
  if (z < 0) return `top:${col}`;
  if (z > 0) return `bot:${col}`;
  return null;
}
