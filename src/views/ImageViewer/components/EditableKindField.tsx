import { ClickAwayListener, Input } from "@mui/material";
import { useState } from "react";

export const EditableKindField = ({
  kindId,
  kindName,
  isEditing,
  onFinishedEditing,
}: {
  kindId: string;
  kindName: string;
  isEditing: boolean;
  onFinishedEditing: (kindId: string, newDisplayName: string) => void;
}) => {
  const [editedKindName, setEditedKindName] = useState<string>(kindName);

  const handleFinishedEditing = () => {
    if (editedKindName.length === 0) {
      setEditedKindName(kindName);
    }
    onFinishedEditing(kindId, editedKindName);
  };
  return (
    <ClickAwayListener
      onClickAway={handleFinishedEditing}
      mouseEvent={isEditing ? "onClick" : false}
      touchEvent={isEditing ? "onTouchStart" : false}
    >
      <Input
        value={editedKindName}
        readOnly={!isEditing}
        onChange={(event) => setEditedKindName(event.target.value)}
        //onEnter={handleFinishedEditing}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            handleFinishedEditing();
          }
        }}
        disableUnderline={!isEditing}
        sx={{ mx: 1 }}
        slotProps={{
          input: {
            style: !isEditing ? { cursor: "pointer" } : {},
          },
        }}
      />
    </ClickAwayListener>
  );
};
