const infinity = Number.MAX_SAFE_INTEGER;

type metadata = {
  x: number;
  y: number;
  e: boolean;
  g: number;
};

const findWithAttr = (
  array: { x: number; y: number }[],
  value: { x: number; y: number }
): number => {
  return array.findIndex((el) => el.x === value.x && el.y === value.y);
};

export const livewire = (
  seed: { x: number; y: number },
  cost: number[],
  width: number,
  height: number
) => {
  //initialize metadata
  let metadata: metadata[][] = [];
  for (let y = 0; y < height; y++) {
    metadata[y] = [];
    for (let x = 0; x < width; x++) {
      metadata[y][x] = { x: x, y: y, e: false, g: infinity };
    }
  }
  // initialize pointers
  let pointers: { x: number; y: number }[][] = [];
  for (let y = 0; y < height; y++) {
    pointers[y] = [];
    for (let x = 0; x < width; x++) {
      pointers[y][x] = { x: x, y: y };
    }
  }

  const L: { x: number; y: number }[] = []; // list of active pixels, sorted by total cost
  let q: { x: number; y: number } | undefined;
  let gtmp: number;
  let r: metadata;
  let insert: boolean = false;

  L.push({ x: seed.x, y: seed.y });
  metadata[seed.y][seed.x].g = 0;

  while (L.length !== 0) {
    q = L.pop(); // get pixel coordinate with minimum total cost

    if (q) {
      metadata[q.y][q.x].e = true; // label pixel as expanded

      //for each neighbor pixel
      let neighbours = [];
      if (q.y > 0 && q.x > 0) {
        neighbours.push(metadata[q.y - 1][q.x - 1]);
      }
      if (q.y > 0) {
        neighbours.push(metadata[q.y - 1][q.x]);
      }
      if (q.y > 0 && q.x < width - 1) {
        neighbours.push(metadata[q.y - 1][q.x + 1]);
      }
      if (q.x > 0) {
        neighbours.push(metadata[q.y][q.x - 1]);
      }
      if (q.x < width - 1) {
        neighbours.push(metadata[q.y][q.x + 1]);
      }
      if (q.y < height - 1 && q.x > 0) {
        neighbours.push(metadata[q.y + 1][q.x - 1]);
      }
      if (q.y < height - 1) {
        neighbours.push(metadata[q.y + 1][q.x]);
      }
      if (q.y < height - 1 && q.x < width - 1) {
        neighbours.push(metadata[q.y + 1][q.x + 1]);
      }
      neighbours = neighbours.filter(
        (neighbour) => !metadata[neighbour.y][neighbour.x].e
      );

      for (let idx = 0; idx < neighbours.length; idx++) {
        r = neighbours[idx];
        if (!(r.x === q.x) || r.y === q.y) {
          //diagonal case: increase local cost
          gtmp =
            metadata[q.y][q.x].g + cost[(width * r.y + r.x) * 4] * Math.sqrt(2);
        } else {
          gtmp = metadata[q.y][q.x].g + cost[(width * r.y + r.x) * 4];
        }
        let rindex = findWithAttr(L, { x: r.x, y: r.y });
        if (rindex > -1 && gtmp < r.g) {
          L.splice(rindex, 1); //remove from list, to be added with new score, and sorted again
          insert = true;
        }
        if (rindex === -1 || insert) {
          r.g = gtmp;
          pointers[r.y][r.x] = { x: q.x, y: q.y };
          L.push({ x: r.x, y: r.y });
          // sort list in descending order, so that a pop() operation gives the pixel with smallest total cost
          L.sort(function (a, b) {
            return metadata[b.y][b.x].g - metadata[a.y][a.x].g;
          });
          if (insert) {
            insert = false;
          }
        }
      }
    }
  }
  return pointers;
};
