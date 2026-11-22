import { useCallback, useEffect, useState } from "react";

import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Tooltip,
  Typography,
} from "@mui/material";
import { Delete as DeleteIcon } from "@mui/icons-material";

import { useBackend } from "core/backend";

import { DialogTitleBar } from "components/ui/DialogTitleBar";

import type { ProjectInfo } from "core/backend";

const when = (ms?: number): string =>
  ms ? new Date(ms).toLocaleString() : "never";

/*
 * The projects a backend keeps (`project.workspace`): open another, or
 * delete one that is not open. Opening replaces what every client of the
 * session holds, which the backend announces as `project/didReset`.
 */
export const ProjectsDialog = ({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) => {
  const backend = useBackend();
  const [projects, setProjects] = useState<ProjectInfo[] | null>(null);
  const [error, setError] = useState<string | undefined>();
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<ProjectInfo | null>(null);

  const refresh = useCallback(async () => {
    if (!backend.project.list) return;
    try {
      setProjects(await backend.project.list());
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause));
    }
  }, [backend]);

  useEffect(() => {
    let active = true;
    backend.project
      .list?.()
      .then((listed) => {
        if (active) setProjects(listed);
      })
      .catch((cause: unknown) => {
        if (active)
          setError(cause instanceof Error ? cause.message : String(cause));
      });
    return () => {
      active = false;
    };
  }, [backend]);

  const act = async (action: () => Promise<unknown>, close = false) => {
    setBusy(true);
    setError(undefined);
    try {
      await action();
      if (close) onClose();
      else await refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog fullWidth maxWidth="sm" open={open} onClose={onClose}>
      <DialogTitleBar title="Projects on this Backend" closeDialog={onClose} />
      <DialogContent>
        {error && (
          <Alert severity="warning" sx={{ mb: 1 }}>
            {error}
          </Alert>
        )}
        {projects === null ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 3 }}>
            <CircularProgress size={28} />
          </Box>
        ) : (
          <List dense data-testid="backend-projects">
            {projects.map((project) => (
              <ListItem
                key={project.id}
                disablePadding
                secondaryAction={
                  confirmDelete?.id === project.id ? (
                    <Box
                      sx={{ display: "flex", gap: 0.5, alignItems: "center" }}
                    >
                      <Typography variant="caption">Delete?</Typography>
                      <Button
                        size="small"
                        color="error"
                        disabled={busy}
                        onClick={() =>
                          void act(async () => {
                            await backend.project.delete!(project.id);
                            setConfirmDelete(null);
                          })
                        }
                      >
                        Yes
                      </Button>
                      <Button
                        size="small"
                        onClick={() => setConfirmDelete(null)}
                      >
                        No
                      </Button>
                    </Box>
                  ) : (
                    <Tooltip
                      title={
                        project.current
                          ? "Open another project before deleting this one"
                          : "Delete this project"
                      }
                    >
                      <span>
                        <IconButton
                          edge="end"
                          size="small"
                          disabled={busy || project.current}
                          onClick={() => setConfirmDelete(project)}
                          aria-label={`delete ${project.name}`}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </span>
                    </Tooltip>
                  )
                }
              >
                <ListItemButton
                  selected={project.current}
                  disabled={busy || project.current}
                  onClick={() =>
                    void act(() => backend.project.open!(project.id), true)
                  }
                >
                  <ListItemText
                    primary={
                      <>
                        {project.name}
                        {project.current && (
                          <Typography
                            component="span"
                            variant="caption"
                            sx={{ ml: 1, color: "text.secondary" }}
                          >
                            (open)
                          </Typography>
                        )}
                      </>
                    }
                    secondary={`${project.images ?? 0} images · last opened ${when(project.openedAt)}`}
                  />
                </ListItemButton>
              </ListItem>
            ))}
            {projects.length === 0 && (
              <ListItem>
                <ListItemText secondary="No projects yet" />
              </ListItem>
            )}
          </List>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="inherit">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};
