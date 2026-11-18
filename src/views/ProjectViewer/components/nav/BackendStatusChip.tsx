import { useState } from "react";

import {
  Chip,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Tooltip,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import {
  CloudDone as ConnectedIcon,
  CloudOff as DisconnectIcon,
  Computer as LocalIcon,
  Link as ConnectIcon,
} from "@mui/icons-material";

import { useBackend } from "core/backend";
import { leaveSession } from "core/backend/bootstrap";

import { useDialogHotkey } from "hooks";

import { ConnectBackendDialog } from "components/dialogs";

import { HotkeyContext } from "utils/enums";

/*
 * Where the project lives: in this browser, or on an engine the page is
 * connected to. Always visible in the app bar, since a remote session
 * changes what the app can do, and offers the way to the other mode.
 */
export const BackendStatusChip = () => {
  const backend = useBackend();
  const theme = useTheme();
  const compact = useMediaQuery(theme.breakpoints.down("md"));
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const {
    onClose: closeConnectDialog,
    onOpen: openConnectDialog,
    open: connectDialogOpen,
  } = useDialogHotkey(HotkeyContext.ConfirmationDialog);

  const server = backend.kind === "remote" ? backend.session.server : undefined;
  const remote = backend.kind === "remote";
  const label = server ? server.name : remote ? "Remote" : "Local";
  const tooltip = remote
    ? `Connected to ${server ? `${server.name} ${server.version}` : "a backend"}` +
      (server?.url ? ` at ${server.url}` : "") +
      ` (session ${backend.session.id.slice(0, 8)})`
    : "Running in this browser. Connect to an engine to work on its project.";

  return (
    <>
      <Tooltip title={tooltip}>
        <Chip
          data-testid="backend-status"
          icon={
            remote ? (
              <ConnectedIcon fontSize="small" />
            ) : (
              <LocalIcon fontSize="small" />
            )
          }
          label={compact ? undefined : label}
          color={remote ? "success" : "default"}
          variant="outlined"
          size="small"
          onClick={(event) => setAnchor(event.currentTarget)}
          sx={{ mr: 1, "& .MuiChip-label": compact ? { px: 0.5 } : {} }}
        />
      </Tooltip>
      <Menu
        anchorEl={anchor}
        open={Boolean(anchor)}
        onClose={() => setAnchor(null)}
      >
        {remote ? (
          <MenuItem
            dense
            onClick={() => {
              setAnchor(null);
              leaveSession();
            }}
          >
            <ListItemIcon>
              <DisconnectIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Disconnect and work locally</ListItemText>
          </MenuItem>
        ) : (
          <MenuItem
            dense
            onClick={() => {
              setAnchor(null);
              openConnectDialog();
            }}
          >
            <ListItemIcon>
              <ConnectIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Connect to a backend…</ListItemText>
          </MenuItem>
        )}
      </Menu>
      <ConnectBackendDialog
        open={connectDialogOpen}
        onClose={closeConnectDialog}
      />
    </>
  );
};
