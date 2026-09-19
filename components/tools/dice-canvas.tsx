"use client";

import * as React from "react";

/**
 * Canvas dice: a small 3D renderer, no dependencies.
 *
 * Each die is a real polyhedron (d4 tetrahedron, d6 cube, d8 octahedron,
 * d10 pentagonal trapezohedron, d12 dodecahedron, d20 icosahedron) drawn with
 * perspective projection, flat sticker fills, ink edges and painted markings.
 * A die rests with the rolled face towards the camera and its marking at full
 * ink, the neighbours faded. The d4 is the exception: like a real one it sits
 * point-up and is read at the top corner.
 *
 * Faces come from a generic convex-hull pass over each solid's vertices, and
 * orientation is a quaternion, so a throw is a slerp from where the die last
 * stopped to the orientation that shows the rolled face, times an unwinding
 * spin about a random axis for the tumble.
 */

type Vec3 = [number, number, number];
/** Quaternion as [x, y, z, w]. */
type Quat = [number, number, number, number];

const PHI = (1 + Math.sqrt(5)) / 2;

const sub = (a: Vec3, b: Vec3): Vec3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const scaled = (a: Vec3, k: number): Vec3 => [a[0] * k, a[1] * k, a[2] * k];
const dot = (a: Vec3, b: Vec3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a: Vec3, b: Vec3): Vec3 => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
];
const length = (a: Vec3) => Math.sqrt(dot(a, a));
const unit = (a: Vec3): Vec3 => scaled(a, 1 / (length(a) || 1));
const centroid = (pts: Vec3[]): Vec3 =>
  scaled(
    pts.reduce<Vec3>((sum, p) => [sum[0] + p[0], sum[1] + p[1], sum[2] + p[2]], [0, 0, 0]),
    1 / pts.length,
  );

function qmul(a: Quat, b: Quat): Quat {
  const [ax, ay, az, aw] = a;
  const [bx, by, bz, bw] = b;
  return [
    aw * bx + ax * bw + ay * bz - az * by,
    aw * by - ax * bz + ay * bw + az * bx,
    aw * bz + ax * by - ay * bx + az * bw,
    aw * bw - ax * bx - ay * by - az * bz,
  ];
}

function qAxis(axis: Vec3, angle: number): Quat {
  const [x, y, z] = unit(axis);
  const s = Math.sin(angle / 2);
  return [x * s, y * s, z * s, Math.cos(angle / 2)];
}

/** Shortest rotation taking unit vector `from` to unit vector `to`. */
function qBetween(from: Vec3, to: Vec3): Quat {
  const d = dot(from, to);
  if (d > 0.999999) return [0, 0, 0, 1];
  if (d < -0.999999) {
    // Opposite: any perpendicular axis, half a turn.
    const axis = Math.abs(from[0]) < 0.9 ? cross(from, [1, 0, 0]) : cross(from, [0, 1, 0]);
    return qAxis(axis, Math.PI);
  }
  const c = cross(from, to);
  return normalizeQ([c[0], c[1], c[2], 1 + d]);
}

function normalizeQ(q: Quat): Quat {
  const n = Math.hypot(q[0], q[1], q[2], q[3]) || 1;
  return [q[0] / n, q[1] / n, q[2] / n, q[3] / n];
}

function qSlerp(a: Quat, b: Quat, t: number): Quat {
  let [bx, by, bz, bw] = b;
  let cosine = a[0] * bx + a[1] * by + a[2] * bz + a[3] * bw;
  if (cosine < 0) {
    bx = -bx; by = -by; bz = -bz; bw = -bw;
    cosine = -cosine;
  }
  if (cosine > 0.9995) {
    return normalizeQ([
      a[0] + (bx - a[0]) * t,
      a[1] + (by - a[1]) * t,
      a[2] + (bz - a[2]) * t,
      a[3] + (bw - a[3]) * t,
    ]);
  }
  const theta = Math.acos(cosine);
  const s = Math.sin(theta);
  const wa = Math.sin((1 - t) * theta) / s;
  const wb = Math.sin(t * theta) / s;
  return [a[0] * wa + bx * wb, a[1] * wa + by * wb, a[2] * wa + bz * wb, a[3] * wa + bw * wb];
}

