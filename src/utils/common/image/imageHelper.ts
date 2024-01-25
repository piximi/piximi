import * as ImageJS from "image-js";
import {
  scalar,
  tensor1d,
  tensor2d,
  tensor4d,
  Tensor1D,
  Tensor2D,
  Tensor3D,
  Tensor4D,
  tidy,
  fill,
} from "@tensorflow/tfjs";
import { v4 as uuidv4 } from "uuid";

import {
  DEFAULT_COLORS,
  ImageType,
  Partition,
  UNKNOWN_IMAGE_CATEGORY_ID,
} from "types";
import { Colors } from "types/tensorflow";

/*
 ======================================
 Image Inspection/Introspection helpers
 ======================================
 */

//QUESTION: Is there a reason why these are in this file and not in types?
export enum ImageShapeEnum {
  DicomImage,
  GreyScale,
  SingleRGBImage,
  HyperStackImage,
  InvalidImage,
}

const MIMETYPES = [
  "image/png",
  "image/jpeg",
  "image/tiff",
  "image/dicom",
] as const;

export type MIMEType = (typeof MIMETYPES)[number];

export type BitDepth = ImageJS.BitDepth;

export type DataArray = ImageJS.DataArray;

export interface ImageShapeInfo {
  shape: ImageShapeEnum;
  bitDepth?: BitDepth;
  components?: number;
  alpha?: boolean;
}

export interface ImageFileShapeInfo extends ImageShapeInfo {
  ext: MIMEType;
}

/*
 ----------------------------
 File blob & data url helpers
 ----------------------------
 */

const forceStack = async (image: ImageJS.Image | ImageJS.Stack) => {
  const imageShapeInfo = getImageInformation(image);

  if (imageShapeInfo.shape !== ImageShapeEnum.HyperStackImage) {
    image = (image as ImageJS.Image).split({ preserveAlpha: false });
    // preserveAlpha removes the alpha data from each ImageJS.Image
    // but its still present as its own ImageJS.Image as the final
    // element of the stack, so remove it
    if (imageShapeInfo.alpha) {
      image = new ImageJS.Stack(image.splice(0, image.length - 1));
    }
    return image;
  } else {
    return image as ImageJS.Stack;
  }
};

/*
 Receives a path to an image file, retrieved via import, eg:

 import myImage from "path/to/myImage.png"

 or via url, eg:

 "https://piximi.photos/path/to/img"

 and optionally a name, which is inffered from path if not provided.

 A File object is generated, identical to a File
 object retrived via html:
 
 <input type="file">

 This should only be used browser side, 
 If you want to generate files node side, use the analogous function defined in
 "nodeImageHelper.ts".
*/
export const fileFromPath = async (
  imPath: string,
  name: string | undefined = undefined
) => {
  let imName: string;

  if (!name) {
    const pathParts = imPath.split("/");
    imName = pathParts[pathParts.length - 1];
  } else {
    imName = name;
  }

  return fetch(imPath)
    .then((res) => res.blob())
    .then((blob) => new File([blob], imName, blob));
};

/*
  Receives a File blob and returns an ImageJS.Stack
  
  If the file is a greyscale, rgb, rgba, ImageJS will return a single
  ImageJS.Image object, where the data field has the pixel data interleaved
  (including alpha, if present).

    e.g. for rgba: [r1, g1, b1, a1, r2, g2, b2, a2, ...]

  Otherwise ImageJS will return an ImageJS.Stack object, which is a sublcass
  of a simple array, where each element is a single channel ImageJS.Image object.

  Instead we want to always return a stack, regardless of filetype.
  Alpha channel is discarded, if present.
  BitDepth and datat type is preserved.

  ---

  The File object, may come from an HTML <input type="file">,
  
  or generated via "fileFromPath" either here or in "nodeImageHelper.ts"
*/
export const loadImageFileAsStack = async (file: File) => {
  try {
    const buffer = await file.arrayBuffer();

    const image = (await ImageJS.Image.load(buffer, {
      ignorePalette: true,
    })) as ImageJS.Image | ImageJS.Stack;

    return forceStack(image);
  } catch (err) {
    process.env.NODE_ENV !== "production" &&
      console.error(`Error loading image file ${file.name}`);
    throw err;
  }
};

