import "@tensorflow/tfjs-node";
import { preprocess } from "./preprocess";
import { Category } from "../../../types/Category";
import { Image } from "../../../types/Image";
import { Partition } from "../../../types/Partition";
import { Shape } from "../../../types/Shape";
import { RescaleOptions } from "../../../types/RescaleOptions";
import { generateDefaultChannels } from "../../../image/imageHelper";

jest.setTimeout(50000);

const inputShape: Shape = {
  width: 224,
  channels: 3,
  frames: 1,
  height: 224,
  planes: 1,
};

const rescaleOptions: RescaleOptions = {
  rescale: true,
  rescaleMinMax: { min: 2, max: 5 },
};

const categories: Array<Category> = [
  {
    color: "",
    id: "00000000-0000-0000-0000-00000000001",
    name: "",
    visible: true,
  },
  {
    color: "",
    id: "00000000-0000-0000-0000-00000000002",
    name: "",
    visible: true,
  },
];

const images: Array<Image> = [
  {
    categoryId: "00000000-0000-0000-0000-00000000001",
    colors: generateDefaultChannels(inputShape.channels),
    id: "00000000-0000-0000-0001-00000000000",
    annotations: [],
    name: "",
    originalSrc: [],
    src: "https://picsum.photos/seed/piximi/224",
    partition: Partition.Training,
    shape: inputShape,
  },
];

it("preprocess", async () => {
  const preprocessed = await preprocess(
    images,
    images,
    categories,
    inputShape,
    rescaleOptions
  );

  const items = await preprocessed.train.toArrayForTest();

  expect(items[0]["xs"].shape).toEqual([224, 224, 3]);
});
