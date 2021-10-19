import { RescalingForm } from "../RescalingForm/RescalingForm";
import * as React from "react";
import { useState } from "react";
import {
  Button,
  Checkbox,
  Collapse,
  FormControlLabel,
  FormGroup,
  ListItem,
  ListItemIcon,
  ListItemText,
  Tooltip,
  Typography,
} from "@mui/material";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";

type PreprocessingSettingsListItemProps = {
  closeDialog: () => void;
  openedDialog: boolean;
};

export const PreprocessingSettingsListItem = ({
  closeDialog,
  openedDialog,
}: PreprocessingSettingsListItemProps) => {
  const [collapsedPreprocessingList, setCollapsedPreprocessingList] =
    useState<boolean>(false);

  const onPreprocessingListClick = () => {
    // shows or hides preprocessing list in interface
    setCollapsedPreprocessingList(!collapsedPreprocessingList);
  };

  // // Preprocessing clicks
  // const [paddingOption1, setPaddingOption1] = React.useState<boolean>(false);
  // const onPaddingOption1Click = () => {
  //   setPaddingOption1(!paddingOption1);
  // };
  //
  // const [paddingOption2, setPaddingOption2] = React.useState<boolean>(false);
  // const onpaddingOption2Click = () => {
  //   setPaddingOption2(!paddingOption2);
  // };

  //TODO implement this (when clicking, we should be doing the preprocessing in the background) -- set it to processed so that it's not re-done in the Saga
  // Skeleton
  // const onPreprocessingClick = async (
  //   lowerPercentile: number,
  //   upperPercentile: number,
  //   labeledData: ImageType[]
  // ) => {
  //   //does actual preprocessing upon clicking button
  //
  //   const rescaledSet = await rescaleData(
  //     lowerPercentile,
  //     upperPercentile,
  //     labeledData
  //   );
  //   const resizedSet = await resizeData(
  //     paddingOption1,
  //     paddingOption2,
  //     labeledData
  //   );
  //   const augmentedSet = await augmentData(dataAugmentation, labeledData);
  // };
  //
  // const [dataAugmentation, setDataAugmentation] =
  //   React.useState<boolean>(false);
  // const onDataAugmentationClick = () => {
  //   setDataAugmentation(!dataAugmentation);
  // };

  return (
    <>
      <ListItem
        button
        onClick={onPreprocessingListClick}
        style={{ padding: "12px 0px" }}
      >
        <ListItemIcon>
          {collapsedPreprocessingList ? <ExpandLessIcon /> : <ExpandMoreIcon />}
        </ListItemIcon>

        <ListItemText primary="Preprocessing" style={{ fontSize: "1em" }} />
      </ListItem>
      <Collapse in={collapsedPreprocessingList} timeout="auto" unmountOnExit>
        <Typography id="rescaling" gutterBottom>
          Pixel Intensity Rescaling
        </Typography>

        <RescalingForm />

        <Typography id="augmentation" gutterBottom>
          Data Augmentation
        </Typography>

        <FormGroup row>
          <FormControlLabel
            control={
              // @ts-ignore
              <Checkbox value="randomDataAugmentation" />
            }
            label="Random Data Augmentation"
          ></FormControlLabel>
        </FormGroup>

        <Typography id="resizing" gutterBottom>
          Resizing
        </Typography>

        <FormGroup row>
          <FormControlLabel
            // @ts-ignore
            control={<Checkbox value="paddingOption1" />}
            label="Padding Option 1"
          ></FormControlLabel>
        </FormGroup>

        <FormGroup row>
          <FormControlLabel
            // @ts-ignore
            control={<Checkbox value="paddingOption2" />}
            label="Padding Option 2"
          ></FormControlLabel>
        </FormGroup>
        <Tooltip title="Apply Preprocessing Settings" placement="bottom">
          <div>
            <Button variant="contained" color="primary" onClick={() => {}}>
              Apply preprocessing
            </Button>
          </div>
        </Tooltip>
      </Collapse>
    </>
  );
};