/*
  Converts a base64 dataURL encoded image into an ImageJS stack

  If the encoded image is a greyscale, rgb, or rgba, ImageJS will return a single
  ImageJS.Image object, where the data field has the pixel data interleaved
  (including alpha, if present).

    e.g. for rgba: [r1, g1, b1, a1, r2, g2, b2, a2, ...]

  Otherwise ImageJS will return an ImageJS.Stack object, which is a sublcass
  of a simple array, where each element is a single channel ImageJS.Image object.

  Instead we want to always return a stack, regardless of filetype.
  Alpha channel is discarded, if present.
  BitDepth and datat type is preserved.
 */
export const loadDataUrlAsStack = async (dataURL: string) => {
  try {
    const image = await ImageJS.Image.load(dataURL, {
      ignorePalette: true,
    });

    return forceStack(image);
  } catch (err) {
    process.env.NODE_ENV !== "production" &&
      console.error("Error loading dataURL");
    throw err;
  }
};

export const getImageFileInformation = async (
  file: File
): Promise<ImageFileShapeInfo> => {
  const ext = file.type as MIMEType;
  try {
    // https://stackoverflow.com/questions/56565528/typescript-const-assertions-how-to-use-array-prototype-includes
    if (!(MIMETYPES as ReadonlyArray<string>).includes(file.type)) {
      process.env.NODE_ENV !== "production" &&
        console.error("Invalid MIME Type:", ext);
      return { shape: ImageShapeEnum.InvalidImage, ext };
    }

    if (file.name.endsWith("dcm") || file.name.endsWith("DICOM")) {
      return { shape: ImageShapeEnum.DicomImage, ext: "image/dicom" };
    }

    const buffer = await file.arrayBuffer();
    const image: ImageJS.Image | ImageJS.Stack = await ImageJS.Image.load(
      buffer,
      {
        ignorePalette: true,
      }
    );

    return { ...getImageInformation(image), ext };
  } catch (err) {
    return { shape: ImageShapeEnum.InvalidImage, ext };
  }
};

/*
 ----------------------------
 Image.JS.Image|Stack Helpers
 ----------------------------
*/

export const getImageInformation = (
  image: ImageJS.Image | ImageJS.Stack
): ImageShapeInfo => {
  // a "proper" RGB will be an ImageJS.Image object with 3 components
  if (!Array.isArray(image) && image.components === 3) {
    return {
      shape: ImageShapeEnum.SingleRGBImage,
      components: image.components,
      bitDepth: image.bitDepth,
      alpha: image.alpha === 1,
    };
    // 1 channel (greyscale) image will also be an ImageJs.Image object
  } else if (!Array.isArray(image) && image.components === 1) {
    return {
      shape: ImageShapeEnum.GreyScale,
      components: image.components,
      bitDepth: image.bitDepth,
      alpha: image.alpha === 1,
    };
    // should not happen
  } else if (!Array.isArray(image)) {
    process.env.NODE_ENV !== "production" &&
      console.error("Unrecognized Image.JS.Image type, channels not in [1,3]");
    return {
      shape: ImageShapeEnum.InvalidImage,
    };
  }
  // else RGBstack, or multi-channel, or multi-z-stack image as an ImageJS.Stack object
  else {
    return {
      shape: ImageShapeEnum.HyperStackImage,
      components: image.length,
      bitDepth: image[0].bitDepth,
      alpha: image[0].alpha === 1,
    };
  }
};

/*
 ========================================
 ImageJS <-> ImageType Conversion Helpers
 ========================================
 */

