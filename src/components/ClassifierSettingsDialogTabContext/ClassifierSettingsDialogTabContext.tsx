import React from "react";
import { PreprocessingTabPanel } from "../PreprocessingTabPanel";
import { ArchitectureTabPanel } from "../ArchitectureTabPanel";
import { TrainingTabPanel } from "../TrainingTabPanel";
import { TabContext, TabList } from "@mui/lab";
import { Tab } from "@mui/material";

export const ClassifierSettingsDialogTabContext = () => {
  const [value, setValue] = React.useState<string>("preprocessing");

  const onChange = (event: React.ChangeEvent<{}>, v: string) => {
    setValue(v);
  };

  return (
    <TabContext value={value}>
      <TabList aria-label="classifier settings" onChange={onChange}>
        <Tab label="Preprocessing" value="preprocessing" />
        <Tab label="Training" value="training" />
        <Tab label="Architecture" value="architecture" />
      </TabList>

      <PreprocessingTabPanel />
      <TrainingTabPanel />
      <ArchitectureTabPanel />
    </TabContext>
  );
};
