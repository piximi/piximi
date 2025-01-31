import { readFileSync } from "fs";
import { MIMEType } from "./types";

/*
 Receives a file path to an image file relative to "src", retrieved via path, eg:

 "src/path/to/myImage.png"

 or url path, eg:

 "https://piximi.photos/path/to/img"

 with a "url" flag indicating which path type it is,
 
 and a mimetype, eg.

 "image/png"

 and optionally a name, eg:

 "myImage.png"

 which will be inferred from path if not provided.

 A File object is generated out of it, identical to a File
 object retrived via html:
 
 <input type="file">

 This should only be used for testing node side.
 For browser side, use the analogous function defined in "imageHelper.ts".
*/
export const fileFromPath = async (
  imPath: string,
  mimetype: MIMEType,
  url: boolean = false,
  name: string | undefined = undefined,
) => {
  let imName: string;
  let bufferData: BlobPart;

  if (name === undefined) {
    const pathParts = imPath.split("/");
    imName = pathParts[pathParts.length - 1];
  } else {
    imName = name;
  }

  if (url) {
    bufferData = await fetch(imPath).then((res) => res.blob());
  } else {
    bufferData = readFileSync(imPath).buffer;
  }

  const file = new File([bufferData], imName, { type: mimetype });

  return file;
};
