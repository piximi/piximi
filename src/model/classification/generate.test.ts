import "@tensorflow/tfjs-node";
import { Category, Image, Partition } from "@piximi/types";
import { generate } from "./generate";

jest.setTimeout(50000);

const categories: Array<Category> = [
  {
    description: "a",
    identifier: "11111111-1111-1111-1111-11111111111",
    index: 1,
    visualization: {
      color: "#FFFFFF",
      visible: true,
    },
  },
  {
    description: "b",
    identifier: "22222222-2222-2222-2222-22222222222",
    index: 2,
    visualization: {
      color: "#FFFFFF",
      visible: true,
    },
  },
];

const images: Array<Image> = [
  {
    categoryIdentifier: "11111111-1111-1111-1111-11111111111",
    checksum: "",
    data: "https://picsum.photos/seed/piximi/224",
    identifier: "11111111-1111-1111-1111-11111111111",
    partition: Partition.Training,
    scores: [],
    visualization: {
      brightness: 0,
      contrast: 0,
      visible: true,
      visibleChannels: [],
    },
  },
  {
    categoryIdentifier: "22222222-2222-2222-2222-22222222222",
    checksum: "",
    data: "https://picsum.photos/seed/piximi/224",
    identifier: "22222222-2222-2222-2222-22222222222",
    partition: Partition.Validation,
    scores: [],
    visualization: {
      brightness: 0,
      contrast: 0,
      visible: true,
      visibleChannels: [],
    },
  },
];

it("generate", async () => {
  const { data, validationData } = await generate(images, categories);

  expect((await data.toArray())[0].xs.shape).toEqual([224, 224, 3]);
  expect((await data.toArray())[0].ys.shape).toEqual([2]);

  expect((await validationData.toArray())[0].xs.shape).toEqual([224, 224, 3]);
  expect((await validationData.toArray())[0].ys.shape).toEqual([2]);
});