function qRotate(q: Quat, v: Vec3): Vec3 {
  const [x, y, z, w] = q;
  const tx = 2 * (y * v[2] - z * v[1]);
  const ty = 2 * (z * v[0] - x * v[2]);
  const tz = 2 * (x * v[1] - y * v[0]);
  return [
    v[0] + w * tx + (y * tz - z * ty),
    v[1] + w * ty + (z * tx - x * tz),
    v[2] + w * tz + (x * ty - y * tx),
  ];
}

interface Face {
  indices: number[];
  /** Outward unit normal in the solid's own frame. */
  normal: Vec3;
  centre: Vec3;
  /** In-plane basis, used for pips, numbers and glyph orientation. */
  u: Vec3;
  v: Vec3;
  /** Distance from the face centre to its nearest edge. */
  inradius: number;
  /** Half the length of the first edge: the unit d6 pips are laid out in. */
  halfEdge: number;
  value: number;
}

interface Solid {
  vertices: Vec3[];
  faces: Face[];
  /**
   * Set for the d4 only: it is read at the top corner, not on a face, so each
   * vertex carries a value (index + 1) and every face shows its three corners.
   */
  cornerRead: boolean;
}

/**
 * Faces of the convex hull of `vertices`, each ordered counter-clockwise seen
 * from outside. Every vertex triple spans a candidate plane; it is a face when
 * no vertex lies outside it. Fine at these sizes (at most 20 vertices) and it
 * means no hand-written face tables to get wrong.
 */
function hullFaces(vertices: Vec3[]): number[][] {
  const found = new Map<string, number[]>();
  const n = vertices.length;
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      for (let k = j + 1; k < n; k++) {
        const a = vertices[i]!;
        const raw = cross(sub(vertices[j]!, a), sub(vertices[k]!, a));
        if (length(raw) < 1e-9) continue;
        let normal = unit(raw);
        let offset = dot(normal, a);
        if (offset < 0) {
          normal = scaled(normal, -1);
          offset = -offset;
        }
        if (vertices.some((p) => dot(normal, p) > offset + 1e-7)) continue;
        // Round for the key, and fold -0 into 0 or each face is found twice.
        const key = normal
          .map((x) => {
            const t = x.toFixed(6);
            return t === "-0.000000" ? "0.000000" : t;
          })
          .join(",");
        if (found.has(key)) continue;
        const on = vertices
          .map((p, index) => [index, dot(normal, p)] as const)
          .filter(([, d]) => Math.abs(d - offset) < 1e-7)
          .map(([index]) => index);
        const centre = centroid(on.map((index) => vertices[index]!));
        const u = unit(sub(vertices[on[0]!]!, centre));
        const w = cross(normal, u);
        on.sort((p, q) => {
          const pa = sub(vertices[p]!, centre);
          const pb = sub(vertices[q]!, centre);
          return Math.atan2(dot(pa, w), dot(pa, u)) - Math.atan2(dot(pb, w), dot(pb, u));
        });
        found.set(key, on);
      }
    }
  }
  return [...found.values()];
}

function cyclic(a: number, b: number): Vec3[] {
  return [
    [0, a, b],
    [a, b, 0],
    [b, 0, a],
  ];
}

function signedCyclic(a: number, b: number): Vec3[] {
  const out: Vec3[] = [];
  for (const sa of [a, -a]) for (const sb of [b, -b]) out.push(...cyclic(sa, sb));
  return out;
}

function cubeVertices(): Vec3[] {
  const out: Vec3[] = [];
  for (const x of [1, -1]) for (const y of [1, -1]) for (const z of [1, -1]) out.push([x, y, z]);
  return out;
}

/**
 * The d10 shape: two apexes over two rings of five, offset by half a step.
 * The apex height is not free: it is the one that makes the kite faces planar,
 * found by bisecting the coplanarity residual. The ring offset is chosen so the
 * die comes out about as tall as it is wide, like a real d10.
 */
