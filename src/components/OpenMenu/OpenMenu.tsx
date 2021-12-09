import { Divider, Menu, MenuList } from "@mui/material";
import { bindMenu } from "material-ui-popup-state";
import { OpenExampleProjectMenuItem } from "../OpenExampleProjectMenuItem";
import { OpenProjectMenuItem } from "../OpenProjectMenuItem";
import { OpenClassifierMenuItem } from "../OpenClassifierMenuItem";

type OpenMenuProps = {
  popupState: any;
};

export const OpenMenu = ({ popupState }: OpenMenuProps) => {
  return (
    <Menu {...bindMenu(popupState)}>
      <MenuList dense variant="menu">
        <OpenProjectMenuItem popupState={popupState} />
        <OpenExampleProjectMenuItem popupState={popupState} />
        <Divider />

        <OpenClassifierMenuItem popupState={popupState} />
      </MenuList>
    </Menu>
  );
};
