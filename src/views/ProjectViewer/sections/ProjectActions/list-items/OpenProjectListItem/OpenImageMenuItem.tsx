import { Fragment, useRef } from "react";

import { ListItemText, MenuItem } from "@mui/material";

import { useFileLoader } from "hooks";

import { TiffConfigDialog } from "components/dialogs";
import { HelpItem } from "components/layout/HelpDrawer/HelpContent";

type OpenImageMenuItemProps = {
  onCloseMenu: () => void;
};

// TODO: MenuItem??

export const OpenImageMenuItem = ({ onCloseMenu }: OpenImageMenuItemProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const {
    upload,
    tiffDialogOpen,
    pendingTiffAnalysis,
    handleConfirmTiffConfig,
    handleCancelTiffConfig,
  } = useFileLoader();
  const onOpenImage = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.currentTarget.files) return;
    const files: FileList = Object.assign([], event.currentTarget.files);

    await upload(files);

    onCloseMenu();
  };

  const handleClick = () => {
    if (inputRef.current) inputRef.current.click();
  };

  return (
    <Fragment>
      <MenuItem data-help={HelpItem.OpenImage} dense onClick={handleClick}>
        <ListItemText primary="Image" />
        <input
          ref={inputRef}
          accept="image/*,.dcm"
          hidden
          multiple
          id="open-image"
          onChange={onOpenImage}
          type="file"
        />
      </MenuItem>
      {pendingTiffAnalysis !== null && (
        <TiffConfigDialog
          open={tiffDialogOpen}
          analysisResult={pendingTiffAnalysis}
          onCancel={handleCancelTiffConfig}
          onConfirm={handleConfirmTiffConfig}
        />
      )}
    </Fragment>
  );
};
