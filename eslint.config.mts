import globals from "globals";
import pluginJs from "@eslint/js";
import tseslint from "typescript-eslint";
import pluginReact from "eslint-plugin-react";
import pluginStorybook from "eslint-plugin-storybook";

import type { Linter } from "eslint";

export default [
  {
    files: ["**/*.{js,mjs,cjs,ts,jsx,tsx}"],
    languageOptions: {
      globals: globals.browser,  // Define global variables for the browser environment
    },
    plugins: {
      react: pluginReact,  // Adding react plugin
      storybook: pluginStorybook,  // Adding storybook plugin
    },
    rules: {
      "react/prop-types": "off", // Disable PropTypes checking for TypeScript
      "react/react-in-jsx-scope": "off", // Disable React in scope rule (React 17+)
      "import/no-anonymous-default-export": "off", // For Storybook files
    },
  },

  // TypeScript configuration (if you're using TS)
  ...tseslint.configs.recommended,

  // React-specific linting
  pluginReact.configs.flat.recommended,

  // Storybook recommended linting
  ...pluginStorybook.configs['flat/recommended'],

  // Storybook specific rules
  {
    files: ["**/*.stories.{js,jsx,ts,tsx}"],
    rules: {
      "import/no-anonymous-default-export": "off", // Specific rule override for Storybook
    },
    ignores: ['!.storybook'],
    plugins: {
      storybook: pluginStorybook,  // Adding storybook plugin for specific files
    },
  },

  // JS/TS linting
  pluginJs.configs.recommended,
] satisfies Linter.Config[];
