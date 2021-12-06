```src/index.tsx
  ReactDOM.render(
  <Provider store={productionStore}>
    ...
  </Provider>,
  document.getElementById("root")
);
```

```src/store/stores/productionStore.ts
  export const saga = createSagaMiddleware();

  const middleware: Middleware[] = [logger, saga, thunk];

  const options = {
    devTools: true,
    enhancers: enhancers,
    middleware: middleware,
    preloadedState: preloadedState,
    reducer: reducer,
  };

  export const productionStore: EnhancedStore = configureStore(options);

  saga.run(rootSaga);
```

```src/store/reducer/reducer.ts
  const reducers = {
    classifier: classifierSlice.reducer,
    imageViewer: imageViewerSlice.reducer,
    project: projectSlice.reducer,
    settings: applicationSlice.reducer,
    toolOptions: toolOptionsSlice.reducer,
  };

  export const reducer = combineReducers(reducers);
```

```src/store/slices/classifierSlice.ts
  export const classifierSlice = createSlice({
    name: "classifier",
    initialState: initialState,
    reducers: {
      ...
      fit(
        state,
        action: PayloadAction<{
          onEpochEnd: any;
        }>
      ) {
        state.fitting = true;
      },
      ...
    }
}
```

```src/store/sagas/rootSaga.ts
  export function* rootSaga() {
    const effects = [
      ...
      fork(watchFitSaga),
      ...
    ];

    yield all(effects);
  }
```

```src/store/sagas/classifier/watchFitSaga.ts
  export function* watchFitSaga(): any {
    yield takeEvery(classifierSlice.actions.fit.type, fitSaga);
  }
```

```src/store/sagas/classifier/fitSaga.ts
  export function* fitSaga(action: any): any {
    ...
    const { fitted, status } = yield fit(compiled, data, options, onEpochEnd);
    yield put(classifierSlice.actions.updateFitted({fitted, status}));
```

```src/store/coroutines/classifier/fit.ts
  export const fit = async (
    compiled: LayersModel,
    data: {
      val: tensorflow.data.Dataset<{
        xs: tensorflow.Tensor;
        ys: tensorflow.Tensor;
      }>;
      train: tensorflow.data.Dataset<{
        xs: tensorflow.Tensor;
        ys: tensorflow.Tensor;
      }>;
    },
    options: FitOptions,
    onEpochEnd: any
  ): Promise<{ fitted: LayersModel; status: History }> => {
    ...
    return { fitted: compiled, status: status };
  }
```

```src/components/ClassifierList/ClassifierList.tsx
  export const ClassifierList = () => {
    return (
      <List dense>
        ...
        <Collapse in={collapsed} timeout="auto" unmountOnExit>
          <List component="div" dense disablePadding>
            ...
            <FitClassifierListItem />
            ...
          </List>
        </Collapse>
      </List>
    );
  }
```

```src/comonents/ClassifierListItem/ClassifierListItem.tsx
  export const FitClassifierListItem = () => {
    const { onClose, onOpen, open } = useDialog();

    const onFitClick = () => {
      onOpen();
    };

    return (
      <>
        <ListItem onClick={() => {}}>
          ...
        <FitClassifierDialog
          openedDialog={open}
          openedDrawer={true}
          closeDialog={onClose}
        />
      </>
    );
  };
```

```src/components/FitClassifierDialog/FitClassifierDialog/FitClassifierDialog.tsx
  export const FitClassifierDialog = (props: FitClassifierDialogProps) => {
    const onFit = async () => {
      ...
      dispatch(
        classifierSlice.actions.fit({
          onEpochEnd: (epoch: number, logs: any) => {
            console.info(logs);
            console.info(epoch + ":" + logs.loss);
          },
        })
      );
    };

    return (
      <Dialog
        disableEscapeKeyDown
        fullScreen
        onClose={closeDialog}
        open={openedDialog}
        TransitionComponent={DialogTransition}
        style={{ zIndex: 1203 }}
      >
        <FitClassifierDialogAppBar
          closeDialog={closeDialog}
          fit={onFit}
          openedDrawer={openedDrawer}
          disableFitting={noCategorizedImagesAlert}
        />
        ...
        <DialogContent>
          ...
        </DialogContent>
      </Dialog>
    );
  };
```

```src/components/FitClassifierDialog/FitClassifierDialogAppBar/FitClassifierDialogAppBar.tsx
  export const FitClassifierDialogAppBar = (props: any) => {
    ...

    return (
      <AppBar className={classes.appBar}>
        <Toolbar>
          ...
          <Tooltip
            title={
              disableFitting
                ? "Plaese label images before fitting a model."
                : "Fit the model"
            }
            placement="bottom"
          >
            <span>
              <IconButton
                className={classes.button}
                onClick={fit}
                href={""}
                disabled={disableFitting}
              >
                <PlayCircleOutline />
              </IconButton>
            </span>
          </Tooltip>
          ...
        </Toolbar>
      </AppBar>
    );
  };
```