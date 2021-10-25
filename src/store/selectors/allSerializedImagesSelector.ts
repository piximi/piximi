import { SerializedImageType } from "../../types/SerializedImageType";
import { Project } from "../../types/Project";
import { Image } from "../../types/Image";

export const allSerializedImagesSelector = ({
  project,
}: {
  project: Project;
}): Array<SerializedImageType> => {
  if (!project.images.length) return [];

  return project.images.map((image: Image) => {
    return {
      imageChannels: image.shape.channels,
      imageChecksum: "",
      imageData: image.src,
      imageFilename: image.name,
      imageFrames: image.shape.frames,
      imageHeight: image.shape.height,
      imageId: image.id,
      imagePlanes: image.shape.planes,
      imageWidth: image.shape.width,
      annotations: [],
    };
  });
};
