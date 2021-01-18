/**
 * This class represents a single search node in the exploration tree for
 * A* algorithm.
 *
 * @param {Object} node  original node in the graph
 */
import { Node } from "ngraph.graph";

export class NodeSearchState {
  public node: Node | null = null;

  public parent: NodeSearchState | null = null;
  public closed: boolean = false;
  public open: number = 0;
  public distanceToSource: number = Number.POSITIVE_INFINITY;
  // the f(n) = g(n) + h(n) value
  public fScore: number = Number.POSITIVE_INFINITY;

  // used to reconstruct heap when fScore is updated.
  public heapIndex: number = -1;

  public constructor(init?: Partial<NodeSearchState>) {
    Object.assign(this, init);
  }
}

export function makeSearchStatePool() {
  let currentInCache = 0;
  const nodeCache: any[] = [];

  return {
    createNewState: createNewState,
    reset: reset,
  };

  function reset() {
    currentInCache = 0;
  }

  function createNewState(node: Node) {
    let cached = nodeCache[currentInCache];
    if (cached) {
      cached.node = node;
      // How we came to this node?
      cached.parent = null;

      cached.closed = false;
      cached.open = 0;

      cached.distanceToSource = Number.POSITIVE_INFINITY;
      // the f(n) = g(n) + h(n) value
      cached.fScore = Number.POSITIVE_INFINITY;

      // used to reconstruct heap when fScore is updated.
      cached.heapIndex = -1;
    } else {
      cached = new NodeSearchState({ node: node });
      nodeCache[currentInCache] = cached;
    }
    currentInCache++;
    return cached;
  }
}
