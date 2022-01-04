import { Divider, Menu, MenuItem, MenuList } from "@mui/material";
import { bindMenu } from "material-ui-popup-state";
import { OpenProjectMenuItem } from "../OpenProjectMenuItem";
import { OpenClassifierDialog } from "../OpenClassifierDialog";
import { useDialog } from "../../hooks";
import { OpenExampleClassifierDialog } from "../OpenExampleClassifierDialog/OpenExampleClassifierDialog";

type OpenMenuProps = {
  popupState: any;
};

export const OpenMenu = ({ popupState }: OpenMenuProps) => {
  const {
    onClose: onCloseClassifierDialog,
    onOpen: onOpenClassifierDialog,
    open: openClassifierDialog,
  } = useDialog();
  const {
    onClose: onCloseExampleClassifierDialog,
    onOpen: onOpenExampleClassifierDialog,
    open: openExampleClassifier,
  } = useDialog();

  return (
    <Menu {...bindMenu(popupState)}>
      <MenuList dense variant="menu">
        <OpenProjectMenuItem popupState={popupState} />
        <MenuItem onClick={onOpenExampleClassifierDialog}>
          Open example project
        </MenuItem>
        <Divider />

        <MenuItem onClick={onOpenClassifierDialog}>Open classifier</MenuItem>
      </MenuList>

      <OpenExampleClassifierDialog
        onClose={onCloseExampleClassifierDialog}
        open={openExampleClassifier}
        popupState={popupState}
      />

      <OpenClassifierDialog
        onClose={onCloseClassifierDialog}
        open={openClassifierDialog}
        popupState={popupState}
      />
    </Menu>
  );
};
