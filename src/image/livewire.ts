const cost = (image: [], width: number, height: number) => {
  let grayscale: number[][] = [];

  let y, x;
  for (y = 0; y < height; y++) {
    grayscale[y] = [];
    for (x = 0; x < height; x++) {
      const idx = (width * y + x) * 4;
      grayscale[y][x] = (image[idx] + image[idx + 1] + image[idx + 2]) / 3;
      grayscale[y][x] = grayscale[y][x];
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
  p: { x: number | null; y: number | null };
}[][];

export const livewire = (
  seed: { x: number; y: number },
  data: metadata,
  cost: number[][]
) => {
  const L: { x: number; y: number }[] = []; // list of active pixels, sorted by total cost
  let q: { x: number; y: number } | undefined;
  let gtmp: number;

  L.push({ x: seed.x, y: seed.y }); // this should be a priority queue
  data[seed.y][seed.x].g = 0;

  while (L.length !== 0) {
    q = L.pop(); // get pixel coordinate with minimum total cost
    if (q && q.x && q.y) {
      data[q.y][q.x].e = true; // label pixel as expanded
      //for each neighhbor pixel
      let neighbours = [
        data[q.y - 1][q.x - 1],
        data[q.y - 1][q.x],
        data[q.y - 1][q.x + 1],
        data[q.y][q.x - 1],
        data[q.y][q.x + 2],
        data[q.y + 1][q.x - 1],
        data[q.y + 1][q.x],
        data[q.y + 1][q.x + 1],
      ];

      //[implement] for each neighbor that has NNOT been visited...
      gtmp = data[q.y][q.x].g + cost[q.y][q.x];
    }
  }
};
