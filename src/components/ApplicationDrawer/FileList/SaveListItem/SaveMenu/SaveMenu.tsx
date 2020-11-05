import React from "react";
import Menu from "@material-ui/core/Menu";
import MenuList from "@material-ui/core/MenuList";
import MenuItem from "@material-ui/core/MenuItem";
import Divider from "@material-ui/core/Divider";
import { saveAs } from "file-saver";
import { useSelector } from "react-redux";
import { classifierSelector } from "../../../../../store/selectors";
import { projectSelector } from "../../../../../store/selectors";

type SaveMenuProps = {
  anchorEl: any;
  onClose: () => void;
  onOpen: (event: any) => void;
  open: boolean;
};

export const SaveMenu = ({
  anchorEl,
  onClose,
  onOpen,
  open,
}: SaveMenuProps) => {
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

    onClose();
  };

  return (
    <Menu
      anchorEl={anchorEl}
      anchorOrigin={{ horizontal: "center", vertical: "bottom" }}
      getContentAnchorEl={null}
      open={open}
      transformOrigin={{ horizontal: "center", vertical: "top" }}
    >
      <MenuList dense variant="menu">
        <MenuItem onClick={onSaveProjectClick}>Save project</MenuItem>

        <Divider />

        <MenuItem onClick={onClose}>Save example project</MenuItem>

        <MenuItem onClick={onClose}>Save classifier</MenuItem>
      </MenuList>
    </Menu>
  );
};
