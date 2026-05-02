import { useEffect, useState } from "react";

import type { SelectChangeEvent } from "@mui/material";
import {
  Box,
  Button,
  ButtonGroup,
  Divider,
  MenuItem,
  Typography,
} from "@mui/material";

import { StyledSelect } from "components/inputs";

import { useGridActions } from "@ProjectViewer/hooks";

export const SelectionOptions = () => {
  const {
    hasItems,
    allSelected,
    selectedFilteredItemIds,
    handleCategorize,
    handleDelete,
    activeCategories,
    handleSelectAll,
    handleDeselectAll,
    filteredItems,
  } = useGridActions();

  const [selectedCategory, setSelectedCategory] = useState<string>("");

  const handleCategoryChange = (e: SelectChangeEvent<unknown>) => {
    const catId = e.target.value as string;
    setSelectedCategory(catId);
    handleCategorize(catId);
  };
  useEffect(() => {
    setSelectedCategory("");
  }, [selectedFilteredItemIds.length]);

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        px: 1,
        alignItems: "flex-end",
      }}
    >
      <Typography variant="caption">{`${selectedFilteredItemIds.length}/${filteredItems.length} (filtered)`}</Typography>
      <ButtonGroup
        sx={{ width: "100%", display: "flex", justifyContent: "space-around" }}
      >
        <Button
          variant="text"
          onClick={handleSelectAll}
          disabled={allSelected || !hasItems}
          size="small"
        >
          Select All
        </Button>
        <Button
          variant="text"
          onClick={handleDeselectAll}
          disabled={selectedFilteredItemIds.length === 0 || !hasItems}
          size="small"
        >
          Deselect All
        </Button>
      </ButtonGroup>

      <StyledSelect
        value={selectedCategory}
        variant="standard"
        size="small"
        sx={{ alignSelf: "center" }}
        displayEmpty
        renderValue={(v) => {
          if (!v) return <em style={{ opacity: 0.6 }}>Update Category…</em>;
          return activeCategories.find((c) => c.id === v)?.name ?? "";
        }}
        onChange={handleCategoryChange}
        disabled={selectedFilteredItemIds.length === 0 || !hasItems}
      >
        {activeCategories.map((cat) => (
          <MenuItem key={`cat-select-${cat.id}`} value={cat.id} dense>
            {cat.name}
          </MenuItem>
        ))}
      </StyledSelect>
      <Divider flexItem orientation="horizontal" sx={{ my: 1 }} />
      <Button
        variant="text"
        onClick={handleDelete}
        disabled={!hasItems || selectedFilteredItemIds.length === 0}
        size="small"
        color="error"
        sx={{ alignSelf: "center" }}
      >
        Delete Selected
      </Button>
    </Box>
  );
};
