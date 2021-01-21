import Image from "image-js";

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

export const flood = ({
  x,
  y,
  image,
  tolerance,
}: {
  x: number;
  y: number;
  image: Image;
  tolerance: number;
}) => {
  // const canvas = new HTMLCanvasElement;
  // const ctx = canvas.getContext('2d');
  // const imData = ctx.createImageData(image.width, image.height);
  const overlay2 = Image.createFrom(image, {});
  // const overlay2 = new Image(image.width, image.height)
  console.log("FFFFFFF");
  console.log(overlay2);

  let position: Position = new Position(x, y);

  const color = image.getPixelXY(x, y);

  const boundary = new Position(image.width, image.height);

  let start: number = position.y * boundary.x + position.x;

  let visit: Array<number> = [start];

  const visited = new Set();

  const directions: Array<Position> = [
    new Position(-1, 0),
    new Position(1, 0),
    new Position(0, -1),
    new Position(0, 1),
  ];

  const positivePixels = [];

  while (visit.length > 0) {
    const testIndex = visit.shift()!;

    position.x = testIndex % boundary.x;
    position.y = Math.floor(testIndex / (boundary.x === 0 ? 1 : boundary.x));
    const data = image.getPixelXY(position.x, position.y);

    visited.add(testIndex);

    const difference: number = Math.abs(
      data[0] - color[0] + (data[1] - color[1]) + (data[2] - color[2])
    );

    if (difference <= tolerance) {
      // context!.fillRect(position.x, position.y, 1, 1);
      positivePixels.push(new Position(position.x, position.y));
      overlay2.setPixelXY(position.x, position.y, [255, 255, 255, 255]);
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
  console.log(positivePixels);
  return overlay2.toDataURL();
};
