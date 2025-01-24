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
      "no-prototype-builtins": "off",
      "no-case-declarations": "off",
      "react/no-deprecated": "off", // TODO remove after move to REACT 18
      "react/display-name": "off",
      "react/prop-types": "off", // Disable PropTypes checking for TypeScript
      "react/react-in-jsx-scope": "off", // Disable React in scope rule (React 17+)
      "@typescript-eslint/no-unsafe-function-type": "off",
      "@typescript-eslint/no-unused-vars": ["warn", {"args": "after-used", "argsIgnorePattern": "^_"}],
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-expressions": ["error", { "allowShortCircuit": true, "allowTernary": true }],
      "@typescript-eslint/ban-ts-comment": ["error", {"ts-ignore": "allow-with-description", "ts-nocheck": "allow-with-description"}],
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
  
  {
    files: ["**/*.{.js,mjs,jsx", "**/*test*", "**/tests/**", "scripts/*"],
    rules: {
      "@typescript-eslint/no-require-imports": "off",
      "no-undef": "off",
    },
  },

  {
    ignores: ["**/*.json", "**/*.yml"]
  }

] satisfies Linter.Config[];