function trapezohedronVertices(ringY = 0.13): Vec3[] {
  const ring = (y: number, offset: number): Vec3[] =>
    Array.from({ length: 5 }, (_, i) => {
      const a = ((i * 72 + offset) * Math.PI) / 180;
      return [Math.cos(a), y, Math.sin(a)] as Vec3;
    });
  const upper = ring(ringY, 0);
  const lower = ring(-ringY, 36);
  const residual = (c: number) => {
    const apex: Vec3 = [0, c, 0];
    return dot(sub(upper[0]!, apex), cross(sub(upper[1]!, apex), sub(lower[0]!, apex)));
  };
  let lo = ringY + 1e-9;
  let hi = 40;
  for (let s = 0; s < 120; s++) {
    const mid = (lo + hi) / 2;
    if (residual(lo) * residual(mid) <= 0) hi = mid;
    else lo = mid;
  }
  const apexY = (lo + hi) / 2;
  return [[0, apexY, 0], [0, -apexY, 0], ...upper, ...lower];
}

/** Raw vertices per die, plus a size nudge so the solids look like a matching set. */
const SHAPES: Record<number, { vertices: () => Vec3[]; scale: number; sink?: number }> = {
  // Sits point-up, so its base is well above the bounding sphere: sink it to the ground.
  4: { vertices: () => [[1, 1, 1], [1, -1, -1], [-1, 1, -1], [-1, -1, 1]], scale: 1.3, sink: 0.36 },
  6: { vertices: cubeVertices, scale: 1.1 },
  8: { vertices: () => [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]], scale: 1.12 },
  10: { vertices: () => trapezohedronVertices(), scale: 1 },
  12: { vertices: () => [...cubeVertices(), ...signedCyclic(1 / PHI, PHI)], scale: 1 },
  20: { vertices: () => signedCyclic(1, PHI), scale: 1 },
};

/** Distance from a face centre to its nearest edge, in the face plane. */
function faceInradius(points: Vec3[], centre: Vec3) {
  let min = Infinity;
  for (let i = 0; i < points.length; i++) {
    const a = points[i]!;
    const b = points[(i + 1) % points.length]!;
    const edge = sub(b, a);
    const t = Math.max(0, Math.min(1, dot(sub(centre, a), edge) / dot(edge, edge)));
    min = Math.min(min, length(sub(centre, [a[0] + edge[0] * t, a[1] + edge[1] * t, a[2] + edge[2] * t])));
  }
  return min;
}

/** Values 1..n, with opposite faces summing to n + 1 where the solid has them. */
function assignValues(faces: { normal: Vec3 }[]) {
  const values = new Array<number>(faces.length).fill(0);
  let next = 1;
  for (let i = 0; i < faces.length; i++) {
    if (values[i]) continue;
    const opposite = faces.findIndex(
      (f, j) => j !== i && !values[j] && dot(f.normal, faces[i]!.normal) < -0.999,
    );
    values[i] = next;
    if (opposite >= 0) values[opposite] = faces.length + 1 - next;
    next++;
  }
  return values;
}

const solidCache = new Map<number, Solid>();

function getSolid(sides: number): Solid {
  const cached = solidCache.get(sides);
  if (cached) return cached;

  const shape = SHAPES[sides] ?? SHAPES[6]!;
  const raw = shape.vertices();
  // Uniform scale only: scaling vertices individually would bend the d10's faces.
  const longest = Math.max(...raw.map(length));
  const vertices = raw.map((v) => scaled(v, shape.scale / longest));

  const bare = hullFaces(vertices).map((indices) => {
    const points = indices.map((i) => vertices[i]!);
    const centre = centroid(points);
    const normal = unit(centre);
    // Along the first edge, not out to a corner: markings then sit square to an
    // edge (a cube face upright, a triangle's apex up), as on a real die.
    let u = unit(sub(points[1]!, points[0]!));
    let v = cross(normal, u);
    // An irregular face (the d10's kite) stands on its symmetry axis instead,
    // sharp corner up, or the whole kite leans once the glyph is upright.
    const reach = points.map((p) => length(sub(p, centre)));
    const far = Math.max(...reach);
    if (far - Math.min(...reach) > 1e-6) {
      v = unit(sub(points[reach.indexOf(far)]!, centre));
      u = cross(v, normal);
    }
    return {
      indices,
      normal,
      centre,
      u,
      v,
      inradius: faceInradius(points, centre),
      halfEdge: length(sub(points[1]!, points[0]!)) / 2,
    };
  });

  const values = assignValues(bare);
  const solid: Solid = {
    vertices,
    faces: bare.map((face, i) => ({ ...face, value: values[i] ?? i + 1 })),
    cornerRead: sides === 4,
  };
  solidCache.set(sides, solid);
  return solid;
}

