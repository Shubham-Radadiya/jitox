import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import "antd/dist/reset.css";
import { Toaster } from "react-hot-toast";

createRoot(document.getElementById("root")).render(
  <>
    <StrictMode>
      <App />
    </StrictMode>
    <Toaster position="top-center" reverseOrder={false} />
  </>
);
