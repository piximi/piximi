// DroppableZone.tsx
import type { ReactNode } from "react";

import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";

import { Box, Typography } from "@mui/material";

type DroppableZoneProps = {
  id: string;
  title: string;
  itemIds: string[];
  maxHeight?: number | string;
  emptyMessage?: string;
  children: ReactNode;
};

export const DroppableZone = ({
  id,
  title,
  itemIds,
  maxHeight = 200,
  emptyMessage = "Drop dimensions here",
  children,
}: DroppableZoneProps) => {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <Box
      ref={setNodeRef}
      sx={{
        p: 2,
        minHeight: 80,
        maxHeight,
        border: "2px dashed",
        borderColor: isOver ? "primary.main" : "divider",
        borderRadius: 1,
        bgcolor: isOver ? "action.hover" : "background.paper",
        transition: "border-color 0.2s ease, background-color 0.2s ease",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Typography variant="subtitle2" sx={{ mb: 1, flexShrink: 0 }}>
        {title}
      </Typography>
      <SortableContext items={itemIds} strategy={verticalListSortingStrategy}>
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "stretch",
            gap: 0.5,
            minHeight: 40,
            flex: 1,
            overflowY: "auto",
            overflowX: "hidden",
            // Custom scrollbar styling
            "&::-webkit-scrollbar": {
              width: 6,
            },
            "&::-webkit-scrollbar-track": {
              bgcolor: "action.hover",
              borderRadius: 3,
            },
            "&::-webkit-scrollbar-thumb": {
              bgcolor: "divider",
              borderRadius: 3,
              "&:hover": {
                bgcolor: "action.disabled",
              },
            },
          }}
        >
          {itemIds.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              {emptyMessage}
            </Typography>
          ) : (
            children
          )}
        </Box>
      </SortableContext>
    </Box>
  );
};