/*
 Receives an image stack, where each elem is an ImageJS.Image object,
 representing an image "frame", in the following order:
 [slice_1_channel_1, slice1_channel2, ..., slice_numSlices_channel_numChannels]

 Each frame of an image stack has a data array
 which is 1D, in row major format
  e.g [r1c1, r1c2, r1c3, r2c1, r2c2, r2c3]
  representing an image of rows = height = 2, cols = width = 3

 March through and form a 2d imageData array of shape [frames, pixels]
  e.g:

  [[ 0, 1, 2, 3, 4, 5],
   [10,11,12,13,14,15],
   [20,21,22,23,24,25],
   [30,31,32,33,34,35],
   [40,41,42,43,44,45],
   [50,51,52,53,54,55]]

 Tensorflow prefers image data to have a shape of [height,width,channels],
 but we cannot simply reshape the 2d matrix above in that way, since the
 data is not ordered such. Instead create 4d tensor of shape:
 [slices,channels,height,width]
 and then transpose into the preffered shape

 The image tensor is of type "float32", wich tensorflow expects to be
 in the range of 0-1, so normalize the tensor with the bitdepth of the
 image, if necessary

 Return the resulting imageTensor
 */
export const convertToTensor = (
  imageStack: ImageJS.Stack,
  numSlices: number,
  numChannels: number
): Tensor4D => {
  const { bitDepth, width, height } = imageStack[0];

  const numPixels = height * width;

  // create empty 2d array of expected size
  const imageData = new Float32Array(numSlices * numChannels * numPixels);

  // fill in 2d array with image stack data
  // shape: [numFrames, numPixels]
  for (let i = 0; i < imageStack.length; i++) {
    imageData.set(Float32Array.from(imageStack[i].data), i * numPixels);
  }

  return tidy("stackToTensor", () => {
    // convert to 4d tensor
    // shape: [Z, C, H, W]
    // then permute dims
    // shape: [Z, H, W, C]
    let imageTensor: Tensor4D = tensor4d(imageData, [
      numSlices,
      numChannels,
      height,
      width,
    ]).transpose([0, 2, 3, 1]);

    // normalize in range of 0-1, if not already
    if (!(imageStack[0].data instanceof Float32Array)) {
      const normScalar = scalar(2 ** bitDepth - 1);
      imageTensor = imageTensor.div(normScalar);
    }

    return imageTensor;
  });
};

/*
  receive image of dims: [Z, H, W, C]
  get slice corresponding to given index
  return image slice with dims: [H, W, C]
 */
export const getImageSlice = (
  imageTensor: Tensor4D,
  sliceIdx: number,
  opts: { disposeImageTensor: boolean } = { disposeImageTensor: false }
): Tensor3D => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_, height, width, numChannels] = imageTensor.shape;

  return tidy("getImageSlice", () => {
    const res = imageTensor
      .slice([sliceIdx], [1, height, width, numChannels])
      .reshape([height, width, numChannels]) as Tensor3D;
    // gc input tensor
    opts.disposeImageTensor && imageTensor.dispose();
    return res;
  });
};

// filter out channels with visibility true in image colors
export const filterVisibleChannels = (colors: Colors): Array<number> => {
  /*
    colors.visible has shape { [channel: boolean]: boolean; }
    Object.entries(colors.visible) produces [string, boolean][],
      e.g. [ ['0', true], ['1', false], ['2', true] ]
    filter out the ones that have true as the value in index 1
    map remaining tuples to the int of the channel number in index 0
    resulting in channel nums that are tagged visible,
      e.g. [0, 2]
   */
  return Object.entries(colors.visible)
    .filter((channelVisible) => channelVisible[1])
    .map((channelVisible) => parseInt(channelVisible[0]));
};

/*
  for input of Tensor3D:

  receive image slice of dims:
    [H, W, C]
  and filter array with channels to include in result
    VC = num_visible_channels = filter.length

  return color filtered image slice of dims:
    [H, W, VC]

  for input of Tensor4D:

  receive image slice of dims:
    [Z, H, W, C]
  filter and return image slice of dims:
    [Z, H, W, VC]
 */
export const sliceVisibleChannels = <T extends Tensor3D | Tensor4D>(
  imageSlice: T,
  filter: Array<number>,
  opts: { disposeImageSlice: boolean } = { disposeImageSlice: true }
): T => {
  // channel axis is innermost
  const channelAxis = imageSlice.rank - 1;

  return tidy("sliceVisibleChannels", () => {
    const indices = tensor1d(filter, "int32");

    // form a new 3D/4D tensor, gathering only channels in the indices matching the filter
    // channel axis is innermost, 2
    const res = (imageSlice as T).gather(indices, channelAxis);
    // gc input tensor
    opts.disposeImageSlice && imageSlice.dispose();
    return res;
  });
};

