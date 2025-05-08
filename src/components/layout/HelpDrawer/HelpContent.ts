export enum HelpContext {
  WelcomeView = "welcome-view",
  ProjectView = "project-view",
}
export enum HelpItem {
  Documentation = "documentation",
  // Project Viewer -- Top-bar
  ProjectName = "project-name",
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
  // Image Viewer -- Top Bar
  ZoomAndPosition = "zoom-and-position",
  ImageTools = "image-tools",
  SelectionTools = "selection-tools",
  // Image Viewer -- Right Bar
  ObjectManipulationTools = "object-manipulation-tools",
  ObjectCreationTools = "object-creation-tools",
  // Measurement Viewer -- Left Drawer
  NewMeasurementTable = "new-measurement-table",
  MeasurementSplits = "measurement-splits",
  MeasurementsTree = "measurement-options",
  IntensityMeasurements = "intensity-measurements",
  ObjectMeasurements = "object-measurements",
  // Measurement Viewer -- Measurement Group
  MeasurementGroupTabs = "measurement-group-tabs",
  MeasurementDataTable = "measurements-data-table",
  MeasurementPlotType = "measurement-plot-type",
  MeasurementPlotColorMap = "measurement-plot-color-map",
  MeasurementPlotXAxis = "measurement-plot-x-axis",
  MeasurementPlotYAxis = "measurement-plot-y-axis",
  MeasurementPlotSize = "measurement-plot-mark-size",
  MeasurementPlotColor = "measurement-plot-mark-color",
}
export type HelpItemContent = { desc: string; brief: string };

const AddKindTab = `
Create a new **Kind** or re-open one that was previously minimized.`;

const BatchSize = `
Batch size defines how many images the model will look at before updating its internal parameters.\n
A batch size of 1 would mean that the model will:
* Look at one image
* Update its internal parameters on what links an image to a class
* Repeat this with the next image until all images have been analyzed.
`;

const Categorize = `
To label an image (i.e. assign a category to an image) simply select the image, click "Categorize" in the selection bar and choose the correct category.\n
If the desired category does not exist, click "Create category" to make a new category.`;

const CreateCategory = `
Create a new category belonging to the active *Kind* by clicking on the "Create Category" button.
`;
const CreateKind = `
Create a new *Kind*`;

const CropOptions = `
Cropping effectively creates multiple training samples from a single image.\n
This can be particularly useful when the original dataset is limited.\n\n
A **CropSchema** of **Match** will add padding to the crops to maintain a uniform size.`;

const DataShuffling = `
Shuffling the data can help reduce bias during training and improve model accuracy.\n
This is expecially true when cropping the images prior to training.
`;

const DeleteAllCategories = `
Delete all categories belinging to the active *Kind*.\n
*Associated objects well be recategorized as 'Unknown'*`;

const DeleteKind = `
Delete this *Kind*, associated objects and categories will also be deleted`;

const DeleteObject = `
Images can be deleted from the workspace at any time by selecting them and clicking "delete" on the top right.\n
Selected images can also be deleted by using the "delete" hotkey.`;

const Documentation = `
Open the Piximi Documentation in a new tab
`;

const EditKind = `
Edit the display name of the *Kind*`;

const Epochs = `
An epoch is a measure of how many times the entire training subset is studied by the deep learning model.\n
However, increasing the number of epochs does not necessarily lead to better results and can instead result in overfitting.`;

const ExportAnnotations = `
Save annotations locally. Choose from a list of formats.`;

const FilterImageGrid = `
Filter the images in the image grid by 'Category' or Training 'Partition'.`;

const GridItemInfo = `
View details of selected items in the Image Grid`;

const GridZoom = `
Adjust the size of the displayed imaages`;

const ImageViewerKindGroup = `
Contains the categories which belong the the specified **Kind**.\n

Item Functions
* menu > Edit: Update the display name of the **Kind**.
* menu > Delete: Delete the **Kind** along with associated categories and objects.
* menu > Clear Objects: Delete all the objects belonging to this kind.
* Eyeball: Toggle displaying objects of this kind.`;

