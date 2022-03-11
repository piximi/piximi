import React from "react";
import { ApplicationToolbar } from "../ApplicationToolbar";
import { AppBar, Box } from "@mui/material";
import { AlertDialog } from "components/AlertDialog/AlertDialog";
import { useSelector } from "react-redux";
import { alertStateSelector } from "store/selectors/alertStateSelector";
import { AlertType } from "types/AlertStateType";

export const ApplicationAppBar = () => {
  const [showAlertDialogs, setShowAlertDialogs] = React.useState(false);

  const alertState = useSelector(alertStateSelector);

  React.useEffect(() => {
    if (alertState.alertType !== AlertType.None) {
      setShowAlertDialogs(true);
    }
  }, [alertState]);

  return (
    <Box>
      <AppBar
        sx={{
          borderBottom: "1px solid rgba(0, 0, 0, 0.12)",
          boxShadow: "none",
        }}
        color="inherit"
        position="fixed"
      >
        <ApplicationToolbar />

        {showAlertDialogs && (
          <AlertDialog
            setShowAlertDialog={setShowAlertDialogs}
            alertState={alertState}
          />
        )}
      </AppBar>
    </Box>
  );
};
