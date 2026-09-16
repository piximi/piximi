# Use node 20, slim
FROM node:20.20-slim AS build

# Not sure if this ist still needed as of 2026
ENV PYTHON="/usr/local/bin/python"

RUN apt-get update && apt-get install -y git

RUN npm install -g pnpm@latest-10

# Change working directory
WORKDIR /piximi

# Make module binaries available (e.g. react-scripts)
ENV PATH="./node_modules/.bin:$PATH"

# Copy source code
# cannot copy over only package.json before yarn install
# yarn install has data dependencies in prepare script
# and src/examples/data
COPY . .

RUN pnpm install --dangerously-allow-all-builds

# Not sure if these are still needed in 2026
# https://stackoverflow.com/questions/62663167/dockerizing-react-in-production-mode-fatal-error-ineffective-mark-compacts-nea
ENV GENERATE_SOURCEMAP=false
ENV TSC_COMPILE_ON_ERROR=true
ENV ESLINT_NO_DEV_ERRORS=true
ENV DISABLE_ESLINT_PLUGIN=true

# Build the project
RUN pnpm build
# RUN NODE_OPTIONS="--max-old-space-size=8192" yarn build

FROM node:20.20-slim  AS production

COPY --from=build /piximi/ /piximi/

WORKDIR /piximi

RUN npm install -g pnpm@latest-10 

# Expose API port to the outside
EXPOSE 3000

# Launch application
CMD ["pnpm", "start", "--host"]