const KindTabs = `
Click on the tabs to view the different **Kinds** of objects in your project.\n
**Tab Functions**
* Edit: Change the display name of the **Kind**.
* Minimize: Hide this **Kind**. (Re-open from *Add Kind* button)
* Delete: Delete the **Kind (excluding Image)** from the project. (***Associated images, objects, and categpries will also be deleted***)`;

const InputShape = `
Input shape describes the shape of the images that the model consumes for training and inference.\n
* The images in you project will be cropped, scaled, or padded to obtain the shape.
* **Once a model is trained with a specific shape, images used for futer training and inference will need to conform to this shape as well**.`;

const LearningRate = `
The learning rate is a value that determines by how much the model updates its internal parameters in response to the loss function.`;

const LearningTask = `
Select the type of DL task you would like to perform.\n
**Classification**:  Categorize the images belonging to the active *Kind*\n
**Segmentation**: Find the objects within the images selected.
`;

const LoadClassificationModel = `
Upload a previusoly trained classification model from the ***.json** and ***.weights.bin** files.`;

const LossFunction = `
The loss function calculates how well a model has performed by comparing the prediction made by the model and what was expected.\n
In essence, a well performing model will output a lower number for the loss function, whereas a poor model will output a higher number.\n
The loss function therefore tells us how well our model is performing at making predictions for a particular set of model parameters. \n
The optimization algorithms work to reduce the loss function and in turn lead to a better performing model.
`;

const ModelArchitecture = `
Model architecture refers to the algorithm will our model use to compute its answers.`;

const NavigateImageViewer = `
Navigate to the Image Viewer to inspect and work with the selected images and objects.`;

const NavigateMeasurements = `
Navigate to the Measurements view to perform measurements on the project data and visualize results.`;

const NavigateProjectView = `
Navigate back to the Project Viewer.`;

const OpenExampleProject = `
Take a look at a example project by clicking "Open example project" in the "Open" menu and selecting a project image of choice!\n 
This gives you an example of a collection of labeled images.
`;

const OpenImage = `
In the left menu, select "Open image" to upload images from your local machine. 
Select one or multiple image files to open.
        
Alternatively, drag and drop the desired image files directly onto the gallery.`;

const OpenMenu = `
From the **Open** Menu you can open=

* Previously saved projects ('*.zip' or '*.zarr')
* One of our Example Projects
* Individual images
`;

const OpenProject = `
To open a saved project click 'Open project' in the Open menu on the left toolbar.
Select a .zip or .zarr file that was downloaded when saving an earlier project.
`;

const OptimizationAlgorithm = `
Optimization algorithms are what update the internal parameters of the model automatically in response to its own performance.\n
These algorithms will compare a prediction made by the model to the expected output and adjust model parameters to bring the predictions closer to the expected output.
`;

const PixelIntensityRescale = `
Neural networks often use small weight values, and large pixel values (which can range from 0 to 255 in 8-bit images) can disrupt or slow down the learning process.\n
Normalizing pixel values to a smaller range, like 0-1, helps the network learn more stably and efficiently.`;
const ProjectName = `
Change the project name
`;

const SaveClassificationModel = `
Save the configuration and weight of the current classification model.
This will output two files=

**'model-name'.json**: Contains the model information.

**'model-name'.weights.bin**: Contains the model weights.
`;

const SaveProject = `
Save all images and assigned categories by clicking on "Save project file" in the Save menu on the left toolbar.
This will download a .json file that encodes the image data.
`;

const SendFeedback = `
Report issues or send feedback about Piximi to the Github Repository`;

const Settings = `
Open the application settings.`;

const StartNewProject = `
Begin a new project in PIXIMI.
`;

const TrainPercentage = `
Whaen training  classifier, the data is split into training and validation sets.\n
The model forms a means of predicting a category, checks the prediction on the validation set, then makes adjustments to its predictions.
`;

