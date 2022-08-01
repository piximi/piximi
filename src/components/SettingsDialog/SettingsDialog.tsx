import React, { ChangeEvent, useState } from "react";
import { batch, useDispatch, useSelector } from "react-redux";
import { BlockPicker, ColorResult } from "react-color";

import {
  Container,
  DialogContent,
  Switch,
  Grid,
  Popover,
  TextField,
  Stack,
} from "@mui/material";
import Dialog from "@mui/material/Dialog";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import { styled } from "@mui/material/styles";

import CloseIcon from "@mui/icons-material/Close";
import PaletteIcon from "@mui/icons-material/Palette";

import { AppBarOffset } from "components/styled/AppBarOffset";

import {
  themeModeSelector,
  imageSelectionColorSelector,
  availableColorsSelector,
  imageSelectionSizeSelector,
} from "store/selectors";
import { soundEnabledSelector } from "store/selectors/soundEnabledSelector";

import { imageViewerSlice, setThemeMode } from "store/slices";

import { applicationSlice } from "store/slices";

import { ThemeMode } from "types/ThemeMode";

import Sun from "icons/Sun.svg";
import Moon from "icons/Moon.svg";
import VolumeUp from "icons/VolumeUp.svg";
import VolumeOff from "icons/VolumeOff.svg";

type SettingsDialogProps = {
  onClose: () => void;
  open: boolean;
};

export const SettingsDialog = ({ onClose, open }: SettingsDialogProps) => {
  const dispatch = useDispatch();

  const initialSelectionSize = useSelector(imageSelectionSizeSelector);
  const initialSelectionColor = useSelector(imageSelectionColorSelector);

  const [selectionSize, setSelectionSize] =
    useState<number>(initialSelectionSize);

  const [selectionColor, setSelectionColor] = useState<string>(
    initialSelectionColor
  );

  const preClose = () => {
    batch(() => {
      dispatch(
        applicationSlice.actions.setImageSelectionSize({ selectionSize })
      );
      dispatch(
        applicationSlice.actions.setImageSelectionColor({
          selectionColor,
        })
      );
    });

    onClose();
  };

  return (
    <Dialog fullScreen onClose={preClose} open={open}>
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

          <IconButton onClick={preClose}>
            <CloseIcon />
          </IconButton>
        </Toolbar>
      </AppBar>

      <AppBarOffset />

      <DialogContent sx={{ marginTop: (theme) => theme.spacing(2) }}>
        <Container maxWidth="md">
          <Stack
            spacing={3}
            sx={{
              ".MuiGrid-root:first-of-type": { marginLeft: "0px" },
            }}
          >
            <ThemeModeToggle />
            <SelectionSize {...{ selectionSize, setSelectionSize }} />
            <ColorPalette {...{ selectionColor, setSelectionColor }} />
            <SoundSettings />
            {/* <LanguageSettings /> */}
          </Stack>
        </Container>
      </DialogContent>
    </Dialog>
  );
};

// const LanguageSettings = () => {
//   const dispatch = useDispatch();

//   const language = useSelector(languageSelector);

//   const onLanguageChange = (event: SelectChangeEvent) => {
//     dispatch(
//       imageViewerSlice.actions.setLanguage({
//         language: event.target.value as LanguageType,
//       })
//     );
//   };

//   return (
//     <Grid item xs={6}>
//       <Grid container>
//         <Grid item xs={12}>
//           <Grid container item xs={4}>
//             <FormControl color="primary" fullWidth>
//               <FormHelperText>Language</FormHelperText>
//               <Select
//                 onChange={onLanguageChange}
//                 value={language}
//                 inputProps={{ "aria-label": "Without label" }}
//               >
//                 {_.map(LanguageType, (v, k) => {
//                   return (
//                     <MenuItem dense key={k} value={v}>
//                       {v}
//                     </MenuItem>
//                   );
//                 })}
//               </Select>
//             </FormControl>
//           </Grid>
//         </Grid>
//       </Grid>
//     </Grid>
//   );
// };

