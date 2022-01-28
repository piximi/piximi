import * as ImageJS from "image-js";
import { AnnotationType } from "../types/AnnotationType";
import { decode } from "../annotator/image/rle";
import { Category, UNKNOWN_CATEGORY_ID } from "../types/Category";
import { SerializedAnnotationType } from "../types/SerializedAnnotationType";
import { saveAs } from "file-saver";
import { ShapeType } from "../types/ShapeType";
import { v4 as uuidv4 } from "uuid";
import { Partition } from "../types/Partition";
import { Image as ImageType } from "../types/Image";
import * as _ from "lodash";
import { DEFAULT_COLORS } from "../types/Colors";
import { ChannelType } from "../types/ChannelType";

export const mapChannelsToDefaultColorImage = (
  data: Array<Array<number>>,
  rows: number,
  columns: number
) => {
  //TODO write docs (this function is used on new image loading, we use default colors to map image)
  const defaultColors = DEFAULT_COLORS;
  const n_channels = data.length;
  const colors = defaultColors.slice(0, n_channels);
  const channels = colors.map((color: Array<number>) => {
    return { visible: true, range: [0, 255], color };
  });
  return mapChannelstoSpecifiedRGBImage(data, channels, rows, columns);
};

export const mapChannelstoSpecifiedRGBImage = (
  data: Array<Array<number>>,
  colors: Array<ChannelType>,
  rows: number,
  columns: number
): string => {
  /**
   * Given an matrix of numbers of shape C x MN (image data for each channel), assign colors to channels and convert to RGB image
   * returns the data URI of that RGB image, to be displayed on canvas
   * data: the channels data
   * colors: the colors to be assigned to each channel
   * returns a URI image for display
   * **/

  const summedChannels: Array<Array<number>> = new Array(rows * columns).fill([
    0, 0, 0,
  ]);

  const mappedChannels = [];

  //iterate through each channel
  for (let channel_idx = 0; channel_idx < data.length; channel_idx++) {
    const color = colors[channel_idx];

    //for each channel
    const channelData: Array<number> = data[channel_idx];
    const max = 255; //TODO is it okay to assume 8-bit for now
    let mappedChannel: Array<Array<number>> = [];

    if (!color.visible) {
      mappedChannel = new Array(channelData.length).fill([0, 0, 0]);
    } else {
      channelData.forEach((pixel: number, j: number) => {
        let mapped_pixel: number = pixel;
        if (pixel < color.range[0]) {
          mapped_pixel = 0;
        } else if (pixel >= color.range[1]) {
          mapped_pixel = 255;
        } else {
          mapped_pixel =
            255 *
            ((pixel - color.range[0]) / (color.range[1] - color.range[0]));
        }
        //iterate through each pixel
        const red: number = (color.color[0] * mapped_pixel) / max;
        const green: number = (color.color[1] * mapped_pixel) / max;
        const blue: number = (color.color[2] * mapped_pixel) / max;
        mappedChannel.push([red, green, blue]);
      });
    }

    mappedChannels.push(mappedChannel);
  }

  for (let j = 0; j < rows * columns; j++) {
    // for each pixel j
    for (let i = 0; i < mappedChannels.length; i++) {
      //for each channel i
      summedChannels[j] = [
        Math.min(summedChannels[j][0] + mappedChannels[i][j][0], 255),
        Math.min(summedChannels[j][1] + mappedChannels[i][j][1], 255),
        Math.min(summedChannels[j][2] + mappedChannels[i][j][2], 255),
      ];
    }
  }

  //TODO, above we cap to 255, but maybe it must be nromalized as (see github link below)
  //TODO summedChannels needs to be normalized as: https://github.com/broadinstitute/DavidStirling_Projects/blob/master/Python%20Scripts/Average_Cell_Visualisation/visualise_single_cells_clean.ipynb
  //right now this is just a simplified version
  const flattened: Array<number> = _.flatten(summedChannels);
  //TODO fix this
  // const min = 0;
  // const max = 255;
  // // const min = _.min(flattened);
  // // const max = _.max(flattened);
  // // if (!max || !min) return "";
  // for (let j = 0; j < flattened.length; j++) {
  //   flattened[j] = (flattened[j] - min) / (max - min);
  // }

  const img: ImageJS.Image = new ImageJS.Image(columns, rows, flattened, {
    components: 3,
    alpha: 0,
  });

  return img.toDataURL("image/png", {
    useCanvas: true,
  });
};

