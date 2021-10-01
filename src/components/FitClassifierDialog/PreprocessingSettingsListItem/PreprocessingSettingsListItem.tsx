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
} from "@material-ui/core";
import ExpandLessIcon from "@material-ui/icons/ExpandLess";
import ExpandMoreIcon from "@material-ui/icons/ExpandMore";
import Typography from "@material-ui/core/Typography";
import { RescalingForm } from "../RescalingForm/RescalingForm";
import * as React from "react";
import { Image as ImageType } from "../../../types/Image";
import {
  augmentData,
  rescaleData,
  resizeData,
} from "../FitClassifierDialog/preprocessing";
import { useState } from "react";

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

  // Preprocessing clicks
  const [paddingOption1, setPaddingOption1] = React.useState<boolean>(false);
  const onPaddingOption1Click = () => {
    setPaddingOption1(!paddingOption1);
  };

  const [paddingOption2, setPaddingOption2] = React.useState<boolean>(false);
  const onpaddingOption2Click = () => {
    setPaddingOption2(!paddingOption2);
  };

  const onPreprocessingClick = async (
    lowerPercentile: number,
    upperPercentile: number,
    labeledData: ImageType[]
  ) => {
    //does actual preprocessing upon clicking button
    // Skeleton
    const rescaledSet = await rescaleData(
      lowerPercentile,
      upperPercentile,
      labeledData
    );
    const resizedSet = await resizeData(
      paddingOption1,
      paddingOption2,
      labeledData
    );
    const augmentedSet = await augmentData(dataAugmentation, labeledData);
  };

  const [dataAugmentation, setDataAugmentation] =
    React.useState<boolean>(false);
  const onDataAugmentationClick = () => {
    setDataAugmentation(!dataAugmentation);
  };

  const [lowerPercentile, setLowerPercentile] = React.useState<number>(0);
  const onLowerPercentileChange = (event: React.FormEvent<EventTarget>) => {
    const target = event.target as HTMLInputElement;
    var value = Number(target.value);
    setLowerPercentile(value);
  };

  const [upperPercentile, setUpperPercentile] = React.useState<number>(1);
  const onUpperPercentileChange = (event: React.FormEvent<EventTarget>) => {
    const target = event.target as HTMLInputElement;
    var value = Number(target.value);
    setUpperPercentile(value);
  };

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
        <Tooltip title="Apply Preprocessing Settings" placement="bottom">
          <div>
            <Button variant="contained" color="primary" onClick={() => {}}>
              Apply preprocessing
            </Button>
          </div>
        </Tooltip>
        <Typography id="rescaling" gutterBottom>
          Pixel Intensity Rescaling
        </Typography>
        <RescalingForm
          onLowerPercentileChange={onLowerPercentileChange}
          onUpperPercentileChange={onUpperPercentileChange}
          lowerPercentile={lowerPercentile}
          upperPercentile={upperPercentile}
          closeDialog={closeDialog}
          openedDialog={openedDialog}
        />

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
      </Collapse>
    </>
  );
};
