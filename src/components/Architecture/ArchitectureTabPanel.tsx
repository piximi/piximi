import React from "react";

import TabPanel from "@mui/lab/TabPanel";

import { InputShape } from "components/InputShape";
import { Architecture } from "./Architecture";

export const ArchitectureTabPanel = () => {
  return (
    <TabPanel value="architecture">
      <Architecture />

      <InputShape />
    </TabPanel>
  );
};
