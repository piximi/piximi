import { useState } from "react";

import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import { parseBackendAddress, sessionLink } from "core/backend/bootstrap";

import { DialogTitleBar } from "components/ui/DialogTitleBar";

import type React from "react";

const LAST_ADDRESS_KEY = "piximi.lastBackend";

const readLastAddress = (): string => {
  try {
    return window.localStorage.getItem(LAST_ADDRESS_KEY) ?? "";
  } catch {
    return "";
  }
};

const writeLastAddress = (address: string): void => {
  try {
    window.localStorage.setItem(LAST_ADDRESS_KEY, address);
  } catch {
    // A private window; the next visit types it again.
  }
};

/*
 * Joins a remote session by address. Connecting is a full navigation to the
 * session link, so the usual boot takes over: the connecting screen, and on
 * failure the choice to try again or continue locally.
 */
export const ConnectBackendDialog = ({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) => {
  const [address, setAddress] = useState(readLastAddress);
  const [token, setToken] = useState("");
  const [error, setError] = useState<string | undefined>();

  const handleConnect = (event: React.FormEvent) => {
    event.preventDefault();
    try {
      const parsed = parseBackendAddress(address);
      const config = {
        url: parsed.url,
        token: token.trim() || parsed.token,
      };
      writeLastAddress(address.trim());
      window.location.assign(sessionLink(config));
    } catch (cause) {
      setError((cause as Error).message);
    }
  };

  return (
    <Dialog fullWidth maxWidth="sm" open={open} onClose={onClose}>
      <DialogTitleBar title="Connect to a Backend" closeDialog={onClose} />
      <form onSubmit={handleConnect}>
        <DialogContent>
          <Stack spacing={2}>
            <Typography variant="body2" color="text.secondary">
              Paste the address a running engine printed: its{" "}
              <code>Backend: ws://…/ws</code> line, or its{" "}
              <code>Open: http://…</code> line, which carries the token.
            </Typography>
            <TextField
              autoFocus
              label="Backend address"
              placeholder="ws://127.0.0.1:8765/ws"
              value={address}
              onChange={(event) => {
                setAddress(event.target.value);
                setError(undefined);
              }}
              error={Boolean(error)}
              helperText={error ?? " "}
              fullWidth
              size="small"
              slotProps={{ htmlInput: { "data-testid": "backend-address" } }}
            />
            <TextField
              label="Launch token"
              placeholder="Only if the engine printed one and it is not in the address"
              value={token}
              onChange={(event) => setToken(event.target.value)}
              fullWidth
              size="small"
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button
            type="submit"
            variant="contained"
            data-testid="backend-connect"
          >
            Connect
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};
