import { AnnotationTool } from "../AnnotationTool";
import {
  createPathFinder,
  getDistance,
  makeGraph,
  PiximiGraph,
} from "utils/annotator";
import { getIdx } from "utils/common";
import { pointsAreEqual } from "utils/annotator";
import * as ImageJS from "image-js";

import { AnnotationStateType } from "types/AnnotationStateType";
import { Point } from "types";

export class MagneticAnnotationTool extends AnnotationTool {
  anchor?: Point;
  buffer: Array<Point> = [];
  factor: number;
  graph?: PiximiGraph;
  origin?: Point;
  path: Array<Point> = [];
  pathfinder?: { find: (fromId: number, toId: number) => any };
  points: Array<Point> = [];
  previous: Array<Point> = [];
  response?: ImageJS.Image;

  constructor(image: ImageJS.Image, factor: number = 0.5) {
    super(image);

    this.factor = factor;

    this.filter();

    if (!this.image || !this.response) return;

    this.graph = makeGraph(
      this.response.data,
      this.response.height,
      this.response.width
    );

    this.pathfinder = createPathFinder(
      this.graph,
      this.image.width * factor,
      factor
    );
  }

  deselect() {
    this.annotation = undefined;

    this.anchor = undefined;
    this.buffer = [];
    this.graph = undefined;
    this.origin = undefined;
    this.points = [];
    this.previous = [];

    this.setBlank();
  }

  onMouseDown(position: { x: number; y: number }) {
    if (this.annotationState === AnnotationStateType.Annotated) return;

    if (this.buffer && this.buffer.length === 0) {
      if (!this.origin) {
        this.origin = position;
      }

      this.setAnnotating();
    }
  }

  onMouseMove(position: { x: number; y: number }) {
    if (
      !this.image ||
      !this.pathfinder ||
      this.annotationState !== AnnotationStateType.Annotating
    )
      return;
    if (this.anchor) {
      const source = getIdx(
        this.image.width * this.factor,
        1,
        Math.floor(this.anchor.x * this.factor),
        Math.floor(this.anchor.y * this.factor),
        0
      );

      const destination = getIdx(
        this.image.width * this.factor,
        1,
        Math.floor(position.x * this.factor),
        Math.floor(position.y * this.factor),
        0
      );

      this.path = this.pathfinder.find(source, destination).flat();

      if (!pointsAreEqual(this.buffer.at(-1)!, this.anchor)) {
        this.buffer.pop();
      }

      this.buffer = [...this.previous, this.anchor, ...this.path];

      return;
    }

    if (this.origin) {
      const source = getIdx(
        this.image.width * this.factor,
        1,
        Math.floor(this.origin.x * this.factor),
        Math.floor(this.origin.y * this.factor),
        0
      );

      const destination = getIdx(
        this.image.width * this.factor,
        1,
        Math.floor(position.x * this.factor),
        Math.floor(position.y * this.factor),
        0
      );

      this.path = this.pathfinder.find(source, destination).flat();

      this.buffer.pop();
      this.buffer.pop();

      this.buffer = [this.origin, ...this.path];
    }
  }

  onMouseUp(position: { x: number; y: number }) {
    if (this.annotationState !== AnnotationStateType.Annotating) return;

    if (
      this.connected(position) &&
      this.origin &&
      this.buffer &&
      this.buffer.length > 0
    ) {
      this.buffer = [...this.buffer, position, this.origin];

      this.points = this.buffer;

      this._boundingBox = this.computeBoundingBoxFromContours(this.points);
      const maskImage = this.computeAnnotationMaskFromPoints();
      if (!maskImage) return;

      this.maskData = maskImage.data;

      this.buffer = [];

      this.setAnnotated();

      return;
    }

    if (this.anchor && this.image) {
      const source = getIdx(
        this.image.width * this.factor,
        1,
        Math.floor(this.anchor.x * this.factor),
        Math.floor(this.anchor.y * this.factor),
        0
      );

      const destination = getIdx(
        this.image.width * this.factor,
        1,
        Math.floor(this.buffer.at(-1)!.x * this.factor),
        Math.floor(this.buffer.at(-1)!.y * this.factor),
        0
      );

      if (!this.pathfinder) return;

      this.path = this.pathfinder.find(source, destination).flat();

      this.buffer.pop();

      this.buffer = [...this.previous, ...this.path];

      this.previous = [...this.previous, ...this.path];

      this.anchor = this.buffer.at(-1);

      return;
    }

    if (this.origin && this.buffer.length > 0) {
      if (!this.image || !this.origin || !this.pathfinder) return;

      this.anchor = this.buffer.at(-1);

      const source = getIdx(
        this.image.width * this.factor,
        1,
        Math.floor(this.origin.x * this.factor),
        Math.floor(this.origin.y * this.factor),
        0
      );

      const destination = getIdx(
        this.image.width * this.factor,
        1,
        Math.floor(this.buffer.at(-1)!.x * this.factor),
        Math.floor(this.buffer.at(-1)!.y * this.factor),
        0
      );

      this.path = this.pathfinder.find(source, destination).flat();

      this.buffer = [this.origin, ...this.path];

      this.previous = [...this.previous, this.origin, ...this.path];
      return;
    }
  }

  private connected(
    position: { x: number; y: number },
    threshold: number = 4
  ): boolean | undefined {
    if (!this.origin) return undefined;

    const distance = getDistance(position, this.origin);

    return distance < threshold;
  }

  private filter() {
    if (!this.image) return;

    const options = { factor: this.factor };

    this.response = this.image.resize(options).grey().sobelFilter();
  }
}
