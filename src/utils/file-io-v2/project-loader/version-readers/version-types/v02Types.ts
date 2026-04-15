import { Partition } from "utils/models/enums";
import { V01ClassifierState, V01Category, V01RawImageObject } from "./v01Types";
import { BitDepth, Shape } from "store/data/types";
import { ProjectState, SegmenterState } from "store/types";
import { EntityState } from "@reduxjs/toolkit";
import { RawData } from "../../types";

// ============================================================
// V02 Piximi State
// ============================================================

export type V02PiximiState = {
  project: ProjectState;
  classifier: V02ClassifierState;
  data: {
    things: EntityState<V02RawImageObject | V02RawAnnotationObject, string>;
    categories: EntityState<V02Category, string>;
    kinds: EntityState<V02Kind, string>;
  };
  segmenter: SegmenterState;
};

// ============================================================
// V01 Classifier
// ============================================================

export type V02ClassifierState = V01ClassifierState;

// ============================================================
// V01 Data
// ============================================================

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
  bitDepth: BitDepth;
  shape: Shape;
  boundingBox: [number, number, number, number];
  encodedMask: number[];
  imageId: string;
  plane: number;
  tensorData: RawData;
};
