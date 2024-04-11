import * as ImageJS from "image-js";
import * as DicomParser from "dicom-parser";

import {
  ImageFileError,
  ImageFileShapeInfo,
  ImageFileType,
  ImageShapeInfo,
  MIMEType,
} from "./types";
import { MIMETYPES } from "./constants";
import {
  convertToImage,
  getImageInformation,
} from "utils/common/tensorHelpers";
import { ImageShapeEnum } from "./enums";
import { getStackTraceFromError } from "utils/common/helpers";
import { AlertState } from "utils/common/types";
import { AlertType } from "utils/common/enums";
import { ImageObject } from "store/data/types";

async function decodeImageFile(imageFile: File, imageTypeEnum: ImageShapeEnum) {
  let imageStack: ImageJS.Stack;
  if (imageTypeEnum === ImageShapeEnum.DicomImage) {
    const imgArrayBuffer = await imageFile.arrayBuffer();

    const imgArray = new Uint8Array(imgArrayBuffer);

    var dicomImgData = DicomParser.parseDicom(imgArray);
    var pixelDataElement = dicomImgData.elements.x7fe00010;

    const samplesPerPixel = dicomImgData.int16("x00280002");
    const rows = dicomImgData.int16("x00280010");
    const columns = dicomImgData.int16("x00280011");
    const bitsAllocated = dicomImgData.int16("x00280100");

    if (!samplesPerPixel || !rows || !columns || !bitsAllocated) {
      throw Error("Failed to parse dicom image tags");
    }

    var pixelData = new Uint16Array(
      dicomImgData.byteArray.buffer,
      pixelDataElement.dataOffset,
      pixelDataElement.length / 2
    );

    const img = new ImageJS.Image(rows, columns, pixelData, {
      components: samplesPerPixel,
      bitDepth: bitsAllocated,
      alpha: 0,
    });

    const channels: ImageJS.Image[] = [];
    for (let i = 0; i < samplesPerPixel; i++) {
      channels.push(img.getChannel(i));
    }
    imageStack = new ImageJS.Stack(channels);
  } else {
    imageStack = await loadImageFileAsStack(imageFile);
  }

  return {
    imageStack,
    fileName: imageFile.name,
  } as ImageFileType;
}

function isImageShapeValid(
  imageStack: Array<ImageJS.Image>,
  channels: number,
  slices: number,
  imageShape: ImageShapeEnum
) {
  if (imageShape === ImageShapeEnum.GreyScale) {
    return channels === 1 && imageStack.length === 1;
  } else if (imageShape === ImageShapeEnum.SingleRGBImage) {
    return channels === 3 && imageStack.length === 3;
  } else {
    return channels * slices === imageStack.length;
  }
}

export const uploadImages = async (
  files: FileList,
  channels: number,
  slices: number,
  referenceShape: ImageShapeInfo,
  categoryId: string
): Promise<{
  imagesToUpload: ImageObject[];
  warning: any;
  errors: AlertState[];
}> => {
  const invalidImageFiles: Array<ImageFileError> = [];
  const imagesToUpload: Array<ImageObject> = [];
  const errors: Array<AlertState> = [];
  let warning: AlertState | undefined;

  for (const file of files) {
    try {
      const { imageStack, fileName } = await decodeImageFile(
        file,
        referenceShape.shape
      );
      if (
        !isImageShapeValid(imageStack, channels, slices, referenceShape.shape)
      ) {
        invalidImageFiles.push({
          fileName: fileName,
          error: `Could not match image to shape ${channels} (c) x ${slices} (z)`,
        });
      } else if (
        !(imageStack[0].bitDepth === 8 || imageStack[0].bitDepth === 16)
      ) {
        invalidImageFiles.push({
          fileName,
          error: `Unsupported bit depth of ${imageStack[0].bitDepth}`,
        });
      } else {
        try {
          const imageToUpload = await convertToImage(
            imageStack,
            fileName,
            undefined,
            slices,
            channels
          );
          imageToUpload.kind = "Image";
          imageToUpload.categoryId = categoryId;
          imageToUpload.containing = [];

          imagesToUpload.push(imageToUpload as ImageObject);
        } catch (err) {
          const error = err as Error;
          const stackTrace = await getStackTraceFromError(error);
          errors.push({
            alertType: AlertType.Error,
            name: "Could not convert file to image",
            description: error.message,
            stackTrace: stackTrace,
          });
        }
      }
    } catch (err) {
      process.env.NODE_ENV !== "production" && console.error(err);
      invalidImageFiles.push({
        fileName: file.name,
        error: "Could not decode",
      });
    }
  }

  if (invalidImageFiles.length) {
    warning = {
      alertType: AlertType.Warning,
      name: "Could not draw image from files",
      description: `Could not load or resolve images from the following files: ${invalidImageFiles.reduce(
        (prev, curr) => prev + "\n" + curr.fileName + ": (" + curr.error + ")",
        ""
      )}`,
    };
  }
  return { imagesToUpload, warning, errors };
};

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
