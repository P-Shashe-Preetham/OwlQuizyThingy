import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import ErrorBoundary from "./components/ErrorBoundary"
import Toaster from "./features/game/components/Toaster"
import "./index.css"
import Router from "./router"

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ErrorBoundary>
      <Router />
      <Toaster />
    </ErrorBoundary>
  </StrictMode>,
)
