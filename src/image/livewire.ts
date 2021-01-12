const infinity = Number.MAX_SAFE_INTEGER;

type metadata = {
  x: number;
  y: number;
  e: boolean;
  g: number;
  p: { x: number; y: number } | null;
};

export const livewire = (
  seed: { x: number; y: number },
  cost: Uint8ClampedArray,
  width: number,
  height: number
) => {
  //initialize metadata
  let metadata: metadata[][] = [];
  for (let y = 0; y < height; y++) {
    metadata[y] = [];
    for (let x = 0; x < width; x++) {
      metadata[y][x] = { x: x, y: y, e: false, g: infinity, p: null };
    }
  }

  const L: { x: number; y: number }[] = []; // list of active pixels, sorted by total cost
  let q: { x: number; y: number } | undefined;
  let gtmp: number;
  let r: metadata;
  let insert: boolean = false;

  let pointers: { x: number; y: number }[][] = [];

  L.push({ x: seed.x, y: seed.y });
  metadata[seed.y][seed.x].g = 0;

  while (L.length !== 0) {
    q = L.pop(); // get pixel coordinate with minimum total cost
    if (q && q.x && q.y) {
      metadata[q.y][q.x].e = true; // label pixel as expanded
      //for each neighhbor pixel
      let neighbours = [
        metadata[q.y - 1][q.x - 1],
        metadata[q.y - 1][q.x],
        metadata[q.y - 1][q.x + 1],
        metadata[q.y][q.x - 1],
        metadata[q.y][q.x + 2],
        metadata[q.y + 1][q.x - 1],
        metadata[q.y + 1][q.x],
        metadata[q.y + 1][q.x + 1],
      ];
      neighbours = neighbours.filter(
        (neighbour) => !metadata[neighbour.y][neighbour.x].e
      );
      for (let idx = 0; idx < neighbours.length; idx++) {
        r = neighbours[idx];
        if (!(r.x === q.x) || r.y === q.y) {
          //diagonal case: increase local cost
          gtmp = r.g + cost[(width * r.y + r.x) * 4] * Math.sqrt(2);
        } else {
          gtmp = r.g + cost[(width * r.y + r.x) * 4];
        }
        let rindex = L.indexOf({ x: r.x, y: r.y });
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
        }
      }
    }
  }
  return pointers;
};
