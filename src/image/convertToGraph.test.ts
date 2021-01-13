import "jest";
import createGraph from "ngraph.graph";
import { Image as ImageType } from "../types/Image";
import { Image } from "image-js";
import { sobel } from "./imageHelper";
import { makeGraph } from "./convertToGraph";

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
  edges.invert({ inPlace: true });

  const graph = makeGraph(edges.data, img.height, img.width);
  console.log(graph.getNode(30));

  // run sobel transform
  // iterate through graph pixels : for each pixel, get neighbours and create graph links

  // let graph = createGraph();
  // graph.addLink('a', 'b', {weight: 10});
  // graph.addLink('b', 'a', {weight: 5});
  // console.log(graph.getLink('b', 'a'));
  // console.log(graph.getLink('a', 'b'));
});
