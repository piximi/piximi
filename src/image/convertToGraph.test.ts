import "jest";
import { Link, Node } from "ngraph.graph";
import { Image as ImageType } from "../types/Image";
import { Image, ThresholdAlgorithm } from "image-js";
import { fromIdxToCoord, makeGraph } from "./convertToGraph";

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
  const thresholdedEdges = edges.mask({ threshold: 30 });
  const invertedEdges = thresholdedEdges.invert();

  const graph = makeGraph(invertedEdges.data, img.height, img.width);

  // for example, ind best path between node 11 and 45
  let path = require("ngraph.path");
  const pathFinder = path.aStar(graph, {
    distance(fromNode: number, toNode: number, link: Link) {
      return -1 * link.data;
    },
  });
  const foundPath = pathFinder.find(5, 10);
  let node: Node;
  for (node of foundPath) {
    const id = node.id as number;
    const [x, y] = fromIdxToCoord(id, img.width);
    console.log(x, y);
  }
});
