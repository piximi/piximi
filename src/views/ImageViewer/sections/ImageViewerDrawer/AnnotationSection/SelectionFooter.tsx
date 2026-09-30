import { useState } from "react";

import { useDispatch, useSelector } from "react-redux";

import { Box, Menu, MenuItem, Popover, Typography, Link } from "@mui/material";
import ArrowDropUpIcon from "@mui/icons-material/ArrowDropUp";

import { useDialogHotkey } from "hooks";

import { ConfirmationDialog } from "components/dialogs";
import { TooltipTextButton } from "components/inputs";

import { selectExperiment } from "store/data/selectors";
import { dataSlice } from "store/data";
import { HelpItem } from "help/HelpContent";

import { HotkeyContext } from "utils/enums";

import { ExportOptionsPanel } from "./ExportOptionsPanel";
import { RecategorizePanel } from "./RecategorizePanel";

import type { KindNode, OpScope, ScopeId } from "./types";

interface SelectionFooterProps {
  selSummary: string;
  anySel: boolean;
  selectedCount: number;
  viewCount: number;
  planeCount: number;
  totalCount: number;
  onClear: () => void;
  scopeToAnnotations: (scope: ScopeId) => Set<string>;
  groups: KindNode[];
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
  groups,
}: SelectionFooterProps) => {
  const dispatch = useDispatch();
  const [delAnchor, setDelAnchor] = useState<HTMLElement | null>(null);
  const [expAnchor, setExpAnchor] = useState<HTMLElement | null>(null);
  const [catAnchor, setCatAnchor] = useState<HTMLElement | null>(null);
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
        <TooltipTextButton
          color="error"
          variant="outlined"
          endIcon={<ArrowDropUpIcon />}
          onClick={(e) => setDelAnchor(e.currentTarget)}
          label="Delete"
          tooltipText="Delete annotations"
          sx={{ fontSize: 12 }}
        />
        <TooltipTextButton
          variant="outlined"
          endIcon={<ArrowDropUpIcon />}
          onClick={(e) => setCatAnchor(e.currentTarget)}
          label="Categorize"
          tooltipText="Categorize annotations"
          sx={{ fontSize: 12 }}
        />
        <TooltipTextButton
          variant="outlined"
          endIcon={<ArrowDropUpIcon />}
          onClick={(e) => setExpAnchor(e.currentTarget)}
          label="Export"
          tooltipText="Export annotations"
          data-help={HelpItem.ExportAnnotation}
          sx={{ fontSize: 12 }}
        />
      </Box>
      {catAnchor && (
        <CategorizePopover
          catAnchor={catAnchor}
          onClose={() => setCatAnchor(null)}
          scopes={scopes}
          scopeToAnnotations={scopeToAnnotations}
          groups={groups}
        />
      )}
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
            letterSpacing: ".6px",
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
              minWidth: 150,
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
const CategorizePopover = ({
  catAnchor,
  onClose,
  scopes,
  scopeToAnnotations,
  groups,
}: {
  catAnchor: HTMLElement;
  onClose: () => void;
  scopes: OpScope[];
  scopeToAnnotations: (scope: ScopeId) => Set<string>;
  groups: KindNode[];
}) => {
  return (
    <Popover
      anchorEl={catAnchor}
      open
      onClose={onClose}
      anchorOrigin={{ vertical: "top", horizontal: "right" }}
      transformOrigin={{ vertical: "bottom", horizontal: "right" }}
    >
      <RecategorizePanel
        scopes={scopes}
        scopeToAnnotations={scopeToAnnotations}
        onCategorized={onClose}
        groups={groups}
      />
    </Popover>
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