/*
  receive image colors containing color matrix of dims:
    [C, 3]
  and filter array with idx of color triples to include in result
    VC = num_visible_channels = filter.length

  return filtered color matrix of dims:
    [VC, 3]
 */
export const sliceVisibleColors = (
  colors: Colors,
  filter: Array<number>
): Tensor2D => {
  // channel axis is outermost
  const channelAxis = 0;

  return tidy("sliceVisibleColors", () => {
    const indices = tensor1d(filter, "int32");

    // form a new 2D tensor, gathering only triples in indices matching filter
    return colors.color.gather(indices, channelAxis);
  });
};

/*
  for input of Tensor3D:

  receive image slice (with channels filtered for visibility) of shape:
    [H, W, VC]
  reshape input image slice to shape:
    [pixels, VC]

  e.g. if input image slice of shape [3, 2, 4] is:
  [ [[a, b, c, d],
     [e, f, g, h]],

   [[i, j, k, l],
    [m, n, o, p]],
  
   [[q, r, s, t],
    [u, v, w, x]] ]

  reshape to be of shape [6, 4]:
  [[a, b, c, d],
   [e, f, g, h],
   [i, j, k, l],
   [m, n, o, p],
   [q, r, s, t],
   [u, v, w, x]]

  apply colors to image slice, with colors.color of shape:
    [VC, 3]

  e.g. [4, 3]

  [[r1, g1, b1],
   [r2, g2, b2],
   [r3, g3, b3],
   [r4, g4, b4]]

  resulting in shape [pixels, 3]

  which is reshaped to [height, width, 3] and returned

  for input of Tensor4D, all of the above happens, however
  receive image of shape [Z, H, W, VC],
  reshape to [Z, pixels, VC]

  take colors of shape [VC, 3] and broad cast to shape [Z, VC, 3],
  where each element of the Z dim is just a copy,
  and apply, resulting in [Z, pixels, 3],
  which is then reshaped to [Z, H, W, 3] and returned

  if opts.scaleMinMax is set to true, each channel will be
  normalized from the range [min_channel_value, max_channel_value]
  to the range [0, 2**bitDepth-1]
 */
export const generateColoredTensor = <T extends Tensor3D | Tensor4D>(
  imageSlice: T,
  colors: Tensor2D,
  opts: {
    disposeImageSlice?: boolean;
    disposeColors?: boolean;
  } = {}
): T => {
  opts.disposeImageSlice = opts.disposeImageSlice ?? true;
  opts.disposeColors = opts.disposeColors ?? true;

  if (imageSlice.rank === 3) {
    const [height, width, numVisibleChannels] = (imageSlice as Tensor3D).shape;

    return tidy("generateColoredTensor", () => {
      const res: T =
        numVisibleChannels > 0
          ? imageSlice
              // [pixels, VC]
              .reshape([height * width, numVisibleChannels])
              // [pixels, VC] * [VC, 3] = [pixels, 3]
              .matMul(colors)
              // make sure composite is clamped to proper range for float32
              .clipByValue(0, 1)
              // [H, W, 3]
              .reshape([height, width, 3])
          : // if no visible channels, return tensor of all 0s: [H, W, 3]
            (fill([height, width, 1], 0) as T);

      opts.disposeImageSlice && imageSlice.dispose();
      opts.disposeColors && colors.dispose();

      return res;
    });
  } else {
    const [slices, height, width, numVisibleChannels] = (imageSlice as Tensor4D)
      .shape;

    return tidy("generateColoredTensor", () => {
      const res: T =
        numVisibleChannels > 0
          ? imageSlice
              // [Z, pixels, VC]
              .reshape([slices, height * width, numVisibleChannels])
              // [Z, pixels, VC] * broadcast_on_Z( [VC, 3] ) = [Z, pixels, 3]
              .matMul(colors)
              // make sure composite is clamped to proper range for float32
              .clipByValue(0, 1)
              // [Z, H, W, 3]
              .reshape([slices, height, width, 3])
          : // if no visible channels, return tensor of all 0s: [H, W, 3]
            (fill([slices, height, width, 3], 0) as T);

      opts.disposeImageSlice && imageSlice.dispose();
      opts.disposeColors && colors.dispose();

      return res;
    });
  }
};

