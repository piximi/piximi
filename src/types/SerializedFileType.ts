import { SerializedAnnotationType } from "./SerializedAnnotationType";
import { _Color } from "format_convertor/types";

// TODO: image_data
export type SerializedFileType = {
  imageChannels: number;
  imageColors: Array<_Color>;
  imageData: Array<Array<string>>;
  imageSrc: string;
  imageFilename: string;
  //imageFrames: number;
  imageHeight: number;
  imageId: string;
  imagePlanes: number;
  imageWidth: number;
  annotations: Array<SerializedAnnotationType>;
};
