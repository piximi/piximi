import { useState } from "react";

import { useDispatch } from "react-redux";

import { saveAs } from "file-saver";

import {
  Box,
  Button,
  Divider,
  MenuItem,
  MenuList,
  Typography,
} from "@mui/material";
import RadioButtonCheckedIcon from "@mui/icons-material/RadioButtonChecked";
import RadioButtonUncheckedIcon from "@mui/icons-material/RadioButtonUnchecked";

import { useBackend } from "core/backend";
import { exportOptions } from "core/file-io/export/runAnnotationExport";

import { StyledSelect } from "components/inputs";

import { applicationSettingsSlice } from "store/applicationSettings";

import { AlertType } from "utils/enums";

import type { SelectChangeEvent } from "@mui/material";

import type { AnnotationExportType } from "core/file-io/export/enums";

import type { AlertState } from "utils/types";

import type { OpScope, ScopeId } from "./types";

interface ExportOptionsPanelProps {
  scopes: OpScope[];
  scopeToAnnotations: (scope: ScopeId) => Set<string>;
  experimentName: string;
  onExported: () => void;
}

/**
 * The export scope + format picker, shared by the desktop selection footer's
 * popover and the mobile export panel so a format added in one place can't
 * drift out of sync with the other.
 */
export const ExportOptionsPanel = ({
  scopes,
  scopeToAnnotations,
  experimentName,
  onExported,
}: ExportOptionsPanelProps) => {
  const backend = useBackend();
  const dispatch = useDispatch();
  const [format, setFormat] = useState<AnnotationExportType>(
    exportOptions[0].type,
  );
  const [scope, setScope] = useState<ScopeId>("selected");

  // The backend renders the file from what it holds, so this session's
  // unsaved edits are not in it until they are saved.
  const handleExport = async () => {
    if (!backend.export) return;
    try {
      const file = await backend.export.annotations({
        type: format,
        query: { ids: [...scopeToAnnotations(scope)] },
        name: experimentName,
      });
      // A copy: the bytes may sit in a shared or offset buffer.
      saveAs(new Blob([file.data.slice()], { type: file.mime }), file.fileName);
    } catch (err) {
      const warning: AlertState = {
        alertType: AlertType.Warning,
        name: "Could not export annotations",
        description: err instanceof Error ? err.message : String(err),
      };
      dispatch(
        applicationSettingsSlice.actions.updateAlertState({
          alertState: warning,
        }),
      );
    }
  };
  const handleFormatChange = (event: SelectChangeEvent<unknown>) => {
    setFormat(event.target.value as AnnotationExportType);
  };

  return (
    <Box sx={{ width: 236, py: 1 }}>
      <Typography
        sx={{
          px: 2,
          pb: 0.5,
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: ".6px",
          textTransform: "uppercase",
          color: "text.secondary",
        }}
      >
        Export scope
      </Typography>
      {/* MenuItems need a MenuList parent (MUI 9), not just the popover. */}
      <MenuList dense disablePadding>
        {scopes.map((s) => (
          <MenuItem
            key={s.id}
            onClick={() => setScope(s.id)}
            dense
            sx={{ py: 0, minHeight: 24, minWidth: 150, borderRadius: 0 }}
            disabled={s.count === 0}
          >
            {scope === s.id ? (
              <RadioButtonCheckedIcon
                color="primary"
                sx={{ fontSize: 16, mr: 1 }}
              />
            ) : (
              <RadioButtonUncheckedIcon
                sx={{ fontSize: 16, mr: 1, color: "action.active" }}
              />
            )}
            {s.label}
            <Typography
              component="span"
              variant="caption"
              sx={{ ml: "auto", color: "text.disabled" }}
            >
              ({s.count})
            </Typography>
          </MenuItem>
        ))}
      </MenuList>
      <Divider sx={{ my: 0.75 }} />
      <Typography
        sx={{
          px: 2,
          pb: 0.75,
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: ".6px",
          textTransform: "uppercase",
          color: "text.secondary",
        }}
      >
        Format
      </Typography>
      <Box
        sx={{ display: "flex", flexWrap: "wrap", gap: 0.75, px: 1.5, pb: 1 }}
      >
        <StyledSelect value={format} onChange={handleFormatChange} fullWidth>
          {exportOptions.map((option) => (
            <MenuItem key={option.title} value={option.type} dense>
              {option.title}
            </MenuItem>
          ))}
        </StyledSelect>
      </Box>
      <Box sx={{ px: 1.5, pt: 0.5 }}>
        <Button
          fullWidth
          variant="contained"
          size="small"
          onClick={() => {
            onExported();
            void handleExport();
          }}
        >
          Export
        </Button>
      </Box>
    </Box>
  );
};
