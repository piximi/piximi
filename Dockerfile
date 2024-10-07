# Use node 16 (LTS, latest), debian 11 (slim)
FROM node:16.13-bullseye-slim

# Use python 3.8, node 16 (LTS, latest), debian 11 (slim)
# Needed if including installation of @tensorflow/tfjs-node
# FROM nikolaik/python-nodejs:python3.8-nodejs16-bullseye

ENV PYTHON="/usr/local/bin/python"

RUN apt-get update && apt-get install -y git

# Change working directory
WORKDIR /piximi

# Make module binaries available (e.g. react-scripts)
ENV PATH="./node_modules/.bin:$PATH"

# Set production environment for yarn
ENV NODE_ENV="production"

# Copy source code
# cannot copy over only package.json before yarn install
# yarn install has data dependencies in prepare script
# and src/examples/data
COPY . .

RUN yarn install

# https://stackoverflow.com/questions/62663167/dockerizing-react-in-production-mode-fatal-error-ineffective-mark-compacts-nea
ENV GENERATE_SOURCEMAP=false

# Build the project
RUN yarn run build
# RUN NODE_OPTIONS="--max-old-space-size=8192" yarn build

# Expose API port to the outside
EXPOSE 3000

# Launch application
# CMD ["yarn", "run", "BROWSER=none", "react-scripts", "start"]
CMD ["yarn", "run", "start"]