/** d6 pips, in units of half an edge. */
const PIPS: Record<number, [number, number][]> = {
  1: [[0, 0]],
  2: [[-0.45, 0.45], [0.45, -0.45]],
  3: [[-0.45, 0.45], [0, 0], [0.45, -0.45]],
  4: [[-0.45, 0.45], [0.45, 0.45], [-0.45, -0.45], [0.45, -0.45]],
  5: [[-0.45, 0.45], [0.45, 0.45], [0, 0], [-0.45, -0.45], [0.45, -0.45]],
  6: [[-0.45, 0.5], [-0.45, 0], [-0.45, -0.5], [0.45, 0.5], [0.45, 0], [0.45, -0.5]],
};

/** Camera distance in die radii: lower is a wider, more obvious perspective. */
const FOCAL = 5;
/**
 * A fixed turn away from square, so a die reads as a solid rather than a badge.
 * The positive pitch tips the top towards the camera: we look down on the dice,
 * which is what the ground shadow and the light from above both imply.
 */
const VIEW: Quat = qmul(qAxis([1, 0, 0], (13 * Math.PI) / 180), qAxis([0, 1, 0], (-21 * Math.PI) / 180));
const LIGHT: Vec3 = unit([-0.4, 0.8, 0.5]);
const SPIN_MS = 1000;
/** The d4 rests on a face with the rolled corner up, seen from further round and above. */
const VIEW_D4: Quat = qmul(qAxis([1, 0, 0], (24 * Math.PI) / 180), qAxis([0, 1, 0], (-40 * Math.PI) / 180));
/**
 * Every visible face is marked. The ink fades in between these two values of
 * the face normal's z, so a glyph never pops in edge-on at the silhouette.
 */
const FACING: [number, number] = [0.16, 0.36];
const FACING_D4: [number, number] = [0.32, 0.5];
/** Ink strength of markings that are not the rolled value, once the die is at rest. */
const BYSTANDER = 0.42;
/**
 * A d4 face shows one number: the corner currently highest on screen, which is
 * how a d4 is read. A corner within this height (in die radii) of the top one is
 * cross-faded in, so the number hands over smoothly as the die tumbles.
 */
const CORNER_BAND = 0.3;

function easeOut(t: number) {
  return 1 - Math.pow(1 - t, 3);
}

/** One big hop plus a small second bounce, landing exactly at zero. */
function hopAt(t: number) {
  return Math.abs(Math.sin(Math.PI * t * 1.62)) * (1 - t);
}

function readVar(name: string, fallback: string) {
  if (typeof window === "undefined") return fallback;
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return value || fallback;
}

/** The orientation that rests `value`'s face towards the camera, upright. */
function restQuat(solid: Solid, value: number): Quat {
  if (solid.cornerRead) {
    const top = Math.min(solid.vertices.length, Math.max(1, value)) - 1;
    const align = qBetween(unit(solid.vertices[top]!), [0, 1, 0]);
    // Swing one of the faces under that corner round to the camera.
    const front = solid.faces.find((f) => f.indices.includes(top)) ?? solid.faces[0]!;
    const n = qRotate(align, front.normal);
    const yaw = qAxis([0, 1, 0], -Math.atan2(n[0], n[2]));
    return normalizeQ(qmul(VIEW_D4, qmul(yaw, align)));
  }
  const face = solid.faces.find((f) => f.value === value) ?? solid.faces[0]!;
  const align = qBetween(face.normal, [0, 0, 1]);
  // Turn about the view axis so the face's own basis stands upright on screen:
  // u must point right and v (= n × u) then points up.
  const u = qRotate(align, face.u);
  const twist = qAxis([0, 0, 1], -Math.atan2(u[1], u[0]));
  return normalizeQ(qmul(VIEW, qmul(twist, align)));
}

