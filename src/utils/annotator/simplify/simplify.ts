/*
 © 2013, Vladimir Agafonkin. Released under BSD license.
 Simplify.js, a high-performance JS polyline simplification library
 mourner.github.io/simplify-js
*/

// square distance between 2 points
function getSqDist(p1: Array<number>, p2: Array<number>) {
  var dx = p1[0] - p2[0],
    dy = p1[1] - p2[1];

  return dx * dx + dy * dy;
}

// square distance from a point to a segment
function getSqSegDist(p: Array<number>, p1: Array<number>, p2: Array<number>) {
  var x = p1[0],
    y = p1[1],
    dx = p2[0] - x,
    dy = p2[1] - y;

  if (dx !== 0 || dy !== 0) {
    var t = ((p[0] - x) * dx + (p[1] - y) * dy) / (dx * dx + dy * dy);

    if (t > 1) {
      x = p2[0];
      y = p2[1];
    } else if (t > 0) {
      x += dx * t;
      y += dy * t;
    }
  }

  dx = p[0] - x;
  dy = p[1] - y;

  return dx * dx + dy * dy;
}

// basic distance-based simplification
function simplifyRadialDist(points: Array<Array<number>>, sqTolerance: number) {
  var prevPoint = points[0];
  var newPoints = [prevPoint];
  var point: Array<number> = [];

  for (var i = 1, len = points.length; i < len; i++) {
    point = points[i];

    if (getSqDist(point, prevPoint) > sqTolerance) {
      newPoints.push(point);
      prevPoint = point;
    }
  }

  if (prevPoint !== point) newPoints.push(point);

  return newPoints;
}

function simplifyDPStep(
  points: Array<Array<number>>,
  first: number,
  last: number,
  sqTolerance: number,
  simplified: Array<Array<number>>
) {
  let maxSqDist = sqTolerance;
  let index: number = 0;

  for (var i = first + 1; i < last; i++) {
    var sqDist = getSqSegDist(points[i], points[first], points[last]);

    if (sqDist > maxSqDist) {
      index = i;
      maxSqDist = sqDist;
    }
  }

  if (maxSqDist > sqTolerance) {
    if (index - first > 1)
      simplifyDPStep(points, first, index, sqTolerance, simplified);
    simplified.push(points[index]);
    if (last - index > 1)
      simplifyDPStep(points, index, last, sqTolerance, simplified);
  }
}

// simplification using Ramer-Douglas-Peucker algorithm
function simplifyDouglasPeucker(
  points: Array<Array<number>>,
  sqTolerance: number
) {
  var last = points.length - 1;

  var simplified = [points[0]];
  simplifyDPStep(points, 0, last, sqTolerance, simplified);
  simplified.push(points[last]);

  return simplified;
}

/**
 * Polyline simplification using a combination of Douglas-Peucker and Radial Distance algorithm.
 * @param points Array of points (Polyline).
 * @param tolerance [default = 1] Affects the amount of simplification (in the same metric as the point coordinates).
 * @param highestQuality [default = true] Excludes distance-based preprocessing step which leads to highest quality simplification but runs ~10-20 times slower.
 * @returns Array of simplified points.
 */
export function simplifyPolygon(
  points: Array<Array<number>>,
  tolerance = 1,
  highestQuality = true
) {
  if (points.length <= 2) return points;

  const sqTolerance = tolerance * tolerance;

  //points = highestQuality ? points : simplifyRadialDist(points, sqTolerance);
  //points = simplifyDouglasPeucker(points, sqTolerance);
  console.log("simplify");
  return points;
}
