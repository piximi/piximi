import { Category, UNKNOWN_ANNOTATION_CATEGORY_ID } from "types/Category";
import { Shape } from "types/Shape";
import {
  encodeAnnotationToSegmentationMask,
  decodeSegmentationMaskToAnnotations,
} from "./segmentationMasks";
import { AnnotationType } from "types/AnnotationType";

jest.setTimeout(50000);

const annotationCategories: Array<Category> = [
  {
    color: "#920000",
    id: "00000000-0000-1111-0000-000000000000",
    name: "Unknown",
    visible: true,
  },
  {
    color: "#006ddb",
    id: "1dca6ba0-c53b-435d-a43f-d4a2bb4042a5",
    name: "Test",
    visible: true,
  },
];

it("create-segmentation-mask", async () => {
  const annotations: Array<AnnotationType> = [
    {
      boundingBox: [1, 1, 5, 5],
      categoryId: "1dca6ba0-c53b-435d-a43f-d4a2bb4042a5",
      id: "59b919c0-f052-4df6-b947-bb8f3c9359a7",
      mask: [0, 25],
      plane: 0,
    },
  ];

  const shape: Shape = {
    width: 10,
    height: 10,
    channels: 3,
    planes: 1,
  };

  const expectedSegmentationMask = [
    [
      [0, 0],
      [0, 0],
      [0, 0],
      [0, 0],
      [0, 0],
      [0, 0],
      [0, 0],
      [0, 0],
      [0, 0],
      [0, 0],
    ],
    [
      [0, 0],
      [0, 1],
      [0, 1],
      [0, 1],
      [0, 1],
      [0, 1],
      [0, 0],
      [0, 0],
      [0, 0],
      [0, 0],
    ],
    [
      [0, 0],
      [0, 1],
      [0, 1],
      [0, 1],
      [0, 1],
      [0, 1],
      [0, 0],
      [0, 0],
      [0, 0],
      [0, 0],
    ],
    [
      [0, 0],
      [0, 1],
      [0, 1],
      [0, 1],
      [0, 1],
      [0, 1],
      [0, 0],
      [0, 0],
      [0, 0],
      [0, 0],
    ],
    [
      [0, 0],
      [0, 1],
      [0, 1],
      [0, 1],
      [0, 1],
      [0, 1],
      [0, 0],
      [0, 0],
      [0, 0],
      [0, 0],
    ],
    [
      [0, 0],
      [0, 1],
      [0, 1],
      [0, 1],
      [0, 1],
      [0, 1],
      [0, 0],
      [0, 0],
      [0, 0],
      [0, 0],
    ],
    [
      [0, 0],
      [0, 0],
      [0, 0],
      [0, 0],
      [0, 0],
      [0, 0],
      [0, 0],
      [0, 0],
      [0, 0],
      [0, 0],
    ],
    [
      [0, 0],
      [0, 0],
      [0, 0],
      [0, 0],
      [0, 0],
      [0, 0],
      [0, 0],
      [0, 0],
      [0, 0],
      [0, 0],
    ],
    [
      [0, 0],
      [0, 0],
      [0, 0],
      [0, 0],
      [0, 0],
      [0, 0],
      [0, 0],
      [0, 0],
      [0, 0],
      [0, 0],
    ],
    [
      [0, 0],
      [0, 0],
      [0, 0],
      [0, 0],
      [0, 0],
      [0, 0],
      [0, 0],
      [0, 0],
      [0, 0],
      [0, 0],
    ],
  ];

  const createdCategories = annotationCategories
    .filter((category) => category.id !== UNKNOWN_ANNOTATION_CATEGORY_ID)
    .map((category) => category.id);

  const segmentationMask = encodeAnnotationToSegmentationMask(
    annotations,
    shape,
    createdCategories
  );

  expect(expectedSegmentationMask).toStrictEqual(segmentationMask);
});

it("create-annotation-from-segmentation-mask", async () => {
  const annotations: Array<AnnotationType> = [
    {
      boundingBox: [1, 1, 5, 5],
      categoryId: "1dca6ba0-c53b-435d-a43f-d4a2bb4042a5",
      id: "59b919c0-f052-4df6-b947-bb8f3c9359a7",
      mask: [0, 25],
      plane: 0,
    },
  ];

  const shape: Shape = {
    width: 10,
    height: 10,
    channels: 3,
    planes: 1,
  };

  const createdCategories = annotationCategories.filter(
    (category) => category.id !== UNKNOWN_ANNOTATION_CATEGORY_ID
  );

  const predictedSegmentationMask = [
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 1, 1, 1, 1, 1, 0, 0, 0, 0],
    [0, 1, 1, 1, 1, 1, 0, 0, 0, 0],
    [0, 1, 1, 1, 1, 1, 0, 0, 0, 0],
    [0, 1, 1, 1, 1, 1, 0, 0, 0, 0],
    [0, 1, 1, 1, 1, 1, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  ];

  const predictedAnnotations = decodeSegmentationMaskToAnnotations(
    createdCategories,
    predictedSegmentationMask,
    shape
  );

  expect(createdCategories[0].id).toStrictEqual(
    predictedAnnotations[0].categoryId
  );

  expect(annotations[0].boundingBox).toStrictEqual(
    predictedAnnotations[0].boundingBox
  );

  expect(annotations[0].mask).toStrictEqual(predictedAnnotations[0].mask);
});
