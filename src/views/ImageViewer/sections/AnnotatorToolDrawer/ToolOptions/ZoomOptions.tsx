import React, { useContext, useEffect, useState } from "react";
import { batch, useDispatch, useSelector } from "react-redux";
import {
  Checkbox,
  Divider,
  Grid,
  List,
  ListItem,
  Radio,
  RadioGroup,
  Slider,
} from "@mui/material";
import {
  ZoomIn as ZoomInIcon,
  ZoomOut as ZoomOutIcon,
} from "@mui/icons-material";

import { useTranslation } from "hooks";
import { useZoom } from "../../../hooks";

import {
  CustomListItemButton,
  CustomListItem,
  DividerHeader,
} from "components/ui";

import { StageContext } from "views/ImageViewer/state/StageContext";
import { imageViewerSlice } from "views/ImageViewer/state/imageViewer";
import { selectActiveImage } from "views/ImageViewer/state/annotator/reselectors";
import {
  selectStageHeight,
  selectStageScale,
  selectStageWidth,
  selectZoomSelection,
  selectZoomToolOptions,
} from "views/ImageViewer/state/imageViewer/selectors";

import {
  CheckboxCheckedIcon,
  CheckboxUncheckedIcon,
  RadioCheckedIcon,
  RadioUncheckedIcon,
} from "icons";

import { ZoomMode } from "views/ImageViewer/utils/enums";

//TODO: Slider

export const ZoomOptions = () => {
  const dispatch = useDispatch();

  const options = useSelector(selectZoomToolOptions);
  const stageWidth = useSelector(selectStageWidth);
  const stageHeight = useSelector(selectStageHeight);
  const stageRef = useContext(StageContext);
  const image = useSelector(selectActiveImage);
  const { centerPoint } = useSelector(selectZoomSelection);
  const stageScale = useSelector(selectStageScale);
  const [sliderValue, setSliderValue] = useState<number>(
    stageRef?.current?.scaleX() ?? 1
  );

  const t = useTranslation();

  const { zoomAndOffset } = useZoom(stageRef?.current);

  const onAutomaticCenteringChange = () => {
    const payload = {
      options: {
        ...options,
        automaticCentering: !options.automaticCentering,
      },
    };
    batch(() => {
      dispatch(imageViewerSlice.actions.setZoomToolOptions(payload));
    });
  };

  const onToActualSizeClick = () => {
    const payload = {
      options: {
        ...options,
        toActualSize: !options.toActualSize,
      },
    };

    dispatch(imageViewerSlice.actions.setZoomToolOptions(payload));
    zoomAndOffset(1, { x: stageWidth / 2, y: stageHeight / 2 });
  };

  const onToFitClick = () => {
    const payload = {
      options: {
        ...options,
        toFit: !options.toFit,
      },
    };

    if (!image || !image.shape) return;

    const imageWidth = image.shape.width;
    const imageHeight = image.shape.height;
    const newScale = Math.min(
      stageHeight / imageHeight,
      stageWidth / imageWidth
    );

    dispatch(imageViewerSlice.actions.setZoomToolOptions(payload));
    zoomAndOffset(newScale, { x: stageWidth / 2, y: stageHeight / 2 });
  };

  const onModeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt((event.target as HTMLInputElement).value);

    const payload = {
      options: {
        ...options,
        mode: value as ZoomMode,
      },
    };

    dispatch(imageViewerSlice.actions.setZoomToolOptions(payload));
  };

  const onModeClick = (event: any, mode: ZoomMode) => {
    const payload = {
      options: {
        ...options,
        mode: mode,
      },
    };

    dispatch(imageViewerSlice.actions.setZoomToolOptions(payload));
  };

  const onSliderChange = (value: number) => {
    setSliderValue(value);
    zoomAndOffset(value, centerPoint!);
  };
  const onResetClick = () => {
    stageRef?.current?.position({
      x: ((1 - stageRef?.current?.scaleX()!) * stageWidth) / 2,
      y: ((1 - stageRef?.current?.scaleX()!) * stageHeight) / 2,
    });
    dispatch(
      imageViewerSlice.actions.setStagePosition({
        stagePosition: {
          x: ((1 - stageRef?.current?.scaleX()!) * stageWidth) / 2,
          y: ((1 - stageRef?.current?.scaleX()!) * stageHeight) / 2,
        },
      })
    );
  };

  useEffect(() => {
    setSliderValue(stageScale);
  }, [stageScale]);

  return (
    <>
      <List>
        <ListItem>
          <Grid container spacing={2}>
            <Grid item>
              <ZoomOutIcon />
            </Grid>
            <Grid item xs>
              <Slider
                defaultValue={1}
                onChange={(event: any, value: number | number[]) =>
                  onSliderChange(value as number)
                }
                value={sliderValue}
                min={0.25}
                max={5}
                step={0.01}
              />
            </Grid>
            <Grid item>
              <ZoomInIcon />
            </Grid>
          </Grid>
        </ListItem>
        <CustomListItem
          primaryText={t("Automatically zoom towards the center")}
          icon={
            <Checkbox
              checked={options.automaticCentering}
              disableRipple
              edge="start"
              icon={<CheckboxUncheckedIcon />}
              checkedIcon={<CheckboxCheckedIcon />}
              tabIndex={-1}
              onClick={onAutomaticCenteringChange}
            />
          }
          dense
          primaryTypographyProps={{
            fontSize: "0.875rem",
            textAlign: "center",
          }}
        />
      </List>

      <DividerHeader textAlign="left" typographyVariant="body2">
        Zoom Mode
      </DividerHeader>

      <RadioGroup
        defaultValue={ZoomMode.In}
        aria-label="annotation mode"
        name="annotation-mode"
        onChange={onModeChange}
        value={options.mode}
      >
        <List dense>
          <CustomListItem
            primaryText={t("Zoom in")}
            icon={
              <Radio
                disableRipple
                edge="start"
                icon={<RadioUncheckedIcon />}
                checkedIcon={<RadioCheckedIcon />}
                tabIndex={-1}
                value={ZoomMode.In}
                onClick={(event) => onModeClick(event, ZoomMode.In)}
              />
            }
          />

          <CustomListItem
            primaryText={t("Zoom out")}
            icon={
              <Radio
                disableRipple
                edge="start"
                icon={<RadioUncheckedIcon />}
                checkedIcon={<RadioCheckedIcon />}
                tabIndex={-1}
                value={ZoomMode.Out}
                onClick={(event) => onModeClick(event, ZoomMode.Out)}
              />
            }
          />
        </List>
      </RadioGroup>

      <Divider />

      <List dense>
        <CustomListItemButton
          primaryText={t("Actual size")}
          onClick={onToActualSizeClick}
        />

        <CustomListItemButton
          primaryText={t("Fit to canvas")}
          onClick={onToFitClick}
        />

        <CustomListItemButton
          primaryText={t("Reset position")}
          onClick={onResetClick}
        />
      </List>
      <List sx={{ mt: "auto" }} dense>
        <CustomListItem
          primaryText={t("Alt+Click to drag stage")}
          primaryTypographyProps={{
            fontSize: "0.875rem",
            textAlign: "center",
          }}
        />
      </List>
    </>
  );
};
