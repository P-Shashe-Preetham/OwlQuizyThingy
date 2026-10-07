import { useEffect, useState } from "react"
import {
  createBrowserRouter,
  Navigate,
  Outlet,
  RouterProvider,
} from "react-router"
import { useSocket, useEvent } from "@rahoot/web/features/game/contexts/socketProvider"
import AuthLayout from "@rahoot/web/pages/game/auth/layout"
import PlayerAuthPage from "@rahoot/web/pages/game/auth/page"
import { GameLayout } from "@rahoot/web/pages/game/layout"
import AuthManagerPage from "./pages/game/auth/manager/page"
import CreatorPage from "./pages/creator/page"
import NotFound from "./pages/NotFound"
import ManagerGamePage from "./pages/game/party/manager/page"
import PlayerGamePage from "./pages/game/party/page"

const ManagerProtectedRoute = () => {
  const { socket } = useSocket()
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)

  useEffect(() => {
    if (!socket) {
      setIsAuthenticated(false)

      return
    }

    // Check session flag
    let isAuthed = false

    try {
      isAuthed = sessionStorage.getItem("manager_authenticated") === "true"
    } catch {
      // Ignore
    }

    setIsAuthenticated(isAuthed)
  }, [socket])

  useEvent("manager:quizzList", () => {
    try {
      sessionStorage.setItem("manager_authenticated", "true")
    } catch {
      // Ignore
    }

    setIsAuthenticated(true)
  })

  if (isAuthenticated === null) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-950 text-white font-bold">
        Checking authentication...
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/manager" replace />
  }

  return <Outlet />
}

const router = createBrowserRouter([
  {
    path: "/",
    element: <GameLayout />,
    children: [
      {
        path: "/",
        element: <AuthLayout />,
        children: [
          {
            path: "/",
            element: <PlayerAuthPage />,
          },
          {
            path: "/manager",
            element: <AuthManagerPage />,
          },
        ],
      },
      {
        element: <ManagerProtectedRoute />,
        children: [
          {
            path: "/creator",
            element: <CreatorPage />,
          },
          {
            path: "/party/manager/:gameId",
            element: <ManagerGamePage />,
          },
        ],
      },
      {
        path: "/party/:gameId",
        element: <PlayerGamePage />,
      },
    ],
  },
  {
    path: "*",
    element: <NotFound />,
  },
])

const Router = () => <RouterProvider router={router} />

export default Router
