import { Edge, Point } from "utils/types";

export const pointsAreEqual = (p1: Point, p2: Point) => {
  return p1.x === p2.x && p1.y === p2.y;
};

export const getDistance = (p1: Point, p2: Point) => {
  return Math.hypot(p1.x - p2.x, p1.y - p2.y);
};

// returns minimum y-value of two points
export function getYMin(edge: Edge) {
  return edge.p1.y <= edge.p2.y ? edge.p1.y : edge.p2.y;
}

// returns maximum y-value of two points
export function getYMax(edge: Edge) {
  return edge.p1.y > edge.p2.y ? edge.p1.y : edge.p2.y;
}

// returns the x-value of the point with the minimum y-value
export function getXofYMin(edge: Edge) {
  return edge.p1.y <= edge.p2.y ? edge.p1.x : edge.p2.x;
}

// returns the x-value of the point with the maximum y-value
export function getXofYMax(edge: Edge) {
  return edge.p1.y > edge.p2.y ? edge.p1.x : edge.p2.x;
}

// converts list of points to list of non-horizontal edges
export function pointsToEdges(points: Array<Point>) {
  const edges: Array<Edge> = [];
  let p1 = points.at(-1)!;
  for (let i = 0; i < points.length; i++) {
    const p2 = points[i];
    // ignore horizontal edges
    if (p1.y !== p2.y) edges.push({ p1: p1, p2: p2 });
    p1 = p2;
  }
  return edges;
}

// linear interpolation
// finds x-value from scanline intersecting edge
export function interpolateX(yScan: number, edge: Edge) {
  const y1 = edge.p1.y;
  const y2 = edge.p2.y;
  const x1 = edge.p1.x;
  const x2 = edge.p2.x;
  return Math.floor(((yScan - y1) / (y2 - y1)) * (x2 - x1) + x1);
}

export const fromIdxToCoord = (idx: number, width: number) => {
  const row = Math.floor(idx / width);
  const col = idx - row * width;
  return { x: col, y: row };
};
