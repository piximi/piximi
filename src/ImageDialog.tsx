import Dialog from "@material-ui/core/Dialog";
import AppBar from "@material-ui/core/AppBar";
import Toolbar from "@material-ui/core/Toolbar";
import IconButton from "@material-ui/core/IconButton";
import CloseIcon from "@material-ui/icons/Close";
import Drawer from "@material-ui/core/Drawer";
import Divider from "@material-ui/core/Divider";
import state from "./index.json";
import DialogContent from "@material-ui/core/DialogContent";
import Container from "@material-ui/core/Container";
import { Canvas } from "react-three-fiber";
import { Box, PerspectiveCamera } from "@react-three/drei";
import React, { ReactElement } from "react";
import { VolumeUp } from "@material-ui/icons";
import * as THREE from "three";
import { useStyles } from "./index.css";
import Typography from "@material-ui/core/Typography";
import Grid from "@material-ui/core/Grid";
import { Slider } from "@material-ui/core";
import Input from "@material-ui/core/Input";
import { Photo } from "./store";
import { TransitionProps } from "@material-ui/core/transitions";
import { CategoriesList } from "./CategoriesList";

type SliderWithInputFieldProps = {
  icon: ReactElement;
  name: string;
};

const SliderWithInputField = ({ icon, name }: SliderWithInputFieldProps) => {
  const classes = useStyles();

  const [value, setValue] = React.useState<
    number | string | Array<number | string>
  >(30);

  const onBlur = () => {
    if (value < 0) {
      setValue(0);
    } else if (value > 100) {
      setValue(100);
    }
  };

  const onInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setValue(event.target.value === "" ? "" : Number(event.target.value));
  };

  const onSliderChange = (event: any, newValue: number | number[]) => {
    setValue(newValue);
  };

  return (
    <div className={classes.slider}>
      <Typography id="input-slider" gutterBottom>
        {name}
      </Typography>
      <Grid container spacing={2} alignItems="center">
        <Grid item>{icon}</Grid>
        <Grid item xs>
          <Slider
            value={typeof value === "number" ? value : 0}
            onChange={onSliderChange}
            aria-labelledby="input-slider"
          />
        </Grid>
        <Grid item>
          <Input
            className={classes.sliderInput}
            value={value}
            margin="dense"
            onChange={onInputChange}
            onBlur={onBlur}
            inputProps={{
              step: 10,
              min: 0,
              max: 100,
              type: "number",
              "aria-labelledby": "input-slider",
            }}
          />
        </Grid>
      </Grid>
    </div>
  );
};

const ImageMesh = ({ photo }: { photo: Photo }) => {
  const ref = React.useRef();

  const texture = React.useMemo(() => {
    return new THREE.TextureLoader().load(photo.src);
  }, [photo]);

  return (
    <mesh ref={ref}>
      <Box args={[1, 1, 1]}>
        <meshBasicMaterial attach="material" map={texture} />
      </Box>
    </mesh>
  );
};

type ImageDialogProps = {
  categoryMenuState: any;
  onClose: () => void;
  onOpenCreateCategoryDialog: () => void;
  open: boolean;
  photo: Photo;
  TransitionComponent?: React.ComponentType<
    TransitionProps & { children?: React.ReactElement<any, any> }
  >;
};

export const ImageDialog = ({
  categoryMenuState,
  onClose,
  onOpenCreateCategoryDialog,
  open,
  photo,
  TransitionComponent,
}: ImageDialogProps) => {
  const classes = useStyles();

  return (
    <Dialog
      fullScreen
      onClose={onClose}
      open={open}
      TransitionComponent={TransitionComponent}
    >
      <AppBar className={classes.imageDialogAppBar} position="fixed">
        <Toolbar>
          <IconButton edge="start" color="inherit" onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Toolbar>
      </AppBar>
      <Drawer
        anchor="left"
        className={classes.drawer}
        classes={{ paper: classes.drawerPaper }}
        variant="permanent"
      >
        <div className={classes.drawerHeader} />
        <Divider />
        <CategoriesList categories={state.categories} />
      </Drawer>

      <DialogContent className={classes.imageDialogContent}>
        <Container fixed maxWidth="sm">
          <Canvas
            colorManagement={false}
            onCreated={({ gl }) => {
              gl.setClearColor("pink");
            }}
          >
            <PerspectiveCamera makeDefault position={[0, 0, 2]} />

            <React.Suspense fallback={null}>
              <ImageMesh photo={photo} />
            </React.Suspense>
          </Canvas>
        </Container>
      </DialogContent>

      <Drawer
        anchor="right"
        className={classes.drawer}
        classes={{ paper: classes.drawerPaper }}
        variant="permanent"
      >
        <div className={classes.drawerHeader} />
        <Divider />
        <SliderWithInputField icon={<VolumeUp />} name="Brightness" />
      </Drawer>
    </Dialog>
  );
};
