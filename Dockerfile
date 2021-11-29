# Use node 16 (LTS, latest), debian 11 (slim)
FROM node:16.13-bullseye-slim

# Change working directory
WORKDIR /piximi

# Make module binaries available (e.g. react-scripts)
ENV PATH="./node_modules/.bin:$PATH"

# Install dependencies
COPY package.json .
RUN yarn install

# Copy source code
COPY . .

# https://stackoverflow.com/questions/62663167/dockerizing-react-in-production-mode-fatal-error-ineffective-mark-compacts-nea
ENV GENERATE_SOURCEMAP false

# Build the project
RUN yarn run build

# Expose API port to the outside
EXPOSE 3000

# Launch application
# CMD ["yarn", "run", "BROWSER=none", "react-scripts", "start"]
CMD ["react-scripts", "start"]
