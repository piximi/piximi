import * as ImageJS from "image-js";

export abstract class Tool {
  /**
   * Image-JS object of the active image (i.e. of the image that we are annotating on).
   * https://image-js.github.io/image-js/#image
   */
  image: ImageJS.Image;

  constructor(image: ImageJS.Image) {
    this.image = image;
  }
}
