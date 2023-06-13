import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import reportWebVitals from "./reportWebVitals";
import { MantineProvider, createEmotionCache } from "@mantine/core";
import { Notifications } from "@mantine/notifications";
import { ModalsProvider } from "@mantine/modals";

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement
);
const myCache = createEmotionCache({
  key: "mantine",
  prepend: false,
});

root.render(
  <React.StrictMode>
    <MantineProvider
      emotionCache={myCache}
      theme={{
        fontFamily: "Inter, sans-serif",
        fontFamilyMonospace: "Monaco, Courier, monospace",
        headings: { fontFamily: "Greycliff CF, sans-serif" },
      }}
    >
      <ModalsProvider>
        <Notifications />
        <App />
      </ModalsProvider>
    </MantineProvider>
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
