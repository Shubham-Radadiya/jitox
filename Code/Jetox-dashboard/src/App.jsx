import { BrowserRouter } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { Provider } from "react-redux";
import { ConfigProvider } from "antd";
import store from "./redux/store";
import AppRoutes from "./routes/AppRoutes";
import { QueryProvider } from "./providers/QueryProvider";
import TaskSocketProvider from "./providers/TaskSocketProvider";
import PageHelmet from "./components/seo/PageHelmet";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { ThemeProvider } from "./providers/ThemeProvider";

const antTheme = {
  token: {
    fontFamily:
      '"Inter", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
    fontSize: 13,
    fontSizeHeading1: 20,
    fontSizeHeading2: 18,
    fontSizeHeading3: 16,
    fontSizeHeading4: 14,
    fontSizeHeading5: 13,
    lineHeight: 1.5,
    borderRadius: 8,
  },
  components: {
    Table: {
      cellFontSize: 13,
      headerFontSize: 12,
    },
    Form: {
      labelFontSize: 12,
    },
    Modal: {
      titleFontSize: 16,
    },
  },
};

function App() {
  return (
    <ThemeProvider>
    <ConfigProvider theme={antTheme}>
    <QueryProvider>
      <Provider store={store}>
        <HelmetProvider>
          <BrowserRouter>
            <TaskSocketProvider>
              <PageHelmet />
              <ErrorBoundary>
                <AppRoutes />
              </ErrorBoundary>
            </TaskSocketProvider>
          </BrowserRouter>
        </HelmetProvider>
      </Provider>
    </QueryProvider>
    </ConfigProvider>
    </ThemeProvider>
  );
}

export default App
