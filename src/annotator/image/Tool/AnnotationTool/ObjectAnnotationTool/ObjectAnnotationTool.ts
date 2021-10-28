import { RectangularAnnotationTool } from "../RectangularAnnotationTool";
import * as ImageJS from "image-js";
import * as tensorflow from "@tensorflow/tfjs";
import * as _ from "lodash";
import { encode } from "../../../rle";

export class ObjectAnnotationTool extends RectangularAnnotationTool {
  graph?: tensorflow.LayersModel;
  prediction?: ImageJS.Image;
  points: Array<number> = [];
  // @ts-ignore
  roi?: ImageJS.Roi;
  offset?: { x: number; y: number };
  output?: ImageJS.Image;

  deselect() {
    this.annotated = false;
    this.annotating = false;

    this.prediction = undefined;
    this.points = [];
    this.roi = undefined;
    this.offset = undefined;
    this.output = undefined;

    this.origin = undefined;
    this.width = undefined;
  }

  async onMouseUp(position: { x: number; y: number }) {
    if (!this.annotating || this.annotated) return;

    await this.predict();
  }

  static async compile(image: ImageJS.Image) {
    const instance = new ObjectAnnotationTool(image);

    const pathname =
      "https://raw.githubusercontent.com/zaidalyafeai/HostedModels/master/unet-128/model.json";

    instance.graph = await tensorflow.loadLayersModel(pathname);

    const optimizer = tensorflow.train.adam();

    instance.graph.compile({
      optimizer: optimizer,
      loss: "categoricalCrossentropy",
      metrics: ["accuracy"],
    });

    return instance;
  }

  private async predict() {
    if (!this.image || !this.origin || !this.width || !this.height) return;

    this.annotating = false;

    const width = Math.round(this.width);
    const height = Math.round(this.height);

    const crop = this.image.crop({
      x: this.origin.x,
      y: this.origin.y,
      width: width,
      height: height,
    });

    const prediction = tensorflow.tidy(() => {
      if (crop) {
        const cropped: tensorflow.Tensor3D = tensorflow.browser.fromPixels(
          crop.getCanvas()
        );

        const size: [number, number] = [128, 128];
        const resized = tensorflow.image.resizeBilinear(cropped, size);
        const standardized = resized.div(tensorflow.scalar(255));
        const batch = standardized.expandDims(0);

        if (!this.height || !this.width || !this.origin) return;

        if (this.graph) {
          const prediction = this.graph.predict(
            batch
          ) as tensorflow.Tensor<tensorflow.Rank>;

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
      const clamped: Uint8ClampedArray = await tensorflow.browser.toPixels(
        prediction as tensorflow.Tensor3D
      );
      // .then(async (clamped) => {
      this.output = new ImageJS.Image({
        width: this.image.width,
        height: this.image.height,
        data: clamped,
      });

      const greyMask = this.output.grey();

      //compute bounding box with ROI manager
      const roiManager = this.image.getRoiManager();
      //@ts-ignore
      const binaryMask = greyMask.mask({
        algorithm: "threshold",
        threshold: 1,
      });
      // @ts-ignore
      roiManager.fromMask(binaryMask);
      // @ts-ignore
      const rois = roiManager.getRois();
      const roi = rois.sort((a: any, b: any) => {
        return b.surface - a.surface;
      })[1]; // take the second roi because the first one will be of the size of the image,the second one is the actual largest roi
      this._boundingBox = [roi.minX, roi.minY, roi.maxX, roi.maxY];

      //threshold
      const thresholded = _.map(greyMask.data, (i: number) =>
        i > 1 ? 255 : 0
      ); //threshold necessary because output of NN is not binary

      // @ts-ignore
      this._mask = encode(thresholded);

      this.annotated = true;
      this.width = undefined;
    }
  }
}
