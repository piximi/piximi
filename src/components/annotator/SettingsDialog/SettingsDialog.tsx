import React from "react";
import {
  AppBar,
  Dialog,
  FormControlLabel,
  Select,
  SelectChangeEvent,
  FormHelperText,
  Box,
} from "@mui/material";
import DialogContent from "@mui/material/DialogContent";
import FormControl from "@mui/material/FormControl";
import MenuItem from "@mui/material/MenuItem";
import Typography from "@mui/material/Typography";
import FormGroup from "@mui/material/FormGroup";
import Switch from "@mui/material/Switch";
import Grid from "@mui/material/Grid";
import Divider from "@mui/material/Divider";
import { LanguageType } from "../../../types/LanguageType";
import { useDispatch, useSelector } from "react-redux";
import { imageViewerSlice } from "../../../store/slices";
import { languageSelector } from "../../../store/selectors/languageSelector";
import { soundEnabledSelector } from "../../../store/selectors/soundEnabledSelector";
import Toolbar from "@mui/material/Toolbar";
import CloseIcon from "@mui/icons-material/Close";
import IconButton from "@mui/material/IconButton";
import _ from "lodash";

type SettingsDialogProps = {
  onClose: () => void;
  open: boolean;
};

// TODO: #133 Move (language) settings from Annotator to Classifier view
export const SettingsDialog = ({ onClose, open }: SettingsDialogProps) => {
  const dispatch = useDispatch();

  const language = useSelector(languageSelector);
  const soundEnabled = useSelector(soundEnabledSelector);

  const onLanguageChange = (event: SelectChangeEvent) => {
    dispatch(
      imageViewerSlice.actions.setLanguage({
        language: event.target.value as LanguageType,
      })
    );
  };

  const onSoundEffectsChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    dispatch(
      imageViewerSlice.actions.setSoundEnabled({
        soundEnabled: event.target.checked,
      })
    );
  };

  // @ts-ignore
  // @ts-ignore
  return (
    <Dialog fullScreen onClose={onClose} open={open}>
      <AppBar sx={{ flexGrow: 1 }} color="inherit" position="fixed">
        <Toolbar>
          <Typography sx={{ flexGrow: 1 }} variant="h6">
            Settings
          </Typography>

          <IconButton aria-label="close" onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Toolbar>
      </AppBar>

      <Box sx={(theme) => ({ ...theme.mixins.toolbar })} />

      <DialogContent sx={{ marginTop: (theme) => theme.spacing(2) }}>
        <Grid container spacing={2}>
          <Grid item xs={3} />

          <Grid item xs={6}>
            <Grid container>
              <Grid item xs={12}>
                <Grid container item xs={4}>
                  <FormControl color="primary" fullWidth>
                    <FormHelperText>Language</FormHelperText>
                    <Select
                      onChange={onLanguageChange}
                      value={language}
                      inputProps={{ "aria-label": "Without label" }}
                    >
                      {_.map(LanguageType, (v, k) => {
                        return (
                          <MenuItem dense key={k} value={v}>
                            {v}
                          </MenuItem>
                        );
                      })}
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>

              <Grid item style={{ padding: "32px 0" }} xs={12}>
                <Divider />
              </Grid>

              <Grid item xs={12}>
                <FormControl component="fieldset">
                  <FormGroup aria-label="position" row>
                    <FormControlLabel
                      control={
                        <Switch
                          color="default"
                          checked={soundEnabled}
                          onChange={onSoundEffectsChange}
                          name="soundEnabled"
                        />
                      }
                      label="Sound effects"
                    />
                  </FormGroup>
                </FormControl>
              </Grid>
            </Grid>
          </Grid>
        </Grid>
      </DialogContent>
    </Dialog>
  );
};
