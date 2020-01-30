const path = require("path");
module.exports = {
  module: {
    rules: [
      {
        include: path.resolve(
          __dirname,
          "../src/FitClassifierDialog/FitClassifierDialog"
        ),
        loader: "awesome-typescript-loader",
        test: /\.tsx?$/
      }
    ]
  },
  resolve: {
    extensions: [".tsx", ".ts", ".js"]
  }
};
