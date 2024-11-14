import React from "react";
import { AppBarOffset } from "components/AppBarOffset";
import { MeasurementGroupOptionsContainer } from "../MeasurementGroupOptionsContainer";
import { BaseAppDrawer } from "components/BaseAppDrawer";
import { MeasurementsAppBar } from "sections/app-bars";

export const MeasurementsDrawer = () => {
  return (
    <BaseAppDrawer>
      <MeasurementsAppBar />
      <AppBarOffset />
      <MeasurementGroupOptionsContainer />
    </BaseAppDrawer>
  );
};
