import React from "react";
import Menu from "@material-ui/core/Menu";
import MenuList from "@material-ui/core/MenuList";
import MenuItem from "@material-ui/core/MenuItem";
import Divider from "@material-ui/core/Divider";
import { saveAs } from "file-saver";
import { useSelector } from "react-redux";
import { classifierSelector, projectSelector } from "../../store/selectors";
import { bindMenu } from "material-ui-popup-state";

type SaveMenuProps = {
  popupState: any;
};

export const SaveMenu = ({ popupState }: SaveMenuProps) => {
  const classifier = useSelector(classifierSelector);

  const project = useSelector(projectSelector);

  const onSaveProjectClick = (
    event: React.MouseEvent<HTMLElement, MouseEvent>
  ) => {
    const part = {
      classifier: classifier,
      project: project,
      version: "0.0.0",
    };

    const parts = [JSON.stringify(part)];

    const data = new Blob(parts, { type: "application/json;charset=utf-8" });

    saveAs(data, `${project.name}.json`);
  };

  return (
    <Menu {...bindMenu(popupState)}>
      <MenuList dense variant="menu">
        <MenuItem onClick={onSaveProjectClick}>Save project</MenuItem>

        <Divider />

        <MenuItem onClick={() => {}}>Save example project</MenuItem>

        <MenuItem onClick={() => {}}>Save classifier</MenuItem>
      </MenuList>
    </Menu>
  );
};
