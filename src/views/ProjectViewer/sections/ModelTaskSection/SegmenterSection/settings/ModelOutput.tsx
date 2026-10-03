import { useMemo, useState } from "react";

import { useDispatch, useSelector } from "react-redux";

import { Box, Link, Tooltip, Typography } from "@mui/material";
import {
  Edit as EditIcon,
  InfoOutlined as InfoIcon,
} from "@mui/icons-material";

import { OUTPUT_MODE } from "core/dl/segmentation/models/consts";

import { TextFieldWithBlur } from "components/inputs";

import { selectSegmenterKindName } from "store/segmenter/selectors";
import { segmenterSlice } from "store/segmenter";

import { useSegmenter } from "views/ProjectViewer/hooks";

export const ModelOutput = () => {
  const dispatch = useDispatch();
  const { loadedModel } = useSegmenter();
  const kindName = useSelector(selectSegmenterKindName);

  const usesClasses = useMemo(
    () => loadedModel?.outputPolicy.mode === OUTPUT_MODE.CLASSES,
    [loadedModel],
  );

  const initName = useMemo(() => {
    if (!loadedModel) return "N/A";
    if (kindName) return kindName;
    const outputPolicy = loadedModel.outputPolicy;
    if (outputPolicy.mode === OUTPUT_MODE.SINGLE)
      return outputPolicy.defaultKindName;
    return outputPolicy.kindNames.slice(0, 3).join(", ") + "...";
  }, [loadedModel, kindName]);

  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(initName);
  const handleChangeOutputName = (newDisplayName: string) => {
    dispatch(segmenterSlice.actions.kindNameSet(newDisplayName));
  };
  return (
    <Box sx={{ py: 1.75 }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Box sx={{ display: "flex", flex: 1, alignItems: "center" }}>
          <Typography variant="caption" sx={{ mr: 1 }}>
            Output kind name:
          </Typography>
          {isEditing && !Array.isArray(editedName) ? (
            <TextFieldWithBlur
              value={editedName}
              onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                setEditedName(event.target.value);
              }}
              onBlur={() => {
                handleChangeOutputName(editedName);
                setIsEditing(false);
              }}
              size="small"
              sx={{
                width: "100%",
                maxWidth: 120,
                "& .MuiInputBase-input": { font: "var(--mui-font-caption)" },
              }}
              autoFocus
              slotProps={{
                htmlInput: { style: { paddingBlock: 0 } },
              }}
            />
          ) : (
            <Typography variant="caption">{initName}</Typography>
          )}
        </Box>
        {usesClasses ? (
          <Tooltip
            title={
              <Typography variant="caption">
                {"Not Editable -- "}
                <Link
                  href="https://github.com/tensorflow/tfjs-models/blob/e80d693bb43cb0ef234b808021c4def434ea816a/coco-ssd/src/classes.ts"
                  target="_blank"
                >
                  See object classes here
                </Link>
              </Typography>
            }
          >
            <InfoIcon
              sx={{
                fontSize: "1rem",
                p: 0,
              }}
            />
          </Tooltip>
        ) : (
          <EditIcon
            color="primary"
            sx={{
              fontSize: "0.875rem",
              p: 0,
              "&:hover": {
                color: "var(--mui-palette-primary-main)",
                cursor: "pointer",
              },
            }}
            onClick={() => setIsEditing(true)}
          />
        )}
      </Box>
    </Box>
  );
};
