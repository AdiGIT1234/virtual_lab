/**
 * Breadboard hole coordinate utilities.
 *
 * The breadboard mesh group sits at scene-group X = 1.2, Z = 0 + bbOffset.
 * Holes are laid out with HOLE_SPACING = 0.05 across 63 columns:
 *   - Main top rows (a–e), main bottom rows (f–j)
 *   - Power rails (+T positive top, -T negative top, +B positive bot, -B negative bot)
 *
 * This module returns positions in *scene-group* coordinates (the same space
 * used by `posMap` in CircuitScene.jsx), so callers can feed the result
 * directly into a component `position` prop. The 1.2 breadboard-group offset
 * is baked into the X formula here; bbOffset is applied on top.
 *
 * Y is BOARD_Y = 0.035 (the visible top surface of the breadboard).
 *
 * Hole IDs are strings like:
 *   "h25"   → row h, column 25  (main bottom)
 *   "a12"   → row a, column 12  (main top)
 *   "+T30"  → top positive rail, column 30
 *   "-B15"  → bottom negative rail, column 15
 */

const HOLE_SPACING = 0.05;
const COLS = 63;
const BB_GROUP_X = 1.2; // scene-group X of the breadboard group origin

// Board surface Y (matches BOARD_Y in CircuitScene.jsx)
export const BOARD_Y = 0.035;

// Z positions per row, in breadboard-group local space (bbOffset = 0).
// Derived from BreadboardModel.jsx with gapZ = 0.04 and HOLE_SPACING = 0.05.
const ROW_Z = {
  // Main top half (a–e): z = -(0.04 + 5*0.05) + row*0.05 + 0.025
  a: -0.265,
  b: -0.215,
  c: -0.165,
  d: -0.115,
  e: -0.065,
  // Main bottom half (f–j): z = 0.04 + row*0.05 + 0.025
  f: 0.065,
  g: 0.115,
  h: 0.165,
  i: 0.215,
  j: 0.265,
  // Top power rails — positive nearer the main rows, negative further
  "+T": -0.350,
  "-T": -0.400,
  // Bottom power rails — positive nearer the main rows, negative further
  "+B": 0.350,
  "-B": 0.400,
};

// X offset of column 1 in scene-group space, before bbOffset.
// startX (breadboard-local) = -(63 * 0.05) / 2 = -1.575
// → scene-group X of col 1 = 1.2 + (-1.575) = -0.375
const SCENE_COL1_X = BB_GROUP_X - (COLS * HOLE_SPACING) / 2;

/**
 * Parse a hole ID into { row, col }.
 * Returns null if the ID is malformed or out of range.
 */
function parseHoleId(holeId) {
  if (typeof holeId !== "string" || holeId.length < 2) return null;

  // Power-rail IDs start with '+' or '-' (e.g. "+T30", "-B15")
  if (holeId[0] === "+" || holeId[0] === "-") {
    const row = holeId.slice(0, 2); // "+T", "-T", "+B", "-B"
    const col = parseInt(holeId.slice(2), 10);
    if (!(row in ROW_Z) || !Number.isFinite(col)) return null;
    return { row, col };
  }

  // Main-row IDs start with a letter a–j followed by column number
  const row = holeId[0];
  const col = parseInt(holeId.slice(1), 10);
  if (!(row in ROW_Z) || !Number.isFinite(col)) return null;
  return { row, col };
}

/**
 * Resolve a hole ID to scene-group [x, y, z] coordinates.
 * @param {string} holeId - e.g. "h25", "a12", "+T30", "-B15"
 * @param {{x?: number, z?: number}} [bbOffset] - optional breadboard drag offset
 * @returns {[number, number, number]} [x, y, z] in scene-group coords
 */
export function holeCoords(holeId, bbOffset = { x: 0, z: 0 }) {
  const parsed = parseHoleId(holeId);
  if (!parsed) {
    // Unknown hole — return breadboard centre as a safe fallback so the
    // component is at least visible and the caller can spot the bug.
    return [BB_GROUP_X + (bbOffset.x || 0), BOARD_Y, 0 + (bbOffset.z || 0)];
  }
  const { row, col } = parsed;
  const c = Math.max(1, Math.min(COLS, col));
  const x = SCENE_COL1_X + (c - 1) * HOLE_SPACING + (bbOffset.x || 0);
  const z = ROW_Z[row] + (bbOffset.z || 0);
  return [x, BOARD_Y, z];
}

/**
 * Centroid of a list of [x, y, z] coordinates.
 * Returns [0, BOARD_Y, 0] for an empty input.
 * @param {Array<[number, number, number]>} coordsArray
 * @returns {[number, number, number]}
 */
export function midpoint(coordsArray) {
  if (!Array.isArray(coordsArray) || coordsArray.length === 0) {
    return [0, BOARD_Y, 0];
  }
  let sx = 0, sy = 0, sz = 0;
  for (const c of coordsArray) {
    sx += c[0];
    sy += c[1];
    sz += c[2];
  }
  const n = coordsArray.length;
  return [sx / n, sy / n, sz / n];
}

