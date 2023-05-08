import * as ImageJS from "image-js";

export type ImageFileType = {
  fileName: string;
  imageStack: ImageJS.Stack;
};

export type ImageFileError = {
  fileName: string;
  error: string;
};
