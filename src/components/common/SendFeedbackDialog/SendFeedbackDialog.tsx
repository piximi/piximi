import { useState } from "react";

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  TextField,
  DialogActions,
  Button,
} from "@mui/material";

import { useTranslation } from "hooks/useTranslation";

import { AlertType } from "types/AlertStateType";

import { createGitHubIssue } from "utils/createGitHubIssue";

type SendFeedbackDialogProps = {
  onClose: () => void;
  open: boolean;
};

export const SendFeedbackDialog = ({
  onClose,
  open,
}: SendFeedbackDialogProps) => {
  const t = useTranslation();

  const [issueTitle, setIssueTitle] = useState("");
  const [issueComment, setIssueComment] = useState("");

  const openGitHubIssue = () => {
    createGitHubIssue(issueTitle, issueComment, AlertType.Warning);

    setIssueTitle("");
    setIssueComment("");

    onClose();
  };

  return (
    <Dialog onClose={onClose} open={open}>
      <DialogTitle>{t("Send feedback")}</DialogTitle>

      <DialogContent>
        <DialogContentText
          sx={{
            "& a": { color: "deepskyblue" },
          }}
        >
          {t(
            "Use this form to report issues with Piximi via our GitHub page, or visit"
          )}{" "}
          <a
            href="https://forum.image.sc/tag/piximi"
            target="_blank"
            rel="noreferrer"
          >
            forum.image.sc/tag/piximi
          </a>
          .
        </DialogContentText>

        <TextField
          autoFocus
          margin="dense"
          label="Title"
          id="issue-title"
          onChange={(e) => setIssueTitle(e.target.value)}
          multiline
          rows={1}
          fullWidth
        />

        <TextField
          autoFocus
          margin="dense"
          label="Description"
          id="issue-comment"
          onChange={(e) => setIssueComment(e.target.value)}
          multiline
          rows={10}
          fullWidth
        />
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} color="primary">
          Cancel
        </Button>

        <Button onClick={openGitHubIssue} color="primary">
          Create GitHub issue
        </Button>
      </DialogActions>
    </Dialog>
  );
};
