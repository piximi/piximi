// to suit your point format, run search/replace for '.x' and '.y';
// for 3D version, see 3d branch (configurability would draw significant performance overhead)

type Point = {
  x: number;
  y: number;
};

// square distance between 2 points
const getSqDist = (p1: Point, p2: Point) => {
  const dx = p1.x - p2.x;
  const dy = p1.y - p2.y;

  return dx * dx + dy * dy;
};

// square distance from a point to a segment
const getSqSegDist = (p: Point, p1: Point, p2: Point) => {
  let x = p1.x;
  let y = p1.y;
  let dx = p2.x - x;
  let dy = p2.y - y;

  if (dx !== 0 || dy !== 0) {
    const t = ((p.x - x) * dx + (p.y - y) * dy) / (dx * dx + dy * dy);

    if (t > 1) {
      x = p2.x;
      y = p2.y;
    } else if (t > 0) {
      x += dx * t;
      y += dy * t;
    }
  }

  dx = p.x - x;
  dy = p.y - y;

  return dx * dx + dy * dy;
};
// rest of the code doesn't care about point format

// basic distance-based simplification
function simplifyRadialDist(points: Array<Point>, sqTolerance: number) {
  let prevPoint = points[0];
  let newPoints = [prevPoint];
  let point;

  for (let i = 1, len = points.length; i < len; i++) {
    point = points[i];

    if (getSqDist(point, prevPoint) > sqTolerance) {
      newPoints.push(point);
      prevPoint = point;
    }
  }

  if (point && prevPoint !== point) {
    newPoints.push(point);
  }

  return newPoints;
}

const simplifyDPStep = (
  points: Array<Point>,
  first: number,
  last: number,
  sqTolerance: number,
  simplified: any[]
) => {
  let maxSqDist = sqTolerance;
  let index;

  for (let i = first + 1; i < last; i++) {
    const sqDist = getSqSegDist(points[i], points[first], points[last]);

    if (sqDist > maxSqDist) {
      index = i;
      maxSqDist = sqDist;
    }
  }

  if (index && maxSqDist > sqTolerance) {
    if (index - first > 1) {
      simplifyDPStep(points, first, index, sqTolerance, simplified);
    }

    simplified.push(points[index]);

    if (last - index > 1) {
      simplifyDPStep(points, index, last, sqTolerance, simplified);
    }
  }
};

// simplification using Ramer-Douglas-Peucker algorithm
const simplifyDouglasPeucker = (points: Array<Point>, sqTolerance: number) => {
  const last = points.length - 1;

  const simplified = [points[0]];
  simplifyDPStep(points, 0, last, sqTolerance, simplified);
  simplified.push(points[last]);

  return simplified;
};

// both algorithms combined for awesome performance
export const simplify = (
  points: Array<Point>,
  tolerance: number = 1,
  highestQuality: boolean
) => {
  if (points.length <= 2) return points;

  const sqTolerance = tolerance * tolerance;

  points = highestQuality ? points : simplifyRadialDist(points, sqTolerance);
  points = simplifyDouglasPeucker(points, sqTolerance);

  return points;
};
