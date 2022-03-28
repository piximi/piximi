export enum AlertType {
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
  visible?: boolean;
};

export const defaultAlert: AlertStateType = {
  alertType: AlertType.Info,
  name: "None",
  description: "default state",
  visible: false,
};
