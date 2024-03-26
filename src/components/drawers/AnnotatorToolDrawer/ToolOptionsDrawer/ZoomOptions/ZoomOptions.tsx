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

import { useTranslation, useZoom } from "hooks";

import {
  setStagePosition,
  selectStageHeight,
  selectStageWidth,
  selectZoomSelection,
  selectZoomToolOptions,
  setZoomToolOptions,
  selectStageScale,
} from "store/slices/imageViewer";
import { selectActiveImage } from "store/slices/data";

import { ZoomModeType } from "types";

import {
  CheckboxCheckedIcon,
  CheckboxUncheckedIcon,
  RadioCheckedIcon,
  RadioUncheckedIcon,
} from "icons";
import { CustomListItemButton } from "components/list-items/CustomListItemButton";
import { CustomListItem } from "components/list-items/CustomListItem";
import { DividerHeader } from "components/styled-components";
import { StageContext } from "contexts";

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
      dispatch(setZoomToolOptions(payload));
    });
  };

  const onToActualSizeClick = () => {
    const payload = {
      options: {
        ...options,
        toActualSize: !options.toActualSize,
      },
    };

    dispatch(setZoomToolOptions(payload));
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

    dispatch(setZoomToolOptions(payload));
    zoomAndOffset(newScale, { x: stageWidth / 2, y: stageHeight / 2 });
  };

  const onModeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt((event.target as HTMLInputElement).value);

    const payload = {
      options: {
        ...options,
        mode: value as ZoomModeType,
      },
    };

    dispatch(setZoomToolOptions(payload));
  };

  const onModeClick = (event: any, mode: ZoomModeType) => {
    const payload = {
      options: {
        ...options,
        mode: mode,
      },
    };

    dispatch(setZoomToolOptions(payload));
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
      setStagePosition({
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
        defaultValue={ZoomModeType.In}
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
                value={ZoomModeType.In}
                onClick={(event) => onModeClick(event, ZoomModeType.In)}
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
                value={ZoomModeType.Out}
                onClick={(event) => onModeClick(event, ZoomModeType.Out)}
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
