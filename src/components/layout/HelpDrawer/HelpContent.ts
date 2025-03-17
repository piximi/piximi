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
      desc: 'Take a look at a example project by clicking "Open example project" in the "Open" menu and selecting a project image of choice! This gives you an example of a collection of labeled images.',
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
      desc: 'To label an image (i.e. assign a category to an image) simply select the image, click "Categorize" in the selection bar and choose the correct category. If the desired category does not exist, click "Create category" to make a new category.',
      brief: "Categorize selected objects",
    },
    [HelpItem.GridZoom]: {
      desc: "",
      brief: "Adjust the size of the displayed imaages",
    },
    [HelpItem.OpenProject]: {
      desc: 'To open a saved project click "Open project" in the Open menu on the left toolbar. Select a .json file that was downloaded when saving an earlier project.',
      brief:
        'To open a saved project click "Open project" in the Open menu on the left toolbar. Select a .json file that was downloaded when saving an earlier project.',
    },
    [HelpItem.SaveProject]: {
      desc: 'Save all images and assigned categories by clicking on "Save project file" in the Save menu on the left toolbar. This will download a .json file that encodes the image data.',
      brief:
        'Save all images and assigned categories by clicking on "Save project file" in the Save menu on the left toolbar. This will download a .json file that encodes the image data.',
    },
    [HelpItem.CreateCategory]: {
      desc: 'Create a new category by clicking on the "Create category" button. Once a category is created, its name and color can be changed at any time by selecting its "Edit category" menu on the right of the category icon.',
      brief:
        'Create a new category by clicking on the "Create category" button. Once a category is created, its name and color can be changed at any time by selecting its "Edit category" menu on the right of the category icon.',
    },
    [HelpItem.DeleteObject]: {
      desc: 'Images can be deleted from the workspace at any time by selecting them and clicking "delete" on the top right. Selected images can also be deleted by using the "delete" hotkey.',
      brief:
        'Images can be deleted from the workspace at any time by selecting them and clicking "delete" on the top right. Selected images can also be deleted by using the "delete" hotkey.',
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
      desc: "Batch size defines how many images the model will look at before updating its internal parameters. A batch size of 1 would mean that the model will look at one image, update its internal parameters on what links an image to a class, and then repeat this with the next image until all images have been analyzed.",
      brief:
        "Batch size defines how many images the model will look at before updating its internal parameters. A batch size of 1 would mean that the model will look at one image, update its internal parameters on what links an image to a class, and then repeat this with the next image until all images have been analyzed.",
    },
    [HelpItem.LearningRate]: {
      desc: "The learning rate is a value that determines by how much the model updates its internal parameters in response to the loss function.",
      brief:
        "The learning rate is a value that determines by how much the model updates its internal parameters in response to the loss function.",
    },
    [HelpItem.LossFunction]: {
      desc: "The loss function calculates how well a model has performed by comparing the prediction made by the model and what was expected. In essence, a well performing model will output a lower number for the loss function, whereas a poor model will output a higher number. The loss function therefore tells us how well our model is performing at making predictions for a particular set of model parameters. The optimization algorithms work to reduce the loss function and in turn lead to a better performing model.",
      brief:
        "The loss function calculates how well a model has performed by comparing the prediction made by the model and what was expected. In essence, a well performing model will output a lower number for the loss function, whereas a poor model will output a higher number. The loss function therefore tells us how well our model is performing at making predictions for a particular set of model parameters. The optimization algorithms work to reduce the loss function and in turn lead to a better performing model.",
    },
    [HelpItem.Epochs]: {
      desc: "An epoch is a measure of how many times the entire training subset is studied by the deep learning model. However, increasing the number of epochs does not necessarily lead to better results and can instead result in overfitting.",
      brief:
        "An epoch is a measure of how many times the entire training subset is studied by the deep learning model. However, increasing the number of epochs does not necessarily lead to better results and can instead result in overfitting.",
    },
    [HelpItem.OptimizationAlgorithm]: {
      desc: "Optimization algorithms are what update the internal parameters of the model automatically in response to its own performance. These algorithms will compare a prediction made by the model to the expected output and adjust model parameters to bring the predictions closer to the expected output.",
      brief:
        "Optimization algorithms are what update the internal parameters of the model automatically in response to its own performance. These algorithms will compare a prediction made by the model to the expected output and adjust model parameters to bring the predictions closer to the expected output.",
    },
  },
};
