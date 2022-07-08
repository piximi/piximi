![Piximi](src/images/Piximi_Logo.png)

Piximi is a free, open source web app for performing image understanding tasks. It’s written by dozens of engineers and scientists from institutions like the Biological Research Centre Szeged, Broad Institute of MIT and Harvard, Chan Zuckerberg Initiative, ETH Zurich, and FIMM Helsinki.

Piximi's target users are computational or non-computational scientists interested in image analysis from fields like astronomy, biology, and medicine.

# Development

## Available Scripts

In the project directory, you can run:

### `yarn install`

Install all project dependencies.

### `yarn start`

Runs the app in the development mode.<br />
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

### `yarn build`

Builds the app for production to the `build` folder.<br />

### `yarn test`

Runs the tests. Note that for tests using tensorflow you need to specify the custom environment:

`yarn test --env=./src/store/coroutines/classifier/custom-test-env.js`<br />

## Docker

To run as a docker container, clone the repo, build the image and run it:

```
git clone https://github.com/piximi/piximi
docker build -t <image_name> piximi/
docker run -p 3000:3000 --name <container_name> <image_name>
```

If you encounter the following message:
` The build failed because the process exited too early. This probably means the system ran out of memory or someone called ``kill -9`` on the process. `
and you are running Docker Desktop, you will need to increase memory resources. `8GB` memory should be sufficient.

Alternatively, download the pre-built image and run it directly from Docker Hub:

```
docker run -p 3000:3000 --name piximi gnodar01/piximi:0.1.0
```
