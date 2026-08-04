import { useRef } from "react";

import { CSS } from "@dnd-kit/utilities";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useDroppable } from "@dnd-kit/core";

import { Chip, Popover, Box, Typography } from "@mui/material";
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";

import { SortableDimensionChip } from "./SortableDimensionChip";

import type { DimensionValue } from "@MeasurementViewer/types";

type ExpandableDimensionChipProps = {
  id: string;
  label: string;
  values: DimensionValue[];
  isExpanded: boolean;
  onExpandToggle: (id: string, expanded: boolean) => void;
};

export const ExpandableDimensionChip = ({
  id,
  label,
  values,
  isExpanded,
  onExpandToggle,
}: ExpandableDimensionChipProps) => {
  const chipRef = useRef<HTMLDivElement>(null);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  // Create a droppable zone for the popover content
  const { setNodeRef: setPopoverDropRef, isOver } = useDroppable({
    id: `popover-${id}`,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    cursor: "grab",
  };

  const handleExpandClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    onExpandToggle(id, !isExpanded);
  };

  const handlePopoverClose = () => {
    onExpandToggle(id, false);
  };

  // Combine refs for both sortable and the anchor element
  const combinedRef = (node: HTMLDivElement | null) => {
    setNodeRef(node);
    (chipRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
  };

  return (
    <>
      <Chip
        ref={combinedRef}
        style={style}
        {...attributes}
        {...listeners}
        icon={<DragIndicatorIcon fontSize="small" />}
        label={
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            {label}
            <Box
              component="span"
              onClick={handleExpandClick}
              sx={{
                display: "flex",
                alignItems: "center",
                ml: "auto",
                cursor: "pointer",
                "&:hover": { opacity: 0.7 },
              }}
            >
              {isExpanded ? (
                <ExpandLessIcon fontSize="small" />
              ) : (
                <ExpandMoreIcon fontSize="small" />
              )}
            </Box>
          </Box>
        }
        sx={{
          flexShrink: 0,
          width: "100%",
          justifyContent: "flex-start",
          "& .MuiChip-label": {
            width: "100%",
            display: "flex",
          },
        }}
        size="small"
      />

      <Popover
        open={isExpanded}
        anchorEl={chipRef.current}
        onClose={handlePopoverClose}
        disablePortal // Keep in DOM hierarchy for dnd-kit
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "left",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "left",
        }}
        slotProps={{
          paper: {
            sx: {
              mt: 0.5,
              minWidth: 200,
              maxHeight: 300,
              overflow: "hidden",
            },
          },
        }}
      >
        <Box
          ref={setPopoverDropRef}
          sx={{
            p: 1,
            bgcolor: isOver ? "action.hover" : "background.paper",
            transition: "background-color 0.2s ease",
          }}
        >
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ px: 1, display: "block", mb: 1 }}
          >
            Drag individual values to Pivot By
          </Typography>
          <SortableContext
            items={values.map((v) => v.id)}
            strategy={verticalListSortingStrategy}
          >
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                gap: 0.5,
                maxHeight: 250,
                overflowY: "auto",
              }}
            >
              {values.map((value) => (
                <SortableDimensionChip
                  key={value.id}
                  id={value.id}
                  label={value.label}
                />
              ))}
            </Box>
          </SortableContext>
        </Box>
      </Popover>
    </>
  );
};
