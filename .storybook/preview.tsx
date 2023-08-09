import React from "react";
import type { Preview } from "@storybook/react";
import { Provider } from "react-redux";
import { ThemeProvider, CssBaseline } from "@mui/material";
import { withThemeFromJSXProvider } from "@storybook/addon-styling";
// .storybook/preview.js

/* TODO: update import for your custom Material UI themes */
import { lightTheme, darkTheme } from "../src/themes/muiTheme";
import { productionStore } from "../src/store/stores";

// Import your fontface CSS files here
// Don't have any? We recommend installing and using @fontsource/roboto
import "@fontsource/roboto/300.css";
import "@fontsource/roboto/400.css";
import "@fontsource/roboto/500.css";
import "@fontsource/roboto/700.css";
import "@fontsource/material-icons";

const preview: Preview = {
  parameters: {
    actions: { argTypesRegex: "^on[A-Z].*" },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/,
      },
    },
  },

  decorators: [
    // Adds global styles and theme switching support.
    withThemeFromJSXProvider({
      GlobalStyles: CssBaseline,
      Provider: ThemeProvider,
      themes: {
        light: lightTheme,
        dark: darkTheme,
      },
      defaultTheme: "light",
    }),
    (Story) => (
      // @ts-ignore
      <Provider store={productionStore}>
        <Story />
      </Provider>
    ),
  ],
};

export default preview;