const SoundSettings = () => {
  const dispatch = useDispatch();

  const soundEnabled = useSelector(soundEnabledSelector);

  const toggleSoundEnabled = () => {
    dispatch(
      imageViewerSlice.actions.setSoundEnabled({
        soundEnabled: !soundEnabled,
      })
    );
  };

  return (
    <Grid container spacing={2}>
      <Grid item xs={4}>
        <Typography variant="h6">Sound effects</Typography>
      </Grid>
      <Grid item xs={4}>
        <MaterialUISwitch
          disable_icon={VolumeOff}
          enable_icon={VolumeUp}
          checked={!soundEnabled}
          onChange={toggleSoundEnabled}
          name="soundEnabled"
        />
      </Grid>
    </Grid>
  );
};

const ThemeModeToggle = () => {
  const dispatch = useDispatch();

  const themeMode = useSelector(themeModeSelector);

  const onToggle = (mode: ThemeMode) => {
    dispatch(setThemeMode({ mode }));
  };

  return (
    <Grid container spacing={2}>
      <Grid item xs={4}>
        <Typography variant="h6">
          {themeMode === ThemeMode.Dark ? "Dark Mode" : "Light Mode"}
        </Typography>
      </Grid>
      <Grid item xs={4}>
        <MaterialUISwitch
          disable_icon={Moon}
          enable_icon={Sun}
          checked={themeMode === ThemeMode.Dark}
          onChange={() =>
            onToggle(
              themeMode === ThemeMode.Dark ? ThemeMode.Light : ThemeMode.Dark
            )
          }
        />
      </Grid>
    </Grid>
  );
};

type MUISwitchProps = {
  disable_icon: string;
  enable_icon: string;
};

// source: https://mui.com/components/switches/
const MaterialUISwitch = styled(Switch)<MUISwitchProps>(
  ({ theme, disable_icon, enable_icon }) => ({
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
          backgroundImage: `url(${disable_icon})`,
        },
        "& + .MuiSwitch-track": {
          opacity: 1,
          backgroundColor:
            theme.palette.mode === "dark" ? "#8796A5" : "#aab4be",
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
        backgroundImage: `url(${enable_icon})`,
      },
    },
    "& .MuiSwitch-track": {
      opacity: 1,
      backgroundColor: theme.palette.mode === "dark" ? "#8796A5" : "#aab4be",
      borderRadius: 20 / 2,
    },
  })
);

const SelectionSize = ({
  selectionSize,
  setSelectionSize,
}: {
  selectionSize: number;
  setSelectionSize(newSize: number): void;
}) => {
  const onChange = (event: ChangeEvent<HTMLInputElement>) => {
    let size = parseInt(event.target.value);
    if (!size) return;
    size = size < 0 ? 0 : size;

    setSelectionSize(size);
  };

  return (
    <Grid container spacing={2}>
      <Grid item xs={4}>
        <Typography variant="h6">Image Selection Size</Typography>
      </Grid>
      <Grid item xs={4}>
        <TextField
          id="outlined-number"
          label="Pixels"
          defaultValue={selectionSize}
          onChange={onChange}
          type="number"
          inputProps={{ inputMode: "numeric", pattern: "[0-9]*" }}
          InputLabelProps={{ shrink: true }}
          size="small"
          sx={{ maxWidth: "80px", marginLeft: "10px" }}
        />
      </Grid>
    </Grid>
  );
};

const ColorPalette = ({
  selectionColor,
  setSelectionColor,
}: {
  selectionColor: string;
  setSelectionColor(newColor: string): void;
}) => {
  const availableColors = useSelector(availableColorsSelector);

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
    <Grid container spacing={2}>
      <Grid item xs={4}>
        <Typography variant="h6">Image Selection Color</Typography>
      </Grid>
      <Grid item xs={4}>
        <IconButton
          onClick={onOpenColorPicker}
          edge="start"
          sx={{ marginLeft: 0 }}
        >
          <PaletteIcon sx={{ color: selectionColor, fontSize: 40 }} />
        </IconButton>
      </Grid>
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
          color={selectionColor}
          onChangeComplete={(color: ColorResult) =>
            setSelectionColor(color.hex)
          }
          colors={availableColors}
        />
      </Popover>
    </Grid>
  );
};
