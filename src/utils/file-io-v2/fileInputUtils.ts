import {
  FILE,
  MIME,
  type FileAnalysisResult,
  type FileInterpretationResult,
  type FileType,
  type MimeType,
} from "./types";

export const interpretFiles = (files: FileList): FileInterpretationResult => {
  // Phase 1: Return basic analysis
  const results: FileInterpretationResult["fileResults"] = {};
  const imageTypeSet = new Set<FileType>();
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const mimeType = inferMimeType(file);
    const imageType = inferImageType(file.name);
    imageTypeSet.add(imageType);
    if (imageTypeSet.size > 1) {
      throw new Error(
        `Input files must be of the same type. Found ${imageTypeSet.entries}`,
      );
    }

    const result: FileAnalysisResult = {
      fileName: file.name,
      fileSize: file.size,
      mimeType,
      imageType,
    };

    // For TIFF files, analyze in worker to detect multi-frame

    results[file.name] = result;
  }

  return { imageType: [...imageTypeSet][0], fileResults: results };
};

const inferMimeType = (file: File): MimeType => {
  const type = file.type;
  if ((Object.values(MIME) as string[]).includes(type)) {
    return type as MimeType;
  }
  const ext = file.name.split(".").pop()?.toLowerCase();
  switch (ext) {
    case "png":
      return MIME.PNG;
    case "jpg":
    case "jpeg":
      return MIME.JPEG;
    case "tif":
    case "tiff":
      return MIME.TIFF;
    case "dcm":
      return MIME.DICOM;
    case "bmp":
      return MIME.BMP;
    case "czi":
      return MIME.CZI;
    default:
      return MIME.UNKNOWN;
  }
};

const inferImageType = (fileName: string): FileType => {
  const ext = fileName.split(".").pop()?.toLowerCase();
  if (ext === "tif" || ext === "tiff") return FILE.TIFF;
  if (ext === "dcm") return FILE.DICOM;
  if (ext === "czi") return FILE.CZI;
  return FILE.BASIC;
};
