import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import {
  MeasurementDataState,
  AnnotationMeasurements,
  AnnotationObjectMeasurements,
} from "./types";

const initialState: MeasurementDataState = {
  annotationMeasurements: {},
  imageMeasurements: {},
};

export const measurementDataSlice = createSlice({
  initialState: initialState,
  name: "measurementData",
  reducers: {
    resetMeasurements: () => initialState,

    addAnnotationObjectMeasurement: (
      state,
      action: PayloadAction<{
        id: string;
        measurements: AnnotationObjectMeasurements;
      }>,
    ) => {
      const { id, measurements } = action.payload;
      if (!state.annotationMeasurements[id]) {
        state.annotationMeasurements[id] = {};
      }
      state.annotationMeasurements[id] = {
        ...state.annotationMeasurements[id],
        ...measurements,
      };
    },
    batchAddAnnotationObjectMeasurement: (
      state,
      action: PayloadAction<Record<string, Partial<AnnotationMeasurements>>>,
    ) => {
      Object.entries(action.payload).forEach(([id, measurements]) => {
        if (!state.annotationMeasurements[id]) {
          state.annotationMeasurements[id] = {};
        }
        state.annotationMeasurements[id] = {
          ...state.annotationMeasurements[id],
          ...measurements,
        };
      });
    },
  },
});
