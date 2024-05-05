import React from "react";
import { AppBarOffset } from "components/styled-components";
import { MeasurementBaseAppDrawer } from "./MeasurementBaseAppDrawer";
import { MeasurementTableOptionsContainer } from "./measurement-tables/MeasurementTableOptionsContainer";

export const MeasurementsDrawer = () => {
  return (
    <MeasurementBaseAppDrawer>
      <AppBarOffset />
      <MeasurementTableOptionsContainer />
    </MeasurementBaseAppDrawer>
  );
};
