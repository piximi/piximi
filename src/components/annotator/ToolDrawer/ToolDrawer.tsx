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
  ColorAdjustment,
  ColorAnnotation,
  EllipticalAnnotation,
  LassoAnnotation,
  MagneticAnnotation,
  FreehandAnnotation,
  PolygonAnnotation,
  QuickAnnotation,
  RectangleAnnotation,
  Selection,
  Zoom,
} from "icons";
import { CustomToolTip } from "../Tool/CustomToolTip";

const toolMap: Record<
  string,
  { operation: OperationType; icon: (color: string) => ReactElement }
> = {
  Zoom: {
    operation: OperationType.Zoom,
    icon: (color) => <Zoom color={color} />,
  },
  "Color Adjustment": {
    operation: OperationType.ColorAdjustment,
    icon: (color) => <ColorAdjustment color={color} />,
  },
  Pointer: {
    operation: OperationType.Pointer,
    icon: (color) => <Selection color={color} />,
  },
  "Rectangular annotation": {
    operation: OperationType.RectangularAnnotation,
    icon: (color) => <RectangleAnnotation color={color} />,
  },
  "Elliptical annotation": {
    operation: OperationType.EllipticalAnnotation,
    icon: (color) => <EllipticalAnnotation color={color} />,
  },
  "Polygonal annotation": {
    operation: OperationType.PolygonalAnnotation,
    icon: (color) => <PolygonAnnotation color={color} />,
  },
  "Freehand annotation": {
    operation: OperationType.PenAnnotation,
    icon: (color) => <FreehandAnnotation color={color} />,
  },
  "Lasso annotation (L)": {
    operation: OperationType.LassoAnnotation,
    icon: (color) => <LassoAnnotation color={color} />,
  },
  "Magnetic annotation": {
    operation: OperationType.MagneticAnnotation,
    icon: (color) => <MagneticAnnotation color={color} />,
  },
  "Color annotation": {
    operation: OperationType.ColorAnnotation,
    icon: (color) => <ColorAnnotation color={color} />,
  },
  "Quick annotation": {
    operation: OperationType.QuickAnnotation,
    icon: (color) => <QuickAnnotation color={color} />,
  },
  "Threshold annotation": {
    operation: OperationType.ThresholdAnnotation,
    icon: (color) => <RectangleAnnotation color={color} />,
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