/* 
  Gets a normalized tensor, where values are in the float range [0, 1],
  and returns a denormalized one, where values are in the integer range
  determined by the given bitdepth, [0, 2**bitDepth - 1]

  note: wrt "integer range" above, the tensor data type is not converted
  from "float32" to "int32"; it remains as "float32" but the values are all "n.0",
  where "n" is in the integer range [0, 2**bitDepth - 1]
 */
export const denormalizeTensor = <T extends Tensor3D | Tensor4D>(
  normalTensor: T,
  bitDepth: BitDepth,
  opts: { disposeNormalTensor: boolean } = { disposeNormalTensor: true }
) => {
  const denormalizedTensor = tidy(() =>
    normalTensor.mul(2 ** bitDepth - 1).round()
  ) as T;

  opts.disposeNormalTensor && normalTensor.dispose();

  return denormalizedTensor;
};

/*
 Receives a tensor of shape [H,W,C] or [Z,H,W,C]
 normalizes it based on the bit depth
 and returns the correct TypedArray view on the buffer data
 */
const getImageTensorData = async (
  imageTensor: Tensor3D | Tensor4D,
  bitDepth: BitDepth,
  opts: { disposeImageTensor: boolean } = { disposeImageTensor: true }
) => {
  const imageData = await denormalizeTensor(imageTensor, bitDepth, {
    disposeNormalTensor: opts.disposeImageTensor,
  }).data();

  // DO NOT USE "imageData instanceof Float32Array" here
  // tensorflow sublcasses typed arrays, so it will always return false
  if (imageData.constructor.name !== "Float32Array") {
    throw Error("Tensor data should be stored as Float32Array");
  }

  return imageData as Float32Array;
};

/*
  Receives an imageTensor of shape [H, W, C] or [Z, H, W, C]
  Returns an array of size 2, where the first element is the min values
  for each of the channels; and the second element contains
  the max values.

  For input of [Z, H, W, C], it is the min and max of each channel
  across the entire stack, eg the min and max values for channel 0
  are those that occur for every possible indexing of [Z, H, W, 0]
 */
export const findMinMaxs = async <T extends Tensor3D | Tensor4D>(
  imageTensor: T,
  opts: { disposeImageTensor: boolean } = { disposeImageTensor: false }
): Promise<[number[], number[]]> => {
  let mins: number[];
  let maxs: number[];

  if (imageTensor.rank === 3) {
    mins = await tidy(
      () => (imageTensor as Tensor3D).min([0, 1]) as Tensor1D
    ).array();
    maxs = await tidy(
      () => (imageTensor as Tensor3D).max([0, 1]) as Tensor1D
    ).array();
  } else {
    mins = await tidy(
      () => (imageTensor as Tensor4D).min([0, 1, 2]) as Tensor1D
    ).array();
    maxs = await tidy(
      () => (imageTensor as Tensor4D).max([0, 1, 2]) as Tensor1D
    ).array();
  }

  opts.disposeImageTensor && imageTensor.dispose();
  return [mins, maxs];
};

/*
  Receives an image tensor of shape [H, W, C] or [Z, H, W, C],
  along with its Colors,
  and scales it by the ranges defined in Colors.

  Returns scaled image tensor of same shape as input.
 */
export const scaleImageTensor = <T extends Tensor3D | Tensor4D>(
  imageTensor: T,
  colors: Colors,
  opts: { disposeImageTensor: boolean } = { disposeImageTensor: true }
): T => {
  const numChannels = imageTensor.shape[imageTensor.rank - 1];

  const mins: number[] = [];
  const ranges: number[] = [];
  for (let i = 0; i < numChannels; i++) {
    const [min, max] = colors.range[i];
    const range = max - min;
    mins.push(min);
    ranges.push(range);
  }

  const scaledImageTensor: T = tidy(() =>
    imageTensor.sub(tensor1d(mins)).div(tensor1d(ranges))
  );

  opts.disposeImageTensor && imageTensor.dispose();

  return scaledImageTensor;
};