export const extractChannelsFromURIImage = () => {
  //TODO implement this
};

export const extractChannelsFromFlattenedArray = (
  flattened: Uint8Array,
  channels: number,
  pixels: number
): Array<Array<number>> => {
  /**
   * Given a flattened data array from greyscale ir RGB imageJ Image[channel1_pix1, channel2_pix1, channel3_pix1, channel1_pix2, channel2_pix2, channel3_pix2, etc....], extract each channel separately
   * as array.
   * **/
  if (channels === 1) {
    //if greyscale, leave array as is, no need to extract, individual channel values
    return [Array.from(flattened)];
  }

  const results = [];
  for (let k = 0; k < channels; k++) {
    results.push(new Array(pixels).fill(0)); //initialize channels
  }

  let i = 0; //iterate over all flattened data
  while (i < flattened.length) {
    let j = 0;
    while (j < channels) {
      results[j][i / channels] = flattened[i + j];
      j += 1;
    }
    i += j;
  }
  return results;
};

export const convertFileToImage = async (
  file: File,
  z_stack?: boolean
): Promise<ImageType> => {
  /**
   * Returns image to be provided to dispatch
   * **/
  return new Promise((resolve, reject) => {
    return file.arrayBuffer().then((buffer) => {
      ImageJS.Image.load(buffer).then((image: ImageJS.Image) => {
        resolve(convertImageJStoImage(image, file.name, z_stack));
      });
    });
  });
};

export const convertFilesToImages = async (
  files: FileList,
  is_stack?: boolean
) => {
  /**
   * Give File List, iterate over each files, get image, and return list of images to update
   * **/
  const newImages: Array<ImageType> = [];

  for (let i = 0; i < files.length; i++) {
    const image = await convertFileToImage(files[i], is_stack);
    newImages.push(image);
  }

  return newImages;
};

export const isArrayOfImages = async (
  file: File,
  callback: () => void
): Promise<boolean> => {
  /**
   * Checks whether the selected file corresponds to an array of images. In which case we need clarification from user whether this image is a z-stack or not.
   * **/
  return new Promise((resolve, reject) => {
    return file.arrayBuffer().then((buffer) => {
      ImageJS.Image.load(buffer).then((image: ImageJS.Image) => {
        if (Array.isArray(image)) {
          callback();
          resolve(true);
        } else {
          resolve(false);
        }
      });
    });
  });
};

export const convertImageDataToURI = (
  width: number,
  height: number,
  data: Array<number>,
  components: number,
  alpha: 0 | 1 | undefined
) => {
  ///TODO write doc
  const img: ImageJS.Image = new ImageJS.Image(width, height, data, {
    components: components,
    alpha: alpha ? alpha : 0,
  });

  return img.toDataURL("image/png", {
    useCanvas: true,
  });
};

export const convertImageJStoImage = (
  image: ImageJS.Image,
  filename: string,
  z_stack?: boolean
): ImageType => {
  /**
   * Given an ImageJS Image object, construct appropriate Image type. Return Image.
   * returns: the image of Image type
   * **/

  let nplanes = 1;
  let height: number;
  let width: number;
  let channelsData: Array<Array<Array<number>>> = [];
  let channels: number;

  let imageSrc: string;

  if (Array.isArray(image)) {
    height = image[0].height;
    width = image[0].width;

    if (z_stack) {
      //user uploaded z stack image: assuming dimensions ZXYC
      nplanes = image.length;

      channels = image[0].components; //this will be either 1 (greyscale) or 3 (rgb)

      for (let j = 0; j < image.length; j++) {
        channelsData.push(
          extractChannelsFromFlattenedArray(
            image[j].data as Uint8Array,
            channels,
            image[j].height * image[j].width
          )
        );
      }

      //make imageSrc using middle image
      const middleIndex = Math.floor(image.length / 2);
      imageSrc = convertImageDataToURI(
        width,
        height,
        image[middleIndex].data,
        channels,
        image[middleIndex].alpha
      );
    } else {
      //user has uploaded a multi-channel image (CXY), which was loaded as an array of images (one channel per image).
      channels = image.length;
      nplanes = 1;

      const tmp: Array<Array<number>> = [];

      for (let j = 0; j < channels; j++) {
        //iterate over each image (which is a channel), push to array
        tmp.push(
          extractChannelsFromFlattenedArray(
            image[j].data as Uint8Array,
            1,
            height * width
          )[0]
        );
      }

      channelsData.push(tmp);

      const idx = 0; //the channel we choose ton show as image preview

      imageSrc = convertImageDataToURI(
        image[idx].width,
        image[idx].height,
        Array.from(image[idx].data),
        1,
        image[idx].alpha
      );
    }
  } else {
    //Case where image of dimension YXC was uploaded, C is  just 1 (grayscale) or 3 (RGB)

    height = image.height;
    width = image.width;
    channels = image.components;
    nplanes = 1;

    console.info(image.data.length);

    channelsData = [
      extractChannelsFromFlattenedArray(
        image.data as Uint8Array,
        image.components,
        image.height * image.width
      ),
    ];

    imageSrc = convertImageDataToURI(
      width,
      height,
      Array.from(image.data),
      channels,
      image.alpha
    );
  }

  const shape: ShapeType = {
    channels: channels,
    frames: 1,
    height: height,
    planes: nplanes,
    width: width,
  };

  return {
    categoryId: UNKNOWN_CATEGORY_ID,
    id: uuidv4(),
    annotations: [],
    name: filename,
    shape: shape,
    originalSrc: channelsData,
    partition: Partition.Inference,
    src: imageSrc,
  };
};

