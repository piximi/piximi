import { useDispatch, useSelector } from "react-redux";

import { useTheme, Box } from "@mui/material";

import { useTranslation } from "hooks";

import { Tool } from "components/ui";
import { HelpItem } from "components/layout/HelpDrawer/HelpContent";

import { annotatorSlice } from "@ImageViewer/state/annotator";
import { selectToolType } from "@ImageViewer/state/annotator/selectors";
import { ToolType } from "@ImageViewer/utils/enums";
import { Selection } from "icons";
import { useAnnotatorToolShortcuts } from "@ImageViewer/hooks";

export const SelectionOptions = () => {
  const dispatch = useDispatch();
  const theme = useTheme();
  const activeTool = useSelector(selectToolType);

  const t = useTranslation();

  useAnnotatorToolShortcuts();

  const handleSetSelectionTool = () => {
    if (activeTool !== ToolType.Pointer)
      dispatch(
        annotatorSlice.actions.setToolType({
          operation: ToolType.Pointer,
        }),
      );
  };

  return (
    <Box sx={{ width: "36px" }}>
      <Tool
        name={t("Selection Tool")}
        onClick={handleSetSelectionTool}
        data-help={HelpItem.SelectionTools}
      >
        <Selection
          color={
            activeTool === ToolType.Pointer
              ? theme.palette.primary.dark
              : theme.palette.text.primary
          }
        />
      </Tool>
    </Box>
  );
};
