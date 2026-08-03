import { useDispatch, useSelector } from "react-redux";

import { useTheme, Stack } from "@mui/material";

import { useTranslation } from "hooks";

import { Tool } from "components/ui";
import { HelpItem } from "components/layout/HelpDrawer/HelpContent";

import { annotatorSlice } from "views/ImageViewer/state/annotator";
import { selectToolType } from "views/ImageViewer/state/annotator/selectors";
import { ToolType } from "views/ImageViewer/utils/enums";
import { Selection } from "icons";

import { useAnnotatorToolShortcuts } from "../../../hooks";

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
    <Stack direction="row" data-help={HelpItem.SelectionTools}>
      <Tool name={t("Selection Tool")} onClick={handleSetSelectionTool}>
        <Selection
          color={
            activeTool === ToolType.Pointer
              ? theme.palette.primary.dark
              : theme.palette.text.primary
          }
        />
      </Tool>
    </Stack>
  );
};
