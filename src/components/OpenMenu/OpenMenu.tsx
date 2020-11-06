import React from "react";
import Menu from "@material-ui/core/Menu";
import MenuList from "@material-ui/core/MenuList";
import Divider from "@material-ui/core/Divider";
import { OpenExampleProjectMenuItem } from "../OpenExampleProjectMenuItem";
import { OpenClassifierMenuItem } from "../OpenClassifierMenuItem";
import MenuItem from "@material-ui/core/MenuItem";
import { createProject } from "../../store/slices";
import { useDispatch } from "react-redux";

type OpenMenuProps = {
  anchorEl: any;
  onClose: () => void;
  open: boolean;
};

export const OpenMenu = ({ anchorEl, onClose, open }: OpenMenuProps) => {
  const dispatch = useDispatch();

  const onChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onClose();

    event.persist();

    if (event.currentTarget.files) {
      const blob = event.currentTarget.files[0];

      const reader = new FileReader();

      reader.onload = (event) => {
        if (event.target) {
          const src = event.target.result;

          dispatch(
            createProject({ project: JSON.parse(src as string).project })
          );
        }
      };

      reader.readAsText(blob);
    }
  };

  return (
    <React.Fragment>
      <input
        accept="application/json"
        hidden
        id="open-project"
        onChange={onChange}
        type="file"
      />

      <Menu
        anchorEl={anchorEl}
        anchorOrigin={{ horizontal: "center", vertical: "bottom" }}
        getContentAnchorEl={null}
        open={open}
        transformOrigin={{ horizontal: "center", vertical: "top" }}
      >
        <MenuList dense variant="menu">
          <label htmlFor="open-project">
            <MenuItem onClick={onClose}>Open project</MenuItem>
          </label>

          <Divider />

          <OpenExampleProjectMenuItem onClose={onClose} />

          <OpenClassifierMenuItem onClose={onClose} />
        </MenuList>
      </Menu>
    </React.Fragment>
  );
};
