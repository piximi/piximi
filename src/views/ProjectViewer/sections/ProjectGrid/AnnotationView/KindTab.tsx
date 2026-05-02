import type React from "react";
import { useState } from "react";

import { Box, Typography } from "@mui/material";
import {
  Delete as DeleteIcon,
  Minimize as MinimizeIcon,
  Edit as EditIcon,
} from "@mui/icons-material";

import { TextFieldWithBlur } from "components/inputs";
import { HelpItem } from "components/layout/HelpDrawer/HelpContent";

import { representsUnknown } from "utils/stringUtils";

import type { KindState } from "@ProjectViewer/state/types";

export const KindTab = ({
  kind,
  handleDelete,
  handleMinimize,
  handleTabEdit,
  handleSelect,
  active,
}: {
  kind: KindState;
  handleDelete: (id: string) => void;
  handleMinimize: (id: string) => void;
  handleTabEdit: (id: string, name: string) => void;
  handleSelect: (id: string) => void;
  active: boolean;
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(kind.name);

  const handleMinOrDelete = (
    event: React.MouseEvent,
    value: string,
    type: "delete" | "minimize",
  ) => {
    event.stopPropagation();
    if (type === "delete") handleDelete(value);
    else handleMinimize(value);
  };

  return (
    <Box
      onClick={() => handleSelect(kind.id)}
      sx={(theme) => ({
        flex: 1,
        position: "relative",
        display: "flex",
        flexDirection: "row",
        justifyContent: "center",
        cursor: "pointer",
        alignItems: "center",
        bgcolor: active ? "rgba(144, 202, 249, 0.16)" : undefined,
        "& .MuiSvgIcon-root": {
          visibility: "hidden",
        },
        ":hover": {
          bgcolor: theme.palette.action.hover,
          "& .MuiSvgIcon-root": {
            visibility: "visible",
          },
        },
      })}
    >
      {isEditing ? (
        <TextFieldWithBlur
          value={editedName}
          onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
            setEditedName(event.target.value);
          }}
          onBlur={() => {
            handleTabEdit(kind.id, editedName);
            setIsEditing(false);
          }}
          size="small"
          autoFocus
          slotProps={{
            htmlInput: { style: { paddingBlock: 0 } },
          }}
        />
      ) : (
        <Typography variant="body2">{kind.name}</Typography>
      )}

      <Box
        sx={{
          display: "flex",
          flexDirection: "row",
          flexShrink: 1,
          position: "absolute",
          right: "10px",
        }}
      >
        {!representsUnknown(kind.id) && (
          <EditIcon
            data-help={HelpItem.EditKind}
            fontSize="small"
            sx={{ p: 0 }}
            onClick={() => setIsEditing(true)}
          />
        )}

        <MinimizeIcon
          data-help={HelpItem.MinimizeKind}
          fontSize="small"
          sx={{ p: 0 }}
          onClick={(event) => handleMinOrDelete(event, kind.id, "minimize")}
        />
        {!representsUnknown(kind.id) && (
          <DeleteIcon
            data-help={HelpItem.DeleteKind}
            fontSize="small"
            sx={{ p: 0 }}
            onClick={(event) => handleMinOrDelete(event, kind.id, "delete")}
          />
        )}
      </Box>
    </Box>
  );
};
