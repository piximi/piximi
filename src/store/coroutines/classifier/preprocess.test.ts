import "@tensorflow/tfjs-node";
import { preprocess } from "./preprocess";
import { Category } from "../../../types/Category";
import { Image } from "../../../types/Image";

jest.setTimeout(50000);

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
    id: "00000000-0000-0000-0001-00000000000",
    name: "",
    src: "https://picsum.photos/seed/piximi/224",
  },
  {
    categoryId: "00000000-0000-0000-0000-00000000002",
    id: "00000000-0000-0000-0002-00000000000",
    name: "",
    src: "https://picsum.photos/seed/piximi/224",
  },
];

it("preprocess", async () => {
  const preprocessed = await preprocess(images, categories);

  const items = await preprocessed.toArrayForTest();

  expect(items[0]["xs"].shape).toEqual([224, 224, 3]);
});
