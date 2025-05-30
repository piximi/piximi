import createGraph from "ngraph.graph";

import { NodeHeap, PiximiGraph } from "./NodeHeap";
import { cachedAStarPathSearch } from "./PathFinder";

import { getIdx } from "views/ImageViewer/utils/imageHelper";
import { Point } from "utils/types";
import { DataArray } from "store/data/types";

const validNeighbours = (
  x: number,
  y: number,
  height: number,
  width: number,
) => {
  const xoffsets = [0];
  const yoffsets = [0];
  const output: Point[] = [];
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
  for (const xoffset of xoffsets) {
    for (const yoffset of yoffsets) {
      if (!(xoffset === 0 && yoffset === 0)) {
        output.push({ x: x + xoffset, y: y + yoffset });
      }
    }
  }
  return output;
};

export const makeGraph = (
  edges: Uint8ClampedArray | DataArray,
  height: number,
  width: number,
) => {
  const graph: any = createGraph();
  graph.fromId = -1;
  graph.openSet = new NodeHeap();
  let cap = 255;
  if (edges.BYTES_PER_ELEMENT === 2) {
    cap = 65535;
  }
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const startIdx = getIdx(width, 1, x, y, 0);
      const dist = cap - edges[startIdx];

      graph.addNode(startIdx, dist);

      const pixels = validNeighbours(x, y, height, width);

      for (const pixel of pixels) {
        const idx = getIdx(width, 1, pixel.x, pixel.y, 0);
        graph.addLink(startIdx, idx);
      }
    }
  }
  return graph as PiximiGraph;
};

export const createPathFinder = (
  graph: PiximiGraph,
  width: number,
  factor: number,
) => {
  return cachedAStarPathSearch(graph, width, factor);
};

// export const convertPathToCoords = (
//   foundPath: any,
//   width: number,
//   factor: number = 1
// ) => {
//   const pathCoords = [];
//   for (let node of foundPath) {
//     const id = node.id as number;
//     const point = fromIdxToCoord(id, width);
//     pathCoords.push([point.x / factor, point.y / factor]);
//   }
//   return pathCoords;
// };