const ZoomAndPosition = `
This set of tools alow you to manipulate the stage zoom and position.\n
**Zoom Center**: Toggles whether zooming is centered on the cursor or center of the image when zoom on scroll or double-click.\n
**Zoom to Region**: Click and drag the cursor to select a region to zoom in to.\n
**Actual Size**: Resized the image to its defualt size.\n
**Fit Screen**: Resizes the image such that its largest dimension matches the window dimension.\n
**Reset Position**: Resets the position to the origin and the zoom scale to 1.`;

const ImageTools = `
This set of tools allows you to manipulate the image.\n
**Channel Adjustment**: Adjust the brightness and contrast, toggle on/off, or update the color of the individual channels.\n
**Z-Stack**: Use the slider to view the different slices of the image. `;

const SelectionTools = `
This set of tools allows you to make selections on the objects.\n
**By Category**: Select a subset of objects based on their category.\n
**Select All**: Select all of the objects.\n
**Deselect All**: Deselect all of the objects.\n
**Selection Tool**: Click on individual objects to select. Hold down shift when selecting to select multiple. Click and drag cursor to select by region.`;

const ObjectManipulationTools = `
This set of tools are used to manipulate selected or newly-created objects.\n
**New**: Simply creates a new object.\n
**Combine**: Merges two or more objects into a single one.\n
**Subtract**: Selecting an object along with this option will subtract the shape of a newly-created object from the selected object. New objects not created.\n
**Intersection**: Creates an object from the intersection of two selected objects.\n
**Invert**: Inverts the currently selected object.`;

const ObjectCreationTools = `
This set of tools is used for creating new objects.\n
**Rectangular Tool**: Click and drag, or click where the location of two opposing corners of the object to create a rectangular object.\n
**Ellipse Tool**: Click and drag or click twice to create an elliptical object.\n
**Polygon Tool**: Click where you want each corner of a polygon to be. Click the first anchor to complene the polygon object.\n
**Pen Tool**: Use the Pen tool to free-draw objects. Open the slider attached to the tool to adjust the size of the tool.\n
**Lasso Tool**: Create an object from an outline created with this tool.\n
**Magnetic Tool**: The tool attempts to follow the border of objects to quickly annotate objects.\n
**Fill Tool**: Click on the center of an object you would like to create, then drag to adjust the threshold and create an annotation.\n
**Quick Annotation Tool**: Hover over regions of the image while the tool predicts objects. Use the slider attached to this tool to adjust sizing.\n
**Threshold Tool**: Select a region to threshold. Use the slider attached to the tool to adjust the threshold sensitivity.`;

const NewMeasurementTable = `
Create a new measurements table based off of the **Kinds** existong in the project`;

const MeasurementSplits = `
Define splits which you would like to make measurements on:\n
**Category**: Measurement statistics over each category.\n
**Partition**: Measurement statistics over each partition`;

const MeasurementsTree = `
Select the measurements you would like to perform on the data:\n
**Intensity**: Contains several intensity related measurements to be calculated on each image.\n
**Object**:(**Not available for whole images**) Contains several object based measurements.`;

const IntensityMeasurements = `
Intensity related measurements.
`;

const ObjectMeasurements = `
Object related measurements.
`;

const MeasurementGroupTabs = `
Switch between two representation of your measurements:\n
**Data Grid**: Measurement data presented in a tabular format. Includes mean, median, and standard deviation of measurements made on each split for the measurements selected in the left drawer.\n
**Plots**: Measurement data for all objects belonging to the **Kind** presented in graph format. You can select the plot type and axes.`;

const MeasurementDataTable = `
Tabular representation of the data with five columns:\n
**Measurement**: The name of the measurement selected from the left drawer.\n
**Split**: The split on which the statistics were calculated.\n
**Mean**: The mean value of the measurement perfomred on the object in this split.\n
**Median**: The median value of the measurement perfomred on the object in this split.\n
**Standard Deviation**: The standard deviation of the measurement perfomred on the object in this split.
`;

const MeasurementPlotType = `
Select the type of plot you would like to use.`;

const MeasurementPlotColorMap = `Choose from several color themes for mapping.`;

const MeasurementPlotXAxis = `Select a measurement to use for the x-axis.`;

