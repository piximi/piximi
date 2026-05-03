import type { Shape } from "store/dataV2/types";
import type { SegmenterState } from "store/segmenter/types";

import type { Partition } from "utils/dl/enums";

import type {
  V01BitDepth,
  V01ClassifierState,
  V01Category,
  V01RawImageObject,
  V01ProjectState,
} from "./v01Types";
import type { EntityState } from "@reduxjs/toolkit";
import type { RawData } from "../../types";

// ============================================================
// V02 Piximi State
// ============================================================

export type V02PiximiState = {
  project: V02ProjectState;
  classifier: V02ClassifierState;
  data: {
    things: EntityState<V02RawImageObject | V02RawAnnotationObject, string>;
    categories: EntityState<V02Category, string>;
    kinds: EntityState<V02Kind, string>;
  };
  segmenter: SegmenterState;
};

// ============================================================
// V02 Project
// ============================================================

export type V02ProjectState = V01ProjectState;

// ============================================================
// V01 Classifier
// ============================================================

export type V02ClassifierState = V01ClassifierState;

// ============================================================
// V01 Data
// ============================================================

export type V02BitDepth = V01BitDepth;
export type V02Kind = {
  id: string;
  displayName: string;
  unknownCategoryId: string;
  containing: string[];
  categories: string[];
};
export type V02Category = V01Category & {
  kind: string;
  containing: string[];
};

export type V02RawImageObject = V01RawImageObject & {
  kind: string;
  containing: string[];
};

export type V02RawAnnotationObject = {
  id: string;
  name: string;
  kind: string;
  activePlane: number;
  categoryId: string;
  partition: Partition;
  bitDepth: V01BitDepth;
  shape: Shape;
  boundingBox: [number, number, number, number];
  encodedMask: number[];
  imageId: string;
  plane: number;
  tensorData: RawData;
};
