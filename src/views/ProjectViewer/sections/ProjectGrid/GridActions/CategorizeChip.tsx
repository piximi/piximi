import {
  LabelOutlined as LabelOutlinedIcon,
  Label as LabelIcon,
} from "@mui/icons-material";
import { Box, MenuItem, MenuList } from "@mui/material";

import { PopperToolButton } from "components/inputs";

import { HelpItem } from "data/help/HelpContent";

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
  return (
    <PopperToolButton
      name={
        selectedFilteredItems.length === 0
          ? "Select Objects to Categorize"
          : "Categorize Selection"
      }
      onClick={() => {}}
      disabled={selectedFilteredItems.length === 0}
      icon={<LabelOutlinedIcon />}
      data-help={HelpItem.Categorize}
      hotkey={["shift", "#"]}
      popperContent={
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
      }
      popperPlacement="bottom"
      clickAway={true}
    />
  );
};
