import * as ImageJS from "image-js";

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
  visit: Array<number>;
  visited: Set<number>;
  rejected: Set<number>;
}

// Generate a tolerance map and associate it with the image itself
export const makeFloodMap = ({
  x,
  y,
  image,
}: {
  x: number;
  y: number;
  image: FloodImage;
}) => {
  console.log("Making flood map");
  if (!image) {
    console.log("Error - No image");
    return;
  }
  image.target = new Position(x, y);
  image.overlayTolerance = -1;
  image.overlay = new ImageJS.Image(
    image.width,
    image.height,
    new Uint8ClampedArray(image.width * image.height * 4),
    { alpha: 1 }
  );

  let start: number = y * image.width + x;

  image.visit = [start];

  image.rejected = new Set();

  image.visited = new Set();

  const tol: Array<number> = [];

  const color = image.getPixelXY(x, y);

  for (let i = 0; i < image.data.length; i += 4) {
    const red = image.data[i];
    const green = image.data[i + 1];
    const blue = image.data[i + 2];
    tol.push(Math.abs(red - color[0] + (green - color[1]) + (blue - color[2])));
  }

  image.toleranceMap = new ImageJS.Image(image.width, image.height, tol, {
    alpha: 0,
    components: 1,
  });
  console.log("Map here", image);
  return image;
};

// Experimental - try to restore flood state from a previous flood operation. Works going forward, not in reverse yet.
// Currently disabled.
export const updateFlood = ({
  x,
  y,
  floodImage,
  newTolerance,
  color,
}: {
  x: number;
  y: number;
  floodImage: FloodImage;
  newTolerance: number;
  color: string;
}) => {
  const r = parseInt(color.slice(1, 3), 16);
  const g = parseInt(color.slice(3, 5), 16);
  const b = parseInt(color.slice(5, 7), 16);
  const fillColor = [r, g, b, 150];

  let position: Position = new Position(x, y);

  const boundary = new Position(floodImage.width, floodImage.height);

  const directions: Array<Position> = [
    new Position(-1, 0),
    new Position(1, 0),
    new Position(0, -1),
    new Position(0, 1),
    new Position(0, 1),
  ];

  // Resume and update search
  if (newTolerance < floodImage.overlayTolerance) {
    // We gotta go backwards!
    let visit = Array.from(floodImage.visited.values());

    console.log("Going in reverse", visit.length);
    while (visit.length > 0) {
      const testIndex = visit.pop()!;
      if (!floodImage.rejected.has(testIndex)) {
        const data = floodImage.getPixel(testIndex)[0];

        if (data > newTolerance) {
          floodImage.visited.delete(testIndex);
          floodImage.rejected.add(testIndex);
          floodImage.overlay.setPixel(testIndex, [0, 0, 0, 0]);
        }
      }
    }
    floodImage.overlayTolerance = newTolerance;
    return floodImage;
  }
  if (floodImage.visit.length === 0) {
    floodImage.visit = Array.from(floodImage.rejected.values());
    floodImage.rejected.clear();
  }
  console.log("Resuming", floodImage.visit.length);

  while (floodImage.visit.length > 0) {
    const testIndex = floodImage.visit.shift()!;

    position.x = testIndex % boundary.x;
    position.y = Math.floor(testIndex / (boundary.x === 0 ? 1 : boundary.x));
    const data = floodImage.toleranceMap.getPixelXY(position.x, position.y)[0];

    floodImage.visited.add(testIndex);

    if (data <= newTolerance) {
      // positivePixels.push(new Position(position.x, position.y));
      floodImage.overlay.setPixelXY(position.x, position.y, fillColor);
      const next: Position = new Position(0, 0);

      for (const direction of directions) {
        next.overwrite(new Position(position.x, position.y)).add(direction);

        if (next.in(boundary)) {
          const nextIndex = next.y * floodImage.width + next.x;

          if (
            !floodImage.visit.includes(nextIndex) &&
            !floodImage.visited.has(nextIndex)
          ) {
            floodImage.visit.push(nextIndex);
          }
        }
      }
    } else {
      floodImage.rejected.add(testIndex);
    }
  }
  floodImage.overlay.setPixelXY(x, y, [255, 255, 255, 255]);
  floodImage.overlayTolerance = newTolerance;

  return floodImage;
};

