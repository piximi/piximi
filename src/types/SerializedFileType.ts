import { SerializedAnnotationType } from "./SerializedAnnotationType";
import { Color } from "./Color";

export type SerializedFileType = {
  imageChannels: number;
  imageChecksum: string;
  imageColors: Array<Color>;
  imageData: Array<Array<string>>;
  imageSrc: string;
  imageFilename: string;
  imageFrames: number;
  imageHeight: number;
  imageId: string;
  imagePlanes: number;
  imageWidth: number;
  annotations: Array<SerializedAnnotationType>;
};
