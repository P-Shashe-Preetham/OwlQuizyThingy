import Loader from "@rahoot/web/features/game/components/Loader"
import { useSocket } from "@rahoot/web/features/game/contexts/socketProvider"
import { Outlet } from "react-router"

const AuthLayout = () => {
  const { isConnected, connectionError } = useSocket()

  return (
    <section className="relative flex min-h-dvh flex-col items-center justify-center">
      <div className="absolute h-full w-full overflow-hidden">
        <div className="bg-primary/15 absolute -top-[15vmin] -left-[15vmin] min-h-[75vmin] min-w-[75vmin] rounded-full"></div>
        <div className="bg-primary/15 absolute -right-[15vmin] -bottom-[15vmin] min-h-[75vmin] min-w-[75vmin] rotate-45"></div>
      </div>

      {!isConnected && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-amber-500/90 text-white text-xs font-semibold py-1.5 px-4 text-center backdrop-blur-sm shadow">
          {connectionError ? "⚠️ Backend socket server disconnected" : "⚡ Connecting to game server..."}
        </div>
      )}

      <h1 className="mb-10 text-5xl font-black italic text-white drop-shadow-xl tracking-tight">OwlQuizThingy</h1>
      <Outlet />
    </section>
  )
}

export default AuthLayout
