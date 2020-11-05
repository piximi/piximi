import React from "react";
import Menu from "@material-ui/core/Menu";
import MenuList from "@material-ui/core/MenuList";
import MenuItem from "@material-ui/core/MenuItem";
import Divider from "@material-ui/core/Divider";
import { useStyles } from "../../../../../index.css";
import { useDispatch } from "react-redux";
import { createProjectAction } from "../../../../../store/slices";

type OpenMenuProps = {
  anchorEl: any;
  onClose: () => void;
  onOpen: (event: any) => void;
  open: boolean;
};

export const OpenMenu = ({
  anchorEl,
  onClose,
  onOpen,
  open,
}: OpenMenuProps) => {
  const dispatch = useDispatch();

  const classes = useStyles();

  const onOpenProject = (event: React.ChangeEvent<HTMLInputElement>) => {
    console.info("onOpenProject");

    onClose();

    event.persist();

    console.log(event.currentTarget.files);

    if (event.currentTarget.files) {
      const blob = event.currentTarget.files[0];

      const reader = new FileReader();

      reader.onload = (event) => {
        if (event.target) {
          const src = event.target.result;

          dispatch(
            createProjectAction({
              project: JSON.parse(src as string).project,
            })
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

          <MenuItem onClick={onClose}>Open example project</MenuItem>

          <MenuItem onClick={onClose}>Open classifier</MenuItem>
        </MenuList>
      </Menu>
    </React.Fragment>
  );
};
