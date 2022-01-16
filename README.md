# Piximi

Piximi is a free, open source web app for performing image understanding tasks. It’s written by by dozens of engineers and scientists from institutions like the Biological Research Centre Szeged, Broad Institute of MIT and Harvard, Chan Zuckerberg Initiative, ETH Zurich, and FIMM Helsinki.

Piximi's target users are computational or non-computational scientists interested in image analysis from fields like astronomy, biology, and medicine.

# Development

## Available Scripts

In the project directory, you can run:

### `yarn install`

Install all project dependencies.

### `yarn start`

Runs the app in the development mode.<br />
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

The page will reload if you make edits.<br />
You will also see any lint errors in the console.

### `yarn build`

Builds the app for production to the `build` folder.<br />
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.<br />
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).

## Docker

To run as a docker container, clone the repo, build the image and run it:

```
git clone https://github.com/piximi/prototype
docker build -t <image_name> prototype/
docker run -p 3000:3000 --name <container_name> <image_name>
```

If you encounter the following message:
` The build failed because the process exited too early. This probably means the system ran out of memory or someone called ``kill -9`` on the process. `
and you are running Docker Desktop, you will need to increase memory resources. `8GB` memory should be sufficient.

Alternatively, download the pre-built image and run it directly from Docker Hub:

```
docker run -p 3000:3000 --name piximi gnodar01/piximi:0.1.0
```
