import React from "react";
import TabPanel from "@material-ui/lab/TabPanel";
import { InputShape } from "../InputShape";
import { Architecture } from "../Architecture";

export const ArchitectureTabPanel = () => {
  return (
    <TabPanel value="architecture">
      <Architecture />

      <InputShape />
    </TabPanel>
  );
};
