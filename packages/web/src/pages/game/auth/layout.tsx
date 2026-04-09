import Loader from "@rahoot/web/features/game/components/Loader"
import { useSocket } from "@rahoot/web/features/game/contexts/socketProvider"
import { Outlet } from "react-router"

const AuthLayout = () => {
  const { isConnected } = useSocket()

  if (!isConnected) {
    return (
      <section className="relative flex min-h-dvh flex-col items-center justify-center">
        <div className="absolute h-full w-full overflow-hidden">
          <div className="bg-primary/15 absolute -top-[15vmin] -left-[15vmin] min-h-[75vmin] min-w-[75vmin] rounded-full"></div>
          <div className="bg-primary/15 absolute -right-[15vmin] -bottom-[15vmin] min-h-[75vmin] min-w-[75vmin] rotate-45"></div>
        </div>

        <h1 className="mb-10 text-5xl font-black italic text-white drop-shadow-xl tracking-tight">OwlQuizThingy</h1>
        <Loader className="h-23" />
        <h2 className="mt-2 text-center text-2xl font-bold text-white drop-shadow-lg md:text-3xl">
          Loading...
        </h2>
      </section>
    )
  }

  return (
    <section className="relative flex min-h-dvh flex-col items-center justify-center">
      <div className="absolute h-full w-full overflow-hidden">
        <div className="bg-primary/15 absolute -top-[15vmin] -left-[15vmin] min-h-[75vmin] min-w-[75vmin] rounded-full"></div>
        <div className="bg-primary/15 absolute -right-[15vmin] -bottom-[15vmin] min-h-[75vmin] min-w-[75vmin] rotate-45"></div>
      </div>

      <h1 className="mb-10 text-5xl font-black italic text-white drop-shadow-xl tracking-tight">OwlQuizThingy</h1>
      <Outlet />
    </section>
  )
}

export default AuthLayout
