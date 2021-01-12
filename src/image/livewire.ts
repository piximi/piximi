const cost = (image: [], width: number, height: number) => {
  let grayscale: number[][] = [];

  let y, x;
  for (y = 0; y < height; y++) {
    grayscale[y] = [];
    for (x = 0; x < height; x++) {
      const idx = (width * y + x) * 4;
      grayscale[y][x] = (image[idx] + image[idx + 1] + image[idx + 2]) / 3;
    }
  }
  //OPTIONAL: compute edges
};

const infinity = Math.pow(10, 1000);

type metadata = {
  x: number;
  y: number;
  e: boolean;
  g: number;
  p: { x: number; y: number } | null;
};

export const livewire = (
  seed: { x: number; y: number },
  metadata: metadata[][],
  cost: number[][],
  width: number,
  height: number
) => {
  //initialize metadata
  let data: metadata[][] = [];
  for (let y = 0; y < height; y++) {
    data[y] = [];
    for (let x = 0; x < width; x++) {
      data[y][x] = { x: x, y: y, e: false, g: infinity, p: null };
    }
  }

  const L: { x: number; y: number }[] = []; // list of active pixels, sorted by total cost
  let q: { x: number; y: number } | undefined;
  let gtmp: number;
  let r: metadata;

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
        gtmp = r.g + cost[r.y][r.x];
        let rindex = L.indexOf({ x: r.x, y: r.y });
        if (rindex > -1 && gtmp < r.g) {
          L.splice(rindex, 1);
        }
        if (rindex === -1) {
          r.g = gtmp;
          r.p = { x: q.x, y: q.y };
          L.push({ x: r.x, y: r.y });
          // sort list in descending order, so that a pop() operation gives the pixel with smallest total cost
          L.sort(function (a, b) {
            return metadata[b.y][b.x].g - metadata[a.y][a.x].g;
          });
        }
      }
    }
  }
};
