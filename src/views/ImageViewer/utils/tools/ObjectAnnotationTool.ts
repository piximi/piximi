import {
  loadLayersModel,
  train,
  tidy,
  image,
  browser,
  scalar,
} from "@tensorflow/tfjs";
import { fromMask, Image as IJSImage, writeCanvas } from "image-js-latest";

import type { Point } from "utils/types";

import { RectangularAnnotationTool } from "./RectangularAnnotationTool";
import { AnnotationState } from "../enums";

import type { LayersModel, Tensor, Tensor3D, Rank } from "@tensorflow/tfjs";

export class ObjectAnnotationTool extends RectangularAnnotationTool {
  graph?: LayersModel;
  prediction?: IJSImage;
  points: Array<Point> = [];
  // @ts-ignore it does exist
  roi?: IJSImage.Roi;
  offset?: { x: number; y: number };
  output?: IJSImage;

  deselect() {
    this.prediction = undefined;
    this.points = [];
    this.roi = undefined;
    this.offset = undefined;
    this.output = undefined;

    this.origin = undefined;
    this.width = undefined;
    this.annotation = undefined;

    this.setBlank();
  }

  async onMouseUp(_position: { x: number; y: number }) {
    if (this.annotationState !== AnnotationState.Annotating) return;

    await this.predict();
  }

  static async compile(image: IJSImage) {
    const instance = new ObjectAnnotationTool(image);

    const pathname =
      "https://raw.githubusercontent.com/zaidalyafeai/HostedModels/master/unet-128/model.json";

    instance.graph = await loadLayersModel(pathname);

    const optimizer = train.adam();

    instance.graph.compile({
      optimizer: optimizer,
      loss: "categoricalCrossentropy",
      metrics: ["accuracy"],
    });

    return instance;
  }

  private async predict() {
    if (!this.image || !this.origin || !this.width || !this.height) return;

    const width = Math.round(this.width);
    const height = Math.round(this.height);

    const crop = this.image.crop({
      origin: { column: this.origin.x, row: this.origin.y },
      width: width,
      height: height,
    });

    const prediction = tidy(() => {
      if (crop) {
        const canvas = document.createElement("canvas");
        writeCanvas(crop, canvas);
        const cropped: Tensor3D = browser.fromPixels(canvas);

        const size: [number, number] = [128, 128];
        const resized = image.resizeBilinear(cropped, size);
        const standardized = resized.div(scalar(255));
        const batch = standardized.expandDims(0);

        if (!this.height || !this.width || !this.origin) return;

        if (this.graph) {
          const prediction = this.graph.predict(batch) as Tensor<Rank>;

          return prediction
            .squeeze([0])
            .tile([1, 1, 3])
            .sub(0.3)
            .sign()
            .relu()
            .resizeBilinear([height, width])
            .pad([
              [this.origin.y, this.image.height - (this.origin.y + height)],
              [this.origin.x, this.image.width - (this.origin.x + width)],
              [0, 0],
            ]);
        }
      }
    });

    if (prediction) {
      const clamped: Uint8ClampedArray = await browser.toPixels(
        prediction as Tensor3D,
      );
      // .then(async (clamped) => {
      this.output = new IJSImage(this.image.width, this.image.height, {
        data: clamped,
      });

      const greyMask = this.output.grey();

      const binaryMask = greyMask.threshold({
        threshold: 1,
      });
      const roiMap = fromMask(binaryMask);

      const rois = roiMap.getRois();
      // take the second roi because the first one will be of the size of the image,the second one is the actual largest roi
      const roi = rois.sort((a: any, b: any) => {
        return b.surface - a.surface;
      })[1];
      const minX = roi.origin.column;
      const minY = roi.origin.row;
      this._boundingBox = [minX, minY, minX + roi.width, minY + roi.height];

      //threshold
      const thresholded = greyMask
        .getRawImage()
        .data.map((i: number) => (i > 1 ? 255 : 0)); //threshold necessary because output of NN is not binary

      this.decodedMask = thresholded as Uint8Array;

      this.width = undefined;
    }

    this.setAnnotated();
  }
}
