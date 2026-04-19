import React from "react";
import AddIcon from "@mui/icons-material/Add";

import { CustomListItemButton } from "components/ui/CustomListItemButton";

import { HelpItem } from "components/layout/HelpDrawer/HelpContent";
import { useConfirmReplaceDialog } from "@ProjectViewer/hooks/useConfirmReplaceProjectDialog";
import { useDispatch } from "react-redux";
import { projectSlice } from "@ProjectViewer/state";

export const NewProjectListItem = () => {
  const dispatch = useDispatch();

  const { getConfirmation } = useConfirmReplaceDialog();

  const handleStartNewProject = () => {
    const confirmation = getConfirmation({});
    if (!confirmation) return;
    if (!confirmation) return;
    dispatch(projectSlice.actions.resetProject());
  };

  return (
    <>
      <CustomListItemButton
        data-help={HelpItem.StartNewProject}
        primaryText="New"
        onClick={handleStartNewProject}
        icon={<AddIcon />}
        tooltipText="New Project"
      />
    </>
  );
};
