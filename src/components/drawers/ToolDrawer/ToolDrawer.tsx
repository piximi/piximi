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
import {
  Lock as LockIcon,
  LockOpen as LockOpenIcon,
} from "@mui/icons-material";

import { useHotkeys, useTranslation } from "hooks";

import { Tool } from "../../annotator/Tool";

import { annotatorSlice } from "store/annotator";
import { selectToolType } from "store/annotator/selectors";

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
import { CustomToolTip } from "../../annotator/Tool/CustomToolTip";

const toolMap: Record<
  string,
  { operation: OperationType; icon: (color: string) => ReactElement }
> = {
  "Zoom Tool": {
    operation: OperationType.Zoom,
    icon: (color) => <Zoom color={color} />,
  },
  "Channel Adjustment": {
    operation: OperationType.ColorAdjustment,
    icon: (color) => <ColorAdjustment color={color} />,
  },
  "Selection Tool": {
    operation: OperationType.Pointer,
    icon: (color) => <Selection color={color} />,
  },
  "Rectangle Tool": {
    operation: OperationType.RectangularAnnotation,
    icon: (color) => <RectangleAnnotation color={color} />,
  },
  "Ellipse Tool": {
    operation: OperationType.EllipticalAnnotation,
    icon: (color) => <EllipticalAnnotation color={color} />,
  },
  "Polygon Tool": {
    operation: OperationType.PolygonalAnnotation,
    icon: (color) => <PolygonAnnotation color={color} />,
  },
  "Pen Tool": {
    operation: OperationType.PenAnnotation,
    icon: (color) => <FreehandAnnotation color={color} />,
  },
  "Lasso Tool": {
    operation: OperationType.LassoAnnotation,
    icon: (color) => <LassoAnnotation color={color} />,
  },
  "Magnetic Tool": {
    operation: OperationType.MagneticAnnotation,
    icon: (color) => <MagneticAnnotation color={color} />,
  },
  "Color Tool": {
    operation: OperationType.ColorAnnotation,
    icon: (color) => <ColorAnnotation color={color} />,
  },
  "Quick Annotation Tool": {
    operation: OperationType.QuickAnnotation,
    icon: (color) => <QuickAnnotation color={color} />,
  },
  "Threshold Tool": {
    operation: OperationType.ThresholdAnnotation,
    icon: (color) => <RectangleAnnotation color={color} />,
  },
};
export const ToolDrawer = ({
  optionsVisibility,
  setOptionsVisibility,
  persistOptions,
  setPersistOptions,
}: {
  optionsVisibility: boolean;
  setOptionsVisibility: React.Dispatch<React.SetStateAction<boolean>>;
  persistOptions: boolean;
  setPersistOptions: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
  const dispatch = useDispatch();
  const theme = useTheme();
  const activeOperation = useSelector(selectToolType);

  const togglePersistHandler = () => {
    setPersistOptions((visible) => !visible);
  };

  useHotkeys(
    "shift+o",
    () => {
      togglePersistHandler();
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
      onMouseEnter={() => {
        !persistOptions && setOptionsVisibility(true);
      }}
    >
      <CustomToolTip
        name={`${persistOptions ? "Unlock" : "Lock"} Options`}
        letter="O"
      >
        <ListItem button onClick={togglePersistHandler}>
          <ListItemIcon sx={{ pt: "1rem" }}>
            <SvgIcon fontSize="small">
              {persistOptions ? <LockIcon /> : <LockOpenIcon />}
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
                  annotatorSlice.actions.setToolType({
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
