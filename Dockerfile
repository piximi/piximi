# Use node latest LTS
FROM node:16.13.0

# Copy source code
COPY . /app

# Change working directory
WORKDIR /app

# Install dependencies
RUN yarn install

# https://stackoverflow.com/questions/62663167/dockerizing-react-in-production-mode-fatal-error-ineffective-mark-compacts-nea
ENV GENERATE_SOURCEMAP false

# Build the project
RUN yarn run build

# Expose API port to the outside
EXPOSE 3000

# Launch application
# CMD ["yarn", "run", "BROWSER=none", "react-scripts", "start"]
CMD ["yarn", "run", "react-scripts", "start"]
