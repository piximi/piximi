import { useSelector } from "react-redux";
import { selectAllImages } from "store/data";

export const useImage = () => {
  const image = useSelector(selectAllImages)[0];

  if (!image || !image.shape) return;

  const htmlImage = new Image(image.shape.width, image.shape.height);
  htmlImage.src = image.src;

  return htmlImage;
};
