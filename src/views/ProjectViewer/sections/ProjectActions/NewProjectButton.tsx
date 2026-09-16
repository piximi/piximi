import { useDispatch } from "react-redux";

import AddIcon from "@mui/icons-material/Add";

import { projectReset } from "store/actions";

import { clearCache } from "utils/renderedSrcsCache";

import { HelpItem } from "data/help/HelpContent";

import { TooltipTextButton } from "@ProjectViewer/components";
import { useConfirmReplaceDialog } from "@ProjectViewer/hooks";

export const NewProjectButton = () => {
  const dispatch = useDispatch();

  const { getConfirmation } = useConfirmReplaceDialog();

  const handleStartNewProject = async () => {
    const confirmation = await getConfirmation({});
    if (!confirmation) return;
    dispatch(projectReset());
    clearCache();
  };

  return (
    <TooltipTextButton
      dataHelp={HelpItem.StartNewProject}
      icon={<AddIcon />}
      label="New"
      tooltipText="Clear and start a new project"
      onClick={handleStartNewProject}
    />
  );
};
