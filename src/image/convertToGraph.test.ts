import "jest";
import { Node } from "ngraph.graph";
import { Image as ImageType } from "../types/Image";
import { Image } from "image-js";
import { fromIdxToCoord, makeGraph } from "./GraphHelper";
import { aStar } from "ngraph.path";

test("foo", async () => {
  // fetch an example image

  const image: ImageType = {
    id: "",
    instances: [],
    name: "foo.png",
    shape: { c: 512, channels: 3, r: 512 },
    src: "https://upload.wikimedia.org/wikipedia/en/a/a9/Example.jpg",
  };

  const src =
    "data:image/gif;base64,R0lGODlhCwALAIAAAAAA3pn/ZiH5BAEAAAEALAAAAAALAAsAAAIUhA+hkcuO4lmNVindo7qyrIXiGBYAOw==";

  const img = await Image.load(src);

  const grey = img.grey();
  const edges = grey.sobelFilter();
  console.log(edges);

  const graph = makeGraph(edges.data, img.height, img.width);

  const pathFinder = aStar(graph, {
    distance(fromNode: Node, toNode: Node) {
      const [x1, y1] = fromIdxToCoord(fromNode.id as number, img.width);
      const [x2, y2] = fromIdxToCoord(toNode.id as number, img.width);
      if (x1 === x2 || y1 === y2) {
        return toNode.data;
      }
      return 1.41 * toNode.data;
    },
  });
  const foundPath = pathFinder.find(4, 10);
  let node: Node;
  const pathCoords = [];
  const pathValues = [];
  const distanceValues = [];
  let lastId = 10;
  for (node of foundPath) {
    const id = node.id as number;
    const [x, y] = fromIdxToCoord(id, img.width);
    pathCoords.push([x, y]);
    pathValues.push(edges.data[id]);
    distanceValues.push(graph.getLink(lastId, id));
    lastId = id;
  }
  console.log(pathCoords);
  console.log(pathValues);
  console.log(distanceValues);
});
