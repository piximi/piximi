import Radio from "@mui/material/Radio";
import React from "react";
import { RadioGroup } from "@mui/material";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import { batch, useDispatch, useSelector } from "react-redux";
import { ZoomModeType } from "../../../../types/ZoomModeType";
import {
  setOffset,
  setStageScale,
  setZoomToolOptions,
} from "../../../../annotator/store";
import Checkbox from "@mui/material/Checkbox";
import {
  imageSelector,
  stageHeightSelector,
  stageScaleSelector,
  stageWidthSelector,
  zoomToolOptionsSelector,
} from "../../../../store/selectors";
import ListSubheader from "@mui/material/ListSubheader";
import ListItemIcon from "@mui/material/ListItemIcon";
import {
  CheckboxCheckedIcon,
  CheckboxUncheckedIcon,
  RadioCheckedIcon,
  RadioUncheckedIcon,
} from "../../../../icons";
import { useTranslation } from "../../../../annotator/hooks/useTranslation";
import Divider from "@mui/material/Divider";
import { InformationBox } from "../InformationBox";
import Slider from "@mui/material/Slider";
import Grid from "@mui/material/Grid";
import ZoomInIcon from "@mui/icons-material/ZoomIn";
import ZoomOutIcon from "@mui/icons-material/ZoomOut";
import { offsetSelector } from "../../../../store/selectors/offsetSelector";
import { ResetButton } from "../HandToolOptions/ResetButton";

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
    }; //FIXME hardcoded heights and widths before merging with master branch!;

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

    //FIXME it seems like we are not currently getting the current stageHeight. It currently stays fixes to the initial state in the redux store.
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

    //FIXME it seems like we are not currently getting the current stageHeight. It currently stays fixes to the initial state in the redux store.
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

  const marks = [
    {
      value: 0.000625,
      label: "-1600%",
    },
    {
      value: 0.00125,
      label: "-800%",
    },
    {
      value: 0.0025,
      label: "-400%",
    },
    {
      value: 0.005,
      label: "-200%",
    },
    {
      value: 0.05,
      label: "-150%",
    },
    {
      value: 0.25,
      label: "-100%",
    },
    {
      value: 0.5,
      label: "50%",
    },
    {
      value: 1,
      label: "100%",
    },
    {
      value: 1.5,
      label: "150%",
    },
    {
      value: 2,
      label: "200%",
    },
    {
      value: 4,
      label: "400%",
    },
    {
      value: 8,
      label: "800%",
    },
    {
      value: 16,
      label: "1600%",
    },
  ];

  const valueLabelFormat = (value: number) => {
    if (value < 0 || value >= marks.length) return;

    return marks[value].label;
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
                  icon={
                    <>
                      {/*// @ts-ignore */}
                      <RadioUncheckedIcon />
                    </>
                  }
                  checkedIcon={
                    <>
                      {/*// @ts-ignore */}
                      <RadioCheckedIcon />
                    </>
                  }
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
                  icon={
                    <>
                      {/*// @ts-ignore */}
                      <RadioUncheckedIcon />
                    </>
                  }
                  checkedIcon={
                    <>
                      {/*// @ts-ignore */}
                      <RadioCheckedIcon />
                    </>
                  }
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
          {/*// @ts-ignore */}
          <Checkbox
            checked={options.automaticCentering}
            disableRipple
            edge="start"
            icon={
              <>
                {/*// @ts-ignore */}
                <CheckboxUncheckedIcon />
              </>
            }
            checkedIcon={
              <>
                {/*// @ts-ignore */}
                <RadioCheckedIcon />
              </>
            }
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
