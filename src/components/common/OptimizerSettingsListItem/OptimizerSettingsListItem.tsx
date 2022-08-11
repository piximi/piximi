import { useState } from "react";

import { Collapse, ListItem, ListItemIcon, ListItemText } from "@mui/material";
import {
  ExpandLess as ExpandLessIcon,
  ExpandMore as ExpandMoreIcon,
} from "@mui/icons-material";

import {
  OptimizerSettingsGrid,
  OptimizerSettingsGridProps,
} from "./OptimizerSettingsGrid/OptimizerSettingsGrid";

export const OptimizerSettingsListItem = ({
  compileOptions,
  dispatchLossFunctionCallback,
  dispatchOptimizationAlgorithmCallback,
  dispatchEpochsCallback,
  fitOptions,
  dispatchBatchSizeCallback,
  dispatchLearningRateCallback,
}: OptimizerSettingsGridProps) => {
  const [collapsedOptimizerSettingsList, setCollapsedOptimizerSettingsList] =
    useState<boolean>(false);

  const onOptimizerSettingsListClick = () => {
    setCollapsedOptimizerSettingsList(!collapsedOptimizerSettingsList);
  };

  return (
    <>
      <ListItem
        button
        onClick={onOptimizerSettingsListClick}
        style={{ padding: "12px 0px" }}
      >
        <ListItemIcon>
          {collapsedOptimizerSettingsList ? (
            <ExpandLessIcon />
          ) : (
            <ExpandMoreIcon />
          )}
        </ListItemIcon>

        <ListItemText
          primary="Optimization Settings"
          style={{ fontSize: "20px" }}
        />
      </ListItem>
      <Collapse
        in={collapsedOptimizerSettingsList}
        timeout="auto"
        unmountOnExit
      >
        <OptimizerSettingsGrid
          compileOptions={compileOptions}
          dispatchLossFunctionCallback={dispatchLossFunctionCallback}
          dispatchOptimizationAlgorithmCallback={
            dispatchOptimizationAlgorithmCallback
          }
          dispatchEpochsCallback={dispatchEpochsCallback}
          fitOptions={fitOptions}
          dispatchBatchSizeCallback={dispatchBatchSizeCallback}
          dispatchLearningRateCallback={dispatchLearningRateCallback}
        />
      </Collapse>
    </>
  );
};
