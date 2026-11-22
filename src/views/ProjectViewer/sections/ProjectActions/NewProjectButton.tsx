import AddIcon from "@mui/icons-material/Add";

import { useBackend } from "core/backend";

import { TooltipTextButton } from "components/inputs";

import { HelpItem } from "help/HelpContent";

import { useConfirmReplaceDialog } from "@ProjectViewer/hooks";

export const NewProjectButton = () => {
  const backend = useBackend();

  const { getConfirmation } = useConfirmReplaceDialog();

  // A backend with a workspace keeps the current project beside the new
  // one; the browser-only backend replaces it, which the confirmation says.
  const handleStartNewProject = async () => {
    const confirmation = await getConfirmation({});
    if (!confirmation) return;
    await backend.project.create("New Project");
  };

  return (
    <TooltipTextButton
      dataHelp={HelpItem.StartNewProject}
      startIcon={<AddIcon />}
      label="New"
      tooltipText="Clear and start a new project"
      onClick={handleStartNewProject}
    />
  );
};
