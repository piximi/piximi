import { useState } from "react";

import { useDispatch, useStore } from "react-redux";
import { useNavigate } from "react-router-dom";

import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  LinearProgress,
  Typography,
} from "@mui/material";

import { useBackend } from "core/backend";
import {
  buildChangeSet,
  isEmptyChangeSet,
  withoutConflicts,
} from "core/backend/annotations/changeSet";

import { ConfirmationDialog } from "components/dialogs";

import { dataSlice } from "store/data";

import { imageViewerDataSlice } from "@ImageViewer/state/imageViewerData";
import { annotatorSlice } from "@ImageViewer/state/annotator";
import { useAnnotationSession } from "@ImageViewer/contexts/DataProvider";

import type { AnnotationChangeSet, CommitResult } from "core/backend";

import type { RootState } from "store/rootReducer";

type ExitAnnotatorDialogProps = {
  onClose: () => void;
  open: boolean;
};

type Saving = { percent: number; message: string };

/*
 * Leaving the viewer: Save hands the session's changes to the backend as
 * one commit and leaves once it is applied; Discard drops them. On the
 * local backend the store already holds the edits, so saving puts the
 * tables back to the snapshot first and lets the commit re-apply them
 * through the same path a remote one takes (which is also what measures
 * them). A commit the backend refuses because something changed elsewhere
 * meanwhile asks whether to overwrite, keep what changed, or stay.
 */
export const ExitAnnotatorDialog = ({
  onClose,
  open,
}: ExitAnnotatorDialogProps) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const store = useStore<RootState>();
  const backend = useBackend();
  const session = useAnnotationSession();
  const [saving, setSaving] = useState<Saving | null>(null);
  const [conflict, setConflict] = useState<{
    changeSet: AnnotationChangeSet;
    result: CommitResult;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const leave = () => {
    navigate("/project");
    dispatch(imageViewerDataSlice.actions.resetState());
    dispatch(annotatorSlice.actions.resetAnnotator());
  };

  const discard = () => {
    if (session.borrowed) {
      dispatch(dataSlice.actions.evictImageAnnotations(session.imageIds));
    } else if (session.snapshot) {
      dispatch(dataSlice.actions.restoreAnnotationTables(session.snapshot));
    }
    leave();
  };

  const commit = async (
    changeSet: AnnotationChangeSet,
    edited: Parameters<typeof dataSlice.actions.restoreAnnotationTables>[0],
  ) => {
    setSaving({ percent: -1, message: "Saving…" });
    setError(null);
    setConflict(null);
    try {
      const result = await backend.annotations.commit(changeSet, {
        onProgress: (update) => setSaving(update),
      });
      if (result.conflicts.length > 0 && !changeSet.force) {
        setSaving(null);
        setConflict({ changeSet, result });
        return;
      }
      if (session.borrowed) {
        dispatch(dataSlice.actions.evictImageAnnotations(session.imageIds));
      }
      leave();
    } catch (failure) {
      // The edits come back as unsaved, for another try or a discard.
      if (!session.borrowed) {
        dispatch(dataSlice.actions.restoreAnnotationTables(edited));
      }
      setSaving(null);
      setError((failure as Error).message);
    }
  };

  const save = () => {
    if (!session.snapshot) return;
    const { annotations, annotationVolumes } = store.getState().data;
    const edited = { annotations, annotationVolumes };
    const changeSet = buildChangeSet(
      session.snapshot,
      edited,
      session.imageIds,
    );
    if (isEmptyChangeSet(changeSet)) {
      if (session.borrowed) {
        dispatch(dataSlice.actions.evictImageAnnotations(session.imageIds));
      }
      leave();
      return;
    }
    if (!session.borrowed) {
      dispatch(dataSlice.actions.restoreAnnotationTables(session.snapshot));
    }
    void commit(changeSet, edited);
  };

  const resolveConflict = (how: "overwrite" | "theirs" | "cancel") => {
    if (!conflict) return;
    const { changeSet } = conflict;
    const { annotations, annotationVolumes } = store.getState().data;
    const edited = { annotations, annotationVolumes };
    if (how === "cancel") {
      setConflict(null);
      if (!session.borrowed && session.snapshot) {
        // The store was put back for the commit; bring the edits back.
        dispatch(dataSlice.actions.restoreAnnotationTables(edited));
      }
      onClose();
      return;
    }
    void commit(
      how === "overwrite"
        ? { ...changeSet, force: true }
        : withoutConflicts(changeSet, conflict.result.conflicts),
      edited,
    );
  };

  const busy = saving !== null || conflict !== null;

  // The confirmation closes itself (and the caller's `open`) before it runs
  // Save, so what follows is shown on its own state, not on `open`.
  return (
    <>
      <ConfirmationDialog
        title="Save Changes?"
        content="Would you like to save the changes to these annotations and return to the project page?"
        onConfirm={save}
        confirmText="SAVE"
        onReject={discard}
        rejectText="DISCARD"
        onClose={onClose}
        isOpen={open && !busy && error === null}
        confirmDisabled={session.loading}
      />
      <Dialog open={saving !== null} fullWidth>
        <DialogTitle>Saving annotations</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 1 }}>
            {saving?.message}
          </Typography>
          <LinearProgress
            variant={
              saving && saving.percent >= 0 ? "determinate" : "indeterminate"
            }
            value={Math.max(0, saving?.percent ?? 0)}
            data-testid="commit-progress"
          />
        </DialogContent>
      </Dialog>
      <Dialog open={conflict !== null} fullWidth>
        <DialogTitle>Changed elsewhere</DialogTitle>
        <DialogContent>
          <Typography variant="body2" data-testid="commit-conflicts">
            {describeConflicts(conflict?.result)} since this image was opened.
            Overwrite them with your changes, keep theirs and save the rest, or
            go back to the image.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => resolveConflict("cancel")}>Cancel</Button>
          <Button onClick={() => resolveConflict("theirs")}>Keep theirs</Button>
          <Button
            variant="contained"
            color="warning"
            onClick={() => resolveConflict("overwrite")}
          >
            Overwrite
          </Button>
        </DialogActions>
      </Dialog>
      <Dialog open={error !== null} fullWidth onClose={onClose}>
        <DialogTitle>Saving failed</DialogTitle>
        <DialogContent>
          <Alert severity="error" data-testid="commit-error">
            {error}
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setError(null);
              onClose();
            }}
          >
            Back to the image
          </Button>
          <Button variant="contained" onClick={() => setError(null)}>
            Try again
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

/* A refused object is listed once even when both its annotation and its
 * volume were refused, so count annotations, or volumes where no
 * annotation of theirs is listed. */
const countObjects = (conflicts: CommitResult["conflicts"]): number => {
  const annotations = conflicts.filter((c) => c.type === "annotation").length;
  return annotations > 0
    ? annotations
    : conflicts.filter((c) => c.type === "volume").length;
};

const describeConflicts = (result: CommitResult | undefined): string => {
  if (!result) return "";
  const modified = countObjects(
    result.conflicts.filter((c) => c.reason === "modified"),
  );
  const missing = countObjects(
    result.conflicts.filter((c) => c.reason === "missing"),
  );
  const parts: string[] = [];
  if (modified > 0) {
    parts.push(
      `${modified} ${modified === 1 ? "object was" : "objects were"} changed`,
    );
  }
  if (missing > 0) {
    parts.push(
      `${missing} ${missing === 1 ? "object was" : "objects were"} deleted`,
    );
  }
  return parts.join(" and ");
};
