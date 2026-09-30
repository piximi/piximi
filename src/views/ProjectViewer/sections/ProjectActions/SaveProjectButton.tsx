import { Download as DownloadIcon } from "@mui/icons-material";

import { useDialogHotkey } from "hooks";

import { SaveProjectDialog } from "components/dialogs";
import { TooltipTextButton } from "components/inputs";

import { HelpItem } from "help/HelpContent";

import { HotkeyContext } from "utils/enums";

export const SaveProjectButton = () => {
  const {
    onClose: onSaveProjectDialogClose,
    onOpen: onSaveProjectDialogOpen,
    open: openSaveProjectDialog,
  } = useDialogHotkey(HotkeyContext.ConfirmationDialog);

  return (
    <>
      <TooltipTextButton
        dataHelp={HelpItem.SaveProject}
        icon={<DownloadIcon />}
        label="Save"
        tooltipText="Save the current project"
        onClick={onSaveProjectDialogOpen}
      />
      <SaveProjectDialog
        onClose={onSaveProjectDialogClose}
        open={openSaveProjectDialog}
      />
    </>
  );
};
