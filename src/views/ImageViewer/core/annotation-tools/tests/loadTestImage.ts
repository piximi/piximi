import { decodeJpeg } from "image-js-latest";

export const loadTestImage = (dataUrl: string) =>
  decodeJpeg(
    Uint8Array.from(Buffer.from(dataUrl.split(",")[1], "base64")),
  ).convertColor("RGBA");
