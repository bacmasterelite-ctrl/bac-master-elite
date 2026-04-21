import React from "react";
import ReactDOM from "react-dom/client";
import { ClerkProvider, useAuth } from "@clerk/react";
import { setBaseUrl, setAuthTokenGetter } from "@workspace/api-client-react";
import App from "./App";
import "./index.css";

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY as string;
if (!PUBLISHABLE_KEY) throw new Error("Missing VITE_CLERK_PUBLISHABLE_KEY");

setBaseUrl("/api");

function ApiTokenBridge({ children }: { children: React.ReactNode }) {
  const { getToken } = useAuth();
  React.useEffect(() => {
    setAuthTokenGetter(async () => {
      try {
        return (await getToken()) ?? null;
      } catch {
        return null;
      }
    });
  }, [getToken]);
  return <>{children}</>;
}

const proxyUrl =
  import.meta.env.PROD ? "/api/__clerk" : undefined;

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ClerkProvider publishableKey={PUBLISHABLE_KEY} proxyUrl={proxyUrl} signInUrl="/login" signUpUrl="/login">
      <ApiTokenBridge>
        <App />
      </ApiTokenBridge>
    </ClerkProvider>
  </React.StrictMode>,
);
