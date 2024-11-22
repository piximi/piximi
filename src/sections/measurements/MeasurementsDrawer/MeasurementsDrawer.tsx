import React from "react";

import { AppBarOffset } from "components/ui/AppBarOffset";
import { BaseAppDrawer } from "components/layout";
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