/*
  Receives a tensor of shape [H, W, 3] or [Z, H, W, 3]
  returns its base64 data url, or array of urls if Z present
 */
export async function renderTensor<T extends Tensor3D | Tensor4D>(
  compositeTensor: T,
  bitDepth: BitDepth,
  opts?: { disposeCompositeTensor?: boolean; useCanvas?: boolean }
): Promise<T extends Tensor3D ? string : string[]>;

export async function renderTensor(
  compositeTensor: Tensor3D | Tensor4D,
  bitDepth: BitDepth,
  opts?: { disposeCompositeTensor?: boolean; useCanvas?: boolean }
): Promise<string | string[]> {
  opts = opts ?? {};
  opts.disposeCompositeTensor = opts.disposeCompositeTensor ?? true;
  // using canvas will result in an rgba image where each channel is
  // 0-255, regardless of the value of bitDepth
  opts.useCanvas = opts.useCanvas ?? true;

  /*
    tf.browser.toPixels has 2 quirks:
    - it will convert the tensor to the range 0-255,
      which is what we usually want (bc less memory),
      but we can't override it to return 16 bit instead
    - it will insert alpha values (255) when the C dim is 3

    leaving here as reminder of why we're not using it
   */
  // const imageData = await browser.toPixels(compositeTensor);
  const imageData = await getImageTensorData(compositeTensor, bitDepth, {
    disposeImageTensor: opts.disposeCompositeTensor,
  });

  if (compositeTensor.rank === 3) {
    const [height, width, components] = (compositeTensor as Tensor3D).shape;

    const image = new ImageJS.Image({
      width,
      height,
      data: imageData,
      kind: "RGB" as ImageJS.ImageKind,
      bitDepth: bitDepth,
      components,
      alpha: 0,
      colorModel: "RGB" as ImageJS.ColorModel,
    });
    return image.toDataURL("image/png", { useCanvas: opts.useCanvas });
  } else {
    let imageURLs: string[] = [];

    const [slices, height, width, components] = (compositeTensor as Tensor4D)
      .shape;

    const strideLength = height * width * components;

    for (let i = 0; i < slices; i++) {
      const sliceStart = i * strideLength;
      const sliceEnd = sliceStart + strideLength;

      const image = new ImageJS.Image({
        width,
        height,
        data: imageData.slice(sliceStart, sliceEnd),
        kind: "RGB" as ImageJS.ImageKind,
        bitDepth: bitDepth,
        components,
        alpha: 0,
        colorModel: "RGB" as ImageJS.ColorModel,
      });

      imageURLs.push(
        image.toDataURL("image/png", { useCanvas: opts.useCanvas })
      );
    }

    return imageURLs;
  }
}

/*
  Receives a tensor of shape [Z, H, W, C], colors to apply, and a bitDepth,
  applies the colors generating a [H, W, 3] tensor,
  and returns the corresponding data url
 */
export async function createRenderedTensor<T extends number | undefined>(
  imageTensor: Tensor4D,
  colors: Colors,
  bitDepth: BitDepth,
  plane: T
): Promise<T extends number ? string : string[]>;

