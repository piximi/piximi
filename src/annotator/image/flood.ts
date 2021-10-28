import * as ImageJS from "image-js";
import PriorityQueue from "ts-priority-queue";

const dirs = [
  [1, 0],
  [0, 1],
  [-1, 0],
  [0, -1],
];

class Position {
  x: number;
  y: number;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  add(that: Position) {
    this.x += that.x;
    this.y += that.y;

    return this;
  }

  clone() {
    return new Position(this.x, this.y);
  }

  in(maximum: Position) {
    return this.x >= 0 && this.x <= maximum.x && this.y >= 0 && maximum.y;
  }

  overwrite(that: Position) {
    this.x = that.x;
    this.y = that.y;

    return this;
  }

  subtract(that: Position) {
    this.x -= that.x;
    this.y -= that.y;

    return this;
  }
}

export interface FloodImage extends ImageJS.Image {
  overlay: ImageJS.Image;
  toleranceMap: ImageJS.Image;
  target: Position;
  overlayTolerance: number;
}

// Generate a tolerance map and associate it with the image itself
export const makeFloodMap = ({
  x,
  y,
  image,
}: {
  x: number;
  y: number;
  image: ImageJS.Image;
}) => {
  const tol: Array<number> = [];

  const color = image.getPixelXY(x, y);

  if (image.data.length === image.width * image.height * 3) {
    //RGB image
    for (let i = 0; i < image.data.length; i += 3) {
      const red = Math.abs(image.data[i] - color[0]);
      const green = Math.abs(image.data[i + 1] - color[1]);
      const blue = Math.abs(image.data[i + 2] - color[2]);
      tol.push(Math.floor((red + green + blue) / 3));
    }
  } else if (image.data.length === image.width * image.height * 4) {
    //RGBA image
    for (let i = 0; i < image.data.length; i += 4) {
      const red = Math.abs(image.data[i] - color[0]);
      const green = Math.abs(image.data[i + 1] - color[1]);
      const blue = Math.abs(image.data[i + 2] - color[2]);
      tol.push(Math.floor((red + green + blue) / 3));
    }
  } else if (image.data.length === image.width * image.height) {
    //greyscale
    for (let i = 0; i < image.data.length; i++) {
      const grey = Math.abs(image.data[i] - color[0]);
      tol.push(Math.floor((grey / image.maxValue) * 255));
    }
  }

  return new ImageJS.Image(image.width, image.height, tol, {
    alpha: 0,
    components: 1,
  });
};

// Expand a watershed map until the desired tolerance is reached.
export const doFlood = ({
  floodMap,
  toleranceMap,
  queue,
  tolerance,
  maxTol,
  seen,
}: {
  floodMap: ImageJS.Image;
  toleranceMap: ImageJS.Image;
  queue: PriorityQueue<Array<number>>;
  tolerance: number;
  maxTol: number;
  seen: Set<number>;
}) => {
  while (queue.length > 0 && queue.peek()[2] <= tolerance) {
    let currentPoint = queue.dequeue();
    maxTol = Math.max(currentPoint[2], maxTol);
    floodMap.setPixelXY(currentPoint[0], currentPoint[1], [maxTol]);
    for (let dir of dirs) {
      let newX = currentPoint[0] + dir[0];
      let newY = currentPoint[1] + dir[1];
      let idx = newX + newY * toleranceMap.width;
      if (
        !seen.has(idx) &&
        newX >= 0 &&
        newY >= 0 &&
        newX < toleranceMap.width &&
        newY < toleranceMap.height
      ) {
        queue.queue([newX, newY, toleranceMap.getPixelXY(newX, newY)[0]]);
        seen.add(idx);
      }
    }
  }
};