export interface DieSpec {
  value: number;
  /** CSS custom property holding the sticker fill, e.g. "--sticker-yellow". */
  tint: string;
}

interface DieState {
  q: Quat;
  from: Quat;
  to: Quat;
  spinAxis: Vec3;
  spins: number;
  start: number;
  duration: number;
  /** Hop height as a multiple of the die size, clamped to the tray at draw time. */
  hop: number;
}

function restingState(solid: Solid, value: number): DieState {
  const q = restQuat(solid, value);
  return { q, from: q, to: q, spinAxis: [0, 1, 0], spins: 0, start: 0, duration: 0, hop: 0 };
}

function randomAxis(): Vec3 {
  const z = Math.random() * 2 - 1;
  const a = Math.random() * Math.PI * 2;
  const r = Math.sqrt(1 - z * z);
  return [Math.cos(a) * r, Math.sin(a) * r, z];
}

export function DiceCanvas({
  dice,
  sides,
  rollId,
  animate,
  onSettled,
  className,
}: {
  dice: DieSpec[];
  sides: number;
  /** Bumped by the parent to start a throw; 0 renders the dice at rest. */
  rollId: number;
  animate: boolean;
  onSettled?: () => void;
  className?: string;
}) {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const states = React.useRef<DieState[]>([]);
  const frame = React.useRef<number | null>(null);
  const restart = React.useRef<() => void>(() => {});
  const lastRoll = React.useRef(rollId);
  const lastSides = React.useRef(sides);
  const settled = React.useRef(onSettled);

  // Everything the draw loop needs, kept in a ref so frames never re-render.
  const scene = React.useRef({ dice, sides });

  React.useEffect(() => {
    settled.current = onSettled;
    scene.current = { dice, sides };
  }, [onSettled, dice, sides]);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const ink = readVar("--foreground", "#2a2723");
    // canvas fonts cannot parse var(), so resolve the heading family up front.
    const headingFont = `${readVar("--font-heading", "system-ui")}, system-ui, sans-serif`;
    const tints = new Map<string, string>();
    const tintOf = (name: string) => {
      const cached = tints.get(name);
      if (cached) return cached;
      const resolved = readVar(name, "#ffd166");
      tints.set(name, resolved);
      return resolved;
    };

    function size() {
      const rect = canvas!.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas!.width = Math.round(rect.width * dpr);
      canvas!.height = Math.round(rect.height * dpr);
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      return rect;
    }

    let rect = size();

    /** A glyph lying in a face: `right` and `up` are its axes, `height` in die radii. */
    function paintGlyph(
      text: string,
      project: (p: Vec3) => [number, number, number],
      at: Vec3,
      right: Vec3,
      up: Vec3,
      height: number,
    ) {
      // Map the face's own axes, then work at 100× so the font size is a sane
      // pixel value rather than a fraction browsers round away.
      const [ox, oy] = project(at);
      const [ux, uy] = project([at[0] + right[0], at[1] + right[1], at[2] + right[2]]);
      const [vx, vy] = project([at[0] + up[0], at[1] + up[1], at[2] + up[2]]);
      ctx!.save();
      ctx!.transform(ux - ox, uy - oy, vx - ox, vy - oy, ox, oy);
      ctx!.scale(0.01, -0.01);
      ctx!.textAlign = "center";
      ctx!.textBaseline = "middle";
      ctx!.font = `800 ${Math.round(height * 100)}px ${headingFont}`;
      ctx!.fillText(text, 0, 0);
      ctx!.restore();
    }

    /** `calm` runs 0 → 1 as the die comes to rest: it singles out the rolled value. */
    function drawDie(
      spec: DieSpec,
      state: DieState,
      cx: number,
      groundY: number,
      radius: number,
      lift: number,
      calm: number,
    ) {
      const sides = scene.current.sides;
      const solid = getSolid(sides);
      const cy = groundY - radius * (1 - (SHAPES[sides]?.sink ?? 0)) - lift;
      const project = (p: Vec3): [number, number, number] => {
        const k = FOCAL / (FOCAL - p[2]);
        return [cx + p[0] * radius * k, cy - p[1] * radius * k, k];
      };

      // Contact shadow: tightens and darkens as the die comes down.
      const close = 1 - Math.min(1, lift / (radius * 2.4));
      ctx!.save();
      ctx!.globalAlpha = 0.1 + close * 0.16;
      ctx!.fillStyle = ink;
      ctx!.beginPath();
      ctx!.ellipse(
        cx + radius * 0.24,
        groundY + radius * 0.16,
        radius * (0.72 + (1 - close) * 0.4),
        radius * 0.2,
        0,
        0,
        Math.PI * 2,
      );
      ctx!.fill();
      ctx!.restore();

      const visible = solid.faces
        .map((face) => ({
          face,
          normal: qRotate(state.q, face.normal),
          centre: qRotate(state.q, face.centre),
          u: qRotate(state.q, face.u),
          v: qRotate(state.q, face.v),
        }))
        // Seen from the camera point, not along z: under perspective the two differ
        // near the silhouette, and the z test drops faces that are still in view.
        .filter((f) => dot(f.normal, [-f.centre[0], -f.centre[1], FOCAL - f.centre[2]]) > 1e-4);

      visible.sort((a, b) => a.centre[2] - b.centre[2]);

      for (const { face, normal, centre, u, v } of visible) {
        ctx!.beginPath();
        face.indices.forEach((index, i) => {
          const [px, py] = project(qRotate(state.q, solid.vertices[index]!));
          if (i === 0) ctx!.moveTo(px, py);
          else ctx!.lineTo(px, py);
        });
        ctx!.closePath();

        ctx!.fillStyle = tintOf(spec.tint);
        ctx!.fill();

        // Flat shading: one translucent wash instead of recomputing the colour.
        const lit = dot(normal, LIGHT);
        ctx!.fillStyle = lit > 0 ? `rgba(255,255,255,${0.16 * lit})` : `rgba(0,0,0,${0.22 * -lit})`;
        ctx!.fill();

        ctx!.lineWidth = Math.max(1.4, radius * 0.055);
        ctx!.lineJoin = "round";
        ctx!.strokeStyle = ink;
        ctx!.stroke();

        // A d4 corner number sits in the narrow tip, where a glancing face only smears it.
        const [from, full] = solid.cornerRead ? FACING_D4 : FACING;
        const facing = Math.min(1, Math.max(0, (normal[2] - from) / (full - from)));
        if (facing <= 0) continue;
        const inkFor = (value: number) =>
          facing * (value === spec.value ? 1 : 1 - (1 - BYSTANDER) * calm);

        ctx!.save();
        ctx!.fillStyle = ink;
        if (solid.cornerRead) {
          const corners = face.indices.map((index) => qRotate(state.q, solid.vertices[index]!));
          const top = Math.max(...corners.map((c) => c[1]));
          for (const [i, index] of face.indices.entries()) {
            const strength = 1 - (top - corners[i]![1]) / CORNER_BAND;
            if (strength <= 0) continue;
            const out = sub(corners[i]!, centre);
            const up = unit(out);
            ctx!.globalAlpha = facing * strength;
            paintGlyph(
              String(index + 1),
              project,
              [centre[0] + out[0] * 0.4, centre[1] + out[1] * 0.4, centre[2] + out[2] * 0.4],
              cross(up, normal),
              up,
              face.inradius * 0.98,
            );
          }
        } else if (sides === 6) {
          ctx!.globalAlpha = inkFor(face.value);
          for (const [pu, pv] of PIPS[face.value] ?? []) {
            const point: Vec3 = [
              centre[0] + u[0] * pu * face.halfEdge + v[0] * pv * face.halfEdge,
              centre[1] + u[1] * pu * face.halfEdge + v[1] * pv * face.halfEdge,
              centre[2] + u[2] * pu * face.halfEdge + v[2] * pv * face.halfEdge,
            ];
            // Drawn in the face's own plane, so a pip on a side face is an ellipse
            // that stays inside it rather than a screen-space circle that spills out.
            const [ox, oy] = project(point);
            const [ux, uy] = project([point[0] + u[0], point[1] + u[1], point[2] + u[2]]);
            const [vx, vy] = project([point[0] + v[0], point[1] + v[1], point[2] + v[2]]);
            ctx!.save();
            ctx!.transform(ux - ox, uy - oy, vx - ox, vy - oy, ox, oy);
            ctx!.beginPath();
            ctx!.arc(0, 0, face.halfEdge * 0.2, 0, Math.PI * 2);
            ctx!.fill();
            ctx!.restore();
          }
        } else {
          ctx!.globalAlpha = inkFor(face.value);
          paintGlyph(String(face.value), project, centre, u, v, face.inradius * 1.2);
        }
        ctx!.restore();
      }
    }

    function draw(now: number) {
      const { dice: specs } = scene.current;
      ctx!.clearRect(0, 0, rect.width, rect.height);

      const count = Math.max(1, specs.length);
      const radius = Math.min(rect.height * 0.26, (rect.width / count) * 0.36, 78);
      const spacing = radius * 2.5;
      const groundY = rect.height * 0.66;
      // Cap the hop so a die can never clip through the top of the tray.
      const headroom = Math.max(0, groundY - radius * 2.6);
      const startX = rect.width / 2 - ((count - 1) * spacing) / 2;

      let busy = false;
      specs.forEach((spec, i) => {
        const state = states.current[i];
        if (!state) return;
        let lift = 0;
        let calm = 1;
        if (state.duration > 0) {
          const t = Math.min(1, Math.max(0, (now - state.start) / state.duration));
          const e = easeOut(t);
          state.q = normalizeQ(
            qmul(qSlerp(state.from, state.to, e), qAxis(state.spinAxis, 2 * Math.PI * state.spins * (1 - e))),
          );
          lift = Math.min(hopAt(t) * state.hop * radius, headroom);
          // Only over the last stretch, so nothing is given away mid-tumble.
          calm = Math.min(1, Math.max(0, (t - 0.7) / 0.3));
          if (t >= 1) {
            state.duration = 0;
            state.q = state.to;
          } else {
            busy = true;
          }
        }
        drawDie(spec, state, startX + i * spacing, groundY, radius, lift, calm);
      });

      if (busy) {
        frame.current = requestAnimationFrame(draw);
      } else {
        frame.current = null;
        settled.current?.();
      }
    }

    function redraw() {
      if (frame.current === null) frame.current = requestAnimationFrame(draw);
    }

    restart.current = redraw;

    const observer = new ResizeObserver(() => {
      rect = size();
      redraw();
    });
    observer.observe(canvas);
    redraw();

    return () => {
      observer.disconnect();
      restart.current = () => {};
      if (frame.current !== null) cancelAnimationFrame(frame.current);
      frame.current = null;
    };
  }, []);

  // Set up the throw whenever the parent bumps rollId (or the tray changes).
  React.useEffect(() => {
    const solid = getSolid(sides);
    const now = performance.now();
    // Only a new rollId is a throw: adding or removing dice just re-lays the tray.
    const thrown = rollId !== lastRoll.current;
    lastRoll.current = rollId;
    const reshaped = sides !== lastSides.current;
    lastSides.current = sides;

    states.current = dice.map((spec, i) => {
      const previous = states.current[i];
      // Re-laying the tray mid-throw leaves the dice already in the air alone.
      if (previous && previous.duration > 0 && !thrown && !reshaped && animate) return previous;
      if (!previous || !animate || !thrown || rollId === 0) return restingState(solid, spec.value);
      return {
        q: previous.q,
        from: previous.q,
        to: restQuat(solid, spec.value),
        spinAxis: randomAxis(),
        spins: 2 + Math.floor(Math.random() * 2),
        start: now + i * 55,
        duration: SPIN_MS + i * 45,
        hop: 0.9 + Math.random() * 0.6,
      };
    });
    restart.current();
  }, [dice, sides, rollId, animate]);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      role="img"
      aria-label={`${dice.length} d${sides} showing ${dice.map((d) => d.value).join(", ")}`}
    />
  );
}