const MeasurementPlotYAxis = `Select a measurement to use for the y-axis.`;

const MeasurementPlotSize = `Select a measurement to use for the size of the mark (**Scatter Only**)`;
const MeasurementPlotColor = `Select a split to use for coloring each mark (**Scatter Only**)`;

export const helpContent: {
  contexts: Record<HelpContext, { items: Array<HelpItem> }>;
  "help-items": Record<HelpItem, HelpItemContent>;
} = {
  contexts: {
    [HelpContext.WelcomeView]: {
      items: [
        HelpItem.StartNewProject,
        HelpItem.OpenExampleProject,
        HelpItem.Documentation,
      ],
    },
    [HelpContext.ProjectView]: {
      items: [HelpItem.ProjectName],
    },
  },
  "help-items": {
    [HelpItem.StartNewProject]: {
      desc: StartNewProject,
      brief: StartNewProject,
    },
    [HelpItem.OpenExampleProject]: {
      desc: OpenExampleProject,
      brief: OpenExampleProject,
    },
    [HelpItem.Documentation]: {
      desc: Documentation,
      brief: Documentation,
    },
    [HelpItem.ProjectName]: {
      desc: ProjectName,
      brief: ProjectName,
    },
    [HelpItem.Categorize]: {
      desc: Categorize,
      brief: Categorize,
    },
    [HelpItem.GridZoom]: {
      desc: GridZoom,
      brief: GridZoom,
    },
    [HelpItem.OpenProject]: {
      desc: OpenProject,

      brief: OpenProject,
    },
    [HelpItem.SaveProject]: {
      desc: SaveProject,

      brief: SaveProject,
    },
    [HelpItem.CreateCategory]: {
      desc: CreateCategory,
      brief: CreateCategory,
    },
    [HelpItem.DeleteObject]: {
      desc: DeleteObject,
      brief: DeleteObject,
    },
    [HelpItem.OpenImage]: {
      desc: OpenImage,
      brief: OpenImage,
    },
    [HelpItem.OpenMenu]: {
      desc: OpenMenu,
      brief: OpenMenu,
    },
    [HelpItem.KindTabs]: {
      desc: KindTabs,
      brief: KindTabs,
    },
    [HelpItem.AddKindTab]: {
      desc: AddKindTab,
      brief: AddKindTab,
    },
    [HelpItem.EditKind]: {
      desc: EditKind,
      brief: EditKind,
    },
    [HelpItem.DeleteKind]: {
      desc: DeleteKind,
      brief: DeleteKind,
    },
    [HelpItem.CreateKind]: {
      desc: CreateKind,
      brief: CreateKind,
    },
    [HelpItem.LearningTask]: {
      desc: LearningTask,
      brief: LearningTask,
    },
    [HelpItem.SaveClassificationModel]: {
      desc: SaveClassificationModel,
      brief: SaveClassificationModel,
    },
    [HelpItem.LoadClassificationModel]: {
      desc: LoadClassificationModel,
      brief: LoadClassificationModel,
    },
    [HelpItem.BatchSize]: {
      desc: BatchSize,
      brief: BatchSize,
    },
    [HelpItem.LearningRate]: {
      desc: LearningRate,
      brief: LearningRate,
    },
    [HelpItem.LossFunction]: {
      desc: LossFunction,
      brief: LossFunction,
    },
    [HelpItem.Epochs]: {
      desc: Epochs,
      brief: Epochs,
    },
    [HelpItem.OptimizationAlgorithm]: {
      desc: OptimizationAlgorithm,
      brief: OptimizationAlgorithm,
    },
    [HelpItem.DeleteAllCategories]: {
      desc: DeleteAllCategories,
      brief: DeleteAllCategories,
    },
    [HelpItem.Settings]: {
      desc: Settings,
      brief: Settings,
    },
    [HelpItem.SendFeedback]: {
      desc: SendFeedback,
      brief: SendFeedback,
    },
    [HelpItem.FilterImageGrid]: {
      desc: FilterImageGrid,
      brief: FilterImageGrid,
    },
    [HelpItem.GridItemInfo]: {
      desc: GridItemInfo,
      brief: GridItemInfo,
    },
    [HelpItem.NavigateImageViewer]: {
      desc: NavigateImageViewer,
      brief: NavigateImageViewer,
    },
    [HelpItem.NavigateMeasurements]: {
      desc: NavigateMeasurements,
      brief: NavigateMeasurements,
    },
    [HelpItem.InputShape]: {
      desc: InputShape,
      brief: InputShape,
    },
    [HelpItem.CropOptions]: {
      desc: CropOptions,
      brief: CropOptions,
    },
    [HelpItem.PixelIntensityRescale]: {
      desc: PixelIntensityRescale,
      brief: PixelIntensityRescale,
    },
    [HelpItem.TrainPercentage]: {
      desc: TrainPercentage,
      brief: TrainPercentage,
    },
    [HelpItem.DataShuffling]: {
      desc: DataShuffling,
      brief: DataShuffling,
    },
    [HelpItem.ModelArchitecture]: {
      desc: ModelArchitecture,
      brief: ModelArchitecture,
    },
    [HelpItem.ExportAnnotation]: {
      desc: ExportAnnotations,
      brief: ExportAnnotations,
    },
    [HelpItem.NavigateProjectView]: {
      desc: NavigateProjectView,
      brief: NavigateProjectView,
    },
    [HelpItem.ImageViewerKindSection]: {
      desc: ImageViewerKindGroup,
      brief: ImageViewerKindGroup,
    },
    [HelpItem.ZoomAndPosition]: {
      desc: ZoomAndPosition,
      brief: ZoomAndPosition,
    },
    [HelpItem.ImageTools]: {
      desc: ImageTools,
      brief: ImageTools,
    },
    [HelpItem.SelectionTools]: {
      desc: SelectionTools,
      brief: SelectionTools,
    },
    [HelpItem.ObjectManipulationTools]: {
      desc: ObjectManipulationTools,
      brief: ObjectManipulationTools,
    },
    [HelpItem.ObjectCreationTools]: {
      desc: ObjectCreationTools,
      brief: ObjectCreationTools,
    },
    [HelpItem.NewMeasurementTable]: {
      desc: NewMeasurementTable,
      brief: NewMeasurementTable,
    },
    [HelpItem.MeasurementSplits]: {
      desc: MeasurementSplits,
      brief: MeasurementSplits,
    },
    [HelpItem.MeasurementsTree]: {
      desc: MeasurementsTree,
      brief: MeasurementsTree,
    },
    [HelpItem.IntensityMeasurements]: {
      desc: IntensityMeasurements,
      brief: IntensityMeasurements,
    },
    [HelpItem.ObjectMeasurements]: {
      desc: ObjectMeasurements,
      brief: ObjectMeasurements,
    },
    [HelpItem.MeasurementGroupTabs]: {
      desc: MeasurementGroupTabs,
      brief: MeasurementGroupTabs,
    },
    [HelpItem.MeasurementDataTable]: {
      desc: MeasurementDataTable,
      brief: MeasurementDataTable,
    },
    [HelpItem.MeasurementPlotType]: {
      desc: MeasurementPlotType,
      brief: MeasurementPlotType,
    },
    [HelpItem.MeasurementPlotColorMap]: {
      desc: MeasurementPlotColorMap,
      brief: MeasurementPlotColorMap,
    },
    [HelpItem.MeasurementPlotXAxis]: {
      desc: MeasurementPlotXAxis,
      brief: MeasurementPlotXAxis,
    },
    [HelpItem.MeasurementPlotYAxis]: {
      desc: MeasurementPlotYAxis,
      brief: MeasurementPlotYAxis,
    },
    [HelpItem.MeasurementPlotSize]: {
      desc: MeasurementPlotSize,
      brief: MeasurementPlotSize,
    },
    [HelpItem.MeasurementPlotColor]: {
      desc: MeasurementPlotColor,
      brief: MeasurementPlotColor,
    },
  },
};
