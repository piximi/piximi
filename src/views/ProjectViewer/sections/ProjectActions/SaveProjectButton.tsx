import { Download as DownloadIcon } from "@mui/icons-material";

import { useBackend } from "core/backend";

import { useDialogHotkey } from "hooks";

import { SaveProjectDialog } from "components/dialogs";
import { TooltipTextButton } from "components/inputs";

import { HelpItem } from "help/HelpContent";

import { HotkeyContext } from "utils/enums";

export const SaveProjectButton = () => {
  // An engine keeps the project itself; what this does there is download a copy.
  const remote = useBackend().kind === "remote";
  const {
    onClose: onSaveProjectDialogClose,
    onOpen: onSaveProjectDialogOpen,
    open: openSaveProjectDialog,
  } = useDialogHotkey(HotkeyContext.ConfirmationDialog);

  return (
    <>
      <TooltipTextButton
        dataHelp={HelpItem.SaveProject}
        startIcon={<DownloadIcon />}
        label={remote ? "Download" : "Save"}
        tooltipText={
          remote
            ? "Download a copy of the project as a .piximi file"
            : "Save the current project"
        }
        onClick={onSaveProjectDialogOpen}
      />
      {openSaveProjectDialog && (
        <SaveProjectDialog
          onClose={onSaveProjectDialogClose}
          open={openSaveProjectDialog}
        />
      )}
    </>
  );
};