export const connectPoints = (
  coordinates: Array<Array<number>>,
  image: ImageJS.Image
) => {
  let connectedPoints: Array<Array<number>> = [];

  const foo = _.filter(
    _.zip(coordinates.slice(0, coordinates.length - 1), coordinates.slice(1)),
    ([current, next]) => {
      return !_.isEqual(current, next);
    }
  );
  foo.forEach(([current, next]) => {
    const points = drawLine(current!, next!);
    connectedPoints = _.concat(connectedPoints, points);
  });
  return connectedPoints;
};

export const drawLine = (p: Array<number>, q: Array<number>) => {
  const coords: Array<Array<number>> = [];

  let x: number,
    y: number,
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    dx: number,
    dy: number,
    step: number,
    i: number;

  x1 = Math.round(p[0]);
  y1 = Math.round(p[1]);
  x2 = Math.round(q[0]);
  y2 = Math.round(q[1]);

  dx = x2 - x1;
  dy = y2 - y1;

  step = Math.abs(dy);

  if (Math.abs(dx) >= Math.abs(dy)) {
    step = Math.abs(dx);
  }

  dx = dx / step;
  dy = dy / step;
  x = x1;
  y = y1;
  i = 1;

  while (i <= step) {
    coords.push([Math.round(x), Math.round(y)]);
    x = x + dx;
    y = y + dy;
    i = i + 1;
  }

  return coords;
};

export const getIdx = (width: number, nchannels: number) => {
  return (x: number, y: number, index: number) => {
    index = index || 0;
    return Math.floor((width * y + x) * nchannels + index);
  };
};

/*
Given a click at a position, return all overlapping annotations ids
 */
export const getOverlappingAnnotations = (
  position: { x: number; y: number },
  annotations: Array<AnnotationType>,
  imageWidth: number,
  imageHeight: number
) => {
  const overlappingAnnotations = annotations.filter(
    (annotation: AnnotationType) => {
      const boundingBox = annotation.boundingBox;
      if (
        position.x >= boundingBox[0] &&
        position.x <= boundingBox[2] &&
        position.y >= boundingBox[1] &&
        position.y <= boundingBox[3]
      ) {
        const boundingBoxWidth = boundingBox[2] - boundingBox[0];
        const boundingBoxHeight = boundingBox[3] - boundingBox[1];
        if (boundingBoxHeight && boundingBoxWidth) {
          //return annotation if clicked on actual selected data
          const maskROI = new ImageJS.Image(
            boundingBox[2] - boundingBox[0],
            boundingBox[3] - boundingBox[1],
            decode(annotation.mask),
            { components: 1, alpha: 0 }
          );
          if (
            maskROI.getPixelXY(
              Math.round(position.x - boundingBox[0]),
              Math.round(position.y - boundingBox[1])
            )[0]
          )
            return true;
        }
      }
      return false;
    }
  );
  return overlappingAnnotations.map((annotation: AnnotationType) => {
    return annotation.id;
  });
};

export const getAnnotationsInBox = (
  minimum: { x: number; y: number },
  maximum: { x: number; y: number },
  annotations: Array<AnnotationType>
) => {
  return annotations.filter((annotation: AnnotationType) => {
    return (
      minimum.x <= annotation.boundingBox[0] &&
      minimum.y <= annotation.boundingBox[1] &&
      maximum.x >= annotation.boundingBox[2] &&
      maximum.y >= annotation.boundingBox[3]
    );
  });
};

