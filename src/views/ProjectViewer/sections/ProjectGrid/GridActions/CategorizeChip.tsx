import { useMemo, useState } from "react";

import { useSelector } from "react-redux";

import {
  LabelOutlined as LabelOutlinedIcon,
  Label as LabelIcon,
} from "@mui/icons-material";
import { Box, MenuItem, MenuList } from "@mui/material";

import { PopperToolButton, StyledSelect } from "components/inputs";

import { HelpItem } from "help/HelpContent";
import {
  selectAllKinds,
  selectAnnotationCategories,
} from "store/data/selectors";

import {
  selectActiveKindId,
  selectActiveView,
} from "views/ProjectViewer/state/selectors";

import type { SelectChangeEvent } from "@mui/material";

import type { Category } from "core/entities";

export const CategorizeChip = ({
  selectedFilteredItems,
  handleCategorize,
  activeCategories,
}: {
  selectedFilteredItems: string[];
  handleCategorize: (catId: string) => void;
  activeCategories: Category[];
}) => {
  const activeView = useSelector(selectActiveView);
  return (
    <PopperToolButton
      name={
        selectedFilteredItems.length === 0
          ? "Select Objects to Categorize/Re-kind"
          : "Categorize/Re-kind Selection"
      }
      onClick={() => {}}
      disabled={selectedFilteredItems.length === 0}
      icon={<LabelOutlinedIcon />}
      data-help={HelpItem.Categorize}
      hotkey={["shift", "#"]}
      popperContent={(close) => {
        const handleCategorizeAndClose = (catId: string) => {
          handleCategorize(catId);
          close();
        };
        return activeView === "images" ? (
          <Box
            sx={{
              bgcolor: "var(--mui-palette-background-paper)",
              border: "1px solid var(--mui-palette-text-primary)",
              borderRadius: 2,
            }}
          >
            <MenuList dense variant="menu">
              {activeCategories.map((category: Category) => (
                <MenuItem
                  key={category.id}
                  onClick={() => handleCategorize(category.id)}
                >
                  <LabelIcon
                    style={{ color: category.color, paddingRight: "8px" }}
                  />
                  {category.name}
                </MenuItem>
              ))}
            </MenuList>
          </Box>
        ) : (
          <CategoryPopover handleCategorize={handleCategorizeAndClose} />
        );
      }}
      popperPlacement="bottom"
      clickAway={true}
    />
  );
};

const CategoryPopover = ({
  handleCategorize,
}: {
  handleCategorize: (catId: string) => void;
}) => {
  const kinds = useSelector(selectAllKinds);
  const activeKind = useSelector(selectActiveKindId);
  const categories = useSelector(selectAnnotationCategories);
  const [selectedKind, setSelectedKind] = useState<string>(activeKind ?? "");
  const availableCategories = useMemo(() => {
    if (selectedKind === "") return [];
    return categories.filter((c) => c.kindId === selectedKind);
  }, [selectedKind, categories]);
  const handleSelectKind = (event: SelectChangeEvent<unknown>) => {
    setSelectedKind(event.target.value as string);
  };
  return (
    <Box
      sx={{
        bgcolor: "var(--mui-palette-background-paper)",
        border: "1px solid var(--mui-palette-text-primary)",
        borderRadius: 2,
        p: 1,
      }}
    >
      <StyledSelect
        value={selectedKind}
        onChange={handleSelectKind}
        fullWidth
        displayEmpty
      >
        <MenuItem disabled value="" dense>
          <em>Select a kind</em>
        </MenuItem>
        {kinds.map((k) => (
          <MenuItem key={k.id} value={k.id} dense>
            {k.name}
          </MenuItem>
        ))}
      </StyledSelect>
      <MenuList dense variant="menu">
        {availableCategories.map((category: Category) => (
          <MenuItem
            key={category.id}
            onClick={() => handleCategorize(category.id)}
          >
            <LabelIcon style={{ color: category.color, paddingRight: "8px" }} />
            {category.name}
          </MenuItem>
        ))}
      </MenuList>
    </Box>
  );
};
