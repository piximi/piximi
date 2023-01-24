import { AlertType } from "types/AlertStateType";

export const createGitHubIssue = (
  title: string,
  body: string,
  alertType: AlertType = AlertType.Error
) => {
  const label = alertType === AlertType.Error ? "bug" : "help%20wanted";
  const url =
    "https://github.com/piximi/piximi/issues/new?title=" +
    encodeURIComponent(title) +
    "&labels=" +
    label +
    "&body=" +
    encodeURIComponent(body);
  window.open(url);
};
