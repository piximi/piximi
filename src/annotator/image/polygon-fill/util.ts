// Code from: https://github.com/kamoroso94/polygon-fill-benchmark

// linear interpolation
// finds x-value from scanline intersecting edge
export function lerp(
  yScan: number,
  [[x1, y1], [x2, y2]]: Array<Array<number>>
) {
  return Math.floor(((yScan - y1) / (y2 - y1)) * (x2 - x1) + x1);
}

// returns minimum y-value of two points
export function getYMin([[, y1], [, y2]]: Array<Array<number>>) {
  return y1 <= y2 ? y1 : y2;
}

// returns maximum y-value of two points
export function getYMax([[, y1], [, y2]]: Array<Array<number>>) {
  return y1 > y2 ? y1 : y2;
}

// returns the x-value of the point with the minimum y-value
export function getXofYMin([[x1, y1], [x2, y2]]: Array<Array<number>>) {
  return y1 <= y2 ? x1 : x2;
}

// returns the x-value of the point with the maximum y-value
export function getXofYMax([[x1, y1], [x2, y2]]: Array<Array<number>>) {
  return y1 > y2 ? x1 : x2;
}

// converts list of points to list of non-horizontal edges
export function pointsToEdges(points: Array<Array<number>>) {
  let edges = [];
  let p1 = points[points.length - 1];
  for (let i = 0; i < points.length; i++) {
    const p2 = points[i];
    // ignore horizontal edges
    if (p1[1] != p2[1]) edges.push([p1, p2]);
    p1 = p2;
  }
  return edges;
}
