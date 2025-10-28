import { MeasurementDataState } from "./types";

export const selectAnnotationMeasurements = ({
  measurementData,
}: {
  measurementData: MeasurementDataState;
}) => {
  return measurementData.annotationMeasurements;
};
