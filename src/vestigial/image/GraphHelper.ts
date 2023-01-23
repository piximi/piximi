import createGraph, { Graph, Node } from "ngraph.graph";
import { getIdx } from "utils/common/imageHelper";
import { DataArray } from "image-js";
import { aStar } from "ngraph.path";

const validNeighbors = (
  x: number,
  y: number,
  height: number,
  width: number
) => {
  const xoffsets = [0];
  const yoffsets = [0];
  const output: { x: number; y: number }[] = [];

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
      const startIdx = getIdx(width, 1, x, y, 0);
      const cap = Math.max(...Array.from(edges));
      const dist = cap - edges[startIdx];

      graph.addNode(startIdx, dist);

      const pixels = validNeighbors(x, y, height, width);

      for (let pixel of pixels) {
        const idx = getIdx(width, 1, pixel.x, pixel.y, 0);
        graph.addLink(startIdx, idx);
      }
    }
  }
  return graph;
};

export const createPathFinder = (graph: Graph, width: number) => {
  return aStar(graph, {
    distance(fromNode: Node, toNode: Node) {
      const [x1, y1] = fromIdxToCoord(fromNode.id as number, width);
      const [x2, y2] = fromIdxToCoord(toNode.id as number, width);
      if (x1 === x2 || y1 === y2) {
        return toNode.data;
      }
      return 1.41 * toNode.data;
    },
  });
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
