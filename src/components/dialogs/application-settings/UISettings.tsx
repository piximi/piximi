import { useDispatch, useSelector } from "react-redux";
import {
  Box,
  Button,
  ButtonGroup,
  Popover,
  Stack,
  Typography,
  useTheme,
} from "@mui/material";
import {
  Palette as PaletteIcon,
  DarkMode as DarkModeIcon,
  LightMode as LightModeIcon,
  VolumeUp as VolumeUpIcon,
  VolumeOff as VolumeOffIcon,
  Notes as NotesIcon,
  Image as ImageIcon,
} from "@mui/icons-material";
import { DividerHeader } from "components/ui";
import { applicationSettingsSlice } from "store/applicationSettings";
import {
  selectImageSelectionColor,
  selectSelectedImageBorderWidth,
  selectSoundEnabled,
  selectTextOnScroll,
  selectThemeMode,
} from "store/applicationSettings/selectors";
import { ThemeMode } from "themes/enums";
import { SettingsItem } from "./SettingsItem";
import { selectAvaliableCategoryColors } from "store/project/reselectors";
import { useState } from "react";
import { BlockPicker, ColorResult } from "react-color";

export const UISettings = () => {
  return (
    <Box>
      <DividerHeader
        typographyVariant="body1"
        textAlign="left"
        sx={(theme) => ({ color: theme.palette.grey[500] })}
      >
        UI
      </DividerHeader>
      <Stack
        spacing={1}
        sx={{
          px: 2,
          ".MuiGrid-root:first-of-type": { marginLeft: "0px" },
        }}
      >
        <ThemeSetting />
        <BorderWidthSetting />
        <BorderColorSetting />
        <SoundSetting />
        <TextOnScrollSetting />
        {/* <LanguageSettings /> */}
      </Stack>
    </Box>
  );
};

const ThemeSetting = () => {
  const themeMode = useSelector(selectThemeMode);
  const theme = useTheme();
  const dispatch = useDispatch();
  const onToggleTheme = (mode: ThemeMode) => {
    dispatch(applicationSettingsSlice.actions.setThemeMode({ mode }));
  };
  return (
    <SettingsItem
      title={
        <Box display="flex">
          <Typography>{"Theme Mode"}</Typography>
        </Box>
      }
    >
      <ButtonGroup
        sx={{
          height: 28,
          "& .MuiButtonGroup-grouped": { minWidth: 32 },
          "& .MuiButton-root": {
            p: 0,
          },
        }}
      >
        <Button
          onClick={() => onToggleTheme(ThemeMode.Dark)}
          variant="outlined"
          size="small"
          sx={{
            backgroundColor:
              themeMode === ThemeMode.Dark ? "primary.main" : "inherit",
          }}
        >
          <DarkModeIcon
            sx={{
              color:
                themeMode === ThemeMode.Dark
                  ? theme.palette.background.paper
                  : theme.palette.primary.main,
            }}
          />
        </Button>
        <Button
          onClick={() => onToggleTheme(ThemeMode.Light)}
          variant="outlined"
          size="small"
          sx={{
            backgroundColor:
              themeMode === ThemeMode.Light ? "primary.main" : "inherit",
          }}
        >
          <LightModeIcon
            sx={{
              color:
                themeMode === ThemeMode.Light
                  ? theme.palette.background.paper
                  : theme.palette.primary.main,
            }}
          />
        </Button>
      </ButtonGroup>
    </SettingsItem>
  );
};

const BorderWidthSetting = () => {
  const dispatch = useDispatch();
  const selectedBorderWidth = useSelector(selectSelectedImageBorderWidth);
  const selectionBorderColor = useSelector(selectImageSelectionColor);

  const updateSelectionBorderWidth = (op: "inc" | "dec") => {
    const newWidth =
      op === "inc"
        ? Math.min(selectedBorderWidth + 1, 10)
        : Math.max(selectedBorderWidth - 1, 1);
    if (newWidth === selectedBorderWidth) return;
    dispatch(
      applicationSettingsSlice.actions.setSelectedImageBorderWidth({
        selectionSize: newWidth,
      }),
    );
  };

  return (
    <SettingsItem
      title={
        <Box display="flex">
          <Typography display="inline">{"Selection Border Width: "}</Typography>
          <Box
            sx={(theme) => ({
              display: "inline-block",
              justifySelf: "center",
              alignSelf: "center",
              width: 64,
              height: selectedBorderWidth + "px",
              backgroundColor: selectionBorderColor,
              borderRadius: theme.shape.borderRadius,
              marginLeft: 1,
            })}
          ></Box>
        </Box>
      }
    >
      <ButtonGroup
        sx={{
          height: 28,
          "& .MuiButtonGroup-grouped": { minWidth: 32 },
          "& .MuiButton-root": {
            p: 0,
          },
        }}
      >
        <Button
          onClick={() => updateSelectionBorderWidth("inc")}
          variant="outlined"
          size="small"
        >
          +
        </Button>
        <Button
          onClick={() => updateSelectionBorderWidth("dec")}
          variant="outlined"
          size="small"
        >
          -
        </Button>
      </ButtonGroup>
    </SettingsItem>
  );
};

