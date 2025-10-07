import { useContext } from "react";
import { MeasurementsContext } from "../providers/MeasurementsProvider";

export const useMeasurementParameters = () => {
  return useContext(MeasurementsContext)!;
};
