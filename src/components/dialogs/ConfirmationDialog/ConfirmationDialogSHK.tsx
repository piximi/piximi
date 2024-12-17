import { useHotkeys } from "hooks";

import { ConfirmationDialog } from "./ConfirmationDialog";

import { HotkeyContext } from "utils/common/enums";

type ConfirmationDialogProps = {
  title: string;
  content: string;
  onConfirm: () => void;
  onClose: () => void;
  isOpen: boolean;
  onReject?: () => void;
  confirmText?: string;
  rejectText?: string;
};

//NOTE: SHK : Sans Hotkey for storybook

export const ConfirmationDialogSHK = ({
  title,
  content,
  onConfirm,
  onClose: handleClose,
  onReject: handleReject,
  confirmText = "Confirm",
  rejectText = "Reject",
  isOpen,
}: ConfirmationDialogProps) => {
  const handleConfirm = () => {
    onConfirm();

    handleClose();
  };

  useHotkeys(
    "enter",
    () => {
      handleConfirm();
    },
    HotkeyContext.ConfirmationDialog,
    { enableOnTags: ["INPUT"] },
    [handleConfirm],
  );

  return (
    <ConfirmationDialog
      title={title}
      content={content}
      onConfirm={handleConfirm}
      onReject={handleReject}
      onClose={handleClose}
      isOpen={isOpen}
      confirmText={confirmText}
      rejectText={rejectText}
    />
  );
};
