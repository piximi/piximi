import React, { ChangeEvent, ReactNode, useState } from "react";
import { batch, useDispatch, useSelector } from "react-redux";
import { BlockPicker, ColorResult } from "react-color";

import {
  Container,
  Dialog,
  DialogContent,
  IconButton,
  Popover,
  TextField,
  Toolbar,
  Typography,
  Stack,
  Box,
} from "@mui/material";

import {
  Close as CloseIcon,
  Palette as PaletteIcon,
} from "@mui/icons-material";

import { MaterialUISwitch } from "components/controls";
import { applicationSettingsSlice } from "store/applicationSettings";

import Sun from "icons/Sun.svg";
import Moon from "icons/Moon.svg";
import VolumeUp from "icons/VolumeUp.svg";
import VolumeOff from "icons/VolumeOff.svg";
import { ThemeMode } from "themes/enums";
import { selectActiveCategoryColors } from "store/project/reselectors";
import {
  selectImageSelectionColor,
  selectSelectedImageBorderWidth,
  selectSoundEnabled,
  selectThemeMode,
} from "store/applicationSettings/selectors";

const SettingsItem = ({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) => {
  return (
    <Box
      display="flex"
      flexDirection="row"
      justifyContent="space-between"
      alignItems="center"
      gap={8}
    >
      <Typography fontWeight={"bold"}>{title}</Typography>
      {children}
    </Box>
  );
};

type SettingsDialogProps = {
  onClose: () => void;
  open: boolean;
};

export const SettingsDialog = ({ onClose, open }: SettingsDialogProps) => {
  const dispatch = useDispatch();

  const themeMode = useSelector(selectThemeMode);

  const initialSelectedImageBorderWidth = useSelector(
    selectSelectedImageBorderWidth
  );
  const [selectionSize, setSelectionSize] = useState<number>(
    initialSelectedImageBorderWidth
  );

  const initialSelectionColor = useSelector(selectImageSelectionColor);
  const [selectionColor, setSelectionColor] = useState<string>(
    initialSelectionColor
  );
  const availableColors = useSelector(selectActiveCategoryColors);
  const [colorMenuAnchorEl, setColorMenuAnchorEl] =
    React.useState<null | HTMLButtonElement>(null);
  const colorPopupOpen = Boolean(colorMenuAnchorEl);

  const soundEnabled = useSelector(selectSoundEnabled);

  const preClose = () => {
    batch(() => {
      dispatch(
        applicationSettingsSlice.actions.setSelectedImageBorderWidth({
          selectionSize,
        })
      );
      dispatch(
        applicationSettingsSlice.actions.setImageSelectionColor({
          selectionColor,
        })
      );
    });

    onClose();
  };

  const onToggleTheme = (mode: ThemeMode) => {
    dispatch(applicationSettingsSlice.actions.setThemeMode({ mode }));
  };

  const onChangeImageSelectionWidth = (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    let size = parseInt(event.target.value);
    if (!size) return;
    size = size < 0 ? 0 : size;

    setSelectionSize(size);
  };

  const onOpenColorPicker = (event: React.MouseEvent<HTMLButtonElement>) => {
    setColorMenuAnchorEl(event.currentTarget);
  };
  const onCloseColorPicker = () => {
    setColorMenuAnchorEl(null);
  };

  const toggleSoundEnabled = () => {
    dispatch(
      applicationSettingsSlice.actions.setSoundEnabled({
        soundEnabled: !soundEnabled,
      })
    );
  };

  return (
    <Dialog onClose={preClose} open={open}>
      <Toolbar sx={{ backgroundColor: "inherit" }}>
        <Typography sx={{ flexGrow: 1 }} variant="h6">
          Settings
        </Typography>

        <IconButton onClick={preClose}>
          <CloseIcon />
        </IconButton>
      </Toolbar>

      <DialogContent sx={{ marginTop: (theme) => theme.spacing(2) }}>
        <Container maxWidth="md">
          <Stack
            spacing={4}
            sx={{
              ".MuiGrid-root:first-of-type": { marginLeft: "0px" },
            }}
          >
            <SettingsItem
              title={themeMode === ThemeMode.Dark ? "Dark Mode" : "Light Mode"}
            >
              <MaterialUISwitch
                disable_icon={Moon}
                enable_icon={Sun}
                checked={themeMode === ThemeMode.Dark}
                onChange={() =>
                  onToggleTheme(
                    themeMode === ThemeMode.Dark
                      ? ThemeMode.Light
                      : ThemeMode.Dark
                  )
                }
              />
            </SettingsItem>
            <SettingsItem title="Image Selection Size">
              <TextField
                id="outlined-number"
                label="Pixels"
                defaultValue={selectionSize}
                onChange={onChangeImageSelectionWidth}
                type="number"
                inputProps={{ inputMode: "numeric", pattern: "[0-9]*" }}
                InputLabelProps={{ shrink: true }}
                size="small"
                sx={{ maxWidth: "80px", marginLeft: "10px" }}
              />
            </SettingsItem>
            <SettingsItem title="Image Selection Color">
              <IconButton
                onClick={onOpenColorPicker}
                edge="start"
                sx={{ marginLeft: 0 }}
              >
                <PaletteIcon sx={{ color: selectionColor, fontSize: 40 }} />
              </IconButton>

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
            </SettingsItem>
            <SettingsItem title="Sound effects">
              <MaterialUISwitch
                disable_icon={VolumeOff}
                enable_icon={VolumeUp}
                checked={!soundEnabled}
                onChange={toggleSoundEnabled}
                name="soundEnabled"
              />
            </SettingsItem>
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
