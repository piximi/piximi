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
  let position: Position = new Position(x, y);

  const color = image.getPixelXY(x, y);

  const boundary = new Position(image.width, image.height);

  let start: number = position.y * boundary.x + position.x;

  let visit: Array<number> = [start];

  let visited: Array<number> = [];

  const directions: Array<Position> = [
    new Position(-1, 0),
    new Position(1, 0),
    new Position(0, -1),
    new Position(0, 1),
  ];

  const positivePixels = [];

  while (visit.length > 0) {
    const index = visit[0];

    visit.splice(0, 1);

    visited[index] = index;

    const data = image.getPixel(index);
    position.x = index % boundary.x;
    position.y = Math.floor(index / (boundary.x === 0 ? 1 : boundary.x));
    if (index < image.data.length) {
      const difference: number = Math.abs(
        data[0] - color[0] + (data[1] - color[1]) + (data[2] - color[2])
      );
      // console.log(difference, tolerance, position.x, position.y, data, index)
      if (difference <= tolerance) {
        // context!.fillRect(position.x, position.y, 1, 1);
        // console.log("Pushed")
        positivePixels.push(index);
        const next: Position = new Position(0, 0);

        for (let direction of directions) {
          const post = new Position(position.x, position.y).add(direction);

          next.overwrite(new Position(position.x, position.y)).add(direction);

          if (next.in(boundary)) {
            const nextIndex = next.y * image.width + next.x;

            if (visit.indexOf(nextIndex) === -1 && visited[index] != null) {
              // console.log("Queueing", post.x, post.y, nextIndex)
              visit.push(nextIndex);
            }
          }
        }
      }
    }
  }
  return positivePixels;
};
