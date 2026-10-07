import { Outlet } from "react-router"

const AuthLayout = () => (
    <section className="relative flex min-h-dvh flex-col items-center justify-center bg-secondary overflow-hidden">
      {/* Decorative Background */}
      <div className="absolute inset-0 pointer-events-none opacity-50">
        <div className="absolute bg-primary/20 blur-[100px] -top-[20%] -left-[10%] w-[60%] h-[60%] rounded-full mix-blend-screen" />
        <div className="absolute bg-orange-500/10 blur-[100px] top-[40%] -right-[10%] w-[50%] h-[70%] rounded-full mix-blend-screen" />
      </div>

      <div className="relative z-10 flex flex-col items-center w-full px-4">
        <h1 className="mb-12 text-5xl md:text-6xl font-black italic text-white drop-shadow-2xl tracking-tighter text-center">
          OwlQuizThingy
        </h1>
        <div className="w-full max-w-sm">
          <Outlet />
        </div>
      </div>
    </section>
  )

export default AuthLayout
