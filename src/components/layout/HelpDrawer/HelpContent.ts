export enum HelpContext {
  WelcomeView = "welcome-view",
  ProjectView = "project-view",
}
export enum HelpItem {
  StartNewProject = "start-new-project",
  OpenProject = "open-project",
  OpenExampleProject = "open-example-project",
  Documentation = "documentation",
  ProjectName = "project-name",
  Categorize = "categorize",
  GridZoom = "grid-zoom",
  SaveProject = "save-project",
  CreateCategory = "create-category",
  DeleteObject = "delete-object",
  OpenImage = "open-image",
  OpenMenu = "open-menu",
  KindTabs = "kind-tabs",
  EditKind = "edit-kind",
  DeleteKind = "delete-kind",
  CreateKind = "create-kind",
  LearningTask = "learning-task",
  SaveClassificationModel = "save-classification-model",
  LoadClassificationModel = "load-classification-model",
  OptimizationAlgorithm = "optimization-algorithm",
  LearningRate = "learning-rate",
  LossFunction = "loss-function",
  BatchSize = "batch-size",
  Epochs = "epochs",
  DeleteAllCategories = "delete-all-categories",
  Settings = "settings",
  SendFeedback = "send-feedback",
  FilterImageGrid = "filter-image-grid",
  GridItemInfo = "grid-item-info",
  NavigateImageViewer = "navigate-to-imageviewer",
  NavigateMeasurements = "navigate-to-measurements",
  CropOptions = "crop-options",
  PixelIntensityRescale = "pixel-intensity-rescale",
  TrainPercentage = "train-percentage",
  DataShuffling = "data-shuffling",
  ModelArchitecture = "model-architecture",
}
export type HelpItemContent = { desc: string; brief: string };

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
      desc: "",
      brief: "Opens Piximi in an empty project",
    },
    [HelpItem.OpenExampleProject]: {
      desc: 'Take a look at a example project by clicking "Open example project" in the "Open" menu and selecting a project image of choice!\n This gives you an example of a collection of labeled images.',
      brief: "Choose from a list of example projects to open",
    },
    [HelpItem.Documentation]: {
      desc: "",
      brief: "Open the Piximi Documentation in a new tab",
    },
    [HelpItem.ProjectName]: {
      desc: "",
      brief: "Change the project name",
    },
    [HelpItem.Categorize]: {
      desc: 'To label an image (i.e. assign a category to an image) simply select the image, click "Categorize" in the selection bar and choose the correct category.\n If the desired category does not exist, click "Create category" to make a new category.',
      brief: "Categorize selected objects",
    },
    [HelpItem.GridZoom]: {
      desc: "",
      brief: "Adjust the size of the displayed imaages",
    },
    [HelpItem.OpenProject]: {
      desc: 'To open a saved project click "Open project" in the Open menu on the left toolbar.\n Select a .json file that was downloaded when saving an earlier project.',
      brief:
        'To open a saved project click "Open project" in the Open menu on the left toolbar.\n Select a .json file that was downloaded when saving an earlier project.',
    },
    [HelpItem.SaveProject]: {
      desc: 'Save all images and assigned categories by clicking on "Save project file" in the Save menu on the left toolbar.\n This will download a .json file that encodes the image data.',
      brief:
        'Save all images and assigned categories by clicking on "Save project file" in the Save menu on the left toolbar.\n This will download a .json file that encodes the image data.',
    },
    [HelpItem.CreateCategory]: {
      desc: 'Create a new category by clicking on the "Create category" button.\n Once a category is created, its name and color can be changed at any time by selecting its "Edit category" menu on the right of the category icon.',
      brief:
        'Create a new category by clicking on the "Create category" button.\n Once a category is created, its name and color can be changed at any time by selecting its "Edit category" menu on the right of the category icon.',
    },
    [HelpItem.DeleteObject]: {
      desc: 'Images can be deleted from the workspace at any time by selecting them and clicking "delete" on the top right.\n Selected images can also be deleted by using the "delete" hotkey.',
      brief:
        'Images can be deleted from the workspace at any time by selecting them and clicking "delete" on the top right.\n Selected images can also be deleted by using the "delete" hotkey.',
    },
    [HelpItem.OpenImage]: {
      desc:
        'In the left menu, select "Open image" to upload images from your local machine. Select one or multiple image files to open.' +
        "\nAlternatively, drag and drop the desired image files directly onto the gallery.",
      brief: "Upload images from your local machine",
    },
    [HelpItem.OpenMenu]: {
      desc: "Open project or image",
      brief: "Open project or image",
    },
    [HelpItem.KindTabs]: {
      desc: "Click on the tabs to view the different 'Kinds' of objects in your project",
      brief:
        "Click on the tabs to view the different 'Kinds' of objects in your project",
    },
    [HelpItem.EditKind]: {
      desc: "Edit the display name of the 'Kind'",
      brief: "Edit the display name of the 'Kind'",
    },
    [HelpItem.DeleteKind]: {
      desc: "Delete this 'Kind', associated objects and categories will also be deleted",
      brief:
        "Delete this 'Kind', associated objects and categories will also be deleted",
    },
    [HelpItem.CreateKind]: {
      desc: "Create a new 'Kind'",
      brief: "Create a new 'Kind'",
    },
    [HelpItem.LearningTask]: {
      desc: "Select Select the type of DL task you would like to perform.\nIf you want to categorize the images choose Classification.\nIf you would like to idendify the objects within the images choose Segmentation.",
      brief:
        "Select Select the type of DL task you would like to perform.\nIf you want to categorize the images choose Classification.\nIf you would like to idendify the objects within the images choose Segmentation.",
    },
    [HelpItem.SaveClassificationModel]: {
      desc: "Save the configuration and weight of the current classification model as 'model-name'.json and 'model-name'.weights.bin",
      brief:
        "Save the configuration and weight of the current classification model as 'model-name'.json and 'model-name'.weights.bin",
    },
    [HelpItem.LoadClassificationModel]: {
      desc: "Upload a previusoly trained classification model from the '*.json' and '*.weights.bin' files.",
      brief:
        "Upload a previusoly trained classification model from the '*.json' and '*.weights.bin' files.",
    },
    [HelpItem.BatchSize]: {
      desc: "Batch size defines how many images the model will look at before updating its internal parameters.\n A batch size of 1 would mean that the model will look at one image, update its internal parameters on what links an image to a class, and then repeat this with the next image until all images have been analyzed.",
      brief:
        "Batch size defines how many images the model will look at before updating its internal parameters.\n A batch size of 1 would mean that the model will look at one image, update its internal parameters on what links an image to a class, and then repeat this with the next image until all images have been analyzed.",
    },
    [HelpItem.LearningRate]: {
      desc: "The learning rate is a value that determines by how much the model updates its internal parameters in response to the loss function.",
      brief:
        "The learning rate is a value that determines by how much the model updates its internal parameters in response to the loss function.",
    },
    [HelpItem.LossFunction]: {
      desc: "The loss function calculates how well a model has performed by comparing the prediction made by the model and what was expected.\n In essence, a well performing model will output a lower number for the loss function, whereas a poor model will output a higher number.\n The loss function therefore tells us how well our model is performing at making predictions for a particular set of model parameters. The optimization algorithms work to reduce the loss function and in turn lead to a better performing model.",
      brief:
        "The loss function calculates how well a model has performed by comparing the prediction made by the model and what was expected.\n In essence, a well performing model will output a lower number for the loss function, whereas a poor model will output a higher number.\n The loss function therefore tells us how well our model is performing at making predictions for a particular set of model parameters. The optimization algorithms work to reduce the loss function and in turn lead to a better performing model.",
    },
    [HelpItem.Epochs]: {
      desc: "An epoch is a measure of how many times the entire training subset is studied by the deep learning model.\n However, increasing the number of epochs does not necessarily lead to better results and can instead result in overfitting.",
      brief:
        "An epoch is a measure of how many times the entire training subset is studied by the deep learning model.\n However, increasing the number of epochs does not necessarily lead to better results and can instead result in overfitting.",
    },
    [HelpItem.OptimizationAlgorithm]: {
      desc: "Optimization algorithms are what update the internal parameters of the model automatically in response to its own performance.\n These algorithms will compare a prediction made by the model to the expected output and adjust model parameters to bring the predictions closer to the expected output.",
      brief:
        "Optimization algorithms are what update the internal parameters of the model automatically in response to its own performance.\n These algorithms will compare a prediction made by the model to the expected output and adjust model parameters to bring the predictions closer to the expected output.",
    },
    [HelpItem.DeleteAllCategories]: {
      desc: "Delete all categories belinging to the active 'Kind'.\n Associated onjects well be recategorized as 'Unknown'.",
      brief:
        "Delete all categories belinging to the active 'Kind'.\n Associated onjects well be recategorized as 'Unknown'.",
    },
    [HelpItem.Settings]: {
      desc: "Open the application settings.",
      brief: "Open the application settings.",
    },
    [HelpItem.SendFeedback]: {
      desc: "Report issues or send feedback about Piximi to the Github Repository",
      brief:
        "Report issues or send feedback about Piximi to the Github Repository",
    },
    [HelpItem.FilterImageGrid]: {
      desc: "Filter the images in the image grid by 'Category' or Training 'Partition'.",
      brief:
        "Filter the images in the image grid by 'Category' or Training 'Partition'.",
    },
    [HelpItem.GridItemInfo]: {
      desc: "View details of selected items in the 'Image Grid",
      brief: "View details of selected items in the 'Image Grid",
    },
    [HelpItem.NavigateImageViewer]: {
      desc: "Navigate to the Image Viewer to inspect and work with the selected images and objects.",
      brief:
        "Navigate to the Image Viewer to inspect and work with the selected images and objects.",
    },
    [HelpItem.NavigateMeasurements]: {
      desc: "Navigate to the Measurements view to perform measurements on the project data and visualize results.",
      brief:
        "Navigate to the Measurements view to perform measurements on the project data and visualize results.",
    },
    [HelpItem.CropOptions]: {
      desc: "Cropping effectively creates multiple training samples from a single image, which can be particularly useful when the original dataset is limited.",
      brief:
        "Cropping effectively creates multiple training samples from a single image, which can be particularly useful when the original dataset is limited.",
    },
    [HelpItem.PixelIntensityRescale]: {
      desc: "Neural networks often use small weight values, and large pixel values (which can range from 0 to 255 in 8-bit images) can disrupt or slow down the learning process.\n Normalizing pixel values to a smaller range, like 0-1, helps the network learn more stably and efficiently.",
      brief:
        "Neural networks often use small weight values, and large pixel values (which can range from 0 to 255 in 8-bit images) can disrupt or slow down the learning process.\n Normalizing pixel values to a smaller range, like 0-1, helps the network learn more stably and efficiently.",
    },
    [HelpItem.TrainPercentage]: {
      desc: "Whaen training  classifier, the data is split into training and validation sets.\n The model forms a means of predicting a category, checks the prediction on the validation set, then makes adjustments to its predictions.",
      brief:
        "Whaen training  classifier, the data is split into training and validation sets.\n The model forms a means of predicting a category, checks the prediction on the validation set, then makes adjustments to its predictions.",
    },
    [HelpItem.DataShuffling]: {
      desc: "Shuffling the data can help reduce bias during training and improve model accuracy.\n This is expecially true when cropping the images prior to training.",
      brief:
        "Shuffling the data can help reduce bias during training and improve model accuracy.\n This is expecially true when cropping the images prior to training.",
    },
    [HelpItem.ModelArchitecture]: {
      desc: "Model architecture refers to the algorithm will our model use to compute its answers.",
      brief:
        "Model architecture refers to the algorithm will our model use to compute its answers.",
    },
  },
};
