import { _convertSerialization } from "./convertSerialization";
import { deserializeImage } from "image/utils/deserialize";
import { _SerializedImageType } from "./types";
import { ImageType, SerializedImageType } from "types";

export const deserializeImages = async (
  serializedImages: Array<_SerializedImageType>
) => {
  const deserializedImages: Array<ImageType> = [];

  for (const serializedImage of serializedImages) {
    // TODO: image_data - refactor this if/else block once done
    let deserializedImage: ImageType;
    if (serializedImage.imageData !== undefined) {
      deserializedImage = await _convertSerialization(serializedImage);
      deserializedImages.push(deserializedImage);
    } else {
      deserializedImage = await deserializeImage(
        serializedImage as unknown as SerializedImageType
      );
      deserializedImages.push(deserializedImage);
    }
  }
  return deserializedImages;
};
