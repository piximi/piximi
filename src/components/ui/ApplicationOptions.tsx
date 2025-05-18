import React, { ReactNode, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { BlockPicker, ColorResult } from "react-color";
import {
  Box,
  Button,
  ButtonGroup,
  Popover,
  Stack,
  Typography,
  Divider,
  Dialog,
  DialogContent,
  IconButton,
  DialogTitle,
  DialogContentText,
  TextField,
  Tooltip,
} from "@mui/material";
import {
  Close as CloseIcon,
  FeedbackOutlined as FeedbackIcon,
  SettingsOutlined as SettingsIcon,
  Palette as PaletteIcon,
  DarkMode as DarkModeIcon,
  LightMode as LightModeIcon,
  VolumeUp as VolumeUpIcon,
  VolumeOff as VolumeOffIcon,
  Notes as NotesIcon,
  Image as ImageIcon,
  HelpOutline as HelpIcon,
} from "@mui/icons-material";

import { useHotkeys, useTranslation } from "hooks";
import { useDialogHotkey } from "hooks";
import { useDialog } from "hooks";

import { DividerHeader } from "components/ui/divider/DividerHeader";
import { CustomSwitch } from "components/inputs/CustomSwitch";
import { ConfirmationDialog } from "components/dialogs/ConfirmationDialog";

import { applicationSettingsSlice } from "store/applicationSettings";
import {
  selectImageSelectionColor,
  selectSelectedImageBorderWidth,
  selectSoundEnabled,
  selectTextOnScroll,
  selectThemeMode,
} from "store/applicationSettings/selectors";
import { selectAvaliableCategoryColors } from "store/project/reselectors";

import { AlertType, HotkeyContext } from "utils/enums";
import { ThemeMode } from "themes/enums";
import { createGitHubIssue } from "utils/logUtils";
import { useHelp } from "contexts";

const UISettings = () => {
  return (
    <>
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
    </>
  );
};

const ThemeSetting = () => {
  const themeMode = useSelector(selectThemeMode);
  const dispatch = useDispatch();
  const onToggleTheme = (mode: ThemeMode) => {
    dispatch(applicationSettingsSlice.actions.setThemeMode({ mode }));
  };
  return (
    <SettingsItem
      title={
        <Box display="flex">
          <Typography>{"Theme: "}</Typography>
          {themeMode === ThemeMode.Dark ? (
            <DarkModeIcon sx={{ ml: 1 }} />
          ) : (
            <LightModeIcon sx={{ ml: 1 }} />
          )}
        </Box>
      }
    >
      <CustomSwitch
        checked={themeMode === ThemeMode.Light}
        onChange={() =>
          onToggleTheme(
            themeMode === ThemeMode.Dark ? ThemeMode.Light : ThemeMode.Dark,
          )
        }
        height={24}
        width={62}
      />
    </SettingsItem>
  );
};

const BorderWidthSetting = () => {
  const dispatch = useDispatch();
  const selectedBorderWidth = useSelector(selectSelectedImageBorderWidth);

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
              backgroundColor: theme.palette.text.primary,
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
    React.useState<null | HTMLButtonElement>(null);
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
  const soundEnabled = useSelector(selectSoundEnabled);
  const toggleSoundEnabled = () => {
    dispatch(
      applicationSettingsSlice.actions.setSoundEnabled({
        soundEnabled: !soundEnabled,
      }),
    );
  };
  return (
    <SettingsItem
      title={
        <Box display="flex">
          <Typography display="inline">{"Sound Effects: "}</Typography>
          {soundEnabled ? (
            <VolumeUpIcon sx={{ ml: 1 }} />
          ) : (
            <VolumeOffIcon sx={{ ml: 1 }} />
          )}
        </Box>
      }
    >
      <CustomSwitch
        checked={soundEnabled}
        onChange={toggleSoundEnabled}
        height={24}
        width={62}
      />
    </SettingsItem>
  );
};

const TextOnScrollSetting = () => {
  const dispatch = useDispatch();
  const textOnScrollEnabled = useSelector(selectTextOnScroll);
  const toggletextOnScroll = () => {
    dispatch(
      applicationSettingsSlice.actions.setTextOnScroll({
        textOnScroll: !textOnScrollEnabled,
      }),
    );
  };
  return (
    <SettingsItem
      title={
        <Box display="flex">
          <Typography display="inline">{"Show Text on Scroll: "}</Typography>
          {textOnScrollEnabled ? (
            <NotesIcon sx={{ ml: 1 }} />
          ) : (
            <ImageIcon sx={{ ml: 1 }} />
          )}
        </Box>
      }
    >
      <CustomSwitch
        checked={textOnScrollEnabled}
        onChange={toggletextOnScroll}
        height={24}
        width={62}
      />
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

type SettingsDialogProps = {
  onClose: () => void;
  open: boolean;
};
const SettingsItem = ({
  title,
  children,
}: {
  title: string | ReactNode;
  children: ReactNode;
}) => {
  return (
    <Box
      display="flex"
      flexDirection="row"
      justifyContent="space-between"
      alignItems="flex-end"
      height="40px"
    >
      {typeof title === "string" ? <Typography>{title}</Typography> : title}

      {children}
    </Box>
  );
};

const SettingsDialog = ({ onClose, open }: SettingsDialogProps) => {
  useHotkeys(
    "enter",
    () => {
      onClose();
    },
    HotkeyContext.AppSettingsDialog,
    { enableOnTags: ["INPUT"], enabled: open },
    [onClose],
  );

  return (
    <Dialog onClose={onClose} open={open} fullWidth maxWidth="xs">
      <DialogTitle sx={{ m: 0, p: 2 }}>Settings</DialogTitle>

      <IconButton
        aria-label="close"
        onClick={onClose}
        sx={(theme) => ({
          position: "absolute",
          right: 8,
          top: 8,
          color: theme.palette.grey[500],
        })}
      >
        <CloseIcon />
      </IconButton>

      <DialogContent sx={{ px: 0, pb: 2.5, pt: 1 }}>
        <UISettings />
      </DialogContent>
    </Dialog>
  );
};

type SendFeedbackDialogProps = {
  onClose: () => void;
  open: boolean;
};

const SendFeedbackDialog = ({ onClose, open }: SendFeedbackDialogProps) => {
  const t = useTranslation();

  const [issueTitle, setIssueTitle] = useState("");
  const [issueComment, setIssueComment] = useState("");

  const openGitHubIssue = () => {
    createGitHubIssue(issueTitle, issueComment, AlertType.Warning);
    setIssueTitle("");
    setIssueComment("");

    onClose();
  };

  return (
    <ConfirmationDialog
      isOpen={open}
      onClose={onClose}
      title={t("Send feedback")}
      content={
        <>
          <DialogContentText
            sx={{
              "& a": { color: "deepskyblue" },
            }}
          >
            {t(
              "Use this form to report issues with Piximi via our GitHub page, or visit",
            )}{" "}
            <a
              href="https://forum.image.sc/tag/piximi"
              target="_blank"
              rel="noreferrer"
            >
              forum.image.sc/tag/piximi
            </a>
            .
          </DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            label="Title"
            id="issue-title"
            value={issueTitle}
            onChange={(e) => setIssueTitle(e.target.value)}
            rows={1}
            fullWidth
            size="small"
          />
          <TextField
            margin="dense"
            label="Description"
            id="issue-comment"
            value={issueComment}
            onChange={(e) => setIssueComment(e.target.value)}
            multiline
            rows={10}
            fullWidth
            size="small"
          />
        </>
      }
      onConfirm={openGitHubIssue}
      confirmText="Create Github Issue"
      confirmDisabled={issueTitle.length === 0 || issueComment.length === 0}
    />
  );
};

const SendFeedbackButton = () => {
  const { onClose, onOpen, open } = useDialog();

  return (
    <>
      <Tooltip title="Send Feedback">
        <IconButton onClick={onOpen} size="small">
          <FeedbackIcon />
        </IconButton>
      </Tooltip>

      <SendFeedbackDialog onClose={onClose} open={open} />
    </>
  );
};

const SettingsButton = () => {
  const { onClose, onOpen, open } = useDialogHotkey(
    HotkeyContext.AppSettingsDialog,
  );

  return (
    <>
      <Tooltip title="Settings">
        <IconButton onClick={onOpen} size="small">
          <SettingsIcon />
        </IconButton>
      </Tooltip>

      <SettingsDialog onClose={onClose} open={open} />
    </>
  );
};
const HelpButton = () => {
  const { setHelpMode } = useHelp()!;

  return (
    <>
      <Tooltip title="Toggle Help Mode">
        <IconButton
          onClick={() => setHelpMode((helpMode) => !helpMode)}
          size="small"
        >
          <HelpIcon />
        </IconButton>
      </Tooltip>
    </>
  );
};

export const ApplicationOptions = () => {
  return (
    <>
      <Divider />
      <Stack
        direction="row"
        justifyContent="space-evenly"
        sx={{ py: 0.5, px: 2 }}
      >
        <SettingsButton />

        <SendFeedbackButton />

        <HelpButton />
      </Stack>
    </>
  );
};
