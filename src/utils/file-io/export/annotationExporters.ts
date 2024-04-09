import * as ImageJS from "image-js";
import { decode, hexToRGBA } from "utils/annotator";
import saveAs from "file-saver";
import JSZip from "jszip";
import { AnnotationObject, Category, ImageObject } from "store/data/types";

export const saveAnnotationsAsBinaryInstanceSegmentationMasks = (
  images: Array<ImageObject>,
  annotations: Array<AnnotationObject>,
  categories: Array<Category>,
  zip: any,
  projectName: string
): any => {
  // imageId -> list of annotations it owns
  const annsByImId = annotations.reduce((idMap, ann) => {
    if (idMap[ann.imageId]) {
      idMap[ann.imageId].push(ann);
    } else {
      idMap[ann.imageId] = [ann];
    }
    return idMap;
  }, {} as { [imageId: string]: AnnotationObject[] });

  images.forEach((current) => {
    annsByImId[current.id].forEach((ann) => {
      const height = current.shape.height;
      const width = current.shape.width;

      const fullLabelImage = new ImageJS.Image(
        width,
        height,
        new Uint8Array().fill(0),
        {
          components: 1,
          alpha: 0,
        }
      );
      const decoded = decode(ann.encodedMask);
      const boundingBox = ann.boundingBox;
      const endX = Math.min(width, boundingBox[2]);
      const endY = Math.min(height, boundingBox[3]);

      //extract bounding box params
      const boundingBoxWidth = endX - boundingBox[0];
      const boundingBoxHeight = endY - boundingBox[1];

      const roiMask = new ImageJS.Image(
        boundingBoxWidth,
        boundingBoxHeight,
        decoded,
        {
          components: 1,
          alpha: 0,
        }
      );
      for (let i = 0; i < boundingBoxWidth; i++) {
        for (let j = 0; j < boundingBoxHeight; j++) {
          if (roiMask.getPixelXY(i, j)[0] > 0) {
            fullLabelImage.setPixelXY(
              i + ann.boundingBox[0],
              j + ann.boundingBox[1],
              [255, 255, 255]
            );
          }
        }
      }
      const blob = fullLabelImage.toBlob("image/png");
      const category = categories.find((category: Category) => {
        return category.id === ann.categoryId;
      });
      if (category) {
        zip.folder(`${current.name}/${category.name}`);
        zip.file(`${current.name}/${category.name}/${ann.id}.png`, blob, {
          base64: true,
        });
      }
    });
  });
  zip.generateAsync({ type: "blob" }).then((blob: Blob) => {
    saveAs(blob, `${projectName}.zip`);
  });
};

export const saveAnnotationsAsLabeledSemanticSegmentationMasks = (
  images: Array<ImageObject>,
  annotations: Array<AnnotationObject>,
  categories: Array<Category>,
  zip: any,
  projectName: string
): any => {
  // imageId -> list of annotations it owns
  const annsByImId = annotations.reduce((idMap, ann) => {
    if (idMap[ann.imageId]) {
      idMap[ann.imageId].push(ann);
    } else {
      idMap[ann.imageId] = [ann];
    }
    return idMap;
  }, {} as { [imageId: string]: AnnotationObject[] });

  images.forEach((current) => {
    const height = current.shape.height;
    const width = current.shape.width;

    const fullLabelImage = new ImageJS.Image(
      width,
      height,
      new Uint8Array().fill(0),
      {
        components: 1,
        alpha: 0,
      }
    );
    categories.forEach((category: Category) => {
      const categoryColor = hexToRGBA(category.color);
      if (!categoryColor) return;

      for (let ann of annsByImId[current.id]) {
        if (ann.categoryId !== category.id) continue;
        const decoded = decode(ann.encodedMask!);
        const boundingBox = ann.boundingBox;
        const endX = Math.min(width, boundingBox[2]);
        const endY = Math.min(height, boundingBox[3]);

        //extract bounding box params
        const boundingBoxWidth = endX - boundingBox[0];
        const boundingBoxHeight = endY - boundingBox[1];

        const roiMask = new ImageJS.Image(
          boundingBoxWidth,
          boundingBoxHeight,
          decoded,
          {
            components: 1,
            alpha: 0,
          }
        );
        for (let i = 0; i < boundingBoxWidth; i++) {
          for (let j = 0; j < boundingBoxHeight; j++) {
            if (roiMask.getPixelXY(i, j)[0] > 0) {
              fullLabelImage.setPixelXY(
                i + ann.boundingBox[0],
                j + ann.boundingBox[1],
                categoryColor
              );
            }
          }
        }
      }
    });
    const blob = fullLabelImage.toBlob("image/png");
    zip.file(`${current.name}.png`, blob, {
      base64: true,
    });
  });
  zip.generateAsync({ type: "blob" }).then((blob: Blob) => {
    saveAs(blob, `${projectName}.zip`);
  });
};

