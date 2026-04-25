import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

function makeClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000,
        gcTime: 5 * 60 * 1000,
        retry: (failureCount, error) => {
          if (error?.response?.status === 401) return false;
          return failureCount < 1;
        },
        refetchOnWindowFocus: false,
      },
      mutations: {
        retry: 0,
      },
    },
  });
}

export function QueryProvider({ children }) {
  const [client] = useState(makeClient);
  return (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
}