export async function createRenderedTensor(
  imageTensor: Tensor4D,
  colors: Colors,
  bitDepth: BitDepth,
  plane: number | undefined
) {
  let operandTensor: Tensor4D | Tensor3D;
  let disposeOperandTensor: boolean;

  if (plane === undefined) {
    operandTensor = imageTensor;
    disposeOperandTensor = false;
  } else {
    // image slice := get z idx 0 of image with dims: [H, W, C]
    operandTensor = getImageSlice(imageTensor, plane);
    disposeOperandTensor = true;
  }

  // scale each channel by its range
  const scaledImageSlice = scaleImageTensor(operandTensor, colors, {
    disposeImageTensor: disposeOperandTensor,
  });

  // get indices of visible channels, VC
  const visibleChannels = filterVisibleChannels(colors);

  // image slice filtered by visible channels: [H, W, VC] or [Z, H, W, VC]
  const filteredSlice = sliceVisibleChannels(scaledImageSlice, visibleChannels);

  // color matrix filtered by visible channels: [VC, 3]
  const filteredColors = sliceVisibleColors(colors, visibleChannels);

  // composite image slice: [H, W, 3] or [Z, H, W, 3]
  const compositeImage = generateColoredTensor(filteredSlice, filteredColors);

  return await renderTensor(compositeImage, bitDepth);
}

export const convertToImage = async (
  imageStack: ImageJS.Stack,
  filename: string,
  currentColors: Colors | undefined,
  numSlices: number,
  numChannels: number
): Promise<ImageType> => {
  if (!imageStack.length) {
    throw Error("Expected image stack");
  }

  const activePlane = 0;

  const { bitDepth } = imageStack[activePlane];

  // image data := create image of dims: [Z, H, W, C]
  const imageTensor = convertToTensor(imageStack, numSlices, numChannels);

  const colors = currentColors
    ? currentColors
    : await generateDefaultColors(imageTensor);

  const coloredSliceURL = await createRenderedTensor(
    imageTensor,
    colors,
    bitDepth,
    activePlane
  );

  const [planes, height, width, channels] = imageTensor.shape;

  return {
    kind: "Image",
    activePlane: activePlane,
    colors: colors,
    bitDepth,
    categoryId: UNKNOWN_IMAGE_CATEGORY_ID,
    id: uuidv4(),
    name: filename,
    shape: { planes, height, width, channels },
    data: imageTensor,
    partition: Partition.Inference,
    src: coloredSliceURL,
    visible: true,
  } as ImageType;
};

/*
 ================================
 Image Color Manipulation Helpers
 ================================
 */

export const generateDefaultColors = async <T extends Tensor3D | Tensor4D>(
  imageTensor: T
): Promise<Colors> => {
  const range: { [channel: number]: [number, number] } = {};
  const visible: { [channel: number]: boolean } = {};
  let color: Array<[number, number, number]> = [];

  const numChannels =
    imageTensor.rank === 3
      ? (imageTensor as Tensor3D).shape[2]
      : (imageTensor as Tensor4D).shape[3];

  const [mins, maxs] = await findMinMaxs(imageTensor);

  if (mins.length !== numChannels || maxs.length !== numChannels) {
    throw Error(
      `Expected num channels, min values, and max values to all be ${numChannels}`
    );
  }

  for (let i = 0; i < numChannels; i++) {
    color.push(
      numChannels > 1 && i < DEFAULT_COLORS.length
        ? DEFAULT_COLORS[i]
        : [1, 1, 1]
    );

    range[i] = [mins[i], maxs[i]];

    // if image has more than 3 channels,
    // only show the first channel as default
    // (user can then toggle / untoggle the other channels if desired)
    visible[i] = !(numChannels > 3 && i > 0);
  }

  return {
    range,
    visible,
    color: tensor2d(color, [numChannels, 3], "float32"),
  };
};

export const generateBlankColors = (numChannels: number): Colors => {
  const range: { [channel: number]: [number, number] } = {};
  const visible: { [channel: number]: boolean } = {};
  let color: Array<[number, number, number]> = [];

  for (let i = 0; i < numChannels; i++) {
    color.push(
      numChannels > 1 && i < DEFAULT_COLORS.length
        ? DEFAULT_COLORS[i]
        : [1, 1, 1]
    );

    range[i] = [0, 1];

    // if image has more than 3 channels,
    // only show the first channel as default
    // (user can then toggle / untoggle the other channels if desired)
    visible[i] = !(numChannels > 3 && i > 0);
  }

  return {
    range,
    visible,
    color: tensor2d(color, [numChannels, 3], "float32"),
  };
};

/*
  Set color ranges to provided mins and maxs
 */
