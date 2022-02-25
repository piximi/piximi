import React from "react";
import Dialog from "@mui/material/Dialog";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import CloseIcon from "@mui/icons-material/Close";
import PaletteIcon from "@mui/icons-material/Palette";
import {
  Container,
  DialogContent,
  FormControlLabel,
  FormGroup,
  Switch,
  Grid,
  Popover,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import { AppBarOffset } from "components/styled/AppBarOffset";
import { useDispatch, useSelector } from "react-redux";
import {
  themeModeSelector,
  imageSelectionColorSelector,
  availableColorsSelector,
} from "store/selectors";
import { setThemeMode } from "store/slices";
import { ThemeMode } from "types/ThemeMode";
import Sun from "icons/Sun.svg";
import Moon from "icons/Moon.svg";
import { BlockPicker, ColorResult } from "react-color";
import { applicationSlice } from "store/slices";

type SettingsDialogProps = {
  onClose: () => void;
  open: boolean;
};

export const SettingsDialog = ({ onClose, open }: SettingsDialogProps) => {
  const dispatch = useDispatch();
  const themeMode = useSelector(themeModeSelector);
  const imageSelectionColor = useSelector(imageSelectionColorSelector);
  const availableColors = useSelector(availableColorsSelector);

  const onToggle = (mode: ThemeMode) => {
    dispatch(setThemeMode({ mode }));
  };

  const onColorChange = (color: ColorResult) => {
    console.log("did change");
    dispatch(
      applicationSlice.actions.setImageSelectionColor({
        selectionColor: color.hex,
      })
    );
  };

  const [colorMenuAnchorEl, setColorMenuAnchorEl] =
    React.useState<null | HTMLButtonElement>(null);

  const colorPopupOpen = Boolean(colorMenuAnchorEl);

  const onOpenColorPicker = (event: React.MouseEvent<HTMLButtonElement>) => {
    setColorMenuAnchorEl(event.currentTarget);
  };

  const onCloseColorPicker = () => {
    setColorMenuAnchorEl(null);
  };

  return (
    <Dialog fullScreen onClose={onClose} open={open}>
      <AppBar
        sx={{
          borderBottom: "1px solid rgba(0, 0, 0, 0.12)",
          boxShadow: "none",
        }}
        color="inherit"
        position="fixed"
      >
        <Toolbar>
          <Typography sx={{ flexGrow: 1 }} variant="h6">
            Settings
          </Typography>

          <IconButton onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Toolbar>
      </AppBar>

      <AppBarOffset />

      <DialogContent sx={{ marginTop: (theme) => theme.spacing(2) }}>
        <Container maxWidth="md">
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <FormGroup>
                <FormControlLabel
                  control={
                    <MaterialUISwitch
                      checked={themeMode === ThemeMode.Dark}
                      onChange={() =>
                        onToggle(
                          themeMode === ThemeMode.Dark
                            ? ThemeMode.Light
                            : ThemeMode.Dark
                        )
                      }
                    />
                  }
                  label={
                    <Typography variant="h6">
                      {themeMode === ThemeMode.Dark
                        ? "Dark Mode"
                        : "Light Mode"}
                    </Typography>
                  }
                />
              </FormGroup>
            </Grid>
            <Grid item xs={12}>
              <Typography variant="h6">
                <IconButton onClick={onOpenColorPicker} edge="start">
                  <PaletteIcon
                    sx={{ color: imageSelectionColor, fontSize: 40 }}
                  />
                </IconButton>
                Image Selection Color
              </Typography>
              <Popover
                id="image-color-selection-menu"
                open={colorPopupOpen}
                anchorEl={colorMenuAnchorEl}
                onClose={onCloseColorPicker}
                anchorOrigin={{
                  vertical: "bottom",
                  horizontal: "center",
                }}
                transformOrigin={{
                  vertical: "top",
                  horizontal: "center",
                }}
              >
                <BlockPicker
                  color={imageSelectionColor}
                  onChangeComplete={onColorChange}
                  colors={availableColors}
                />
              </Popover>
            </Grid>
          </Grid>
        </Container>
      </DialogContent>
    </Dialog>
  );
};

// source: https://mui.com/components/switches/
const MaterialUISwitch = styled(Switch)(({ theme }) => ({
  width: 62,
  height: 34,
  padding: 7,
  "& .MuiSwitch-switchBase": {
    margin: 1,
    padding: 0,
    transform: "translateX(6px)",
    "&.Mui-checked": {
      color: "#fff",
      transform: "translateX(22px)",
      "& .MuiSwitch-thumb:before": {
        backgroundImage: `url(${Moon})`,
      },
      "& + .MuiSwitch-track": {
        opacity: 1,
        backgroundColor: theme.palette.mode === "dark" ? "#8796A5" : "#aab4be",
      },
    },
  },
  "& .MuiSwitch-thumb": {
    backgroundColor: theme.palette.mode === "dark" ? "#003892" : "#001e3c",
    width: 32,
    height: 32,
    "&:before": {
      content: "''",
      position: "absolute",
      width: "100%",
      height: "100%",
      left: 0,
      top: 0,
      backgroundRepeat: "no-repeat",
      backgroundPosition: "center",
      backgroundImage: `url(${Sun})`,
    },
  },
  "& .MuiSwitch-track": {
    opacity: 1,
    backgroundColor: theme.palette.mode === "dark" ? "#8796A5" : "#aab4be",
    borderRadius: 20 / 2,
  },
}));
