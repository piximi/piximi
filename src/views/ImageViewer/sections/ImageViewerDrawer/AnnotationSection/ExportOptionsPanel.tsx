import { useState } from "react";

import { useSelector } from "react-redux";

import type { SelectChangeEvent } from "@mui/material";
import { Box, Button, Divider, MenuItem, Typography } from "@mui/material";
import RadioButtonCheckedIcon from "@mui/icons-material/RadioButtonChecked";
import RadioButtonUncheckedIcon from "@mui/icons-material/RadioButtonUnchecked";

import { StyledSelect } from "components/inputs";

import {
  selectAllExtendedAnnotations,
  selectImageEntities,
  selectKindEntities,
} from "store/dataV2/selectors";

import type { AnnotationExportType } from "utils/file-io/enums";
import type { ExportedAnnotation } from "utils/file-io-v2/export/types";
import {
  exportOptions,
  runAnnotationExport,
} from "utils/file-io-v2/export/runAnnotationExport";

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
  const annotations = useSelector(selectAllExtendedAnnotations);
  const images = useSelector(selectImageEntities);
  const kinds = useSelector(selectKindEntities);
  const [format, setFormat] = useState<AnnotationExportType>(
    exportOptions[0].type,
  );
  const [scope, setScope] = useState<ScopeId>("selected");

  const handleExport = async () => {
    const idsInScope = [...scopeToAnnotations(scope)];
    const annotationsById = new Map(annotations.map((a) => [a.id, a]));
    const exportedAnnotations: ExportedAnnotation[] = idsInScope.map((id) => {
      const ann = annotationsById.get(id)!;
      return {
        ...ann,
        kindName: kinds[ann.kindId].name,
        imageShape: images[ann.imageId].shape,
      };
    });

    await runAnnotationExport(format, exportedAnnotations, experimentName);
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
      {scopes.map((s) => (
        <MenuItem
          key={s.id}
          dense
          onClick={() => setScope(s.id)}
          sx={{ py: 0, minHeight: 24 }}
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
            sx={{ ml: 0.75, color: "text.disabled" }}
          >
            ({s.count})
          </Typography>
        </MenuItem>
      ))}
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
        <StyledSelect value={format} onChange={handleFormatChange}>
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
