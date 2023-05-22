import { createTheme } from "@mui/material/styles";
import type {} from "@mui/lab/themeAugmentation";

export const muiTheme = createTheme({
  palette: {
    mode: "dark",
    primary: {
      main: "#1e7efa",
    },
    secondary: {
      main: "#be1699",
    },
    background: {
      default: "#0b1217",
      paper: "#142028",
    },
  },
  components: {
    MuiTypography: {
      styleOverrides: {
        root: {
          textTransform: "none",
          fontFamily: `"Poppins", "Roboto", "Arial", sans-serif`,
          fontSize: 16,
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: "none",
          fontFamily: `"Poppins", "Roboto", "Arial", sans-serif`,
          fontSize: 16,
        },
      },
    },
    MuiAvatar: {
      styleOverrides: {
        root: {
          display: "block",
          img: {
            display: "block",
          },
        },
      },
    },
    MuiMenu: {
      styleOverrides: {
        root: {
          transform: "translateY(15px)",
          paddingTop: 0,
          paddingBottom: 0,
        },
        list: {
          paddingTop: 0,
          paddingBottom: 0,
        },
        paper: {
          borderRadius: "8px",
          backgroundImage: "none",
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          input: {
            padding: "5px 20px",
            fontFamily: `"Poppins", "Roboto", "Arial", sans-serif`,
            fontSize: "18px",
            "@media screen and (max-width: 600px)": {
              padding: "10px 15px",
            },
          },
          fieldset: {
            border: "1px solid #424242",
            borderRadius: "16px",
            fontFamily: `"Poppins", "Roboto", "Arial", sans-serif`,
            transition: "all 0.25s ease-in-out",
            "@media screen and (max-width: 600px)": {
              borderRadius: "8px",
            },
            "&:hover": {
              border: "1px solid #3b82f6 !important",
            },
          },
          "&:hover fieldset": {
            border: "1px solid #3b82f6 !important",
          },
        },
      },
    },
    MuiTabPanel: {
      styleOverrides: {
        root: {
          padding: "12px",
        },
      },
    },
  },
});