export const floodPixels = ({
  x,
  y,
  image,
  tolerance,
  color,
}: {
  x: number;
  y: number;
  image: FloodImage;
  tolerance: number;
  color: string;
}) => {
  image.overlay = new ImageJS.Image(
    image.width,
    image.height,
    new Uint8ClampedArray(image.width * image.height * 4),
    { alpha: 1 }
  );
  const r = parseInt(color.slice(1, 3), 16);
  const g = parseInt(color.slice(3, 5), 16);
  const b = parseInt(color.slice(5, 7), 16);
  const fillColor = [r, g, b, 150];

  let position: Position = new Position(x, y);

  const boundary = new Position(image.width, image.height);

  let start: number = position.y * boundary.x + position.x;

  let visit: Array<number> = [start];

  const visited = new Set();

  const directions: Array<Position> = [
    new Position(-1, 0),
    new Position(1, 0),
    new Position(0, -1),
    new Position(0, 1),
    new Position(0, 1),
  ];

  // const positivePixels = [];

  while (visit.length > 0) {
    const testIndex = visit.shift()!;

    position.x = testIndex % boundary.x;
    position.y = Math.floor(testIndex / (boundary.x === 0 ? 1 : boundary.x));
    const data = image.getPixelXY(position.x, position.y)[0];

    visited.add(testIndex);

    if (data <= tolerance) {
      // positivePixels.push(new Position(position.x, position.y));
      image.overlay.setPixelXY(position.x, position.y, fillColor);
      const next: Position = new Position(0, 0);

      for (const direction of directions) {
        next.overwrite(new Position(position.x, position.y)).add(direction);

        if (next.in(boundary)) {
          const nextIndex = next.y * image.width + next.x;

          if (!visit.includes(nextIndex) && !visited.has(nextIndex)) {
            visit.push(nextIndex);
          }
        }
      }
    }
  }
  image.overlay.setPixelXY(x, y, [255, 255, 255, 255]);
  return image.overlay.toDataURL();
};
//
// export const flood = ({
//   x,
//   y,
//   image,
//   tolerance,
// }: {
//   x: number;
//   y: number;
//   image: Image;
//   tolerance: number;
// }) => {
//   const overlay = new Image(
//     image.width,
//     image.height,
//     new Uint8ClampedArray(image.data.length),
//     { alpha: 1 }
//   );
//
//   let position: Position = new Position(x, y);
//
//   const color = image.getPixelXY(x, y);
//
//   const boundary = new Position(image.width, image.height);
//
//   let start: number = position.y * boundary.x + position.x;
//
//   let visit: Array<number> = [start];
//
//   const visited = new Set();
//
//   const directions: Array<Position> = [
//     new Position(-1, 0),
//     new Position(1, 0),
//     new Position(0, -1),
//     new Position(0, 1),
//   ];
//
//   // const positivePixels = [];
//
//   while (visit.length > 0) {
//     const testIndex = visit.shift()!;
//
//     position.x = testIndex % boundary.x;
//     position.y = Math.floor(testIndex / (boundary.x === 0 ? 1 : boundary.x));
//     const data = image.getPixelXY(position.x, position.y);
//
//     visited.add(testIndex);
//
//     const difference: number = Math.abs(
//       data[0] - color[0] + (data[1] - color[1]) + (data[2] - color[2])
//     );
//     toleranceMap.setPixelXY(position.x, position.y, [difference]);
//     if (difference <= tolerance) {
//       // positivePixels.push(new Position(position.x, position.y));
//       overlay.setPixelXY(position.x, position.y, [100, 100, 255, 150]);
//       const next: Position = new Position(0, 0);
//
//       for (const direction of directions) {
//         next.overwrite(new Position(position.x, position.y)).add(direction);
//
//         if (next.in(boundary)) {
//           const nextIndex = next.y * image.width + next.x;
//
//           if (!visit.includes(nextIndex) && !visited.has(nextIndex)) {
//             visit.push(nextIndex);
//           }
//         }
//       }
//     }
//   }
//   overlay.setPixelXY(x, y, [255, 255, 255, 255]);
//   return overlay.toDataURL();
// };
