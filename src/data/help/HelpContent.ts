export enum HelpItem {
  Documentation = "documentation",
  // Project Viewer -- Top-bar
  ExperimentName = "experiment-name",
  Categorize = "categorize",
  GridZoom = "grid-zoom",
  DeleteObject = "delete-object",
  NavigateImageViewer = "navigate-to-imageviewer",
  NavigateMeasurements = "navigate-to-measurements",
  // Project Viewer -- Drawer
  StartNewProject = "start-new-project",
  OpenProject = "open-project",
  OpenExampleProject = "open-example-project",
  OpenImage = "open-image",
  OpenMenu = "open-menu",
  SaveProject = "save-project",
  LearningTask = "learning-task",
  SaveClassificationModel = "save-classification-model",
  LoadClassificationModel = "load-classification-model",
  ClassificationModelSelect = "classification-model-select",
  DeleteModel = "delete-model",
  FitModelDialog = "fit-model",
  PredictModel = "predict-model",
  EvaluateModel = "evaluate-model",
  OptimizationAlgorithm = "optimization-algorithm",
  CreateCategory = "create-category",
  DeleteAllCategories = "delete-all-categories",
  Settings = "settings",
  SendFeedback = "send-feedback",
  // Project Viewer -- Classification Dialog
  InputShape = "input-shape",
  LearningRate = "learning-rate",
  LossFunction = "loss-function",
  BatchSize = "batch-size",
  Epochs = "epochs",
  CropOptions = "crop-options",
  PixelIntensityRescale = "pixel-intensity-rescale",
  TrainPercentage = "train-percentage",
  DataShuffling = "data-shuffling",
  ModelArchitecture = "model-architecture",
  // Project Viewer -- Right-Bar
  FilterImageGrid = "filter-image-grid",
  GridItemInfo = "grid-item-info",
  // Project Viewer -- Main
  AddKindTab = "add-kind-tab",
  KindTabs = "kind-tabs",
  EditKind = "edit-kind",
  DeleteKind = "delete-kind",
  CreateKind = "create-kind",
  // Image Viewer -- Left Drawer
  NavigateProjectView = "navigate-to-projectviewer",
  ExportAnnotation = "export-annotations",
  ImageViewerKindSection = "image-viewer-kind-section",
  CategorySelection = "category-selection",
  FeatureFilters = "feature-filters",
  AnnotationFilterSection = "annotation-filter-section",
  ChannelAdjustment = "channel-adjustment",
  // Image Viewer -- Top Bar
  ZoomAndPosition = "zoom-and-position",
  ImageTools = "image-tools",
  // Image Viewer -- Right Bar
  ObjectManipulationTools = "object-manipulation-tools",
  RectangleTool = "rectangle-tool",
  EllipseTool = "ellipse-tool",
  PolygonTool = "polygon-tool",
  PenTool = "pen-tool",
  LassoTool = "lasso-tool",
  MagneticTool = "magnetic-tool",
  ColorTool = "color-tool",
  QuickAnnotationTool = "quick-annotation-tool",
  ThresholdTool = "threshold-tool",
  // Measurement Viewer -- Left Drawer
  NewMeasurementTable = "new-measurement-table",
  MeasurementSplits = "measurement-splits",
  MeasurementsTree = "measurement-options",
  IntensityMeasurements = "intensity-measurements",
  ObjectMeasurements = "object-measurements",
  // Measurement Viewer -- Measurement Group
  MeasurementGroupTabs = "measurement-group-tabs",
  MeasurementGroupView = "measurement-group-view",
  MeasurementDataTable = "measurements-data-table",
  MeasurementPlotType = "measurement-plot-type",
  MeasurementPlotColorMap = "measurement-plot-color-map",
  MeasurementPlotXAxis = "measurement-plot-x-axis",
  MeasurementPlotYAxis = "measurement-plot-y-axis",
  MeasurementPlotSize = "measurement-plot-mark-size",
  MeasurementPlotColor = "measurement-plot-mark-color",
  // ~~ New Helpers ~~
  // Project Viewer -- Top Bar

  // Project Viewer -- Main
  GridView = "grid-view",
  MinimizeKind = "minimize-kind",
}

