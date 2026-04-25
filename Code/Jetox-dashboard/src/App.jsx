import { BrowserRouter } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { Provider } from "react-redux";
import store from "./redux/store";
import AppRoutes from "./routes/AppRoutes";
import { QueryProvider } from "./providers/QueryProvider";
import TaskSocketProvider from "./providers/TaskSocketProvider";
import PageHelmet from "./components/seo/PageHelmet";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { ThemeProvider } from "./providers/ThemeProvider";

function App() {
  return (
    <ThemeProvider>
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
    </ThemeProvider>
  );
}

export default App
