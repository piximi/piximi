import { basicReader } from "./BasicReader";
import { dicomReader } from "./DicomReader";
import { tiffReader } from "./TiffReader";

import type { IFileReader, MimeType } from "../types";

const readers: IFileReader[] = [basicReader, dicomReader, tiffReader];

const readerMap = new Map<MimeType, IFileReader>();
for (const reader of readers) {
  for (const mime of reader.supportedTypes) {
    readerMap.set(mime, reader);
  }
}

export function getReader(mimeType: MimeType): IFileReader {
  const reader = readerMap.get(mimeType);
  if (!reader) {
    throw new Error(`No reader registered for MIME type: ${mimeType}`);
  }
  return reader;
}