export const helpContent: Record<HelpItem, string> = {
  [HelpItem.StartNewProject]: `
Begin a new project in PIXIMI.
`,
  [HelpItem.OpenExampleProject]: `
Take a look at a example project by clicking "Open example project" in the "Open" menu and selecting a project image of choice!\n
This gives you an example of a collection of labeled images.
`,
  [HelpItem.Documentation]: `
Open the Piximi Documentation in a new tab
`,
  [HelpItem.ExperimentName]: `Change the experiment name`,
  [HelpItem.Categorize]: `
To label an image (i.e. assign a category to an image) simply select the image, click "Categorize" in the selection bar and choose the correct category.\n
If the desired category does not exist, click "Create category" to make a new category.`,
  [HelpItem.GridZoom]: `
Adjust the size of the displayed imaages`,
  [HelpItem.OpenProject]: `
To open a saved project click 'Open project' in the Open menu on the left toolbar.
Select a .zip or .zarr file that was downloaded when saving an earlier project.
`,
  [HelpItem.SaveProject]: `
Save all images and assigned categories by clicking on "Save project file" in the Save menu on the left toolbar.
This will download a .json file that encodes the image data.
`,
  [HelpItem.CreateCategory]: `
Create a new category belonging to the active *Kind* by clicking on the "Create Category" button.
`,
  [HelpItem.DeleteObject]: `
Images can be deleted from the workspace at any time by selecting them and clicking "delete" on the top right.\n
Selected images can also be deleted by using the "delete" hotkey.`,
  [HelpItem.OpenImage]: `
In the left menu, select "Open image" to upload images from your local machine.
Select one or multiple image files to open.

Alternatively, drag and drop the desired image files directly onto the gallery.`,
  [HelpItem.OpenMenu]: `
From the **Open** Menu you can open=

* Previously saved projects ('*.zip' or '*.zarr')
* One of our Example Projects
* Individual images
`,
  [HelpItem.GridView]: `Switch between image viewing and annotation viewing`,
  [HelpItem.MinimizeKind]: `Hide the Kind tab from view. Replace from the "Add" menu`,
  [HelpItem.KindTabs]: `
Click on the tabs to view the different **Kinds** of objects in your project.\n
**Tab Functions**
* Edit: Change the display name of the **Kind**.
* Minimize: Hide this **Kind**. (Re-open from *Add Kind* button)
* Delete: Delete the **Kind (excluding Image)** from the project. (***Associated images, objects, and categpries will also be deleted***)`,
  [HelpItem.AddKindTab]: `
Create a new **Kind** or re-open one that was previously minimized.`,
  [HelpItem.EditKind]: `
Edit the display name of the *Kind*`,
  [HelpItem.DeleteKind]: `
Delete this *Kind*, associated objects and categories will also be deleted`,
  [HelpItem.CreateKind]: `
Create a new *Kind*`,
  [HelpItem.LearningTask]: `
Select the type of DL task you would like to perform.\n
**Classification**:  Categorize the images belonging to the active *Kind*\n
**Segmentation**: Find the objects within the images selected.
`,
  [HelpItem.SaveClassificationModel]: `
Save the configuration and weight of the current classification model.
This will output two files=

**'model-name'.json**: Contains the model information.

**'model-name'.weights.bin**: Contains the model weights.
`,
  [HelpItem.LoadClassificationModel]: `
Upload a previusoly trained classification model from the ***.json** and ***.weights.bin** files.`,
  [HelpItem.ClassificationModelSelect]: `
Choose which previously fitted model to use, or select **New Model** to start training from scratch.`,
  [HelpItem.DeleteModel]: `
Permanently delete the currently selected model.`,
  [HelpItem.FitModelDialog]: `
Open the dialog to configure and fit (train) the classification model on your labeled data.`,
  [HelpItem.PredictModel]: `
Run the trained model on the unlabeled images in the active *Kind* to predict their categories.`,
  [HelpItem.EvaluateModel]: `
View evaluation metrics for the model's most recent training run.`,
  [HelpItem.BatchSize]: `
Batch size defines how many images the model will look at before updating its internal parameters.\n
A batch size of 1 would mean that the model will:
* Look at one image
* Update its internal parameters on what links an image to a class
* Repeat this with the next image until all images have been analyzed.
`,
  [HelpItem.LearningRate]: `
The learning rate is a value that determines by how much the model updates its internal parameters in response to the loss function.`,
  [HelpItem.LossFunction]: `
The loss function calculates how well a model has performed by comparing the prediction made by the model and what was expected.\n
In essence, a well performing model will output a lower number for the loss function, whereas a poor model will output a higher number.\n
The loss function therefore tells us how well our model is performing at making predictions for a particular set of model parameters. \n
The optimization algorithms work to reduce the loss function and in turn lead to a better performing model.
`,
  [HelpItem.Epochs]: `
An epoch is a measure of how many times the entire training subset is studied by the deep learning model.\n
However, increasing the number of epochs does not necessarily lead to better results and can instead result in overfitting.`,
  [HelpItem.OptimizationAlgorithm]: `
Optimization algorithms are what update the internal parameters of the model automatically in response to its own performance.\n
These algorithms will compare a prediction made by the model to the expected output and adjust model parameters to bring the predictions closer to the expected output.
`,
  [HelpItem.DeleteAllCategories]: `
Delete all categories belinging to the active *Kind*.\n
*Associated objects well be recategorized as 'Unknown'*`,
  [HelpItem.Settings]: `
Open the application settings.`,
  [HelpItem.SendFeedback]: `
Report issues or send feedback about Piximi to the Github Repository`,
  [HelpItem.FilterImageGrid]: `
Filter the images in the image grid by 'Category' or Training 'Partition'.`,
  [HelpItem.GridItemInfo]: `
View details of selected items in the Image Grid`,
  [HelpItem.NavigateImageViewer]: `
Navigate to the Image Viewer to inspect and work with the selected images and objects.`,
  [HelpItem.NavigateMeasurements]: `
Navigate to the Measurements view to perform measurements on the project data and visualize results.`,
  [HelpItem.InputShape]: `
Input shape describes the shape of the images that the model consumes for training and inference.\n
* The images in you project will be cropped, scaled, or padded to obtain the shape.
* **Once a model is trained with a specific shape, images used for futer training and inference will need to conform to this shape as well**.`,
  [HelpItem.CropOptions]: `
Cropping effectively creates multiple training samples from a single image.\n
This can be particularly useful when the original dataset is limited.\n\n
A **CropSchema** of **Match** will add padding to the crops to maintain a uniform size.`,
  [HelpItem.PixelIntensityRescale]: `
Neural networks often use small weight values, and large pixel values (which can range from 0 to 255 in 8-bit images) can disrupt or slow down the learning process.\n
Normalizing pixel values to a smaller range, like 0-1, helps the network learn more stably and efficiently.`,
  [HelpItem.TrainPercentage]: `
Whaen training  classifier, the data is split into training and validation sets.\n
The model forms a means of predicting a category, checks the prediction on the validation set, then makes adjustments to its predictions.
`,
  [HelpItem.DataShuffling]: `
Shuffling the data can help reduce bias during training and improve model accuracy.\n
This is expecially true when cropping the images prior to training.
`,
  [HelpItem.ModelArchitecture]: `
Model architecture refers to the algorithm will our model use to compute its answers.`,
  [HelpItem.ExportAnnotation]: `
Save annotations locally. Choose from a list of formats.`,
  [HelpItem.NavigateProjectView]: `
Navigate back to the Project Viewer.`,
  [HelpItem.ImageViewerKindSection]: `
Contains the categories which belong the the specified **Kind**.\n

Item Functions
* menu > Edit: Update the display name of the **Kind**.
* menu > Delete: Delete the **Kind** along with associated categories and objects.
* menu > Clear Objects: Delete all the objects belonging to this kind.
* Eyeball: Toggle displaying objects of this kind.`,
  [HelpItem.CategorySelection]: `
Browse the categories in the active image, grouped by **Kind**.\n
* Click a category to make it the active category for new annotations.\n
* Use the checkboxes to select or deselect a **Kind** or an individual category.\n
* menu > Edit: Rename the **Kind** or category.\n
* menu > Add category: Add a new category to the **Kind**.\n
* menu > Delete: Delete the **Kind** or category.`,
  [HelpItem.FeatureFilters]: `
Toggle an object feature (e.g. area, intensity) on to include it in the filter criteria below, then drag its slider to set the range.`,
  [HelpItem.AnnotationFilterSection]: `
Build a single, non-destructive filter from the categories, **Kinds**, and object features selected above.\n
**Keep / Hide**: Choose whether matching objects are kept or hidden.\n
**Create Filter / Update Filter**: Apply the current selection, merging it into the existing filter if one already exists.`,
  [HelpItem.ChannelAdjustment]: `
Adjust the brightness and contrast, toggle on/off, or update the color of each individual channel.`,
  [HelpItem.ZoomAndPosition]: `
This set of tools alow you to manipulate the stage zoom and position.\n
**Zoom Center**: Toggles whether zooming is centered on the cursor or center of the image when zoom on scroll or double-click.\n
**Actual Size**: Resized the image to its defualt size.\n
**Fit Screen**: Resizes the image such that its largest dimension matches the window dimension.\n
**Reset Position**: Resets the position to the origin and the zoom scale to 1.`,
  [HelpItem.ImageTools]: `
This set of tools allows you to manipulate the image.\n
**Channel Adjustment**: Adjust the brightness and contrast, toggle on/off, or update the color of the individual channels.\n
**Z-Stack**: Use the slider to view the different slices of the image. `,
  [HelpItem.ObjectManipulationTools]: `
This set of tools are used to manipulate selected or newly-created objects.\n
**New**: Simply creates a new object.\n
**Combine**: Merges two or more objects into a single one.\n
**Subtract**: Selecting an object along with this option will subtract the shape of a newly-created object from the selected object. New objects not created.\n
**Intersection**: Creates an object from the intersection of two selected objects.`,
  [HelpItem.RectangleTool]: `
Click and drag, or click the two opposing corners, to create a rectangular object.`,
  [HelpItem.EllipseTool]: `
Click and drag, or click twice, to create an elliptical object.`,
  [HelpItem.PolygonTool]: `
Click to place each corner of a polygon. Click the first anchor again to close the polygon.`,
  [HelpItem.PenTool]: `
Free-draw an object by dragging. Open the tool's slider to adjust the brush size.`,
  [HelpItem.LassoTool]: `
Draw a freehand outline to create an object from it.`,
  [HelpItem.MagneticTool]: `
Follows the border of objects as you trace over them, to quickly annotate along an edge.`,
  [HelpItem.ColorTool]: `
Click the center of the object you want to create, then drag to adjust how far the fill extends.`,
  [HelpItem.QuickAnnotationTool]: `
Hover over a region of the image and the tool predicts an object there. Use the tool's slider to adjust the prediction size.`,
  [HelpItem.ThresholdTool]: `
Select a region to threshold. Use the tool's slider to adjust the threshold sensitivity.`,
  [HelpItem.NewMeasurementTable]: `
Create a new measurements table based off of the **Kinds** existong in the project`,
  [HelpItem.MeasurementSplits]: `
Define splits which you would like to make measurements on by dragging the availible dimention to the column grouping panel:\n
**Category**: Measurement statistics over each category.\n
**Partition**: Measurement statistics over each partition.\n
**Image**: Object measurement statistics over each image.`,
  [HelpItem.MeasurementsTree]: `
Select the measurements you would like to perform on the data:\n
**Intensity**: Contains several intensity related measurements to be calculated on each image.\n
**Object**:(**Not available for whole images**) Contains several object based measurements.`,
  [HelpItem.IntensityMeasurements]: `
Intensity related measurements.
`,
  [HelpItem.ObjectMeasurements]: `
Object related measurements.
`,
  [HelpItem.MeasurementGroupTabs]: `
Switch between the different measurement tables (**Groups**) you've created.\n
Edit: Rename a group.\n
Close: Delete a group.`,
  [HelpItem.MeasurementGroupView]: `
Switch between two representation of your measurements:\n
**Table**: Measurement data presented in a tabular format. Includes mean, median, and standard deviation of measurements made on each split for the measurements selected in the left drawer.\n
**Plots**: Measurement data for all objects belonging to the **Kind** presented in graph format. You can select the plot type and axes.`,
  [HelpItem.MeasurementDataTable]: `
Tabular representation of the data with five columns:\n
**Measurement**: The name of the measurement selected from the left drawer.\n
**Split**: The split on which the statistics were calculated.\n
**Mean**: The mean value of the measurement perfomred on the object in this split.\n
**Median**: The median value of the measurement perfomred on the object in this split.\n
**Standard Deviation**: The standard deviation of the measurement perfomred on the object in this split.
`,
  [HelpItem.MeasurementPlotType]: `
Select the type of plot you would like to use.`,
  [HelpItem.MeasurementPlotColorMap]: `Choose from several color themes for mapping.`,
  [HelpItem.MeasurementPlotXAxis]: `Select a measurement to use for the x-axis.`,
  [HelpItem.MeasurementPlotYAxis]: `Select a measurement to use for the y-axis.`,
  [HelpItem.MeasurementPlotSize]: `Select a measurement to use for the size of the mark (**Scatter Only**)`,
  [HelpItem.MeasurementPlotColor]: `Select a split to use for coloring each mark (**Scatter Only**)`,
};
