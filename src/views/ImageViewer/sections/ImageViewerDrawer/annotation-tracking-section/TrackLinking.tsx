import { Stack } from "@mui/material";
import { ButtonContainer } from "views/ImageViewer/components/ButtonContainer";
import { OperationButton } from "views/ImageViewer/components/OperationButton";
import { useTrackOperations } from "views/ImageViewer/state/TrackletContext";

export const TrackControls = () => {
  const {
    handleMerge,
    handleSplit,
    handleUndoMerge,
    handleUndoSplit,
    canOperate,
  } = useTrackOperations();
  return (
    <Stack
      sx={{
        width: "100%",
        mx: "auto",
        alignItems: "flex-start",
        gap: 2,
      }}
    >
      <ButtonContainer>
        <OperationButton
          variant="text"
          onClick={handleSplit}
          disabled={!canOperate}
        >
          Link Children
        </OperationButton>
        <OperationButton
          variant="text"
          onClick={handleUndoSplit}
          sx={{ textWrap: "nowrap" }}
          disabled={!canOperate}
        >
          Unlink Children
        </OperationButton>
      </ButtonContainer>
      <ButtonContainer>
        <OperationButton
          variant="text"
          onClick={handleMerge}
          disabled={!canOperate}
        >
          Link Parents
        </OperationButton>
        <OperationButton
          variant="text"
          onClick={handleUndoMerge}
          sx={{ textWrap: "nowrap" }}
          disabled={!canOperate}
        >
          Unlink Parents
        </OperationButton>
      </ButtonContainer>
    </Stack>
  );
};
