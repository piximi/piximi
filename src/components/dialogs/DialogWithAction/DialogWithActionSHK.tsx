import { useHotkeys } from "hooks";

import { HotkeyView } from "types";
import { DialogWithAction } from "./DialogWithAction";

type DialogWithActionHKProps = {
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

export const DialogWithActionSHK = ({
  title,
  content,
  onConfirm,
  onClose: handleClose,
  onReject: handleReject,
  confirmText = "Confirm",
  rejectText = "Reject",
  isOpen,
}: DialogWithActionHKProps) => {
  const handleConfirm = () => {
    onConfirm();

    handleClose();
  };

  useHotkeys(
    "enter",
    () => {
      handleConfirm();
    },
    HotkeyView.DeleteCategoryDialog,
    { enableOnTags: ["INPUT"] },
    [handleConfirm]
  );

  return (
    <DialogWithAction
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
