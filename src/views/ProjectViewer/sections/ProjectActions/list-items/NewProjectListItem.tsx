import { useDispatch } from "react-redux";

import AddIcon from "@mui/icons-material/Add";

import { projectReset } from "store/actions";

import { clearCache } from "utils/renderedSrcsCache";

import { HelpItem } from "data/help/HelpContent";

import { CustomListItemButton } from "@ProjectViewer/components";
import { useConfirmReplaceDialog } from "@ProjectViewer/hooks";

export const NewProjectListItem = () => {
  const dispatch = useDispatch();

  const { getConfirmation } = useConfirmReplaceDialog();

  const handleStartNewProject = async () => {
    const confirmation = await getConfirmation({});
    if (!confirmation) return;
    dispatch(projectReset());
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
