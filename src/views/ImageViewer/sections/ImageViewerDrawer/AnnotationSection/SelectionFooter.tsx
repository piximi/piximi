import { useState } from "react";

import { useDispatch, useSelector } from "react-redux";

import {
  Box,
  Button,
  Menu,
  MenuItem,
  Popover,
  Typography,
  Link,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import DownloadIcon from "@mui/icons-material/Download";
import ArrowDropUpIcon from "@mui/icons-material/ArrowDropUp";

import { useDialogHotkey } from "hooks";

import { ConfirmationDialog } from "components/dialogs";

import { selectExperiment } from "store/data/selectors";
import { dataSlice } from "store/data";

import { HotkeyContext } from "utils/enums";

import { ExportOptionsPanel } from "./ExportOptionsPanel";

import type { OpScope, ScopeId } from "./types";

interface SelectionFooterProps {
  selSummary: string;
  anySel: boolean;
  selectedCount: number;
  viewCount: number;
  planeCount: number;
  totalCount: number;
  onClear: () => void;
  scopeToAnnotations: (scope: ScopeId) => Set<string>;
}

/**
 * The selection surface's action footer. The current selection (categories +
 * active feature ranges) can be promoted to a filter layer (Keep / Hide) OR
 * acted on directly via Delete / Export.
 */
export const SelectionFooter = ({
  selSummary,
  anySel,
  selectedCount,
  viewCount,
  planeCount,
  totalCount,
  onClear,
  scopeToAnnotations,
}: SelectionFooterProps) => {
  const dispatch = useDispatch();
  const [delAnchor, setDelAnchor] = useState<HTMLElement | null>(null);
  const [expAnchor, setExpAnchor] = useState<HTMLElement | null>(null);
  const [pendingScope, setPendingScope] = useState<ScopeId | null>(null);
  const {
    onOpen: openDeleteConfirm,
    onClose: closeDeleteConfirm,
    open: deleteConfirmOpen,
  } = useDialogHotkey(HotkeyContext.ConfirmationDialog);

  const scopes: OpScope[] = [
    { id: "selected", label: "Selected", count: selectedCount },
    { id: "view", label: "In view", count: viewCount },
    { id: "plane", label: "This plane", count: planeCount },
    { id: "image", label: "Whole image", count: totalCount },
  ];

  const pendingCount = pendingScope
    ? (scopes.find((s) => s.id === pendingScope)?.count ?? 0)
    : 0;

  const handleConfirmDelete = () => {
    if (!pendingScope) return;
    const ids = scopeToAnnotations(pendingScope);
    dispatch(dataSlice.actions.batchDeleteAnnotation([...ids]));
    setPendingScope(null);
  };

  return (
    <Box
      sx={{
        borderTop: 1,
        borderColor: "divider",
        width: "100%",
        px: 1.5,
        pt: 1,
        pb: 1.25,
        bgcolor:
          "rgba(var(--mui-palette-primary-mainChannel) / var(--mui-palette-action-selectedOpacity))",
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          mb: 1,
        }}
      >
        <Typography sx={{ fontSize: 12, color: "text.secondary" }}>
          {selSummary}
        </Typography>
        <Link
          component="button"
          underline="none"
          disabled={!anySel}
          onClick={onClear}
          sx={{
            fontSize: 12,
            fontWeight: 500,
            color: anySel ? "primary.main" : "text.disabled",
          }}
        >
          Clear
        </Link>
      </Box>

      {/* act on selection */}
      <Box sx={{ display: "flex", gap: 1 }}>
        <Button
          fullWidth
          color="error"
          variant="outlined"
          size="small"
          startIcon={<DeleteIcon />}
          endIcon={<ArrowDropUpIcon />}
          onClick={(e) => setDelAnchor(e.currentTarget)}
        >
          Delete
        </Button>
        <Button
          fullWidth
          variant="contained"
          size="small"
          startIcon={<DownloadIcon />}
          endIcon={<ArrowDropUpIcon />}
          onClick={(e) => setExpAnchor(e.currentTarget)}
        >
          Export
        </Button>
      </Box>
      {expAnchor && (
        <ExportPopover
          expAnchor={expAnchor}
          onClose={() => setExpAnchor(null)}
          scopes={scopes}
          scopeToAnnotations={scopeToAnnotations}
        />
      )}

      <Menu
        anchorEl={delAnchor}
        open={!!delAnchor}
        onClose={() => setDelAnchor(null)}
        anchorOrigin={{ vertical: "top", horizontal: "left" }}
        transformOrigin={{ vertical: "bottom", horizontal: "left" }}
      >
        <Typography
          sx={{
            px: 2,
            pt: 0.5,
            pb: 0.75,
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: ".5px",
            textTransform: "uppercase",
            color: "text.secondary",
          }}
        >
          Delete scope
        </Typography>
        {scopes.map((s) => (
          <MenuItem
            key={s.id}
            onClick={() => {
              setDelAnchor(null);
              setPendingScope(s.id);
              openDeleteConfirm();
            }}
            dense
            sx={{
              py: 0,
              minHeight: 24,
              color: "error.main",
              minWidth: 200,
              borderRadius: 0,
            }}
            disabled={s.count === 0}
          >
            {s.label}
            <Typography
              component="span"
              variant="caption"
              sx={{ ml: "auto", color: "text.disabled" }}
            >
              {s.count}
            </Typography>
          </MenuItem>
        ))}
      </Menu>

      <ConfirmationDialog
        title="Delete Annotations"
        content={`${pendingCount} ${pendingCount === 1 ? "annotation" : "annotations"} will be deleted`}
        onConfirm={handleConfirmDelete}
        onClose={() => {
          closeDeleteConfirm();
          setPendingScope(null);
        }}
        isOpen={deleteConfirmOpen}
      />
    </Box>
  );
};

const ExportPopover = ({
  expAnchor,
  onClose,
  scopes,
  scopeToAnnotations,
}: {
  expAnchor: HTMLElement;
  onClose: () => void;
  scopes: OpScope[];
  scopeToAnnotations: (scope: ScopeId) => Set<string>;
}) => {
  const experiment = useSelector(selectExperiment);
  return (
    <Popover
      anchorEl={expAnchor}
      open
      onClose={onClose}
      anchorOrigin={{ vertical: "top", horizontal: "right" }}
      transformOrigin={{ vertical: "bottom", horizontal: "right" }}
    >
      <ExportOptionsPanel
        scopes={scopes}
        scopeToAnnotations={scopeToAnnotations}
        experimentName={experiment.name}
        onExported={onClose}
      />
    </Popover>
  );
};
