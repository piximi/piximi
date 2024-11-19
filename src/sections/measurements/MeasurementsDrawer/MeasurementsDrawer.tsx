import React from "react";

import { AppBarOffset } from "components/AppBarOffset";
import { BaseAppDrawer } from "components/BaseAppDrawer";
import { MeasurementGroupOptionsContainer } from "../MeasurementGroupOptionsContainer";
import { MeasurementsAppBar } from "../MeasurementsAppBar";

export const MeasurementsDrawer = () => {
  return (
    <BaseAppDrawer>
      <MeasurementsAppBar />
      <AppBarOffset />
      <MeasurementGroupOptionsContainer />
    </BaseAppDrawer>
  );
};
