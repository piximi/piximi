import { useSelector } from "react-redux";
import { imagesSelector } from "store/project";

export const useImage = () => {
  const image = useSelector(imagesSelector)[0];

  if (!image || !image.shape) return;

  const htmlImage = new Image(image.shape.width, image.shape.height);
  htmlImage.src = image.src;

  return htmlImage;
};
