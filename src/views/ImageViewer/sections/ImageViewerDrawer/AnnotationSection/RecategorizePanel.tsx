import { useMemo, useState } from "react";

import { useDispatch } from "react-redux";

import { Box, Button, Divider, MenuItem, Typography } from "@mui/material";
import RadioButtonCheckedIcon from "@mui/icons-material/RadioButtonChecked";
import RadioButtonUncheckedIcon from "@mui/icons-material/RadioButtonUnchecked";

import { StyledSelect } from "components/inputs";

import { dataSlice } from "store/data";

import type { SelectChangeEvent } from "@mui/material";

import type { KindNode, OpScope, ScopeId } from "./types";

interface RecategorizePanelProps {
  scopes: OpScope[];
  scopeToAnnotations: (scope: ScopeId) => Set<string>;
  onCategorized: () => void;
  groups: KindNode[];
}

/**
 * The export scope + format picker, shared by the desktop selection footer's
 * popover and the mobile export panel so a format added in one place can't
 * drift out of sync with the other.
 */
export const RecategorizePanel = ({
  scopes,
  scopeToAnnotations,
  onCategorized,
  groups,
}: RecategorizePanelProps) => {
  const dispatch = useDispatch();
  const [selectedOption, setSelectedOption] = useState<string>("");

  const [scope, setScope] = useState<ScopeId>("selected");

  const options = useMemo(() => {
    const options: { catId: string; name: string }[] = [];
    groups.forEach((kg) => {
      kg.cats.forEach((c) =>
        options.push({ catId: c.id, name: `${c.name} (${kg.name})` }),
      );
    });
    return options;
  }, [groups]);
  const handleCategorize = async () => {
    if (!selectedOption) return;
    const updates = [...scopeToAnnotations(scope)].map((id) => ({
      id,
      categoryId: selectedOption,
    }));
    dispatch(dataSlice.actions.batchBubbleUpdateAnnotationCategory(updates));
  };
  const handleFormatChange = (event: SelectChangeEvent<unknown>) => {
    setSelectedOption(event.target.value as string);
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
        Categorize scope
      </Typography>
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
        <StyledSelect
          value={selectedOption}
          onChange={handleFormatChange}
          fullWidth
          displayEmpty
        >
          <MenuItem disabled value="" dense>
            <em>Select a category</em>
          </MenuItem>
          {options.map((option) => (
            <MenuItem key={option.catId} value={option.catId} dense>
              {option.name}
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
            onCategorized();
            void handleCategorize();
          }}
        >
          Categorize
        </Button>
      </Box>
    </Box>
  );
};
