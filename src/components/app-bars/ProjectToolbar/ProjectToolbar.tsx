import React, { useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import {
  Slider,
  Toolbar,
  Box,
  Button,
  Typography,
  TextField,
  FormControl,
  Menu,
} from "@mui/material";
import {
  ZoomOut as ZoomOutIcon,
  ZoomIn as ZoomInIcon,
  Search as SearchIcon,
  Add as AddIcon,
  Remove as RemoveIcon,
} from "@mui/icons-material";

import { LogoLoader } from "components/styled-components";

import { applicationSettingsSlice } from "store/applicationSettings";
import { projectSlice } from "store/project";
import { SortSelection } from "components/styled-components";
import {
  selectLoadMessage,
  selectLoadPercent,
  selectProjectName,
} from "store/project/selectors";
import { useMenu, useMobileView } from "hooks";

const minZoom = 0.6;
const maxZoom = 4;

export const ProjectToolbar = () => {
  const dispatch = useDispatch();
  const loadPercent = useSelector(selectLoadPercent);
  const loadMessage = useSelector(selectLoadMessage);
  const projectName = useSelector(selectProjectName);
  const [value, setValue] = useState<number>(1);
  const [newProjectName, setNewProjectName] = useState<string>(projectName);
  const inputRef = useRef<HTMLInputElement>(null);
  const isMobile = useMobileView();
  const { onOpen, onClose, open, anchorEl } = useMenu();

  const handleSizeChange = (event: Event, newValue: number | number[]) => {
    setValue(newValue as number);
    dispatch(
      applicationSettingsSlice.actions.updateTileSize({
        newValue: newValue as number,
      })
    );
  };

  const onZoomOut = () => {
    const newValue = value - 0.1 >= minZoom ? value - 0.1 : minZoom;
    setValue(newValue as number);
    dispatch(
      applicationSettingsSlice.actions.updateTileSize({
        newValue: newValue as number,
      })
    );
  };

  const onZoomIn = () => {
    const newValue = value + 0.1 <= maxZoom ? value + 0.1 : maxZoom;
    setValue(newValue as number);
    dispatch(
      applicationSettingsSlice.actions.updateTileSize({
        newValue: newValue as number,
      })
    );
  };

  const handleTextFieldBlur = () => {
    if (projectName === newProjectName) return;
    dispatch(projectSlice.actions.setProjectName({ name: newProjectName }));
    setNewProjectName("");
  };

  const handleTextFieldChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setNewProjectName(event.target.value);
  };

  const handleTextFieldEnter = (
    event: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (event.key === "Enter") {
      inputRef.current?.blur();
    }
  };

  return (
    <Toolbar>
      <LogoLoader width={250} height={50} loadPercent={loadPercent} />

      {loadMessage ? (
        <Typography ml={5} sx={{ flexGrow: 1 }}>
          {loadMessage}
        </Typography>
      ) : (
        <FormControl>
          <TextField
            onChange={handleTextFieldChange}
            onBlur={handleTextFieldBlur}
            onKeyDown={handleTextFieldEnter}
            defaultValue={projectName}
            inputRef={inputRef}
            size="small"
            sx={{ ml: 5 }}
          />
        </FormControl>
      )}

      <Box sx={{ flexGrow: 1 }} />

      {isMobile ? (
        <>
          <Button onClick={onOpen}>
            <SearchIcon />
          </Button>
          <Menu anchorEl={anchorEl} open={open} onClose={onClose}>
            <Box display="flex" flexDirection="column" alignItems="center">
              <AddIcon />
              <Slider
                orientation="vertical"
                value={value}
                min={minZoom}
                max={maxZoom}
                step={0.1}
                onChange={handleSizeChange}
                sx={{ height: (maxZoom - minZoom) * 20 + "px", my: 1, mr: 0 }}
              />
              <RemoveIcon />
            </Box>
          </Menu>
        </>
      ) : (
        <>
          <SortSelection />
          <Button onClick={onZoomOut}>
            <ZoomOutIcon
              sx={(theme) => ({
                marginLeft: theme.spacing(1),
              })}
            />
          </Button>

          <Slider
            value={value}
            min={minZoom}
            max={maxZoom}
            step={0.1}
            onChange={handleSizeChange}
            sx={{ width: "10%" }}
          />
          <Button onClick={onZoomIn}>
            <ZoomInIcon
              sx={(theme) => ({
                marginRight: theme.spacing(1),
              })}
            />
          </Button>
        </>
      )}
    </Toolbar>
  );
};
