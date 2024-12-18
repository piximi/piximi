import React, { ReactElement } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Drawer,
  Divider,
  ListItemButton,
  ListItemIcon,
  SvgIcon,
  useTheme,
} from "@mui/material";
import {
  Lock as LockIcon,
  LockOpen as LockOpenIcon,
} from "@mui/icons-material";

import { useHotkeys, useTranslation } from "hooks";
import { useAnnotatorToolShortcuts } from "../../hooks";

import { CustomToolTip, Tool } from "../../components";
import { ToolOptions } from "./ToolOptions";

import { annotatorSlice } from "views/ImageViewer/state/annotator";
import { selectToolType } from "views/ImageViewer/state/annotator/selectors";

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

import { HotkeyContext } from "utils/common/enums";
import { ToolType as OperationType } from "utils/annotator/enums";
import { dimensions } from "utils/common/constants";

type AnnotatorToolDrawerProps = {
  optionsVisibility: boolean;
  setOptionsVisibility: React.Dispatch<React.SetStateAction<boolean>>;
  persistOptions: boolean;
  setPersistOptions: React.Dispatch<React.SetStateAction<boolean>>;
};

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

export const AnnotatorToolDrawer = ({
  optionsVisibility,
  setOptionsVisibility,
  persistOptions,
  setPersistOptions,
}: AnnotatorToolDrawerProps) => {
  const dispatch = useDispatch();
  const theme = useTheme();
  const activeOperation = useSelector(selectToolType);
  const t = useTranslation();

  const togglePersistHandler = () => {
    setPersistOptions((visible) => !visible);
  };

  useAnnotatorToolShortcuts();
  useHotkeys(
    "shift+o",
    () => {
      togglePersistHandler();
    },
    HotkeyContext.AnnotatorView,
    [persistOptions]
  );

  const handleToolClick = (toolName: string) => {
    if (activeOperation !== toolMap[toolName].operation)
      dispatch(
        annotatorSlice.actions.setToolType({
          operation: toolMap[toolName].operation,
        })
      );
  };

  const handleToolTouch = (toolName: string) => {
    if (activeOperation !== toolMap[toolName].operation) {
      dispatch(
        annotatorSlice.actions.setToolType({
          operation: toolMap[toolName].operation,
        })
      );
      if (!persistOptions && !optionsVisibility) {
        setOptionsVisibility(true);
      }
    } else {
      if (!persistOptions) {
        setOptionsVisibility((visible) => !visible);
      }
    }
  };

  return (
    <>
      <Drawer
        anchor="right"
        sx={{
          flexShrink: 0,
          "& .MuiDrawer-paper": {
            width: 240,
            right: 56,
          },
        }}
        variant="persistent"
        open={optionsVisibility}
      >
        <ToolOptions optionsVisibility={optionsVisibility} />
      </Drawer>
      <Drawer
        anchor="right"
        sx={{
          flexShrink: 0,
          whiteSpace: "nowrap",
          width: dimensions.toolDrawerWidth,
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
          <ListItemButton sx={{ flexGrow: 0 }} onClick={togglePersistHandler}>
            <ListItemIcon sx={{ pt: "1rem" }}>
              <SvgIcon fontSize="small">
                {persistOptions ? <LockIcon /> : <LockOpenIcon />}
              </SvgIcon>
            </ListItemIcon>
          </ListItemButton>
        </CustomToolTip>

        <br />
        {Object.keys(toolMap).map((name, idx) => {
          return (
            <React.Fragment key={`${name}_${idx}`}>
              <Tool
                name={t(name)}
                onClick={() => handleToolClick(name)}
                onTouch={() => handleToolTouch(name)}
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
        <br />
      </Drawer>
    </>
  );
};
