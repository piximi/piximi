import createGraph, { Graph, Node, NodeId } from "ngraph.graph";
import { getIdx } from "./imageHelper";
import { DataArray } from "image-js";
import { aStar } from "ngraph.path";
import { cachedAStarPathSearch } from "./pathFinder/pathFinder";

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
  console.log("Creating graph");
  let t0 = performance.now();
  let graph = createGraph();

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const startIdx = getIdx(width, 1)(x, y, 0);
      // TODO : Go back to inferring max from actual image data
      // const cap = Math.max.apply(Math, edges.data);
      const cap = 255;
      const dist = cap - edges[startIdx];

      graph.addNode(startIdx, dist);

      const pixels = validNeighbours(x, y, height, width);

      for (let pixel of pixels) {
        const idx = getIdx(width, 1)(pixel.x, pixel.y, 0);
        graph.addLink(startIdx, idx);
      }
    }
  }
  let t1 = performance.now();
  console.log("Graph creation took " + (t1 - t0) + " milliseconds.");
  return graph;
};

export const createPathFinder = (graph: Graph, width: number) => {
  console.log("Regenerating path finder");
  return cachedAStarPathSearch(graph);
  // return  aStar(graph, {
  //   distance(fromNode: Node, toNode: Node) {
  //     return toNode.data
  //   },
  // heuristic(fromNode: Node, toNode: Node) {
  //   const [x1, y1] = fromIdxToCoord(fromNode.id as number, width);
  //   const [x2, y2] = fromIdxToCoord(toNode.id as number, width);
  //   if (x1 === x2 || y1 === y2) {
  //     return toNode.data;
  //   }
  //   return 1.41 * toNode.data;
  // },
  // });
};

export const convertPathToCoords = (
  foundPath: any,
  width: number,
  factor: number = 1
) => {
  const pathCoords = [];
  for (let node of foundPath) {
    const id = node.id as number;
    const [x, y] = fromIdxToCoord(id, width);
    pathCoords.push([x / factor, y / factor]);
  }
  return pathCoords;
};
