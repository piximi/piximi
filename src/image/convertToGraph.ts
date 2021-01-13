import createGraph from "ngraph.graph";
import { getIdx } from "./imageHelper";
import { DataArray } from "image-js";

const validNeighbours = (
  x: number,
  y: number,
  height: number,
  width: number
) => {
  const xoffsets = [0];
  const yoffsets = [0];
  const output: { x: number; y: number }[] = [];
  //David will know what to write here
  if (x > 0) {
    xoffsets.push(-1);
  }
  if (x < width - 1) {
    xoffsets.push(1);
  }
  if (y > 0) {
    yoffsets.push(-1);
  }
  if (y < height - 1) {
    yoffsets.push(1);
  }
  for (let xoffset of xoffsets) {
    for (let yoffset of yoffsets) {
      if (!(xoffset === 0 && yoffset === 0)) {
        output.push({ x: x + xoffset, y: y + yoffset });
      }
    }
  }
  return output;
};

export const fromIdxToCoord = (idx: number, width: number) => {
  const row = Math.floor(idx / width);
  const col = idx - row * width;
  return [col, row];
};

export const makeGraph = (
  edges: Uint8ClampedArray | DataArray,
  height: number,
  width: number
) => {
  let graph = createGraph();

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const startIdx = getIdx(width, 1)(x, y, 0);

      const pixels = validNeighbours(x, y, height, width);

      for (let pixel of pixels) {
        const idx = getIdx(width, 1)(pixel.x, pixel.y, 0);
        const dist = edges[idx];
        graph.addLink(startIdx, idx, dist);
      }
    }
  }
  return graph;
};
