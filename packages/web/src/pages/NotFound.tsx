import { Link } from "react-router"
import background from "@rahoot/web/assets/background.webp"

const NotFound = () => (
  <section className="relative flex min-h-dvh flex-col items-center justify-center">
    <div className="fixed top-0 left-0 h-full w-full">
      <img
        className="pointer-events-none h-full w-full object-cover"
        src={background}
        alt="background"
      />
    </div>

    <div className="z-10 flex flex-col items-center gap-6 text-center">
      <h1 className="text-8xl font-bold text-white drop-shadow-lg">404</h1>
      <p className="text-2xl font-semibold text-white/80">
        Oops! This page doesn't exist.
      </p>
      <Link
        to="/"
        className="rounded-lg bg-white px-8 py-3 text-lg font-bold text-gray-900 shadow-lg transition-transform hover:scale-105 active:scale-95"
      >
        Go Home
      </Link>
    </div>
  </section>
)

export default NotFound
