import { useDispatch } from "react-redux";

import AddIcon from "@mui/icons-material/Add";

import { HelpItem } from "components/layout/HelpDrawer/HelpContent";

import { clearCache } from "utils/renderedSrcsCache";

import { CustomListItemButton } from "@ProjectViewer/components";
import { useConfirmReplaceDialog } from "@ProjectViewer/hooks";
import { projectSlice } from "@ProjectViewer/state";

export const NewProjectListItem = () => {
  const dispatch = useDispatch();

  const { getConfirmation } = useConfirmReplaceDialog();

  const handleStartNewProject = async () => {
    const confirmation = await getConfirmation({});
    if (!confirmation) return;
    dispatch(projectSlice.actions.resetProject());
    clearCache();
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