/*
 * From encoded mask data, get the decoded data and return results as an HTMLImageElement to be used by Konva.Image
 * Warning: the mask produced from the decoded data is scaled to fit the stage.
 *          when creating an image from mask, the original width/height should be scaled by the same scale factor
 */
export const colorOverlayROI = (
  encodedMask: Array<number>,
  boundingBox: [number, number, number, number],
  imageWidth: number,
  imageHeight: number,
  color: Array<number>,
  scalingFactor: number
): HTMLImageElement | undefined => {
  if (!encodedMask) return undefined;

  const decodedData = decode(encodedMask);

  const endX = Math.min(imageWidth, boundingBox[2]);
  const endY = Math.min(imageHeight, boundingBox[3]);

  //extract bounding box params
  const boxWidth = endX - boundingBox[0];
  const boxHeight = endY - boundingBox[1];

  if (!boxWidth || !boxHeight) return undefined;

  const croppedImage = new ImageJS.Image(boxWidth, boxHeight, decodedData, {
    components: 1,
    alpha: 0,
  }).resize({ factor: scalingFactor });

  const colorROIImage = new ImageJS.Image(boxWidth, boxHeight, {
    components: 3,
    alpha: 1,
  }).resize({ factor: scalingFactor });

  const checkNeighbors = (
    arr: ImageJS.Image,
    x: number,
    y: number
  ): boolean => {
    if (x === 0 || x === croppedImage.width - 1) return true;
    for (let [dx, dy] of [
      [0, 1],
      [1, 0],
      [0, -1],
      [-1, 0],
    ]) {
      if (!arr.getPixelXY(x + dx, y + dy)[0]) return true;
    }
    return false;
  };

  for (let i = 0; i < croppedImage.width; i++) {
    for (let j = 0; j < croppedImage.height; j++) {
      if (croppedImage.getPixelXY(i, j)[0] > 0) {
        if (checkNeighbors(croppedImage, i, j)) {
          colorROIImage.setPixelXY(i, j, [color[0], color[1], color[2], 255]);
        } else {
          colorROIImage.setPixelXY(i, j, [color[0], color[1], color[2], 128]);
        }
      } else {
        colorROIImage.setPixelXY(i, j, [0, 0, 0, 0]);
      }
    }
  }

  const src = colorROIImage.toDataURL("image-png", {
    useCanvas: true,
  });
  const image = new Image();
  image.src = src;

  return image;
};

/*
 * Method to rename a cateogry/image if a category/image with this name already exists
 * */
export const replaceDuplicateName = (name: string, names: Array<string>) => {
  let currentName = name;
  let i = 1;
  while (names.includes(currentName)) {
    currentName = name + `_${i}`;
    i += 1;
  }
  return currentName;
};

/*
 * from https://stackoverflow.com/questions/5623838/rgb-to-hex-and-hex-to-rgb
 * */
const hexToRgb = (hex: string) => {
  var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
};

export const rgbToHex = (rgb: Array<number>) => {
  return (
    "#" +
    componentToHex(rgb[0]) +
    componentToHex(rgb[1]) +
    componentToHex(rgb[2])
  );
};

const componentToHex = (c: number) => {
  var hex = c.toString(16);
  return hex.length === 1 ? "0" + hex : hex;
};

export const saveAnnotationsAsBinaryInstanceSegmentationMasks = (
  images: Array<ImageType>,
  categories: Array<Category>,
  zip: any
): any => {
  images.forEach((current: ImageType) => {
    current.annotations.forEach((annotation: AnnotationType) => {
      const fullLabelImage = new ImageJS.Image(
        current.shape.width,
        current.shape.height,
        new Uint8Array().fill(0),
        { components: 1, alpha: 0 }
      );
      const encoded = annotation.mask;
      const decoded = decode(encoded);
      const boundingBox = annotation.boundingBox;
      const endX = Math.min(current.shape.width, boundingBox[2]);
      const endY = Math.min(current.shape.height, boundingBox[3]);

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
              i + annotation.boundingBox[0],
              j + annotation.boundingBox[1],
              [255, 255, 255]
            );
          }
        }
      }
      const blob = fullLabelImage.toBlob("image/png");
      const category = categories.find((category: Category) => {
        return category.id === annotation.categoryId;
      });
      if (category) {
        zip.folder(`${current.name}/${category.name}`);
        zip.file(
          `${current.name}/${category.name}/${annotation.id}.png`,
          blob,
          {
            base64: true,
          }
        );
      }
    });
  });
  zip.generateAsync({ type: "blob" }).then((blob: Blob) => {
    saveAs(blob, "binary_instances.zip");
  });
};

