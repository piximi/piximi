import React from "react";
import Menu from "@material-ui/core/Menu";
import { bindMenu, PopupState } from "material-ui-popup-state/hooks";
import MenuList from "@material-ui/core/MenuList";
import MenuItem from "@material-ui/core/MenuItem";
import Divider from "@material-ui/core/Divider";
import { useStyles } from "./index.css";
import { createProjectAction } from "./store";
import { useDispatch } from "react-redux";

type OpenMenuProps = {
  menu: PopupState;
};

export const OpenMenu = ({ menu }: OpenMenuProps) => {
  const dispatch = useDispatch();

  const classes = useStyles();

  const onOpenProject = (event: React.ChangeEvent<HTMLInputElement>) => {
    console.info("onOpenProject");

    menu.close();

    event.persist();

    console.log(event.currentTarget.files);

    if (event.currentTarget.files) {
      const blob = event.currentTarget.files[0];

      const reader = new FileReader();

      reader.onload = (event) => {
        if (event.target) {
          const src = event.target.result;

          dispatch(
            createProjectAction({ project: JSON.parse(src as string).project })
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
        className={classes.fileInput}
        type="file"
        id="open-project"
        onChange={onOpenProject}
      />

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
          <React.Fragment>
            <label htmlFor="open-project">
              <MenuItem onClick={menu.close}>Open project</MenuItem>
            </label>
          </React.Fragment>

          <Divider />

          <MenuItem onClick={menu.close}>Open example project</MenuItem>

          <MenuItem onClick={menu.close}>Open classifier</MenuItem>
        </MenuList>
      </Menu>
    </React.Fragment>
  );
};
