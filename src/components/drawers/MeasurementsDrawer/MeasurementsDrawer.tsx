import React from "react";
import { AppBarOffset } from "components/styled-components";
import { MeasurementTableOptionsContainer } from "./measurement-tables/MeasurementTableOptionsContainer";
import { BaseAppDrawer } from "../BaseAppDrawer";
import { MeasurementsAppBar } from "components/app-bars";

export const MeasurementsDrawer = () => {
  return (
    <BaseAppDrawer>
      <MeasurementsAppBar />
      <AppBarOffset />
      <MeasurementTableOptionsContainer />
    </BaseAppDrawer>
  );
};
