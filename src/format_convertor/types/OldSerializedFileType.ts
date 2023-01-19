import { _SerializedAnnotationType } from "./OldSerializedAnnotationType";
import { _Color } from "./OldColor";

export type _SerializedFileType = {
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
  annotations: Array<_SerializedAnnotationType>;
};
