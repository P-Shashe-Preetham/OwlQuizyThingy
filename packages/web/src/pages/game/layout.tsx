import {
  SocketProvider,
  useSocket,
} from "@rahoot/web/features/game/contexts/socketProvider"
import { useEffect } from "react"
import { Outlet } from "react-router"
import ErrorBoundary from "@rahoot/web/components/ErrorBoundary"
import Toaster from "@rahoot/web/shared/components/Toaster"

const GameLayoutWrapped = () => {
  const { isConnected, connect, connectionError } = useSocket()

  useEffect(() => {
    if (!isConnected) {
      connect()
    }
  }, [connect, isConnected])

  useEffect(() => {
    document.body.classList.add("bg-secondary")


return () => {
      document.body.classList.remove("bg-secondary")
    }
  }, [])

  return (
    <div className="antialiased min-h-dvh flex flex-col relative text-slate-900 selection:bg-primary/30">
      {/* Global Connection Status */}
      {!isConnected && (
        <div
          role="alert"
          aria-live="assertive"
          className="fixed top-0 left-0 right-0 z-[100] bg-amber-500 text-slate-950 text-sm font-bold py-2 px-4 text-center shadow-md animate-in slide-in-from-top"
        >
          {connectionError ? (
            <span className="flex items-center justify-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
              Backend server disconnected. Reconnecting...
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
              Connecting to game server...
            </span>
          )}
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col relative w-full h-full max-w-[100vw] overflow-x-hidden">
        <ErrorBoundary>
          <Outlet />
        </ErrorBoundary>
      </main>

      <Toaster />
    </div>
  )
}

export const GameLayout = () => (
  <SocketProvider>
    <GameLayoutWrapped />
  </SocketProvider>
)
