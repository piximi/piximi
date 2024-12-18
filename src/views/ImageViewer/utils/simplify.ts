/*
 © 2013, Vladimir Agafonkin. Released under BSD license.
 Simplify.js, a high-performance JS polyline simplification library
 mourner.github.io/simplify-js
*/

import { Point } from "./types";

// square distance between 2 points
function getSqDist(p1: Point, p2: Point) {
  var dx = p1.x - p2.x,
    dy = p1.y - p2.y;

  return dx * dx + dy * dy;
}

// square distance from a point to a segment
function getSqSegDist(p: Point, p1: Point, p2: Point) {
  var x = p1.x,
    y = p1.y,
    dx = p2.x - x,
    dy = p2.y - y;

  if (dx !== 0 || dy !== 0) {
    var t = ((p.x - x) * dx + (p.y - y) * dy) / (dx * dx + dy * dy);

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
}

// basic distance-based simplification
function simplifyRadialDist(points: Array<Point>, sqTolerance: number) {
  var prevPoint = points[0];
  var newPoints = [prevPoint];
  var point: Point | undefined;

  for (var i = 1, len = points.length; i < len; i++) {
    point = points[i];

    if (getSqDist(point, prevPoint) > sqTolerance) {
      newPoints.push(point);
      prevPoint = point;
    }
  }

  if (point && prevPoint !== point) newPoints.push(point);

  return newPoints;
}

function simplifyDPStep(
  points: Array<Point>,
  first: number,
  last: number,
  sqTolerance: number,
  simplified: Array<Point>
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
function simplifyDouglasPeucker(points: Array<Point>, sqTolerance: number) {
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
  points: Array<Point>,
  tolerance = 1,
  highestQuality = true
) {
  if (points.length <= 2) return points;

  const sqTolerance = tolerance * tolerance;

  points = highestQuality ? points : simplifyRadialDist(points, sqTolerance);
  points = simplifyDouglasPeucker(points, sqTolerance);
  return points;
}
