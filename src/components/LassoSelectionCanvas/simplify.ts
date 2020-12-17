type Point = [number, number];

type Segment = {
  a: Point;
  b: Point;
};

const getSquareDistance = (a: Point, b: Point) => {
  const dx = a[0] - b[0];
  const dy = a[1] - b[1];

  return dx * dx + dy * dy;
};

const getSquareSegmentDistance = (point: Point, segment: Segment) => {
  const { a, b } = segment;

  let x = a[0];
  let y = a[1];
  let dx = b[0] - x;
  let dy = b[1] - y;

  if (dx !== 0 || dy !== 0) {
    const t = ((point[0] - x) * dx + (point[1] - y) * dy) / (dx * dx + dy * dy);

    if (t > 1) {
      x = b[0];
      y = b[1];
    } else if (t > 0) {
      x += dx * t;
      y += dy * t;
    }
  }

  dx = point[0] - x;
  dy = point[1] - y;

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
