import { SerializedAnnotationType } from "./SerializedAnnotationType";

export type SerializedFileType = {
  imageChannels: number;
  imageChecksum: string;
  imageData: Array<Array<Array<number>>>;
  imageSrc: string;
  imageFilename: string;
  imageFrames: number;
  imageHeight: number;
  imageId: string;
  imagePlanes: number;
  imageWidth: number;
  annotations: Array<SerializedAnnotationType>;
};
