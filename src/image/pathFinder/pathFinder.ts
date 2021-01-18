import { NodeHeap } from "./nodeHeap";
import { Graph, Node, Link } from "ngraph.graph";
import { makeSearchStatePool, NodeSearchState } from "./makeSearchStatePool";

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
 * @param {Object} options that configures search
 * @param {Function(a, b)} options.heuristic - a function that returns estimated distance between
 * nodes `a` and `b`. This function should never overestimate actual distance between two
 * nodes (otherwise the found path will not be the shortest). Defaults function returns 0,
 * which makes this search equivalent to Dijkstra search.
 * @param {Function(a, b)} options.distance - a function that returns actual distance between two
 * nodes `a` and `b`. By default this is set to return graph-theoretical distance (always 1);
 * @param {Boolean} options.oriented - whether graph should be considered oriented or not.
 *
 * @returns {Object} A pathfinder with single method `find()`.
 */
export function newPathSearch(graph: Graph) {
  // whether traversal should be considered over oriented graph.
  const oriented = true;

  const heuristic = (fromNode: Node, toNode: Node) => {
    return 0;
  };

  const distance = (fromNode: Node, toNode: Node, link: Link) => {
    return 1;
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
    console.log("Resetting pool");
    pool.reset();

    // Maps nodeId to NodeSearchState.
    const nodeState = new Map();

    // the nodes that we still need to evaluate
    const openSet = new NodeHeap();

    const startNode = pool.createNewState(from);
    nodeState.set(fromId, startNode);

    // For the first node, fScore is completely heuristic.
    startNode.fScore = heuristic(from, to);

    // The cost of going from start to start is zero.
    startNode.distanceToSource = 0;
    openSet.push(startNode);
    startNode.open = 1;

    let cameFrom: any;

    while (openSet.length > 0) {
      cameFrom = openSet.pop();

      if (goalReached(cameFrom, to)) return reconstructPath(cameFrom);

      // no need to visit this node anymore
      cameFrom.closed = true;
      cameFrom.node.trace = cameFrom.parent;
      cameFrom.node.target = from.id;
      cameFrom.node.closed = true;
      graph.forEachLinkedNode(cameFrom.node.id, visitNeighbour, oriented);
    }

    // If we got here, then there is no path.
    return NO_PATH;

    function visitNeighbour(otherNode: Node, link: Link) {
      let otherSearchState = nodeState.get(otherNode.id);
      if (!otherSearchState) {
        otherSearchState = pool.createNewState(otherNode);
        nodeState.set(otherNode.id, otherSearchState);
      }

      if (otherSearchState.closed) {
        // Already processed this node.
        return;
      }
      if (otherSearchState.open === 0) {
        // Remember this node.
        openSet.push(otherSearchState);
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

      openSet.updateItem(otherSearchState.heapIndex);
    }
  }
}

function goalReached(searchState: NodeSearchState, targetNode: Node) {
  return searchState.node === targetNode;
}

function reconstructPath(searchState: NodeSearchState, node: any = false) {
  if (node) {
    console.log("Got here");
    const path = [node];
    let parent = node.trace;

    while (parent) {
      path.push(parent.node);
      parent = parent.parent;
    }

    return path;
  }
  const path = [searchState.node];
  let parent = searchState.parent;

  while (parent) {
    path.push(parent.node);
    parent = parent.parent;
  }

  return path;
}
