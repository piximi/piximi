export enum AlertType {
  None,
  Error,
  Warning,
  Info,
}

export type AlertStateType = {
  alertType: AlertType;
  name: string;
  description: string;
  component?: string;
  stackTrace?: string;
};
