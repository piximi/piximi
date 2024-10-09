import { decode } from "utils/annotator";
import JSZip from "jszip";
import { AnnotationObject, Category, ImageObject } from "store/data/types";
import { merge } from "lodash";
import { TiffIO, BaseIFD } from "../tiff-io";
import { AnnotationExportType } from "../enums";

type MaskOptions =
  | {
      binary?: false;
      random?: boolean;
      color?: boolean;
    }
  | { binary?: true; random?: false; color?: false };

type ImageField = string;
type KindField = string;
type CategoryField = string;
type LMasksTiff = Record<
  ImageField,
  Record<
    KindField,
    Record<
      CategoryField,
      { mask: Uint8Array; width: number; height: number; planes: number }
    >
  >
>;

const processAnnotation = (
  ann: AnnotationObject,
  images: Record<string, ImageObject>,
  categories: Record<string, Category>
) => {
  const image = images[ann.imageId];
  const imageShape = image.shape;
  const bbox = ann.boundingBox;

  return {
    imageName: image.name.split(".")[0],
    bboxShape: {
      x: bbox[0],
      y: bbox[1],
      width: bbox[2] - bbox[0],
      height: bbox[3] - bbox[1],
    },
    plane: ann.activePlane,
    decodedMask: ann.decodedMask ?? decode(ann.encodedMask),
    categoryName: categories[ann.categoryId].name,
    kind: ann.kind,
    imageShape,
  };
};

const updateColors = (
  colors: { r: number; g: number; b: number },
  maskOptions: MaskOptions,
  colorValues: string[]
) => {
  if (maskOptions.random) {
    do {
      colors.r = Math.round(Math.random() * 255);
      colors.g = Math.round(Math.random() * 255);
      colors.b = Math.round(Math.random() * 255);
    } while (colorValues.includes(`${colors.r} ${colors.g} ${colors.b}`));

    colorValues.push(`${colors.r} ${colors.g} ${colors.b}`);
  } else if (!maskOptions.binary) {
    colors.r++;
    colors.g++;
    colors.b++;
  }
};

