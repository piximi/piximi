import React from "react";
import Tab from "@material-ui/core/Tab";
import { TrainingTabPanel } from "../TrainingTabPanel";
import TabContext from "@material-ui/lab/TabContext";
import TabList from "@material-ui/lab/TabList";
import { PreprocessingTabPanel } from "../PreprocessingTabPanel";
import { ArchitectureTabPanel } from "../ArchitectureTabPanel";

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
