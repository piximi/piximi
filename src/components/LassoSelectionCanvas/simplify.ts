type Point = {
  x: number;
  y: number;
};

type Segment = {
  a: Point;
  b: Point;
};

const getSquareDistance = (a: Point, b: Point) => {
  const dx = a.x - b.x;
  const dy = a.y - b.y;

  return dx * dx + dy * dy;
};

const getSquareSegmentDistance = (point: Point, segment: Segment) => {
  const { a, b } = segment;

  let x = a.x;
  let y = a.y;
  let dx = b.x - x;
  let dy = b.y - y;

  if (dx !== 0 || dy !== 0) {
    const t = ((point.x - x) * dx + (point.y - y) * dy) / (dx * dx + dy * dy);

    if (t > 1) {
      x = b.x;
      y = b.y;
    } else if (t > 0) {
      x += dx * t;
      y += dy * t;
    }
  }

  dx = point.x - x;
  dy = point.y - y;

  return dx * dx + dy * dy;
};

const preprocess = (points: Array<Point>, tolerance: number) => {
  let previous: Point = points[0];

  let updated: Array<Point> = [previous];

  let current;

  for (let i = 1, len = points.length; i < len; i++) {
    current = points[i];

    const distance = getSquareDistance(current, previous);

    if (distance > tolerance) {
      updated.push(current);

      previous = current;
    }
  }

  if (current && previous !== current) {
    updated.push(current);
  }

  return updated;
};

const step = (
  points: Array<Point>,
  m: number,
  n: number,
  tolerance: number,
  shape: any[]
) => {
  let maximum: number = tolerance;

  let index;

  const segment: Segment = {
    a: points[m],
    b: points[n],
  };

  for (let i = m + 1; i < n; i++) {
    const distance = getSquareSegmentDistance(points[i], segment);

    if (distance > maximum) {
      index = i;

      maximum = distance;
    }
  }

  if (index && maximum > tolerance) {
    if (index - m > 1) {
      step(points, m, index, tolerance, shape);
    }

    shape.push(points[index]);

    if (n - index > 1) {
      step(points, index, n, tolerance, shape);
    }
  }
};

// simplification using Ramer-Douglas-Peucker algorithm
const simplification = (points: Array<Point>, tolerance: number) => {
  const n = points.length - 1;

  const shape = [points[0]];

  step(points, 0, n, tolerance, shape);

  shape.push(points[n]);

  return shape;
};

export const simplify = (
  points: Array<Point>,
  tolerance: number = 1,
  preprocessing: boolean = false
) => {
  if (points.length < 3) return points;

  tolerance = tolerance * tolerance;

  if (preprocessing) {
    points = preprocess(points, tolerance);
  }

  return simplification(points, tolerance);
};
