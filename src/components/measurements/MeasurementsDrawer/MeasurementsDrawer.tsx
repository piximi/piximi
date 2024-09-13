import React from "react";
import { AppBarOffset } from "components/styled-components";
import { MeasurementGroupOptionsContainer } from "../MeasurementGroupOptionsContainer";
import { BaseAppDrawer } from "components/drawers/BaseAppDrawer";
import { MeasurementsAppBar } from "components/app-bars";

export const MeasurementsDrawer = () => {
  return (
    <BaseAppDrawer>
      <MeasurementsAppBar />
      <AppBarOffset />
      <MeasurementGroupOptionsContainer />
    </BaseAppDrawer>
  );
};