// image id -> image
export const exportAnnotationMasks = (
  images: Record<string, ImageObject>,
  annotations: Record<string, AnnotationObject>,
  categories: Record<string, Category>,
  projectName: string,
  zip: JSZip,

  exportType: AnnotationExportType = AnnotationExportType.LabeledInstances
) => {
  const utif = new TiffIO();
  let masks: LMasksTiff = {};
  const maskOptions: MaskOptions = {
    random: false,
    binary: false,
    color: false,
  };
  const colors = {
    r: maskOptions.binary ? 255 : 0,
    g: maskOptions.binary ? 255 : 0,
    b: maskOptions.binary ? 255 : 0,
  };

  const colorValues: string[] = [];
  const annotationCounts: Record<string, number> = {};
  let categoryColorMap: Record<string, Record<string, number>> = {};
  for (const annId in annotations) {
    // for image names like blah.png
    const annotation = annotations[annId];

    let {
      imageName,
      bboxShape,
      plane,
      decodedMask,
      categoryName,
      kind,
      imageShape,
    } = processAnnotation(annotation, images, categories);

    switch (exportType) {
      case AnnotationExportType.BinaryInstances:
        // output {imageName}/{kind}/{category_n}.tiff where n is the annotation index
        const combinedName = `${kind}-${categoryName}`;
        if (combinedName in annotationCounts) {
          const count = annotationCounts[combinedName];
          categoryName += `_${count}`;
          annotationCounts[combinedName]++;
        } else {
          categoryName += `_0`;
          annotationCounts[combinedName] = 1;
        }
        break;
      case AnnotationExportType.Matrix:
        //output {imageName}/{kind}.tiff
        categoryName = kind;
        break;
      case AnnotationExportType.LabeledInstances:
        // output color images (1 channel per plane) as {imageName}/{kind_category}.tiff, {kind}.tiff
        maskOptions.color = true;
        maskOptions.random = true;
        if (!masks?.[imageName]?.[kind]?.[kind]) {
          const arraySize = maskOptions.color
            ? imageShape.width * imageShape.height * imageShape.planes * 3
            : imageShape.width * imageShape.height * imageShape.planes;
          const imageArray = new Uint16Array(arraySize);
          imageArray.fill(0);

          masks = merge(masks, {
            [imageName]: {
              [kind]: {
                [kind]: {
                  mask: imageArray,
                  width: imageShape.width,
                  height: imageShape.height,
                  planes: imageShape.planes,
                },
              },
            },
          });
        }
        break;
      case AnnotationExportType.LabeledSemanticMasks:
        // outputs {imageName}/{kind}.tiff but with annotations colored by category
        if (!(kind in categoryColorMap)) {
          categoryColorMap[kind] = { [categoryName]: 1 };
        } else {
          if (!(categoryName in categoryColorMap[kind])) {
            categoryColorMap[kind][categoryName] = Object.keys(
              categoryColorMap[kind]
            ).length;
          }
        }
        break;
      case AnnotationExportType.BinarySemanticMasks:
        // outputs {imageName}/{kind}/{category}.tiff
        break;
    }

    if (!masks?.[imageName]?.[kind]?.[categoryName]) {
      const arraySize = maskOptions.color
        ? imageShape.width * imageShape.height * imageShape.planes * 3
        : imageShape.width * imageShape.height * imageShape.planes;
      const imageArray = new Uint16Array(arraySize);
      imageArray.fill(0);

      masks = merge(masks, {
        [imageName]: {
          [kind]: {
            [categoryName]: {
              mask: imageArray,
              width: imageShape.width,
              height: imageShape.height,
              planes: imageShape.planes,
            },
          },
        },
      });
    }

    updateColors(colors, maskOptions, colorValues);
    const c = Object.values(colors);

    for (let i = 0; i < decodedMask.byteLength; i++) {
      const pixel = decodedMask[i];
      if (pixel === 0) continue;
      const bboxOffsetY = bboxShape.y + Math.floor(i / bboxShape.width);
      const offsetX = bboxShape.x + (i % bboxShape.width);
      if (maskOptions.color) {
        for (let i = 0; i < c.length; i++) {
          const planeOffset = (plane + i) * imageShape.height;
          const offsetY = (bboxOffsetY + planeOffset) * imageShape.width;
          const imPixelPosition = offsetY + offsetX;
          masks[imageName][kind][categoryName].mask[imPixelPosition] = c[i];
          if (exportType === AnnotationExportType.LabeledInstances) {
            masks[imageName][kind][kind].mask[imPixelPosition] = c[i];
          }
        }
      } else {
        const planeOffset = plane * imageShape.height;
        const offsetY = (bboxOffsetY + planeOffset) * imageShape.width;

        const imPixelPosition = offsetY + offsetX;

        masks[imageName][kind][categoryName].mask[imPixelPosition] =
          exportType === AnnotationExportType.LabeledSemanticMasks
            ? categoryColorMap[kind][categoryName]
            : pixel;
      }
    }
  }

  zip.folder(`${projectName}`);
  for (const [imName, kinds] of Object.entries(masks)) {
    zip.folder(`${projectName}/${imName}`);
    for (const [kindName, cats] of Object.entries(kinds)) {
      const dirName =
        exportType === AnnotationExportType.BinaryInstances
          ? `${projectName}/${imName}/${kindName}`
          : `${projectName}/${imName}`;
      zip.folder(dirName);
      for (const [catName, labelImage] of Object.entries(cats)) {
        const ifdTemplate: BaseIFD = {
          "254": [2],
          "256": [labelImage.width], // width -- max 4 bytes
          "257": [labelImage.height], // height -- max 4 bytes
          "258": [labelImage.mask.BYTES_PER_ELEMENT * 8], // bits per sample -- max 2 bytes
          "259": [1], // compression -- max 2 bytes
          "262": [1], // photometric interpretation -- max 2 bytes
          "273": [], // strips offset -- max 4 bytes
          "277": [1], // samples per pixel -- max 2 bytes
          "278": [labelImage.height], // rows per strip -- max 4 bytes
          "279": [
            labelImage.width *
              labelImage.height *
              labelImage.mask.BYTES_PER_ELEMENT,
          ], // strip byte counts -- max 4 bytes
          "282": [[72, 1]], // x resolution -- 8 bytes
          "283": [[72, 1]], // y resolution -- 8 bytes
          "284": [1], // planar configuration max 2 bytes
          "296": [1], // resolution unit max 2 bytes
        };

        const numIfds = maskOptions.color
          ? labelImage.planes * 3
          : labelImage.planes;
        const { ifds, ifdBlockSize } = utif.generateIFDObject(
          ifdTemplate,
          numIfds
        );

        const encoded = utif.encodeImage(labelImage.mask, ifds, ifdBlockSize);

        const blob = new Blob([encoded], { type: "image/tiff" });

        const fileName =
          exportType !== AnnotationExportType.BinaryInstances
            ? kindName === catName
              ? `${kindName}.tiff`
              : `${kindName}_${catName}.tiff`
            : `${catName}.tiff`;
        zip.file(`${dirName}/${fileName}`, blob, {
          base64: true,
        });
      }
    }
  }
};
