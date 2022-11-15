import React from "react";
import { batch, useDispatch, useSelector } from "react-redux";

import {
  Checkbox,
  Divider,
  Grid,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListSubheader,
  Radio,
  RadioGroup,
  Slider,
} from "@mui/material";

import {
  ZoomIn as ZoomInIcon,
  ZoomOut as ZoomOutIcon,
} from "@mui/icons-material";

import { useTranslation } from "hooks";

import { InformationBox } from "../InformationBox";
import { ResetButton } from "../HandToolOptions/ResetButton";

import {
  offsetSelector,
  setOffset,
  setStageScale,
  stageHeightSelector,
  stageScaleSelector,
  stageWidthSelector,
} from "store/annotator";
import { imageSelector } from "store/common";
import {
  zoomToolOptionsSelector,
  setZoomToolOptions,
} from "store/tool-options";

import { ZoomModeType } from "types";

import {
  CheckboxCheckedIcon,
  CheckboxUncheckedIcon,
  RadioCheckedIcon,
  RadioUncheckedIcon,
} from "icons";

export const ZoomOptions = () => {
  const dispatch = useDispatch();

  const options = useSelector(zoomToolOptionsSelector);

  const stageWidth = useSelector(stageWidthSelector);
  const stageHeight = useSelector(stageHeightSelector);

  const t = useTranslation();

  const scale = useSelector(stageScaleSelector);
  const image = useSelector(imageSelector);
  const offset = useSelector(offsetSelector);

  const onAutomaticCenteringChange = () => {
    const payload = {
      options: {
        ...options,
        automaticCentering: !options.automaticCentering,
      },
    };

    const centerOffset = {
      x:
        offset.x !== 0
          ? 0
          : ((image && image.shape ? image.shape.width : 512) * scale) / 2 -
            offset.x,
      y:
        offset.y !== 0
          ? 0
          : ((image && image.shape ? image.shape.height : 512) * scale) / 2 -
            offset.y,
    };

    batch(() => {
      dispatch(setZoomToolOptions(payload));
      dispatch(setOffset({ offset: centerOffset }));
    });
  };

  const onToActualSizeClick = () => {
    const payload = {
      options: {
        ...options,
        automaticCentering: true,
        toActualSize: !options.toActualSize,
      },
    };

    batch(() => {
      dispatch(setZoomToolOptions(payload));
      dispatch(setStageScale({ stageScale: 1 }));
      dispatch(setOffset({ offset: { x: 0, y: 0 } }));
    });
  };

  const onToFullSizeClick = () => {
    const payload = {
      options: {
        ...options,
        automaticCentering: true,
        toFit: !options.toFit,
      },
    };

    if (!image || !image.shape) return;

    const imageWidth = image && image.shape ? image.shape.width : 512;
    const imageHeight = image && image.shape ? image.shape.height : 512;
    if (imageHeight / stageHeight > imageWidth / stageWidth) {
      dispatch(
        setStageScale({
          stageScale: stageHeight / imageHeight,
        })
      );
    } else {
      dispatch(
        setStageScale({
          stageScale: stageWidth / imageWidth,
        })
      );
    }
    batch(() => {
      dispatch(setZoomToolOptions(payload));

      dispatch(setOffset({ offset: { x: 0, y: 0 } }));
    });
  };

  const onToFitClick = () => {
    const payload = {
      options: {
        ...options,
        automaticCentering: true,
        toFit: !options.toFit,
      },
    };

    if (!image || !image.shape) return;

    const imageWidth = image && image.shape ? image.shape.width : 512;
    const imageHeight = image && image.shape ? image.shape.height : 512;
    if (imageHeight / stageHeight > imageWidth / stageWidth) {
      dispatch(
        setStageScale({
          stageScale: (0.95 * stageHeight) / imageHeight,
        })
      );
    } else {
      dispatch(
        setStageScale({
          stageScale: (0.95 * stageWidth) / imageWidth,
        })
      );
    }

    batch(() => {
      dispatch(setZoomToolOptions(payload));

      dispatch(setOffset({ offset: { x: 0, y: 0 } }));
    });
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
    dispatch(setStageScale({ stageScale: value }));
  };

  // @ts-ignore
  return (
    <>
      <InformationBox description="…" name={t("Zoom")} />

      <Divider />

      <List
        component="nav"
        subheader={
          <ListSubheader component="div">{t("Zoom scale")}</ListSubheader>
        }
      >
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
                valueLabelDisplay="auto"
                value={scale}
                min={0.01}
                max={10}
                step={0.01}
              />
            </Grid>
            <Grid item>
              <ZoomInIcon />
            </Grid>
          </Grid>
        </ListItem>
      </List>

      <Divider />

      <List dense>
        <RadioGroup
          defaultValue={ZoomModeType.In}
          aria-label="annotation mode"
          name="annotation-mode"
          onChange={onModeChange}
          value={options.mode}
        >
          <List
            component="nav"
            subheader={
              <ListSubheader component="div">{t("Zoom mode")}</ListSubheader>
            }
          >
            <ListItem
              button
              dense
              onClick={(event) => onModeClick(event, ZoomModeType.In)}
            >
              <ListItemIcon>
                <Radio
                  disableRipple
                  edge="start"
                  icon={<RadioUncheckedIcon />}
                  checkedIcon={<RadioCheckedIcon />}
                  tabIndex={-1}
                  value={ZoomModeType.In}
                />
              </ListItemIcon>

              <ListItemText primary={t("Zoom in")} />
            </ListItem>

            <ListItem
              button
              dense
              onClick={(event) => onModeClick(event, ZoomModeType.Out)}
            >
              <ListItemIcon>
                <Radio
                  disableRipple
                  edge="start"
                  icon={<RadioUncheckedIcon />}
                  checkedIcon={<RadioCheckedIcon />}
                  tabIndex={-1}
                  value={ZoomModeType.Out}
                />
              </ListItemIcon>

              <ListItemText primary={t("Zoom out")} />
            </ListItem>
          </List>
        </RadioGroup>
      </List>

      <Divider />

      <ListItem button dense onClick={onAutomaticCenteringChange}>
        <ListItemIcon>
          <Checkbox
            checked={options.automaticCentering}
            disableRipple
            edge="start"
            icon={<CheckboxUncheckedIcon />}
            checkedIcon={<CheckboxCheckedIcon />}
            tabIndex={-1}
          />
        </ListItemIcon>

        <ListItemText primary={t("Automatically zoom towards the center")} />
      </ListItem>

      <Divider />

      <List dense>
        <ListItem button onClick={onToActualSizeClick}>
          <ListItemText>{t("Actual size")}</ListItemText>
        </ListItem>

        <ListItem button onClick={onToFullSizeClick}>
          <ListItemText>{t("Full size")}</ListItemText>
        </ListItem>

        <ListItem button onClick={onToFitClick}>
          <ListItemText>{t("Fit to canvas")}</ListItemText>
        </ListItem>

        <ResetButton />
      </List>
    </>
  );
};
