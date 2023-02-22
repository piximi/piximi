import {
  Category,
  SerializedCOCOAnnotationType,
  SerializedCOCOCategoryType,
  SerializedCOCOFileType,
  SerializedCOCOImageType,
  ShadowImageType,
} from "types";

export const serializeCOCOFile = (
  images: Array<ShadowImageType>,
  categories: Array<Category>
): SerializedCOCOFileType => {
  let imCount = 0;
  let catCount = 0;
  let annCount = 0;

  const imIdMap = images.reduce((idMap, im) => {
    idMap[im.id] = {
      id: imCount++,
      width: im.shape.width,
      height: im.shape.height,
      file_name: im.name,
      license: 0,
      flickr_url: "",
      coco_url: "",
      date_captured: "",
    };
    return idMap;
  }, {} as { [internalImageId: string]: SerializedCOCOImageType });

  const catIdMap = categories.reduce((idMap, cat) => {
    idMap[cat.id] = {
      id: catCount++,
      name: cat.name,
      supercategory: cat.name,
    };
    return idMap;
  }, {} as { [internalCategoryId: string]: SerializedCOCOCategoryType });

  let serializedAnnotations: Array<SerializedCOCOAnnotationType> = [];

  for (const im of images) {
    for (const ann of im.annotations) {
      serializedAnnotations.push({
        id: annCount++,
        image_id: imIdMap[im.id].id,
        category_id: catIdMap[ann.categoryId].id,
        segmentation: [[]],
        area: 0,
        // x1, y1, width, height
        bbox: [
          ann.boundingBox[0],
          ann.boundingBox[1],
          ann.boundingBox[2] - ann.boundingBox[0],
          ann.boundingBox[3] - ann.boundingBox[1],
        ],
        iscrowd: 0,
      });
    }
  }

  const info = {
    year: new Date().getFullYear(),
    // TODO: COCO - get this from package.json
    version: "0.1.0",
    description: "",
    contributor: "",
    url: "",
    date_created: "",
  };

  const licenses = [
    {
      id: 0,
      name: "",
      url: "",
    },
  ];

  return {
    info,
    images: Object.values(imIdMap),
    categories: Object.values(catIdMap),
    annotations: serializedAnnotations,
    licenses,
  };
};
