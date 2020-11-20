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
  canvas,
  tolerance,
}: {
  x: number;
  y: number;
  canvas: HTMLCanvasElement;
  tolerance: number;
}) => {
  const context = canvas.getContext("2d");

  let position: Position = new Position(x, y);

  const color = context!.getImageData(position.x, position.y, 1, 1).data;

  const boundary = new Position(canvas.width, canvas.height);

  let start: number = position.x * boundary.x + position.x;

  let visit: Array<number> = [start];

  let visited: Array<number> = [];

  const directions: Array<Position> = [
    new Position(-1, 0),
    new Position(1, 0),
    new Position(0, -1),
    new Position(0, 1),
  ];

  while (visit.length > 0) {
    const index = visit[0];

    visit.splice(0, 1);

    visited[index] = index;

    position.x = index % boundary.x;
    position.y = Math.floor(index / boundary.x === 0 ? 1 : boundary.x);

    const data: Uint8ClampedArray = context!.getImageData(
      position.x,
      position.y,
      1,
      1
    ).data;

    const difference: number = Math.abs(
      data[0] - color[0] + (data[1] - color[1]) + (data[2] - color[2])
    );

    if (difference <= tolerance) {
      context!.fillRect(position.x, position.y, 1, 1);

      const next: Position = new Position(0, 0);

      for (let j = 0; j < directions.length; j++) {
        const direction: Position = directions[index];

        next.overwrite(new Position(x, y)).add(direction);

        if (direction.in(boundary)) {
          const nextIndex = direction.y * canvas.width + direction.x;

          if (visit.indexOf(nextIndex) >= 0 && visited[index] != null) {
            visit.push(nextIndex);
          }
        }
      }
    }
  }
};
