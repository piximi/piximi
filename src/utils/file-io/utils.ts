import IJSImage, { Stack as IJSStack } from "image-js";

/*
  Receives a File blob and returns an IJSStack
  
  If the file is a greyscale, rgb, rgba, ImageJS will return a single
  IJSImage object, where the data field has the pixel data interleaved
  (including alpha, if present).

    e.g. for rgba: [r1, g1, b1, a1, r2, g2, b2, a2, ...]

  Otherwise ImageJS will return an IJSStack object, which is a sublcass
  of a simple array, where each element is a single channel IJSImage object.

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

    const image = (await IJSImage.load(buffer, {
      ignorePalette: true,
    })) as IJSImage | IJSStack;

    return forceStack(image);
  } catch (err) {
    import.meta.env.NODE_ENV !== "production" &&
      console.error(`Error loading image file ${file.name}`);
    throw err;
  }
};

/*
 ----------------------------
 File blob & data url helpers
 ----------------------------
 */

const forceStack = async (image: IJSImage | IJSStack) => {
  if (Array.isArray(image)) {
    return image as IJSStack;
  }
  const splitImage = (image as IJSImage).split({ preserveAlpha: false });
  if (image.alpha === 1) {
    return new IJSStack(splitImage.splice(0, splitImage.length - 1));
  }
  return splitImage;
};

/*
  Converts a base64 dataURL encoded image into an ImageJS stack

  If the encoded image is a greyscale, rgb, or rgba, ImageJS will return a single
  IJSImage object, where the data field has the pixel data interleaved
  (including alpha, if present).

    e.g. for rgba: [r1, g1, b1, a1, r2, g2, b2, a2, ...]

  Otherwise ImageJS will return an IJSStack object, which is a sublcass
  of a simple array, where each element is a single channel IJSImage object.

  Instead we want to always return a stack, regardless of filetype.
  Alpha channel is discarded, if present.
  BitDepth and datat type is preserved.
 */
export const loadDataUrlAsStack = async (dataURL: string) => {
  try {
    const image = await IJSImage.load(dataURL, {
      ignorePalette: true,
    });

    return forceStack(image);
  } catch (err) {
    import.meta.env.NODE_ENV !== "production" &&
      console.error("Error loading dataURL");
    throw err;
  }
};
