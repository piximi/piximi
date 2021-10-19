import React from "react";
import { InputShape } from "../InputShape";
import { Architecture } from "../Architecture";
import TabPanel from "@mui/lab/TabPanel";

export const ArchitectureTabPanel = () => {
  return (
    <TabPanel value="architecture">
      <Architecture />

      <InputShape />
    </TabPanel>
  );
};
