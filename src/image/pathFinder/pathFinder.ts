import { NodeHeap } from "./nodeHeap";
import { Link } from "ngraph.graph";
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

  const distance = (fromNode: Node, toNode: Node, link: Link) => {
    return toNode.data;
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
    const to = graph.getNode(toId);
    if (!to) return NO_PATH;

    let cameFrom: any;
    // Maps nodeId to NodeSearchState.

    const dest = graph.getNode(toId);
    if (dest) {
      if (dest.fromId === fromId) {
        return dest.trace;
      }
    }

    if (graph.fromId !== fromId || graph.openSet.length === 0) {
      console.log("Resetting search for new path");
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

    function visitNeighbour(otherNode: PiximiNode, link: Link) {
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
        cameFrom.distanceToSource + distance(otherNode, cameFrom, link);
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
  let coords = [];
  if (searchNode!.parentId !== null) {
    const parentNode = graph.getNode(searchNode!.parentId);
    if (typeof parentNode !== "undefined") {
      coords.push(...parentNode.trace);
    }
  }
  const [x, y] = fromIdxToCoord(searchNode.id, width);
  coords.push([x / factor, y / factor]);
  return coords;
}
