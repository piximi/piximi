import type React from "react";
import { useRef } from "react";

import type { TooltipProps } from "@mui/material";
import {
  ListItemText,
  MenuItem,
  MenuList,
  styled,
  Tooltip,
  tooltipClasses,
  Typography,
} from "@mui/material";
import { KeyboardArrowRight as KeyboardArrowRightIcon } from "@mui/icons-material";

import { useDialogHotkey, useProjectLoader } from "hooks";

import { ExampleProjectDialog } from "components/dialogs";
import { HelpItem } from "components/layout/HelpDrawer/HelpContent";

import { useConfirmReplaceDialog } from "@ProjectViewer/hooks/useConfirmReplaceProjectDialog";

import { HotkeyContext } from "utils/enums";

type OpenProjectMenuItemProps = {
  onClose: () => void;
};
const MenuTooltip = styled(({ className, ...props }: TooltipProps) => (
  <Tooltip {...props} classes={{ popper: className }} />
))(({ theme }) => ({
  [`& .${tooltipClasses.tooltip}`]: {
    backgroundColor: theme.palette.background.paper,
    // Needed to match `Menu` background color. MUI adds a semi-transparent white
    // linear-gradient overlay on top of background.paper for each elevation level
    // to meet Material Design 3 / accessibility requirement, since
    // box-shadows dont appear clearly in dark mode.
    "--Paper-overlay": "var(--mui-overlays-9)",
    backgroundImage: "var(--Paper-overlay)",
    padding: 0,
  },
}));

export const OpenProjectMenuItem = ({ onClose }: OpenProjectMenuItemProps) => {
  const zarrInputRef = useRef<HTMLInputElement>(null);
  const zipInputRef = useRef<HTMLInputElement>(null);
  const {
    onClose: handleCloseCloseExampleProjectDialog,
    onOpen: handleOpenExampleProjectDialog,
    open: ExampleProjectOpen,
  } = useDialogHotkey(HotkeyContext.ExampleProjectDialog);
  const { getConfirmation } = useConfirmReplaceDialog();
  const { loadProject } = useProjectLoader();

  const handleCloseDialog = () => {
    handleCloseCloseExampleProjectDialog();
    onClose();
  };

  const handleConfirmedOpenExampleProjectDialog = async () => {
    const confirmation = await getConfirmation({});
    if (!confirmation) return;
    handleOpenExampleProjectDialog();
  };
  const handleOpenProject = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    event.persist();
    if (!event.currentTarget.files) return;
    const files = event.currentTarget.files;
    await loadProject(files);

    event.target.value = "";
  };

  const handleOpenFilePicker = async (
    ref: React.RefObject<HTMLInputElement>,
  ) => {
    const confirmation = await getConfirmation({});
    if (confirmation && ref.current) ref.current.click();
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onClose();
    handleOpenProject(event);
  };

  return (
    <>
      <MenuTooltip
        title={
          <MenuList
            dense
            sx={(theme) => ({
              py: 0,
              "& li": {
                px: 1,
                minHeight: 0,
                borderRadius: 0,
                color: theme.palette.text.primary,
              },
            })}
            // `preventDefault` will allow tooltip to keep focus if user
            // clicks on parent "Project" menu item
            onMouseDown={(e) => e.preventDefault()}
          >
            <MenuItem dense onClick={() => handleOpenFilePicker(zarrInputRef)}>
              <ListItemText primary="Upload .zarr" />
            </MenuItem>
            <MenuItem onClick={() => handleOpenFilePicker(zipInputRef)} dense>
              <ListItemText primary="Upload .zip" />
            </MenuItem>
            <MenuItem onClick={handleConfirmedOpenExampleProjectDialog} dense>
              Load Example
            </MenuItem>
          </MenuList>
        }
        placement="right-start"
        slotProps={{
          popper: {
            modifiers: [
              {
                name: "offset",
                options: {
                  offset: [-2, -12],
                },
              },
            ],
          },
        }}
      >
        <MenuItem
          data-help={HelpItem.OpenProject}
          sx={{
            display: "flex",
            justifyContent: "space-between",
          }}
        >
          <Typography variant="body2" sx={{ mr: 2 }}>
            Project
          </Typography>
          <KeyboardArrowRightIcon fontSize="small" />
        </MenuItem>
      </MenuTooltip>
      <input
        ref={zarrInputRef}
        accept=".zarr"
        hidden
        id="open-project-zarr"
        onChange={handleInputChange}
        type="file"
        // @ts-ignore: need it for some reason
        webkitdirectory=""
      />
      <input
        ref={zipInputRef}
        accept="application/zip"
        hidden
        id="open-project-zip"
        onChange={handleInputChange}
        type="file"
      />
      <ExampleProjectDialog
        onClose={handleCloseDialog}
        open={ExampleProjectOpen}
      />
    </>
  );
};