const BorderColorSetting = () => {
  const initialSelectionColor = useSelector(selectImageSelectionColor);
  const availableColors = useSelector(selectAvaliableCategoryColors);
  const [selectionColor, setSelectionColor] = useState<string>(
    initialSelectionColor,
  );
  const [colorMenuAnchorEl, setColorMenuAnchorEl] =
    useState<null | HTMLButtonElement>(null);
  const colorPopupOpen = Boolean(colorMenuAnchorEl);
  const onOpenColorPicker = (event: React.MouseEvent<HTMLButtonElement>) => {
    setColorMenuAnchorEl(event.currentTarget);
  };
  const onCloseColorPicker = () => {
    setColorMenuAnchorEl(null);
  };
  return (
    <SettingsItem
      title={
        <Box display="flex">
          <Typography display="inline">{"Selection Border Color: "}</Typography>
          <Box
            sx={() => ({
              display: "inline-block",
              justifySelf: "center",
              alignSelf: "center",
              width: "1rem",
              height: "1rem",
              backgroundColor: selectionColor,
              borderRadius: 1,
              marginLeft: 1,
            })}
          ></Box>
        </Box>
      }
    >
      <Button
        onClick={onOpenColorPicker}
        sx={(theme) => ({
          height: 28,
          minWidth: 64,
          backgroundColor: theme.palette.primary.main,
          color: theme.palette.primary.contrastText,
        })}
      >
        <PaletteIcon />
      </Button>

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
  );
};

const SoundSetting = () => {
  const dispatch = useDispatch();
  const theme = useTheme();
  const soundEnabled = useSelector(selectSoundEnabled);
  const setSoundEnabled = (on: boolean) => {
    dispatch(
      applicationSettingsSlice.actions.setSoundEnabled({
        soundEnabled: on,
      }),
    );
  };
  return (
    <SettingsItem
      title={
        <Box display="flex">
          <Typography display="inline">{"Sound Effects"}</Typography>
        </Box>
      }
    >
      <ButtonGroup
        sx={{
          height: 28,
          "& .MuiButtonGroup-grouped": { minWidth: 32 },
          "& .MuiButton-root": {
            p: 0,
          },
        }}
      >
        <Button
          onClick={() => setSoundEnabled(false)}
          variant="outlined"
          size="small"
          sx={{
            backgroundColor: !soundEnabled ? "primary.main" : "inherit",
          }}
        >
          <VolumeOffIcon
            sx={{
              color: !soundEnabled
                ? theme.palette.background.paper
                : theme.palette.primary.main,
            }}
          />
        </Button>
        <Button
          onClick={() => setSoundEnabled(true)}
          variant="outlined"
          size="small"
          sx={{
            backgroundColor: soundEnabled ? "primary.main" : "inherit",
          }}
        >
          <VolumeUpIcon
            sx={{
              color: soundEnabled
                ? theme.palette.background.paper
                : theme.palette.primary.main,
            }}
          />
        </Button>
      </ButtonGroup>
    </SettingsItem>
  );
};

const TextOnScrollSetting = () => {
  const dispatch = useDispatch();
  const theme = useTheme();
  const textOnScrollEnabled = useSelector(selectTextOnScroll);
  const setTextOnScroll = (on: boolean) => {
    dispatch(
      applicationSettingsSlice.actions.setTextOnScroll({
        textOnScroll: on,
      }),
    );
  };
  return (
    <SettingsItem
      title={
        <Box display="flex">
          <Typography display="inline">
            {"Hide Image/Show Text on Scroll"}
          </Typography>
        </Box>
      }
    >
      <ButtonGroup
        sx={{
          height: 28,
          "& .MuiButtonGroup-grouped": { minWidth: 32 },
          "& .MuiButton-root": {
            p: 0,
          },
        }}
      >
        <Button
          onClick={() => setTextOnScroll(false)}
          variant="outlined"
          size="small"
          sx={{
            backgroundColor: !textOnScrollEnabled ? "primary.main" : "inherit",
          }}
        >
          <ImageIcon
            sx={{
              color: !textOnScrollEnabled
                ? theme.palette.background.paper
                : theme.palette.primary.main,
            }}
          />
        </Button>
        <Button
          onClick={() => setTextOnScroll(true)}
          variant="outlined"
          size="small"
          sx={{
            backgroundColor: textOnScrollEnabled ? "primary.main" : "inherit",
          }}
        >
          <NotesIcon
            sx={{
              color: textOnScrollEnabled
                ? theme.palette.background.paper
                : theme.palette.primary.main,
            }}
          />
        </Button>
      </ButtonGroup>
    </SettingsItem>
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