export const saveAnnotationsAsLabelMatrix = async (
  images: Array<ImageObject>,
  annotations: Array<AnnotationObject>,
  categories: Array<Category>,
  zip: JSZip,
  random: boolean = false,
  binary: boolean = false
) => {
  // image id -> image
  const imIdMap = images.reduce(
    (idMap, im) => ({ ...idMap, [im.id]: im }),
    {} as { [internalImageId: string]: ImageObject }
  );

  // cat id -> cat name
  const catIdMap = categories.reduce(
    (idMap, cat) => ({ ...idMap, [cat.id]: cat.name }),
    {} as { [internalCategoryId: string]: string }
  );

  // image name -> cat name -> annotations
  const annIdMap = {} as {
    [imName: string]: { [catName: string]: AnnotationObject[] };
  };

  for (const ann of annotations) {
    const im = imIdMap[ann.imageId];
    const catName = catIdMap[ann.categoryId];

    if (!annIdMap.hasOwnProperty(im.name)) {
      annIdMap[im.name] = {};
    }

    if (!annIdMap[im.name].hasOwnProperty(catName)) {
      annIdMap[im.name][catName] = [];
    }

    annIdMap[im.name][catName].push(ann);
  }

  for (const im of images) {
    // for image names like blah.png
    const imCleanName = im.name.split(".")[0];

    for (const cat of categories) {
      const fullLabelImage = new ImageJS.Image(
        im.shape.width,
        im.shape.height,
        new Uint8Array().fill(0),
        { components: 1, alpha: 0 }
      );

      let r = binary ? 255 : 1;
      let g = binary ? 255 : 1;
      let b = binary ? 255 : 1;

      const imCatAnns = annIdMap[im.name][cat.name];

      // no annotations for this category, in this image
      if (!imCatAnns) continue;

      for (const ann of imCatAnns) {
        if (random) {
          r = Math.round(Math.random() * 255);
          g = Math.round(Math.random() * 255);
          b = Math.round(Math.random() * 255);
        } else if (!binary) {
          r = r + 1;
          b = b + 1;
          g = g + 1;
        }

        const decoded = decode(ann.encodedMask);
        const boundingBox = ann.boundingBox;
        const endX = Math.min(im.shape.width, boundingBox[2]);
        const endY = Math.min(im.shape.height, boundingBox[3]);

        //extract bounding box params
        const boundingBoxWidth = endX - boundingBox[0];
        const boundingBoxHeight = endY - boundingBox[1];

        const roiMask = new ImageJS.Image(
          boundingBoxWidth,
          boundingBoxHeight,
          decoded,
          {
            components: 1,
            alpha: 0,
          }
        );
        for (let i = 0; i < boundingBoxWidth; i++) {
          for (let j = 0; j < boundingBoxHeight; j++) {
            if (roiMask.getPixelXY(i, j)[0] > 0) {
              fullLabelImage.setPixelXY(
                i + ann.boundingBox[0],
                j + ann.boundingBox[1],
                [r, g, b]
              );
            }
          }
        }
      }

      const imCatBlob = await fullLabelImage.toBlob("image/png");
      zip.folder(`${imCleanName}`);
      zip.file(`${imCleanName}/${cat.name}.png`, imCatBlob, { base64: true });
    }
  }
};
