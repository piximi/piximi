import React from "react";
import Menu from "@material-ui/core/Menu";
import { bindMenu, PopupState } from "material-ui-popup-state/hooks";
import MenuList from "@material-ui/core/MenuList";
import MenuItem from "@material-ui/core/MenuItem";
import Divider from "@material-ui/core/Divider";
import { saveAs } from "file-saver";
import { useSelector } from "react-redux";
import { classifierSelector } from "./store/selectors/classifierSelector";
import { projectSelector } from "./store/selectors/projectSelector";

type SaveMenuProps = {
  menu: PopupState;
};

export const SaveMenu = ({ menu }: SaveMenuProps) => {
  const classifier = useSelector(classifierSelector);

  const project = useSelector(projectSelector);

  const onSaveProjectClick = () => {
    const part = {
      classifier: classifier,
      project: project,
      version: "0.0.0",
    };

    const parts = [JSON.stringify(part)];

    const data = new Blob(parts, { type: "application/json;charset=utf-8" });

    saveAs(data, `${project.name}.json`);

    menu.close();
  };

  return (
    <Menu
      anchorOrigin={{
        horizontal: "center",
        vertical: "bottom",
      }}
      getContentAnchorEl={null}
      transformOrigin={{
        horizontal: "center",
        vertical: "top",
      }}
      {...bindMenu(menu)}
    >
      <MenuList dense variant="menu">
        <MenuItem onClick={onSaveProjectClick}>Save project</MenuItem>

        <Divider />

        <MenuItem onClick={menu.close}>Save example project</MenuItem>

        <MenuItem onClick={menu.close}>Save classifier</MenuItem>
      </MenuList>
    </Menu>
  );
};
