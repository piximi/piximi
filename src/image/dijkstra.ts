export class Graph {
  private map: any;

  constructor(map: any) {
    this.map = map;
  }

  extractKeys(obj: { [p: string]: Array<string> }) {
    const keys = [];

    for (let key in obj) {
      Object.prototype.hasOwnProperty.call(obj, key) && keys.push(key);
    }
    return keys;
  }

  sorter(a: string, b: string) {
    return parseFloat(a) - parseFloat(b);
  }

  findPaths(
    map: { [key: string]: number }[],
    start: string,
    end: string | number
  ) {
    let costs: { [key: string]: number } = {};
    let open: { [key: string]: Array<string> } = { "0": [start] };
    let predecessors: { [key: string]: string } = {};
    let keys;

    const addToOpen = (cost: number, vertex: string) => {
      const key = "" + cost;
      if (!open[key]) open[key] = [];
      open[key].push(vertex);
    };

    costs[start] = 0;

    while (open) {
      if (!(keys = this.extractKeys(open)).length) break;

      keys.sort(this.sorter);

      let key = keys[0];
      let bucket = open[key];
      let node = bucket.shift();
      let currentCost = parseFloat(key);

      let adjacentNodes: { [key: string]: number } = node
        ? map[parseInt(node)]
        : {};

      if (!bucket.length) delete open[key];

      for (const vertex in adjacentNodes) {
        if (Object.prototype.hasOwnProperty.call(adjacentNodes, vertex)) {
          const cost = adjacentNodes[vertex];
          const totalCost = cost + currentCost;
          const vertexCost = costs[vertex];

          if (vertexCost === undefined || vertexCost > totalCost) {
            costs[vertex] = totalCost;
            addToOpen(totalCost, vertex);
            // TODO: node might be undefined
            predecessors[vertex] = node!;
          }
        }
      }
    }

    if (costs[end] === undefined) {
      return null;
    } else {
      return predecessors;
    }
  }

  extractShortest(predecessors: { [x: string]: any }, end: any) {
    const nodes = [];
    let u = end;

    while (u !== undefined) {
      nodes.push(u);
      u = predecessors[u];
    }

    nodes.reverse();
    return nodes;
  }

  findShortestPath(map: { [key: string]: number }[], nodes: any[]) {
    let start = nodes.shift();
    let end: string | number;
    let predecessors: {} | null;
    const path: any[] = [];
    let shortest: any[];

    while (nodes.length) {
      end = nodes.shift();
      predecessors = this.findPaths(map, start, end);

      if (predecessors) {
        shortest = this.extractShortest(predecessors, end);
        if (nodes.length) {
          path.push.apply(path, shortest.slice(0, -1));
        } else {
          return path.concat(shortest);
        }
      } else {
        return null;
      }
      start = end;
    }
  }

  toArray(list: string | IArguments | any[], offset: number | undefined) {
    try {
      return Array.prototype.slice.call(list, offset);
    } catch (e) {
      const a = [];
      for (let i = offset || 0, l = list.length; i < l; ++i) {
        a.push(list[i]);
      }
      return a;
    }
  }

  _findShortestPath(start: any[], end: any) {
    if (Object.prototype.toString.call(start) === "[object Array]") {
      return this.findShortestPath(this.map, start);
    } else if (arguments.length === 2) {
      return this.findShortestPath(this.map, [start, end]);
    } else {
      return this.findShortestPath(this.map, this.toArray(arguments, 0));
    }
  }

  // _findShortestPath(map: object[], start: any[], end: any) {
  //     if (Object.prototype.toString.call(start) === '[object Array]') {
  //         return this._findShortestPath(map, start);
  //     } else if (arguments.length === 3) {
  //         return this._findShortestPath(map, [start, end]);
  //     } else {
  //         return this._findShortestPath(map, toArray(arguments, 1));
  //     }
  // }
}
