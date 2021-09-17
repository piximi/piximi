import { useSelector } from "react-redux";
import { imagesSelector } from "../../store/selectors";

export const useImage = () => {
  const image = useSelector(imagesSelector)[0];

  if (!image || !image.shape) return;

  const imageHTMLElement = new Image(image.shape.c, image.shape.r);

  return imageHTMLElement;
};
