# Use node 16 (LTS, latest), debian 11 (slim)
FROM node:16.20-bullseye-slim AS build

# Use python 3.8, node 16 (LTS, latest), debian 11 (slim)
# Needed if including installation of @tensorflow/tfjs-node
# FROM nikolaik/python-nodejs:python3.8-nodejs16-bullseye

ENV PYTHON="/usr/local/bin/python"

RUN apt-get update && apt-get install -y git

# Change working directory
WORKDIR /piximi

# Make module binaries available (e.g. react-scripts)
ENV PATH="./node_modules/.bin:$PATH"

# Copy source code
# cannot copy over only package.json before yarn install
# yarn install has data dependencies in prepare script
# and src/examples/data
COPY . .

RUN yarn install --no-lockfile

# https://stackoverflow.com/questions/62663167/dockerizing-react-in-production-mode-fatal-error-ineffective-mark-compacts-nea
ENV GENERATE_SOURCEMAP=false
ENV TSC_COMPILE_ON_ERROR=true
ENV ESLINT_NO_DEV_ERRORS=true
ENV DISABLE_ESLINT_PLUGIN=true

# Build the project
RUN yarn run build
# RUN NODE_OPTIONS="--max-old-space-size=8192" yarn build

FROM node:16.20-bullseye-slim AS production

COPY --from=build /piximi/ /piximi/

WORKDIR /piximi

RUN yarn global add serve

# Expose API port to the outside
EXPOSE 3000

# Launch application
CMD ["serve", "-s", "build"]