// ── Breadboard electrical topology ──────────────────────────────────────────
// Rules:
//   - Main top half (rows a–e) — each column is internally shorted:
//       "a25", "b25", "c25", "d25", "e25"  → node "top:25"
//   - Main bottom half (rows f–j) — each column is internally shorted:
//       "f25", "g25", "h25", "i25", "j25"  → node "bot:25"
//   - The center gap separates top and bottom, so "top:25" and "bot:25"
//     are SEPARATE nodes.
//   - Power rails are one continuous node along the full strip:
//       "+T*"  → "+T",  "-T*" → "-T",  "+B*" → "+B",  "-B*" → "-B"
//   - The left and right halves of the SAME rail row (+T near the top main rows,
//     +B near the bottom main rows) are NOT the same node. +T ≠ +B; bridging
//     them requires an explicit jumper wire.

const TOP_ROWS = new Set(["a", "b", "c", "d", "e"]);
const BOT_ROWS = new Set(["f", "g", "h", "i", "j"]);
const POWER_RAILS = new Set(["+T", "-T", "+B", "-B"]);

/**
 * Returns the canonical node key for a hole, or null if the hole is invalid.
 *   "a25"  → "top:25"
 *   "h25"  → "bot:25"
 *   "+T30" → "+T"
 *   "-B15" → "-B"
 * @param {string} holeId
 * @returns {string | null}
 */
export function nodeKeyForHole(holeId) {
  const parsed = parseHoleId(holeId);
  if (!parsed) return null;
  const { row, col } = parsed;
  if (POWER_RAILS.has(row)) return row;
  if (TOP_ROWS.has(row)) return `top:${col}`;
  if (BOT_ROWS.has(row)) return `bot:${col}`;
  return null;
}

/**
 * Whether a hole sits on one of the four power rails (+T, -T, +B, -B).
 * @param {string} holeId
 * @returns {boolean}
 */
export function isOnPowerRail(holeId) {
  const parsed = parseHoleId(holeId);
  if (!parsed) return false;
  return POWER_RAILS.has(parsed.row);
}

/**
 * Validate a component's pin assignments against breadboard topology rules.
 *
 * Reports:
 *   - SHORT_CIRCUIT:    Two or more leads land on the same electrical node.
 *                       This shorts those leads together through the
 *                       breadboard's internal strip — almost always a bug.
 *   - POWER_RAIL_MISUSE: A lead sits on a power rail (+T/-T/+B/-B). This is
 *                       only valid for VCC_NODE / GROUND_NODE markers or for
 *                       jumper-wire endpoints; regular component leads on a
 *                       rail will be tied directly to V+ or GND.
 *
 * The caller decides which warnings apply: pass `componentType` to suppress
 * POWER_RAIL_MISUSE for VCC_NODE / GROUND_NODE, where rail placement is the
 * intended behaviour.
 *
 * @param {Record<string, string>} pinsObj  e.g. { t1: "h25", t2: "h29" }
 * @param {string} [componentType]          optional, suppresses rail warnings
 *                                          for power/ground node markers
 * @returns {Array<{
 *   type: "SHORT_CIRCUIT" | "POWER_RAIL_MISUSE",
 *   message: string,
 *   terminals?: string[],
 *   terminal?: string,
 * }>}
 */
export function validateComponentPins(pinsObj, componentType = null) {
  const violations = [];
  if (!pinsObj || typeof pinsObj !== "object") return violations;

  // Build node → terminals[] map for short-circuit detection.
  const nodeToTerms = new Map();
  for (const [term, hole] of Object.entries(pinsObj)) {
    if (typeof hole !== "string" || hole.length === 0) continue;
    const node = nodeKeyForHole(hole);
    if (!node) continue;
    if (!nodeToTerms.has(node)) nodeToTerms.set(node, []);
    nodeToTerms.get(node).push(term);
  }

  // SHORT_CIRCUIT: any node with ≥2 terminals on it.
  for (const [node, terms] of nodeToTerms.entries()) {
    if (terms.length >= 2) {
      violations.push({
        type: "SHORT_CIRCUIT",
        message: `Both leads in same node (${node})`,
        terminals: terms,
      });
    }
  }

  // POWER_RAIL_MISUSE: regular components shouldn't have leads on a rail.
  // VCC_NODE / GROUND_NODE markers are exempt — that's literally their job.
  const isPowerMarker =
    componentType === "VCC_NODE" || componentType === "GROUND_NODE";
  if (!isPowerMarker) {
    for (const [term, hole] of Object.entries(pinsObj)) {
      if (typeof hole !== "string" || hole.length === 0) continue;
      if (isOnPowerRail(hole)) {
        const railNode = nodeKeyForHole(hole);
        violations.push({
          type: "POWER_RAIL_MISUSE",
          message: `Component lead on power rail (${railNode})`,
          terminal: term,
        });
      }
    }
  }

  return violations;
}

export default {
  holeCoords,
  midpoint,
  BOARD_Y,
  nodeKeyForHole,
  isOnPowerRail,
  validateComponentPins,
};
