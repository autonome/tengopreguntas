import React from "react";
import ReactDOM from "react-dom/client";
import { EthereumClient, w3mConnectors, w3mProvider } from "@web3modal/ethereum";
import { Web3Modal } from "@web3modal/react";
import { configureChains, createConfig, WagmiConfig } from "wagmi";
import { filecoinCalibration } from "wagmi/chains";
import "./index.css";
import App from "./App";
import reportWebVitals from "./reportWebVitals";
import { CssBaseline, ThemeProvider } from "@mui/material";
import { muiTheme } from "./constants/theme";
import { BrowserRouter } from "react-router-dom";
import { ToastContainer } from "react-toastify";

const root = ReactDOM.createRoot(document.getElementById("root") as HTMLElement);

if (!process.env.REACT_APP_PROJECT_ID) {
  throw new Error("You need to provide NEXT_PUBLIC_PROJECT_ID env variable");
}
const projectId = process.env.REACT_APP_PROJECT_ID;

const { publicClient, webSocketPublicClient } = configureChains(
  [filecoinCalibration],
  [w3mProvider({ projectId })]
);
const config = createConfig({
  autoConnect: true,
  publicClient,
  webSocketPublicClient,
  connectors: w3mConnectors({ chains: [filecoinCalibration], version: 1, projectId }),
});
const ethereumClient = new EthereumClient(config, [filecoinCalibration]);

root.render(
  <React.StrictMode>
    <WagmiConfig config={config}>
      <ThemeProvider theme={muiTheme}>
        <BrowserRouter>
          <App />
          <Web3Modal
            projectId={projectId}
            ethereumClient={ethereumClient}
            defaultChain={filecoinCalibration}
            themeVariables={{
              "--w3m-background-color": "#1567eb",
              "--w3m-accent-color": "#1567eb",
            }}
          />
          <CssBaseline />
          <ToastContainer theme="dark" />
        </BrowserRouter>
      </ThemeProvider>
    </WagmiConfig>
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
