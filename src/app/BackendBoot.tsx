import { useCallback, useEffect, useRef, useState } from "react";

import { Box, Button, CircularProgress, Typography } from "@mui/material";

import {
  forgetSession,
  installLocalBackend,
  installRemoteBackend,
  rememberSession,
  resolveSessionConfig,
  stripSessionParams,
} from "core/backend/bootstrap";

import type { ReactNode } from "react";

import type { Backend, SessionConfig } from "core/backend";
import type { StoreHandle } from "core/backend/local/store";

/* A remote session already holds a project, so skip the welcome screen. */
const enterProject = () => {
  if (window.location.pathname !== "/") return;
  window.history.replaceState(window.history.state, "", "/project");
};

type Phase =
  | { status: "local"; pending: true }
  | { status: "connecting"; config: SessionConfig }
  | { status: "error"; config: SessionConfig; message: string }
  | { status: "ready"; backend: Backend };

/*
 * Chooses and connects the backend before the app renders. A remote session
 * is shown connecting, and a failure stays on screen with the choice to try
 * again or carry on locally; nothing falls back silently.
 */
export const BackendBoot = ({
  store,
  children,
}: {
  store: StoreHandle;
  children: (backend: Backend) => ReactNode;
}) => {
  // The first phase is decided synchronously from the URL, so the connect
  // effect only ever sets state after awaiting.
  const [phase, setPhase] = useState<Phase>(() => {
    const config = resolveSessionConfig();
    return config
      ? { status: "connecting", config }
      : { status: "local", pending: true };
  });
  const started = useRef(false);

  // Promise callbacks rather than awaits: the effect itself must not set
  // state, only what runs once the backend has answered.
  const connectRemote = useCallback(
    (config: SessionConfig) =>
      installRemoteBackend(store, config).then(
        (backend) => {
          rememberSession(config);
          stripSessionParams();
          enterProject();
          setPhase({ status: "ready", backend });
        },
        (error: unknown) => {
          const message =
            error instanceof Error ? error.message : String(error);
          setPhase({ status: "error", config, message });
        },
      ),
    [store],
  );

  const connectLocal = useCallback(() => {
    forgetSession();
    stripSessionParams();
    return installLocalBackend(store).then((backend) =>
      setPhase({ status: "ready", backend }),
    );
  }, [store]);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    if (phase.status === "connecting") void connectRemote(phase.config);
    else void connectLocal();
  }, [phase, connectRemote, connectLocal]);

  if (phase.status === "local") return null;
  if (phase.status === "ready") return <>{children(phase.backend)}</>;

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 2,
        px: 2,
        textAlign: "center",
      }}
    >
      {phase.status === "connecting" ? (
        <>
          <CircularProgress />
          <Typography>Connecting to {phase.config.url}</Typography>
        </>
      ) : (
        <>
          <Typography variant="h6">Could not connect to the backend</Typography>
          <Typography color="text.secondary">
            {phase.config.url}: {phase.message}
          </Typography>
          <Box sx={{ display: "flex", gap: 1 }}>
            <Button
              variant="contained"
              onClick={() => {
                setPhase({ status: "connecting", config: phase.config });
                void connectRemote(phase.config);
              }}
            >
              Try again
            </Button>
            <Button variant="outlined" onClick={() => void connectLocal()}>
              Continue locally
            </Button>
          </Box>
        </>
      )}
    </Box>
  );
};
