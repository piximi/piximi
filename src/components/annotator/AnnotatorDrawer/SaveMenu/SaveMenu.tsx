import React from "react";
import { bindMenu } from "material-ui-popup-state";

import MenuItem from "@mui/material/MenuItem";
import { Menu } from "@mui/material";

import { useDialog } from "hooks/useDialog/useDialog";

import { SaveAnnotationProjectDialog } from "./SaveAnnotationProjectDialog";
import { ExportAnnotationsAsLabeledInstancesMenuItem } from "./ExportAnnotationsAsLabeledInstancesMenuItem";
import { ExportAnnotationsAsMatrixMenuItem } from "./ExportAnnotationsAsMatrixMenuItem";
import { ExportAnnotationsAsLabeledSemanticMasksMenuItem } from "./ExportAnnotationsAsLabeledSemanticMasksMenuItem";
import { ExportAnnotationsAsBinarySemanticMasksMenuItem } from "./ExportAnnotationsAsBinarySemanticMasksMenuItem";
import { ExportAnnotationsAsBinaryInstancesMenuItem } from "./ExportAnnotationsAsBinaryInstancesMenuItem";

type SaveMenuProps = {
  popupState: any;
};

export const SaveMenu = ({ popupState }: SaveMenuProps) => {
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);

  const { onClose, onOpen, open } = useDialog();

  const handleClick = (event: React.MouseEvent<HTMLLIElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  return (
    <div>
      <Menu {...bindMenu(popupState)}>
        <MenuItem onClick={handleClick}>Export annotations as</MenuItem>
        <Menu
          id="save-annotations-as-menu"
          anchorEl={anchorEl}
          keepMounted
          open={Boolean(anchorEl)}
          onClose={handleClose}
        >
          <ExportAnnotationsAsLabeledInstancesMenuItem
            popupState={popupState}
            handleCloseMenu={handleClose}
          />
          <ExportAnnotationsAsBinaryInstancesMenuItem
            popupState={popupState}
            handleCloseMenu={handleClose}
          />
          <ExportAnnotationsAsLabeledSemanticMasksMenuItem
            popupState={popupState}
            handleCloseMenu={handleClose}
          />
          <ExportAnnotationsAsBinarySemanticMasksMenuItem
            popupState={popupState}
            handleCloseMenu={handleClose}
          />
          <ExportAnnotationsAsMatrixMenuItem
            popupState={popupState}
            handleCloseMenu={handleClose}
          />
        </Menu>
        <MenuItem onClick={onOpen}>Save Annotation Project</MenuItem>
      </Menu>

      <SaveAnnotationProjectDialog
        onClose={onClose}
        open={open}
        popupState={popupState}
      />
    </div>
  );
};
