import { useCallback, useEffect, useState } from "react";

import {
  Alert,
  Box,
  Breadcrumbs,
  Button,
  Checkbox,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  FormControlLabel,
  Link,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Stack,
  Switch,
  Typography,
} from "@mui/material";
import {
  Folder as FolderIcon,
  InsertDriveFile as FileIcon,
} from "@mui/icons-material";

import { useBackend } from "core/backend";

import { DialogTitleBar } from "components/ui/DialogTitleBar";

import { TiffConfigDialog } from "./tiff-config/TiffConfigDialog";

import type {
  DimensionConfig,
  DirectoryListing,
  PathInspection,
} from "core/backend";
import type {
  TiffAnalysisResult,
  TiffDialogCallbackResult,
} from "core/file-io/file-loader/types";

const TIFF_RE = /\.tiff?$/i;
const MAX_DEPTH = 16;

const formatSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(0)} KB`;
  if (bytes < 1024 ** 3) return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
  return `${(bytes / 1024 ** 3).toFixed(2)} GB`;
};

/* The dialog's analysis shape for a server file, keyed by its path. */
const toAnalysis = (inspection: PathInspection): TiffAnalysisResult => ({
  fileName: inspection.path,
  frameCount: inspection.frameCount,
  isMultiFrame: inspection.isMultiFrame,
  metadata: {},
  ...(inspection.dimensions && {
    OMEDims: {
      dimensionorder: inspection.dimensions.dimensionOrder,
      sizec: inspection.dimensions.channels,
      sizez: inspection.dimensions.slices,
      sizet: inspection.dimensions.frames,
    },
  }),
});

/* The crumbs from the root the listing sits under down to it. */
const crumbsOf = (
  listing: DirectoryListing,
): Array<{ label: string; path: string }> => {
  if (listing.path === "") return [];
  const root = listing.roots.find(
    (r) => listing.path === r || listing.path.startsWith(`${r}/`),
  );
  if (!root) return [{ label: listing.path, path: listing.path }];
  const crumbs = [{ label: root.split("/").pop() || root, path: root }];
  const rest = listing.path.slice(root.length).split("/").filter(Boolean);
  let current = root;
  for (const segment of rest) {
    current = `${current}/${segment}`;
    crumbs.push({ label: segment, path: current });
  }
  return crumbs;
};

/*
 * Images that live where the backend runs: browse its roots, tick files or
 * take a whole folder, and have the backend add them. TIFF stacks whose
 * layout the metadata does not settle go through the same dimension dialog
 * as an upload; the add itself is an `ingest` job the task toast follows.
 */
export const ServerFilesDialog = ({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) => {
  const backend = useBackend();
  const ingest = backend.ingest;
  const [listing, setListing] = useState<DirectoryListing | null>(null);
  // Mounted only while open, so the first listing is loading from the start.
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | undefined>();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [recursive, setRecursive] = useState(false);
  const [pending, setPending] = useState<{
    paths: string[];
    recursive: boolean;
    analyses: TiffAnalysisResult[];
  } | null>(null);

  const navigate = useCallback(
    async (path?: string) => {
      if (!ingest?.browse) return;
      setLoading(true);
      setError(undefined);
      try {
        setListing(await ingest.browse(path));
        setSelected(new Set());
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : String(cause));
      } finally {
        setLoading(false);
      }
    },
    [ingest],
  );

  useEffect(() => {
    let active = true;
    ingest
      ?.browse?.()
      .then((first) => {
        if (active) setListing(first);
      })
      .catch((cause: unknown) => {
        if (active)
          setError(cause instanceof Error ? cause.message : String(cause));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [ingest]);

  const toggle = (path: string) =>
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });

  /* The TIFF files an add would touch, so they can be looked at first. */
  const tiffsUnder = async (
    paths: string[],
    walk: boolean,
  ): Promise<string[]> => {
    const files: string[] = [];
    const visit = async (directory: string, depth: number) => {
      if (!ingest?.browse || depth > MAX_DEPTH) return;
      const inner = await ingest.browse(directory);
      for (const entry of inner.entries) {
        if (entry.type === "directory") {
          if (walk) await visit(entry.path, depth + 1);
        } else if (entry.supported && TIFF_RE.test(entry.name)) {
          files.push(entry.path);
        }
      }
    };
    for (const path of paths) {
      const entry = listing?.entries.find((e) => e.path === path);
      if (entry?.type === "file") {
        if (TIFF_RE.test(entry.name)) files.push(path);
      } else {
        await visit(path, 0);
      }
    }
    return files;
  };

  const add = async (
    paths: string[],
    walk: boolean,
    dimensionConfigs?: Record<string, DimensionConfig>,
  ) => {
    if (!ingest?.addPaths) return;
    onClose();
    // The job's toast reports from here on; a refusal shows as an alert.
    try {
      await ingest.addPaths({ paths, recursive: walk, dimensionConfigs });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause));
    }
  };

  const startAdd = async (paths: string[], walk: boolean) => {
    if (!ingest?.inspect) return;
    setLoading(true);
    setError(undefined);
    try {
      const tiffs = await tiffsUnder(paths, walk);
      const inspections = tiffs.length > 0 ? await ingest.inspect(tiffs) : [];
      const stacks = inspections.filter(
        (file) => file.isMultiFrame && !file.error,
      );
      if (stacks.length === 0) {
        await add(paths, walk);
        return;
      }
      setPending({ paths, recursive: walk, analyses: stacks.map(toAnalysis) });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause));
    } finally {
      setLoading(false);
    }
  };

  const confirmConfigs = (configs: TiffDialogCallbackResult) => {
    if (!pending) return;
    const dimensionConfigs = Object.fromEntries(
      Object.entries(configs).map(([path, config]) => [
        path,
        {
          dimensionOrder: config.dimensionOrder,
          channels: config.channels,
          slices: config.slices,
          frames: config.frames,
        },
      ]),
    );
    const { paths, recursive: walk } = pending;
    setPending(null);
    void add(paths, walk, dimensionConfigs);
  };

  const crumbs = listing ? crumbsOf(listing) : [];
  const atTop = listing?.path === "";

  return (
    <>
      <Dialog
        fullWidth
        maxWidth="md"
        open={open && pending === null}
        onClose={onClose}
      >
        <DialogTitleBar
          title="Add Images from the Server"
          closeDialog={onClose}
        />
        <DialogContent sx={{ minHeight: 360 }}>
          <Stack spacing={1.5}>
            <Breadcrumbs aria-label="folder path">
              {listing && listing.roots.length > 1 && (
                <Link
                  component="button"
                  underline="hover"
                  color={atTop ? "text.primary" : "inherit"}
                  onClick={() => void navigate("")}
                >
                  Roots
                </Link>
              )}
              {crumbs.map((crumb, i) =>
                i === crumbs.length - 1 ? (
                  <Typography key={crumb.path} color="text.primary">
                    {crumb.label}
                  </Typography>
                ) : (
                  <Link
                    key={crumb.path}
                    component="button"
                    underline="hover"
                    color="inherit"
                    onClick={() => void navigate(crumb.path)}
                  >
                    {crumb.label}
                  </Link>
                ),
              )}
            </Breadcrumbs>
            {error && <Alert severity="warning">{error}</Alert>}
            {loading && !listing ? (
              <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
                <CircularProgress size={28} />
              </Box>
            ) : (
              <List
                dense
                data-testid="server-files"
                sx={{
                  maxHeight: 380,
                  overflowY: "auto",
                  opacity: loading ? 0.6 : 1,
                }}
              >
                {listing?.entries.length === 0 && (
                  <ListItem>
                    <ListItemText secondary="Nothing here" />
                  </ListItem>
                )}
                {listing?.entries.map((entry) =>
                  entry.type === "directory" ? (
                    <ListItemButton
                      key={entry.path}
                      onClick={() => void navigate(entry.path)}
                    >
                      <ListItemIcon>
                        <FolderIcon />
                      </ListItemIcon>
                      <ListItemText primary={entry.name} />
                    </ListItemButton>
                  ) : (
                    <ListItemButton
                      key={entry.path}
                      disabled={!entry.supported}
                      onClick={() => toggle(entry.path)}
                    >
                      <ListItemIcon>
                        <Checkbox
                          edge="start"
                          tabIndex={-1}
                          disableRipple
                          checked={selected.has(entry.path)}
                          slotProps={{
                            input: { "aria-label": `select ${entry.name}` },
                          }}
                        />
                      </ListItemIcon>
                      <ListItemIcon>
                        <FileIcon />
                      </ListItemIcon>
                      <ListItemText
                        primary={entry.name}
                        secondary={
                          entry.size !== undefined
                            ? formatSize(entry.size)
                            : undefined
                        }
                      />
                    </ListItemButton>
                  ),
                )}
              </List>
            )}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ justifyContent: "space-between", px: 3 }}>
          <FormControlLabel
            control={
              <Switch
                size="small"
                checked={recursive}
                onChange={(event) => setRecursive(event.target.checked)}
              />
            }
            label="Include subfolders"
          />
          <Stack direction="row" spacing={1}>
            <Button onClick={onClose} color="inherit">
              Cancel
            </Button>
            <Button
              disabled={!listing || atTop || loading}
              onClick={() =>
                listing && void startAdd([listing.path], recursive)
              }
            >
              Add this folder
            </Button>
            <Button
              variant="contained"
              disabled={selected.size === 0 || loading}
              onClick={() => void startAdd([...selected], false)}
            >
              Add selected{selected.size > 0 ? ` (${selected.size})` : ""}
            </Button>
          </Stack>
        </DialogActions>
      </Dialog>
      {pending && (
        <TiffConfigDialog
          open
          analysisResult={pending.analyses}
          onConfirm={confirmConfigs}
          onCancel={() => setPending(null)}
        />
      )}
    </>
  );
};
