import { QueryCache, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./auth/AuthContext";
import App from "./App";
import { ApiError } from "./lib/api";
import "./index.css";

const queryClient = new QueryClient({
  queryCache: new QueryCache({
    // Si la sesion se perdio (cookie vencida o bloqueada), las pantallas
    // privadas mostrarian listas vacias como si no hubiera datos. Mejor
    // mandar al login para que el problema sea evidente.
    onError: (error) => {
      if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
        if (window.location.pathname !== "/login") {
          window.location.assign("/login");
        }
      }
    },
  }),
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <App />
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>
);
