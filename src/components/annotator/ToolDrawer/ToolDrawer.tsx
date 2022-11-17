import React, { ReactElement } from "react";
import { useDispatch, useSelector } from "react-redux";

import {
  Divider,
  Drawer,
  ListItem,
  ListItemIcon,
  SvgIcon,
  useTheme,
} from "@mui/material";
import { Tune as TuneIcon } from "@mui/icons-material";

import { useHotkeys, useTranslation } from "hooks";

import { Tool } from "../Tool";

import { AnnotatorSlice, toolTypeSelector } from "store/annotator";

import { HotkeyView, ToolType as OperationType } from "types";

import {
  ColorAdjustmentIcon,
  ColorSelectionIcon,
  EllipticalSelectionIcon,
  HandIcon,
  Hand,
  LassoSelectionIcon,
  MagneticSelectionIcon,
  PenSelectionIcon,
  PolygonalSelectionIcon,
  QuickSelectionIcon,
  RectangularSelectionIcon,
  SelectionIcon,
  ZoomIcon,
} from "icons";
import { CustomToolTip } from "../Tool/CustomToolTip";

const toolMap: Record<
  string,
  { operation: OperationType; icon: (color: string) => ReactElement }
> = {
  Hand: {
    operation: OperationType.Hand,
    icon: (color) => <Hand color={color} />,
  },
  Zoom: { operation: OperationType.Zoom, icon: (color) => <ZoomIcon /> },
  "Color Adjustment": {
    operation: OperationType.ColorAdjustment,
    icon: (color) => <ColorAdjustmentIcon />,
  },
  Pointer: {
    operation: OperationType.Pointer,
    icon: (color) => <SelectionIcon />,
  },
  "Rectangular annotation": {
    operation: OperationType.RectangularAnnotation,
    icon: (color) => <RectangularSelectionIcon />,
  },
  "Elliptical annotation": {
    operation: OperationType.EllipticalAnnotation,
    icon: (color) => <EllipticalSelectionIcon />,
  },
  "Polygonal annotation": {
    operation: OperationType.PolygonalAnnotation,
    icon: (color) => <PolygonalSelectionIcon />,
  },
  "Freehand annotation": {
    operation: OperationType.PenAnnotation,
    icon: (color) => <PenSelectionIcon />,
  },
  "Lasso annotation (L)": {
    operation: OperationType.LassoAnnotation,
    icon: (color) => <LassoSelectionIcon />,
  },
  "Magnetic annotation": {
    operation: OperationType.MagneticAnnotation,
    icon: (color) => <MagneticSelectionIcon />,
  },
  "Color annotation": {
    operation: OperationType.ColorAnnotation,
    icon: (color) => <ColorSelectionIcon />,
  },
  "Quick annotation": {
    operation: OperationType.QuickAnnotation,
    icon: (color) => <QuickSelectionIcon />,
  },
  "Threshold annotation": {
    operation: OperationType.ThresholdAnnotation,
    icon: (color) => <RectangularSelectionIcon />,
  },
};
export const ToolDrawer = ({
  optionsVisibility,
  setOptionsVisibility,
}: {
  optionsVisibility: boolean;
  setOptionsVisibility: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
  const dispatch = useDispatch();
  const theme = useTheme();
  const activeOperation = useSelector(toolTypeSelector);

  const toggleOptionsHandler = () => {
    setOptionsVisibility((visible) => !visible);
  };

  useHotkeys(
    "shift+o",
    () => {
      toggleOptionsHandler();
    },
    HotkeyView.Annotator
  );
  const t = useTranslation();

  return (
    <Drawer
      anchor="right"
      sx={{
        flexShrink: 0,
        whiteSpace: "nowrap",
        width: 56,
        "& > .MuiDrawer-paper": {
          width: 56,
        },
      }}
      variant="permanent"
    >
      <CustomToolTip
        name={`${optionsVisibility ? "Hide" : "Show"} Options`}
        letter="O"
      >
        <ListItem button onClick={toggleOptionsHandler}>
          <ListItemIcon sx={{ pt: "1rem" }}>
            <SvgIcon fontSize="small">
              <TuneIcon
                sx={{
                  color: !optionsVisibility
                    ? theme.palette.grey[400]
                    : theme.palette.primary.dark,
                }}
              />
            </SvgIcon>
          </ListItemIcon>
        </ListItem>
      </CustomToolTip>

      <br />
      {Object.keys(toolMap).map((name, idx) => {
        return (
          <React.Fragment key={`${name}_${idx}`}>
            <Tool
              name={t(name)}
              onClick={() => {
                dispatch(
                  AnnotatorSlice.actions.setOperation({
                    operation: toolMap[name].operation,
                  })
                );
              }}
              selected={activeOperation === toolMap[name].operation}
            >
              {toolMap[name].icon(
                activeOperation === toolMap[name].operation
                  ? theme.palette.primary.dark
                  : theme.palette.grey[400]
              )}
            </Tool>
            {[
              "Color Adjustment",
              "Pointer",
              "Polygonal annotation",
              "Freehand annotation",
              "Magnetic annotation",
            ].includes(name) && <Divider sx={{ margin: "0.5rem 0" }} />}
          </React.Fragment>
        );
      })}

      {/* <Tool
        name={t("Object annotation")}
       onClick={() => {
          dispatch(applicationSlice.actions.setOperation({ operation: OperationType.ObjectAnnotation, }) );
      }}
        selected={activeOperation === OperationType.ObjectAnnotation}
      >
        <ObjectSelectionIcon />
      </Tool> */}
      <br />
    </Drawer>
  );
};
