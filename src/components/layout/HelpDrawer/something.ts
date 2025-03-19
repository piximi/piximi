const StartNewProject = `Begin a new project in PIXIMI.`;

const OpenExampleProject =
  'Take a look at a example project by clicking "Open example project" in the "Open" menu and selecting a project image of choice!\n This gives you an example of a collection of labeled images.';

const Documentation = "Open the Piximi Documentation in a new tab";

const ProjectName = "Change the project name";

const Categorize =
  'To label an image (i.e. assign a category to an image) simply select the image, click "Categorize" in the selection bar and choose the correct category.\n If the desired category does not exist, click "Create category" to make a new category.';

const GridZoom = "Adjust the size of the displayed imaages";

const OpenProject = `To open a saved project click 'Open project' in the Open menu on the left toolbar.
      Select a .zip or .zarr file that was downloaded when saving an earlier project.
      `;

const SaveProject = `Save all images and assigned categories by clicking on "Save project file" in the Save menu on the left toolbar.
This will download a .json file that encodes the image data.
      `;

const CreateCategory = `
Create a new category belonging to the active *Kind* by clicking on the "Create Category" button.
`;

const DeleteObject = `
Images can be deleted from the workspace at any time by selecting them and clicking "delete" on the top right.
Selected images can also be deleted by using the "delete" hotkey.`;

const OpenImage = `In the left menu, select "Open image" to upload images from your local machine.
Select one or multiple image files to open.

Alternatively, drag and drop the desired image files directly onto the gallery.`;

const OpenMenu = `From the **Open** Menu you can open=

* Previously saved projects ('*.zip' or '*.zarr')
* One of our Example Projects
* Individual images
`;

const KindTabs = `Click on the tabs to view the different **Kinds** of objects in your project.\n
Tab Functions
* Edit= Change the display name of the **Kind**.
* Minimize= Hide this **Kind**. (Re-open from *Add Kind* button)
* Delete= Delete the **Kind (excluding Image)** from the project. (***Associated images, objects, and categpries will also be deleted***)`;

const AddKindTab = `Create a new **Kind** or re-open one that was previously minimized.`;

const EditKind = `Edit the display name of the *Kind*`;

const DeleteKind = `Delete this *Kind*, associated objects and categories will also be deleted`;

const CreateKind = `Create a new *Kind*`;

const LearningTask = `
Select the type of DL task you would like to perform.

**Classification**=  Categorize the images belonging to the active *Kind*
**Segmentation**= Find the objects within the images selected.
     `;

const SaveClassificationModel = `Save the configuration and weight of the current classification model.
This will output two files=

**'model-name'.json**= Contains the model information.

**'model-name'.weights.bin**= Contains the model weights.
      `;

const LoadClassificationModel = `Upload a previusoly trained classification model from the ***.json** and ***.weights.bin** files.`;

const BatchSize = `
Batch size defines how many images the model will look at before updating its internal parameters.
A batch size of 1 would mean that the model will=
* look at one image
* update its internal parameters on what links an image to a class
* and then repeat this with the next image until all images have been analyzed.
      `;

const LearningRate = `The learning rate is a value that determines by how much the model updates its internal parameters in response to the loss function.`;

const LossFunction = `The loss function calculates how well a model has performed by comparing the prediction made by the model and what was expected.
In essence, a well performing model will output a lower number for the loss function, whereas a poor model will output a higher number.
The loss function therefore tells us how well our model is performing at making predictions for a particular set of model parameters.
The optimization algorithms work to reduce the loss function and in turn lead to a better performing model.
      `;

const Epochs = `An epoch is a measure of how many times the entire training subset is studied by the deep learning model.
However, increasing the number of epochs does not necessarily lead to better results and can instead result in overfitting.`;

const OptimizationAlgorithm = `
Optimization algorithms are what update the internal parameters of the model automatically in response to its own performance.
These algorithms will compare a prediction made by the model to the expected output and adjust model parameters to bring the predictions closer to the expected output.
      `;

const DeleteAllCategories = `Delete all categories belinging to the active *Kind*.\n
*Associated objects well be recategorized as 'Unknown'*`;

const Settings = `Open the application settings.`;

const SendFeedback = `Report issues or send feedback about Piximi to the Github Repository`;

const FilterImageGrid = `Filter the images in the image grid by 'Category' or Training 'Partition'.`;

const GridItemInfo = `View details of selected items in the Image Grid`;

const NavigateImageViewer = `Navigate to the Image Viewer to inspect and work with the selected images and objects.`;

const NavigateMeasurements = `Navigate to the Measurements view to perform measurements on the project data and visualize results.`;

const CropOptions = `Cropping effectively creates multiple training samples from a single image.\n
This can be particularly useful when the original dataset is limited.\n\n
A **CropSchema** of **Match** will add padding to the crops to maintain a uniform size.`;

const PixelIntensityRescale = `
Neural networks often use small weight values, and large pixel values (which can range from 0 to 255 in 8-bit images) can disrupt or slow down the learning process.\n
Normalizing pixel values to a smaller range, like 0-1, helps the network learn more stably and efficiently.
      `;

const TrainPercentage = `
Whaen training  classifier, the data is split into training and validation sets.\n
The model forms a means of predicting a category, checks the prediction on the validation set, then makes adjustments to its predictions.
      `;

const DataShuffling = `Shuffling the data can help reduce bias during training and improve model accuracy.\n
This is expecially true when cropping the images prior to training.
      `;

const ModelArchitecture = `Model architecture refers to the algorithm will our model use to compute its answers.`;
