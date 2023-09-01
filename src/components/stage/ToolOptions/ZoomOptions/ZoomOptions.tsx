import React, { useContext } from "react";
import { batch, useDispatch, useSelector } from "react-redux";

import {
  Checkbox,
  Divider,
  Grid,
  List,
  ListItem,
  ListSubheader,
  Radio,
  RadioGroup,
  Slider,
} from "@mui/material";

import {
  ZoomIn as ZoomInIcon,
  ZoomOut as ZoomOutIcon,
} from "@mui/icons-material";

import { useTranslation, useZoom } from "hooks";

import { StageContext } from "views/ImageViewer/ImageViewer";
import {
  setStagePosition,
  selectStageHeight,
  selectStageWidth,
  selectZoomSelection,
  selectZoomToolOptions,
  setZoomToolOptions,
} from "store/imageViewer";
import { selectActiveImage } from "store/data";

import { ZoomModeType } from "types";

import {
  CheckboxCheckedIcon,
  CheckboxUncheckedIcon,
  RadioCheckedIcon,
  RadioUncheckedIcon,
} from "icons";
import { CustomListItemButton } from "components/list-items/CustomListItemButton";
import { CustomListItem } from "components/list-items/CustomListItem";

//TODO: Slider

export const ZoomOptions = () => {
  const dispatch = useDispatch();

  const options = useSelector(selectZoomToolOptions);
  const stageWidth = useSelector(selectStageWidth);
  const stageHeight = useSelector(selectStageHeight);
  const stageRef = useContext(StageContext);
  const image = useSelector(selectActiveImage);
  const { centerPoint } = useSelector(selectZoomSelection);

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
    if (options.automaticCentering) {
      zoomAndOffset(value, centerPoint!);
    } else {
      zoomAndOffset(value, { x: stageWidth / 2, y: stageHeight / 2 });
    }
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

  // @ts-ignore
  return (
    <>
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
                value={stageRef?.current?.scaleX()!}
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
      </List>

      <Divider />

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
      />

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
      <List sx={{ mt: "auto" }}>
        <CustomListItem
          primaryText={t("Alt+Click to drage stage")}
          primaryTypographyProps={{
            color: "gray",
            fontSize: "0.875rem",
            textAlign: "center",
          }}
        />
      </List>
    </>
  );
};
