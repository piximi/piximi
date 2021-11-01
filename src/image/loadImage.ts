import { Image } from "../types/Image";

const loadPiximiImage = (image: Image): HTMLImageElement => {
  if (image.src.endsWith(".png")) {
    Promise.resolve(loadPiximiPngImage(image.src));
  }
  return getPiximiImage(image);
};

const getPiximiImage = (image: Image) => {
  const img = new Image(224, 224);
  img.crossOrigin = "anonymous";
  img.src = image.src;
  return img;
};

const loadPiximiPngImage = (dataset_url: string): Promise<HTMLImageElement> => {
  // tslint:disable-next-line:max-line-length
  const src = dataset_url;

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.crossOrigin = "anonymous";
    img.src = src;
  });
};
