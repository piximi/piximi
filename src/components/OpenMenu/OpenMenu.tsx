import { Divider, Menu, MenuItem, MenuList } from "@mui/material";
import { bindMenu } from "material-ui-popup-state";
import { OpenExampleProjectMenuItem } from "../OpenExampleProjectMenuItem";
import { OpenProjectMenuItem } from "../OpenProjectMenuItem";
import { OpenClassifierDialog } from "../OpenClassifierDialog";
import { useDialog } from "../../hooks";

type OpenMenuProps = {
  popupState: any;
};

export const OpenMenu = ({ popupState }: OpenMenuProps) => {
  const { onClose, onOpen, open } = useDialog();

  return (
    <Menu {...bindMenu(popupState)}>
      <MenuList dense variant="menu">
        <OpenProjectMenuItem popupState={popupState} />
        <OpenExampleProjectMenuItem popupState={popupState} />
        <Divider />

        <MenuItem onClick={onOpen}>Open classifier</MenuItem>
      </MenuList>

      <OpenClassifierDialog
        onClose={onClose}
        open={open}
        popupState={popupState}
      />
    </Menu>
  );
};