export const saveAnnotationsAsLabeledSemanticSegmentationMasks = (
  images: Array<ImageType>,
  categories: Array<Category>,
  zip: any
): any => {
  images.forEach((current: ImageType) => {
    const fullLabelImage = new ImageJS.Image(
      current.shape.width,
      current.shape.height,
      new Uint8Array().fill(0),
      { components: 1, alpha: 0 }
    );
    categories.forEach((category: Category) => {
      const categoryColor = hexToRgb(category.color);
      if (!categoryColor) return;

      for (let annotation of current.annotations) {
        if (annotation.categoryId !== category.id) continue;
        const encoded = annotation.mask;
        const decoded = decode(encoded);
        const boundingBox = annotation.boundingBox;
        const endX = Math.min(current.shape.width, boundingBox[2]);
        const endY = Math.min(current.shape.height, boundingBox[3]);

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
                i + annotation.boundingBox[0],
                j + annotation.boundingBox[1],
                [categoryColor.r, categoryColor.g, categoryColor.b]
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
    saveAs(blob, "labeled_semantic.zip");
  });
};

export const saveAnnotationsAsLabelMatrix = (
  images: Array<ImageType>,
  categories: Array<Category>,
  zip: any,
  random: boolean = false,
  binary: boolean = false
): Array<Promise<unknown>> => {
  return images
    .map((current: ImageType) => {
      return categories.map((category: Category) => {
        return new Promise((resolve, reject) => {
          const fullLabelImage = new ImageJS.Image(
            current.shape.width,
            current.shape.height,
            new Uint8Array().fill(0),
            { components: 1, alpha: 0 }
          );
          let r = binary ? 255 : 1;
          let g = binary ? 255 : 1;
          let b = binary ? 255 : 1;
          for (let annotation of current.annotations) {
            if (random) {
              r = Math.round(Math.random() * 255);
              g = Math.round(Math.random() * 255);
              b = Math.round(Math.random() * 255);
            } else if (!binary) {
              r = r + 1;
              b = b + 1;
              g = g + 1;
            }
            if (annotation.categoryId !== category.id) continue;
            const encoded = annotation.mask;
            const decoded = decode(encoded);
            const boundingBox = annotation.boundingBox;
            const endX = Math.min(current.shape.width, boundingBox[2]);
            const endY = Math.min(current.shape.height, boundingBox[3]);

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
                    i + annotation.boundingBox[0],
                    j + annotation.boundingBox[1],
                    [r, g, b]
                  );
                }
              }
            }
          }
          const blob = fullLabelImage.toBlob("image/png");
          zip.folder(`${current.name}`);
          zip.file(`${current.name}/${category.name}.png`, blob, {
            base64: true,
          });
          resolve(true);
        });
      });
    })
    .flat();
};

export const importSerializedAnnotations = (
  annotation: SerializedAnnotationType,
  existingCategories: Array<Category>
): { annotation_out: AnnotationType; categories: Array<Category> } => {
  const mask = annotation.annotationMask
    .split(" ")
    .map((x: string) => parseInt(x));

  let newCategories = existingCategories;
  //if category does not already exist in state, add it
  if (
    !existingCategories
      .map((category: Category) => category.id)
      .includes(annotation.annotationCategoryId)
  ) {
    const category: Category = {
      color: annotation.annotationCategoryColor,
      id: annotation.annotationCategoryId,
      name: annotation.annotationCategoryName,
      visible: true,
    };
    newCategories = [...newCategories, category];
  }

  let annotationPlane = annotation.annotationPlane;

  if (!annotationPlane) {
    annotationPlane = 0;
  }

  return {
    annotation_out: {
      boundingBox: [
        annotation.annotationBoundingBoxX,
        annotation.annotationBoundingBoxY,
        annotation.annotationBoundingBoxWidth,
        annotation.annotationBoundingBoxHeight,
      ],
      categoryId: annotation.annotationCategoryId,
      id: annotation.annotationId,
      mask: mask,
      plane: annotationPlane,
    },
    categories: newCategories,
  };
};
