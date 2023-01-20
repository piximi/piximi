// @ts-nocheck TODO: image_data
import * as ImageJS from "image-js";
import _ from "lodash";
import { v4 as uuidv4 } from "uuid";
import { saveAs } from "file-saver";

import { decode } from "../annotator/image/rle";

import { AnnotationType } from "../types/AnnotationType";
import { Category, UNKNOWN_CLASS_CATEGORY_ID } from "../types/Category";
import { ShapeType } from "../types/ShapeType";
import { Partition } from "../types/Partition";
import { ImageType, ShadowImageType } from "../types/ImageType";
import { DEFAULT_COLORS } from "../types/DefaultColors";
import { SerializedImageType } from "types/SerializedImageType";
// TODO: image_data
import { _Color, _SerializedAnnotationType } from "format_convertor/types";

declare module "image-js" {
  interface Image {
    colorDepth(newColorDepth: BitDepth): Image;
    min: number[];
    max: number[];
  }
}

enum BitDepth {
  BINARY = 1,
  UINT8 = 8,
  UINT16 = 16,
  FLOAT32 = 32,
}

// TODO: image_data
export const mapChannelsToSpecifiedRGBImage = (
  data: Array<Array<number>>,
  colors: Array<_Color>,
  rows: number,
  columns: number
): string => {
  /**
   * Given an matrix of numbers of shape C x MN (flattened image data for each channel), assign colors to channels and convert to RGB image,
   * returns the new data URI of that RGB image, to be displayed on canvas
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
    const max = 255;
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
        Math.min(summedChannels[j][0] + mappedChannels[i][j][0], 255), //cap each channel to 255
        Math.min(summedChannels[j][1] + mappedChannels[i][j][1], 255),
        Math.min(summedChannels[j][2] + mappedChannels[i][j][2], 255),
      ];
    }
  }

  const flattened: Array<number> = _.flatten(summedChannels);

  const img: ImageJS.Image = new ImageJS.Image(columns, rows, flattened, {
    components: 3,
    alpha: 0,
  });

  return img.toDataURL("image/png", {
    useCanvas: true,
  });
};

// TODO: image_data
export const extractChannelsFromFlattenedArray = (
  flattened: Uint8Array,
  channels: number,
  alpha: number,
  pixels: number
): Array<Array<number>> => {
  /**
   * Given a flattened data array from greyscale or RGB imageJ Image[channel1_pix1, channel2_pix1, channel3_pix1, channel1_pix2, channel2_pix2, channel3_pix2, etc....], extract each channel separately
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
      results[j][i / (channels + alpha)] = flattened[i + j];
      j += 1;
    }
    i += channels + alpha;
  }
  return results;
};

// TODO: image_data - delete
export const deserializeImages = async (
  serializedImages: Array<SerializedImageType>
) => {
  const deserializedImages: Array<ImageType> = [];

  for (const serializedImage of serializedImages) {
    let originalSrc = serializedImage.imageData;

    if (!Array.isArray(originalSrc) || !Array.isArray(originalSrc[0])) {
      throw new Error("imageData must be a 2-D array");
    }

    const defaultPlane = 0;
    let nPlanes = serializedImage.imageData.length;
    let referenceImageData = originalSrc[defaultPlane][0];
    let referenceImage = await ImageJS.Image.load(referenceImageData, {
      ignorePalette: true,
    });

    let src: string;
    if (serializedImage.imageSrc) {
      src = serializedImage.imageSrc;
    } else if (
      serializedImage.imageColors &&
      serializedImage.imageColors.length > 0
    ) {
      const originalData = await convertImageURIsToImageData(
        new Array(originalSrc[defaultPlane])
      );

      src = mapChannelsToSpecifiedRGBImage(
        originalData[0],
        serializedImage.imageColors,
        referenceImage.height,
        referenceImage.width
      );
    } else {
      // construct image src from 1, 2, or 3 channels from the first z-slice
      src =
        originalSrc[defaultPlane].length === 1
          ? originalSrc[defaultPlane][0]
          : originalSrc[defaultPlane].length === 2
          ? await convertDataArrayToRGBSource(
              [originalSrc[defaultPlane][0], originalSrc[defaultPlane][1]],
              referenceImage.width,
              referenceImage.height
            )
          : await convertDataArrayToRGBSource(
              // use first 3 channels of z-slice
              [
                originalSrc[defaultPlane][0],
                originalSrc[defaultPlane][1],
                originalSrc[defaultPlane][2],
              ],
              referenceImage.width,
              referenceImage.height
            );
    }

    deserializedImages.push({
      activePlane: defaultPlane,
      categoryId: serializedImage.imageCategoryId,
      //@ts-ignore TODO: image_data
      colors: serializedImage.imageColors
        ? serializedImage.imageColors
        : generateDefaultChannels(serializedImage.imageChannels),
      id: serializedImage.imageId,
      annotations: serializedImage.annotations,
      name: serializedImage.imageFilename,
      partition: serializedImage.imagePartition,
      visible: true,
      shape: {
        width: referenceImage.width,
        height: referenceImage.height,
        channels: originalSrc[defaultPlane].length,
        planes: nPlanes,
        frames: serializedImage.imageFrames,
      },
      originalSrc: originalSrc,
      src: src,
    });
  }

  return deserializedImages;
};

/*
  Takes in 3 data URLs, for the Red, Green, Blue channels, respectively
  Returns a single data RGB image data URL
 */
export const convertDataArrayToRGBSource = async (
  channels: Array<string>,
  width: number,
  height: number
): Promise<string> => {
  if (channels.length !== 2 && channels.length !== 3) {
    throw new Error(
      "Channels Data URL array must contain twor or three Data URLs"
    );
  }

  let redChannelPromise = ImageJS.Image.load(channels[0], {
    ignorePalette: true,
  });
  let greenChannelPromise = ImageJS.Image.load(channels[1], {
    ignorePalette: true,
  });
  let blueChannelPromise =
    channels.length === 2 // if no blue channel, construct a "blank" image object
      ? new Promise<ImageJS.Image>((resolve) =>
          resolve(
            new ImageJS.Image(width, height, {
              components: 1,
              alpha: 0,
            })
          )
        )
      : ImageJS.Image.load(channels[2], { ignorePalette: true });

  return Promise.all([
    redChannelPromise,
    greenChannelPromise,
    blueChannelPromise,
  ]).then((channelImages) => {
    const redChannel = channelImages[0];

    let typedData: Uint8Array | Uint16Array;
    if (redChannel.bitDepth === 8) {
      typedData = new Uint8Array(redChannel.data.length * 3);
    } else if (redChannel.bitDepth === 16) {
      typedData = new Uint16Array(redChannel.data.length * 3);
    } else {
      throw new Error(
        `A bit depth of ${redChannel.bitDepth} is not allowed. Must be 8 or 16`
      );
    }

    // interleave the data from each of the individual channels
    // typedData will hold: [r_0, g_0, b_0, r_1, g_1, b_1, ...]
    for (let i = 0; i < channelImages.length; i++) {
      for (let j = 0; j < redChannel.data.length; j++) {
        typedData[channelImages.length * j + i] = channelImages[i].data[j];
      }
    }

    // construct rgb image object from interleaved data
    const rgbImage = new ImageJS.Image(width, height, typedData, {
      components: 3,
      alpha: 0,
    });

    return rgbImage.toDataURL();
  });
};

// TODO: image_data
export enum ImageShapeEnum {
  DicomImage,
  SingleRGBImage,
  HyperStackImage,
  InvalidImage,
}

// TODO: image_data
export const getImageInformation = async (file: File) => {
  try {
    if (file.name.endsWith("dcm") || file.name.endsWith("DICOM")) {
      return ImageShapeEnum.DicomImage;
    }

    const buffer = await file.arrayBuffer();
    const image = await ImageJS.Image.load(buffer, { ignorePalette: true });

    // if the Image-js loads a single image object with 3 components that images is a single-slice RGB
    return image.components === 3 && !Array.isArray(image)
      ? ImageShapeEnum.SingleRGBImage
      : ImageShapeEnum.HyperStackImage;
  } catch (err) {
    return ImageShapeEnum.InvalidImage;
  }
};

// TODO: image_data
const convertImageDataToURI = (
  width: number,
  height: number,
  data: Array<number>,
  components: number,
  alpha: 0 | 1 | undefined
): string => {
  /**
   * Given channel data, convert to the corresponding encoded image URI.
   * **/
  const img: ImageJS.Image = new ImageJS.Image(width, height, data, {
    components: components,
    alpha: alpha ? alpha : 0,
  });

  return img.toDataURL("image/png", {
    useCanvas: true,
  });
};

// TODO: image_data
export const convertToImage = (
  inputStack: Array<ImageJS.Image>,
  filename: string,
  currentColors: Array<_Color> | undefined,
  slices: number,
  channels: number
): ImageType => {
  /**
   * Given an ImageJS Image object, construct appropriate Image type.
   * returns: the image of Image type
   * **/
  const colors = currentColors
    ? currentColors
    : generateDefaultChannels(channels);

  const isSingleRgbImage =
    slices === 1 && channels === 3 && inputStack.length === 1;
  if (isSingleRgbImage)
    // @ts-ignore TODO: image_data
    return convertSingleRGBImage(inputStack[0], filename, colors);

  // calculate min/max values per channel
  const channelMinMaxValues: Array<Array<number>> = [...Array(channels)].map(
    (e) => [Number.MAX_SAFE_INTEGER, Number.MIN_SAFE_INTEGER]
  );

  for (let i = 0; i < inputStack.length; i += channels) {
    for (let c = 0; c < channels; c++) {
      const frameIdx = i + c;

      const frameMin = inputStack[frameIdx].min[0];
      const frameMax = inputStack[frameIdx].max[0];

      if (channelMinMaxValues[c][0] > frameMin) {
        channelMinMaxValues[c][0] = frameMin;
      }

      if (channelMinMaxValues[c][1] < frameMax) {
        channelMinMaxValues[c][1] = frameMax;
      }
    }
  }

  const bitDepth = inputStack[0].bitDepth;
  // downscale images to 8bit if necessarily
  if (bitDepth === BitDepth.UINT16) {
    for (let i = 0; i < inputStack.length; i += channels) {
      for (let c = 0; c < channels; c++) {
        const frameIdx = i + c;
        const min = channelMinMaxValues[c][0];
        const max = channelMinMaxValues[c][1];

        inputStack[frameIdx].data = new Uint8Array(
          inputStack[frameIdx].data.map((p) =>
            Math.floor(((p - min) / (max - min + 1)) * 256)
          )
        );
        inputStack[frameIdx].bitDepth = BitDepth.UINT8;
      }
    }
  } else if (bitDepth !== BitDepth.UINT8 && bitDepth !== BitDepth.BINARY) {
    throw Error(`Unsupported bit depth of ${bitDepth}`);
  }

  const displayedIdx: number = 0;
  const width = inputStack[0].width;
  const height = inputStack[0].height;
  let displayedData: Array<Array<number>> = [];
  const originalURIs: Array<Array<string>> = [];

  for (let i = 0; i < inputStack.length; i += channels) {
    let sliceData: Array<Array<number>> = [];
    let sliceURI: Array<string> = [];

    for (let c = 0; c < channels; c++) {
      const frameIdx = i + c;

      sliceData.push(Array.from(inputStack[frameIdx].data)); //populate array of data
      const channelURI = convertImageDataToURI(
        width,
        height,
        Array.from(inputStack[frameIdx].data),
        1,
        0
      );
      sliceURI.push(channelURI);
    }

    if (i === displayedIdx) {
      displayedData = sliceData;
    }

    originalURIs.push(sliceURI);
  }

  // change the color range only for 8-bit images (16-bit images are mapped tp [0,255])
  if (bitDepth === BitDepth.UINT8) {
    for (let c = 0; c < channels; c++) {
      const channelMin = channelMinMaxValues[c][0];
      const channelMax = channelMinMaxValues[c][1];
      // do not set the color range to [0,0]
      if (channelMax !== 0) {
        colors[c].range = [channelMin, channelMax];
      }
    }
  }

  // apply colors
  const displayedURI = mapChannelsToSpecifiedRGBImage(
    displayedData,
    colors,
    height,
    width
  );

  return {
    activePlane: 0,
    annotations: [],
    //@ts-ignore TODO: image_data
    colors: colors,
    categoryId: UNKNOWN_CLASS_CATEGORY_ID,
    id: uuidv4(),
    name: filename,
    originalSrc: originalURIs,
    partition: Partition.Inference,
    shape: {
      channels: channels,
      frames: 1,
      height: height,
      planes: slices,
      width: width,
    },
    src: displayedURI,
    visible: true,
  };
};

// TODO: image_data
const convertSingleRGBImage = (
  input: ImageJS.Image,
  filename: string,
  colors: Array<_Color>
) => {
  const width = input.width;
  const height = input.height;

  // deinterlace
  const displayedData = extractChannelsFromFlattenedArray(
    input.data as Uint8Array,
    input.components,
    input.alpha,
    width * height
  );

  const originalURI = displayedData.map(
    (channelData: Array<number>, idx: number) => {
      return convertImageDataToURI(width, height, channelData, 1, 0);
    }
  );

  // make composite
  const displayedURI = mapChannelsToSpecifiedRGBImage(
    displayedData,
    colors,
    height,
    width
  );

  return {
    activePlane: 0,
    annotations: [],
    colors: colors,
    categoryId: UNKNOWN_CLASS_CATEGORY_ID,
    id: uuidv4(),
    name: filename,
    originalSrc: [originalURI],
    partition: Partition.Inference,
    shape: {
      channels: 3,
      frames: 1,
      height: height,
      planes: 1,
      width: width,
    },
    src: displayedURI,
    visible: true,
  };
};

export const convertImageURIsToImageData = async (
  originalSrc: Array<Array<string>>
): Promise<Array<Array<Array<number>>>> => {
  /**
   * From arrays of encoded URIs for Z x C x X x Y image, extract the correspond data arrray.
   * Used for color adjustment of image.
   * **/
  const originalData: Array<Array<Array<number>>> = [];

  for (let i = 0; i < originalSrc.length; i++) {
    //z-slice dimension
    const sliceData: Array<Array<number>> = [];
    for (let j = 0; j < originalSrc[i].length; j++) {
      const channelData = await convertURIToGreyscaleImageData(
        originalSrc[i][j]
      );
      sliceData.push(channelData);
    }
    originalData.push(sliceData);
  }

  return originalData;
};

const toGreyscale = (pixels: Array<number>): Array<number> => {
  /***
   * The data URIs we extract are saved as "RGB" values with an alpha channel, but each URI
   * actually corresponds to a single channel. We only need to extract the first "red" value, that's our intensity for that pixel for that channel.
   * ***/
  return pixels.filter(function (_, i) {
    return i % 4 === 0;
  });
};

export const convertSrcURIToOriginalSrcURIs = async (
  src: string,
  shape: ShapeType
): Promise<Array<string>> => {
  /**
   * Given a src URI (the image being displayed), extract R, G, B URIs
   * **/
  const flattenedData = await convertURIToRGBImageData(src);
  const channelData = extractChannelsFromFlattenedArray(
    Uint8Array.from(flattenedData.data),
    shape.channels,
    1,
    shape.width * shape.height
  );
  return Promise.all(
    channelData.map((channel: Array<number>) => {
      return convertImageDataToURI(shape.width, shape.height, channel, 1, 0);
    })
  );
};

const convertURIToGreyscaleImageData = async (URI: string) => {
  const rgbData = await convertURIToRGBImageData(URI);
  return toGreyscale(Array.from(rgbData.data));
};

const convertURIToRGBImageData = (URI: string): Promise<ImageData> => {
  /**
   * From data URI to flattened image data
   * **/

  return new Promise(function (resolve, reject) {
    if (URI == null) return reject();
    var canvas = document.createElement("canvas");
    var context = canvas.getContext("2d");
    var image = new Image();

    image.addEventListener(
      "load",
      function () {
        canvas.width = image.width;
        canvas.height = image.height;
        if (context) {
          context.drawImage(image, 0, 0, canvas.width, canvas.height);
          resolve(context.getImageData(0, 0, canvas.width, canvas.height));
        }
      },
      false
    );

    image.src = URI;
  });
};

// TODO: image_data
export const generateDefaultChannels = (numChannels: number): Array<_Color> => {
  /**
   * Given the number of channels in an image, apply default color scheme. If multi-channel, we apply red to the first channel,
   * green to the second channel, etc.. (see DefaultColors type)
   * If image is greyscale, we assign the white color to that one channel.
   * **/
  let defaultChannels: Array<_Color> = []; //number of channels depends on whether image is greyscale, RGB, or multi-channel

  for (let i = 0; i < numChannels; i++) {
    defaultChannels.push({
      color:
        numChannels > 1 && i < DEFAULT_COLORS.length
          ? DEFAULT_COLORS[i]
          : [255, 255, 255],
      range: [0, 255],
      // if image has more than 3 channels,
      // only show the first channel as default
      // (user can then toggle / untoggle the other channels if desired)
      visible: !(numChannels > 3 && i > 0),
    });
  }

  return defaultChannels;
};

export const connectPoints = (coordinates: Array<Array<number>>) => {
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
  images: Array<ShadowImageType>,
  categories: Array<Category>,
  zip: any
): any => {
  images.forEach((current: ShadowImageType) => {
    current.annotations.forEach((annotation: AnnotationType) => {
      const height = current.shape[1];
      const width = current.shape[2];

      const fullLabelImage = new ImageJS.Image(
        width,
        height,
        new Uint8Array().fill(0),
        { components: 1, alpha: 0 }
      );
      const encoded = annotation.mask;
      const decoded = decode(encoded);
      const boundingBox = annotation.boundingBox;
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
  images: Array<ShadowImageType>,
  categories: Array<Category>,
  zip: any
): any => {
  images.forEach((current: ShadowImageType) => {
    const height = current.shape[1];
    const width = current.shape[2];

    const fullLabelImage = new ImageJS.Image(
      width,
      height,
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
  images: Array<ShadowImageType>,
  categories: Array<Category>,
  zip: any,
  random: boolean = false,
  binary: boolean = false
): Array<Promise<unknown>> => {
  return images
    .map((current: ShadowImageType) => {
      const height = current.shape[1];
      const width = current.shape[2];

      return categories.map((category: Category) => {
        return new Promise((resolve, reject) => {
          const fullLabelImage = new ImageJS.Image(
            width,
            height,
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
  annotation: _SerializedAnnotationType,
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

export const importSerializedAnnotationsTest = (
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
