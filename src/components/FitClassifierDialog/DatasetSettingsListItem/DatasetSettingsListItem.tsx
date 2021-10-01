import {
  Button,
  Collapse,
  ListItem,
  ListItemIcon,
  ListItemText,
  Tooltip,
} from "@material-ui/core";
import ExpandLessIcon from "@material-ui/icons/ExpandLess";
import ExpandMoreIcon from "@material-ui/icons/ExpandMore";
import * as React from "react";
import Typography from "@material-ui/core/Typography";
import Slider from "@material-ui/core/Slider";
import { useState } from "react";

type DatasetSettingsListItemProps = {
  initializeDatasets: () => void;
  datasetSplits: number[];
  handleChange: (event: any, newValue: any) => void;
};

export const DatasetSettingsListItem = ({
  initializeDatasets,
  datasetSplits,
  handleChange,
}: DatasetSettingsListItemProps) => {
  function valuetext(value: any) {
    return `${value}%`;
  }

  const [collapsedDatasetSettingsList, setCollapsedDatasetSettingsList] =
    useState<boolean>(false);

  const onDatasetSettingsListClick = () => {
    setCollapsedDatasetSettingsList(!collapsedDatasetSettingsList);
  };

  return (
    <>
      <ListItem
        button
        onClick={onDatasetSettingsListClick}
        style={{ padding: "12px 0px" }}
      >
        <ListItemIcon>
          {collapsedDatasetSettingsList ? (
            <ExpandLessIcon />
          ) : (
            <ExpandMoreIcon />
          )}
        </ListItemIcon>

        <ListItemText primary="Dataset Settings" style={{ fontSize: "1em" }} />
      </ListItem>
      <Collapse in={collapsedDatasetSettingsList} timeout="auto" unmountOnExit>
        <Tooltip title="Initialize dataset" placement="bottom">
          <Button
            variant="contained"
            color="primary"
            onClick={initializeDatasets}
          >
            Initialize Dataset
          </Button>
        </Tooltip>
        <div style={{ padding: "12px 0px", width: "300" }}>
          <Typography id="range-slider" gutterBottom>
            Dataset Splits
          </Typography>

          <Slider
            value={datasetSplits}
            onChange={handleChange}
            valueLabelDisplay="auto"
            aria-labelledby="range-slider"
            getAriaValueText={valuetext}
          />
        </div>
      </Collapse>
    </>
  );
};
