import { NodeHeap } from "./NodeHeap";
import { fromIdxToCoord, PiximiGraph, PiximiNode } from "../GraphHelper";
import { Node } from "ngraph.graph";

/**
 * Performs a uni-directional A Star search on graph.
 *
 * We will try to minimize f(n) = g(n) + h(n), where
 * g(n) is actual distance from source node to `n`, and
 * h(n) is heuristic distance from `n` to target node.
 */

const NO_PATH: never[] = [];

/**
 * Creates a new instance of pathfinder. A pathfinder has just one method:
 * `find(fromId, toId)`, it may be extended in future.
 *
 * @param graph instance. See https://github.com/anvaka/ngraph.graph
 * @param {width} width of the original image
 * @param {factor} factor for scaling between image and graph
 *
 * @returns {Object} A pathfinder with single method `find()`.
 */
export function cachedAStarPathSearch(
  graph: PiximiGraph,
  width: number,
  factor: number
) {
  // whether traversal should be considered over oriented graph.
  const oriented = true;

  const heuristic = (fromNode: PiximiNode, toNode: PiximiNode) => {
    const [x1, y1] = fromIdxToCoord(fromNode.id as number, width);
    const [x2, y2] = fromIdxToCoord(toNode.id as number, width);
    if (x1 === x2 || y1 === y2) {
      return 1;
    }
    return 1.41;
  };

  const distance = (fromNode: Node, toNode: Node) => {
    const [x1, y1] = fromIdxToCoord(fromNode.id as number, width);
    const [x2, y2] = fromIdxToCoord(toNode.id as number, width);
    if (x1 === x2 || y1 === y2) {
      return 1 * toNode.data;
    }
    return 1.41 * toNode.data;
  };

  return {
    /**
     * Finds a path between node `fromId` and `toId`.
     * @returns {Array} of nodes between `toId` and `fromId`. Empty array is returned
     * if no path is found.
     */
    find: find,
  };

  function find(fromId: number, toId: number) {
    const from = graph.getNode(fromId) as PiximiNode;
    if (!from) return NO_PATH;
    const to = graph.getNode(toId) as PiximiNode;
    if (!to) return NO_PATH;

    let cameFrom: any;
    // Maps nodeId to NodeSearchState.

    const dest = graph.getNode(toId) as PiximiNode;
    if (dest) {
      if (dest.fromId === fromId && dest.trace.length > 0) {
        return dest.trace;
      }
    }

    if (graph.fromId !== fromId || graph.openSet.length === 0) {
      graph.openSet = new NodeHeap();
      // For the first node, fScore is completely heuristic.
      from.fScore = heuristic(from, to);

      // The cost of going from start to start is zero.
      from.distanceToSource = 0;
      graph.openSet.push(from);
      from.open = 1;
      graph.fromId = fromId;
    }

    while (graph.openSet.length > 0) {
      cameFrom = graph.openSet.pop();

      if (cameFrom.id === toId) {
        cameFrom.trace = reconstructPath(graph, cameFrom, width, factor);
        cameFrom.fromId = fromId;
        return cameFrom.trace;
      }

      // no need to visit this node anymore
      cameFrom.trace = reconstructPath(graph, cameFrom, width, factor);
      cameFrom.fromId = fromId;
      cameFrom.closed = true;
      graph.forEachLinkedNode(cameFrom.id, visitNeighbour, oriented);
    }

    // If we got here, then there is no path.
    return NO_PATH;

    function visitNeighbour(otherNode: any) {
      if (otherNode.fromId !== graph.fromId) {
        // This is old data, reset all params
        otherNode.fromId = graph.fromId;
        otherNode.trace = [];
        otherNode.parentId = null;
        otherNode.closed = false;
        otherNode.open = 0;
        otherNode.distanceToSource = Number.POSITIVE_INFINITY;
        otherNode.fScore = Number.POSITIVE_INFINITY;
        otherNode.heapIndex = -1;
      }

      if (otherNode.closed) {
        // Already processed this node.
        return;
      }
      if (otherNode.open === 0) {
        // Remember this node.
        graph.openSet.push(otherNode);
        otherNode.open = 1;
      }

      const tentativeDistance =
        cameFrom.distanceToSource + distance(otherNode, cameFrom);
      if (tentativeDistance >= otherNode.distanceToSource) {
        // This would only make our path longer. Ignore this route.
        return;
      }

      // bingo! we found shorter path:
      otherNode.parentId = cameFrom.id;
      otherNode.distanceToSource = tentativeDistance;
      otherNode.fScore = tentativeDistance + heuristic(otherNode, to);

      graph.openSet.updateItem(otherNode.heapIndex);
    }
  }
}

function reconstructPath(
  graph: PiximiGraph,
  searchNode: PiximiNode | null,
  width: number,
  factor: number = 1
) {
  if (!searchNode) return;

  const [x, y] = fromIdxToCoord(searchNode.id as number, width);
  const newCoord = [x / factor, y / factor];
  let coords = [];
  const fromId = graph.fromId;
  if (searchNode!.parentId !== null) {
    const parentNode = graph.getNode(searchNode!.parentId) as PiximiNode;
    if (typeof parentNode !== "undefined" && parentNode.fromId === fromId) {
      // Fetch a trace from the last coordinate
      coords.push(...parentNode.trace);
      if (coords.length > 1) {
        const oldDirection = pathDirection(
          coords[coords.length - 2],
          coords[coords.length - 1]
        );
        const newDirection = pathDirection(coords[coords.length - 1], newCoord);
        if (oldDirection === newDirection) {
          coords.pop();
        }
      }
    }
  }
  coords.push(newCoord);
  return coords;
}

export const pathDirection = (from: Array<number>, to: Array<number>) => {
  // Generate a number representing the relative direction of the coordinates.
  // Assuming TopLeft of an image is 0,0
  const dx = to[0] - from[0];
  const dy = to[1] - from[1];
  if (dx === 0) {
    if (dy < 0) {
      return 0; // Up
    }
    if (dy > 0) {
      return 4; // Down
    }
  }
  if (dy === 0) {
    if (dx > 0) {
      return 2; // Right
    }
    if (dx < 0) {
      return 6; // Left
    }
  }
  if (dx > 0) {
    if (dy < 0) {
      return 1; // Up+Right
    }
    if (dy > 0) {
      return 3; // Down+Right
    }
  }
  if (dx < 0) {
    if (dy < 0) {
      return 7; // Up+Left
    }
    if (dy > 0) {
      return 5; // Down+Left
    }
  }
  console.log(
    "Invalid direction, this should never appear so check the code",
    dx,
    dy
  );
};