export const scaleColors = (
  colors: Colors,
  minMax: { mins: number[]; maxs: number[] }
) => {
  const { mins, maxs } = minMax;

  if (mins.length !== maxs.length) {
    throw Error("Number of min and max values must be identical");
  }

  if (colors.color.shape[0] !== mins.length) {
    throw Error("Number of min and max values must match number of channels");
  }

  for (let i = 0; i < mins.length; i++) {
    colors.range[i] = [mins[i], maxs[i]];
  }
};

const componentToHex = (c: number) => {
  var hex = (c * 255).toString(16);
  return hex.length === 1 ? "0" + hex : hex;
};

export const rgbToHex = (rgb: [number, number, number]) => {
  return (
    "#" +
    componentToHex(rgb[0]) +
    componentToHex(rgb[1]) +
    componentToHex(rgb[2])
  );
};

/*
 =======================
 General Utility Methods
 =======================
 */

/*
 * Method to rename a cateogry/image if a category/image with this name already exists
 */
export const replaceDuplicateName = (
  newName: string,
  existingNames: Array<string>
) => {
  let currentName = newName;
  let i = 1;
  while (existingNames.includes(currentName)) {
    currentName = newName + `_${i}`;
    i += 1;
  }
  return currentName;
};

//HACK: new
export const newReplaceDuplicateName = (
  newName: string,
  existingNames: Array<string>
) => {
  let currentName = newName;
  let count = 0;
  // eslint-disable-next-line
  const nameRe = new RegExp(`${newName}(_\d+)?`, "g");
  existingNames.forEach((name) => {
    if (!!nameRe.exec(name)) {
      const suffix = +name.split("_")[1];
      if (suffix > count) {
        count = suffix;
      }
    }
  });
  return !count ? currentName : `${currentName}_${count + 1}`;
};

export const scaleUpRange = (
  range: [number, number],
  bitDepth: BitDepth
): [number, number] => {
  return [
    Math.floor(range[0] * (2 ** bitDepth - 1)),
    Math.floor(range[1] * (2 ** bitDepth - 1)),
  ];
};

export const scaleUpRanges = (
  ranges: { [channel: number]: [number, number] },
  bitDepth: BitDepth,
  opts: { inPlace: boolean } = { inPlace: false }
): { [channel: number]: [number, number] } => {
  let operandRanges = opts.inPlace ? ranges : { ...ranges };

  for (const ch of Object.keys(ranges)) {
    const chKey = parseInt(ch);
    operandRanges[chKey] = scaleUpRange(ranges[chKey], bitDepth);
  }

  return ranges;
};

export const scaleDownRange = (
  range: [number, number],
  bitDepth: BitDepth
): [number, number] => {
  return [range[0] / (2 ** bitDepth - 1), range[1] / (2 ** bitDepth - 1)];
};

export const scaleDownRanges = (
  ranges: { [channel: number]: [number, number] },
  bitDepth: BitDepth,
  opts: { inPlace: boolean } = { inPlace: false }
): { [channel: number]: [number, number] } => {
  let operandRanges = opts.inPlace ? ranges : { ...ranges };

  for (const ch of Object.keys(ranges)) {
    const chKey = parseInt(ch);
    operandRanges[chKey] = scaleDownRange(ranges[chKey], bitDepth);
  }

  return ranges;
};

export const extractMinMax = (ranges: {
  [channel: number]: [number, number];
}) => {
  const channels = Object.keys(ranges).map((ch) => parseInt(ch));
  const mins = Array(channels.length);
  const maxs = Array(channels.length);

  for (const ch of channels) {
    const [min, max] = ranges[ch];
    mins[ch] = min;
    maxs[ch] = max;
  }

  return { mins, maxs };
};

export const convertToDataArray = (
  depth: number,
  source: DataArray | Array<number>
): DataArray => {
  switch (depth) {
    case 1:
      throw Error("Binary bit depth not (yet) supported");
    case 8:
      return Uint8Array.from(source);
    case 16:
      return Uint16Array.from(source);
    case 32:
      return Float32Array.from(source);
    default:
      throw Error("Unrecognized bit depth");
  }
};
