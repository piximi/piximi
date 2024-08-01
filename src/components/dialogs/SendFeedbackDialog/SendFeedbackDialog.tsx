import { useState } from "react";

import { DialogContentText, TextField } from "@mui/material";

import { useTranslation } from "hooks";

import { ConfirmationDialog } from "../ConfirmationDialog";
import { createGitHubIssue } from "utils/common/helpers";
import { AlertType } from "utils/common/enums";

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
    <ConfirmationDialog
      isOpen={open}
      onClose={onClose}
      title={t("Send feedback")}
      content={
        <>
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
            value={issueTitle}
            onChange={(e) => setIssueTitle(e.target.value)}
            rows={1}
            fullWidth
            size="small"
          />
          <TextField
            margin="dense"
            label="Description"
            id="issue-comment"
            value={issueComment}
            onChange={(e) => setIssueComment(e.target.value)}
            multiline
            rows={10}
            fullWidth
            size="small"
          />
        </>
      }
      onConfirm={openGitHubIssue}
      confirmText="Create Github Issue"
      confirmDisabled={issueTitle.length === 0 || issueComment.length === 0}
    />
  );
};
