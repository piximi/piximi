import globals from "globals";
import js from "@eslint/js";
import tseslint from "typescript-eslint";
import pluginReact from "eslint-plugin-react";
import pluginStorybook from "eslint-plugin-storybook";

import type { Linter } from "eslint";

export default [
  js.configs.recommended,

  ...tseslint.configs.recommended,

  pluginReact.configs.flat.recommended,

  ...pluginStorybook.configs['flat/recommended'],

  {
    files: ["**/*.{js,mjs,jsx,ts,mts,tsx}"],
    languageOptions: {
      globals: globals.browser,  // Define global variables for the browser environment
    },
    plugins: {
      react: pluginReact,
    },
    rules: {
      "react/prop-types": "off", // Disable PropTypes checking for TypeScript
      "react/react-in-jsx-scope": "off", // Disable React in scope rule (React 17+)
    },
  },

  {
    files: ["**/*.stories.{js,jsx,ts,tsx}"],
    rules: {
      "import/no-anonymous-default-export": "off",
    },
    ignores: ['!.storybook'],
    plugins: {
      storybook: pluginStorybook,
    },
  },

] satisfies Linter.Config[];
