import { Chip } from "@mui/material";
import { CSS } from "@dnd-kit/utilities";
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";
import { useSortable } from "@dnd-kit/sortable";

type SortableDimensionChipProps = { id: string; label: string };

export const SortableDimensionChip = ({
  id,
  label,
}: SortableDimensionChipProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    cursor: "grab",
  };

  return (
    <Chip
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      icon={<DragIndicatorIcon fontSize="small" />}
      label={label}
      sx={{
        flexShrink: 0,
        width: "100%",
        justifyContent: "flex-start",
      }}
      size="small"
    />
  );
};
