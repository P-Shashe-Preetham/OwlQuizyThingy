import { Outlet } from "react-router"

export const GameLayout = () => {
  return (
    <div className="relative z-0 h-dvh w-dvw overflow-hidden">
      <div className="relative z-10 flex h-full w-full flex-col">
        <Outlet />
      </div>
    </div>
  )
}
