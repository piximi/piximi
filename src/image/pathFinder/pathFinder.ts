import { NodeHeap } from "./nodeHeap";
import { Node, Link } from "ngraph.graph";
import { makeSearchStatePool, NodeSearchState } from "./makeSearchStatePool";
import { fromIdxToCoord, PiximiGraph, PiximiNode } from "../GraphHelper";

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
 *
 * @returns {Object} A pathfinder with single method `find()`.
 */
export function cachedAStarPathSearch(graph: PiximiGraph, width: number) {
  // whether traversal should be considered over oriented graph.
  const oriented = true;

  const heuristic = (fromNode: Node, toNode: Node) => {
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

  const pool = makeSearchStatePool();

  return {
    /**
     * Finds a path between node `fromId` and `toId`.
     * @returns {Array} of nodes between `toId` and `fromId`. Empty array is returned
     * if no path is found.
     */
    find: find,
  };

  function find(fromId: number, toId: number) {
    const from = graph.getNode(fromId);
    if (!from)
      throw new Error("fromId is not defined in this graph: " + fromId);
    const to = graph.getNode(toId);
    if (!to) throw new Error("toId is not defined in this graph: " + toId);

    let cameFrom: any;
    // Maps nodeId to NodeSearchState.

    const dest: PiximiNode | undefined = graph.getNode(toId);
    if (dest) {
      if (dest.fromId === fromId) {
        console.log("Calling cached path");
        return dest.trace;
      }
    }

    if (graph.fromId === fromId && graph.openSet.length > 0) {
      console.log("Resuming search for path", graph.openSet.length);
    } else {
      console.log("Resetting search for path");
      pool.reset();
      graph.openSet = new NodeHeap();
      const startNode = pool.createNewState(from);
      graph.nodeState = new Map();

      // the nodes that we still need to evaluate

      graph.nodeState.set(fromId, startNode);

      // For the first node, fScore is completely heuristic.
      startNode.fScore = heuristic(from, to);

      // The cost of going from start to start is zero.
      startNode.distanceToSource = 0;
      graph.openSet.push(startNode);
      startNode.open = 1;
      graph.fromId = fromId;
    }

    while (graph.openSet.length > 0) {
      cameFrom = graph.openSet.pop();

      if (goalReached(cameFrom, to)) {
        cameFrom.closed = true;
        cameFrom.node.trace = reconstructPath(cameFrom, width);
        cameFrom.node.fromId = fromId;
        return cameFrom.node.trace;
      }

      // no need to visit this node anymore
      cameFrom.closed = true;
      cameFrom.node.trace = reconstructPath(cameFrom, width);
      cameFrom.node.fromId = fromId;
      cameFrom.node.closed = true;
      graph.forEachLinkedNode(cameFrom.node.id, visitNeighbour, oriented);
    }

    // If we got here, then there is no path.
    return NO_PATH;

    function visitNeighbour(otherNode: Node, link: Link) {
      let otherSearchState = graph.nodeState.get(otherNode.id);
      if (!otherSearchState) {
        otherSearchState = pool.createNewState(otherNode);
        graph.nodeState.set(otherNode.id, otherSearchState);
      }

      if (otherSearchState.closed) {
        // Already processed this node.
        return;
      }
      if (otherSearchState.open === 0) {
        // Remember this node.
        graph.openSet.push(otherSearchState);
        otherSearchState.open = 1;
      }

      const tentativeDistance =
        cameFrom.distanceToSource + distance(otherNode, cameFrom.node, link);
      if (tentativeDistance >= otherSearchState.distanceToSource) {
        // This would only make our path longer. Ignore this route.
        return;
      }

      // bingo! we found shorter path:
      otherSearchState.parent = cameFrom;
      otherSearchState.distanceToSource = tentativeDistance;
      otherSearchState.fScore =
        tentativeDistance + heuristic(otherSearchState.node, to);

      graph.openSet.updateItem(otherSearchState.heapIndex);
    }
  }
}

function goalReached(searchState: NodeSearchState, targetNode: Node) {
  return searchState.node === targetNode;
}

function reconstructPath(
  searchState: NodeSearchState | null,
  width: number,
  factor: number = 1
) {
  let coords = [];
  if (searchState.parent !== null) {
    coords.push(...searchState.parent.node.trace);
  }
  const [x, y] = fromIdxToCoord(searchState.node.id, width);
  coords.push([x / factor, y / factor]);
  return coords;
}
