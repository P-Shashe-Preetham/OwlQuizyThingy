import type { Status } from "@rahoot/common/types/game/status"
import background from "@rahoot/web/assets/background.webp"
import Button from "@rahoot/web/shared/components/Button"
import Loader from "@rahoot/web/shared/components/Loader"
import {
  useEvent,
  useSocket,
} from "@rahoot/web/features/game/contexts/socketProvider"
import { usePlayerStore } from "@rahoot/web/features/game/stores/player"
import { useQuestionStore } from "@rahoot/web/features/game/stores/question"
import { MANAGER_SKIP_BTN } from "@rahoot/web/features/game/utils/constants"
import clsx from "clsx"
import { type PropsWithChildren, useEffect, useState } from "react"


type Props = PropsWithChildren & {
  statusName: Status | undefined
  onNext?: () => void
  manager?: boolean
}

const GameWrapper = ({ children, statusName, onNext, manager }: Props) => {
  const { isConnected, connectionError, reconnect } = useSocket()
  const { player } = usePlayerStore()
  const { questionStates, setQuestionStates } = useQuestionStore()
  const [isDisabled, setIsDisabled] = useState(false)
  const [bypassedLoader, setBypassedLoader] = useState(false)
  const [gameError, setGameError] = useState<string | null>(null)
  const next = statusName ? MANAGER_SKIP_BTN[statusName] : null

  useEvent("game:updateQuestion", ({ current, total }) => {
    setQuestionStates({
      current,
      total,
    })
  })

  useEvent("game:errorMessage", (message) => {
    setGameError(message)
    setIsDisabled(false)
  })

  useEffect(() => {
    setIsDisabled(false)
  }, [statusName])

  const handleNext = () => {
    setIsDisabled(true)
    onNext?.()
  }

  return (
    <section className="relative min-h-dvh flex">
      <div className="fixed top-0 left-0 h-full w-full">
        <img
          className="pointer-events-none h-full w-full object-cover"
          src={background}
          alt="background"
        />
      </div>

      <div className="z-10 flex flex-1 w-full flex-col justify-between">
        {!isConnected && !statusName && !bypassedLoader ? (
          <div className="flex h-full w-full flex-1 flex-col items-center justify-center p-6 text-center">
            {connectionError ? (
              <div className="max-w-md rounded-2xl bg-black/80 p-8 text-white backdrop-blur-md shadow-2xl border border-white/10">
                <div className="mb-4 text-4xl">🔌</div>
                <h1 className="mb-2 text-2xl font-bold">Backend Not Connected</h1>
                <p className="mb-6 text-sm text-gray-300">
                  The frontend is live, but the real-time WebSocket game server (`@rahoot/socket`) could not be reached.
                </p>
                <div className="flex flex-col gap-3">
                  <Button onClick={() => reconnect()} className="w-full bg-amber-500 text-white font-bold py-3 rounded-xl">
                    Retry Connection
                  </Button>
                  <button
                    type="button"
                    onClick={() => setBypassedLoader(true)}
                    className="text-xs text-gray-400 hover:text-white underline cursor-pointer"
                  >
                    Dismiss & View App Interface
                  </button>
                </div>
              </div>
            ) : (
              <>
                <Loader className="h-30 mb-4" />
                <h1 className="text-3xl font-bold text-white">Connecting to Game Server...</h1>
              </>
            )}
          </div>
        ) : (
          <>
            {(!isConnected && statusName) && (
              <div role="alert" aria-live="assertive" className="z-50 flex items-center justify-center gap-2 bg-red-500/90 px-4 py-2 text-center text-sm font-bold text-white animate-pulse">
                ⚠ Connection lost. Reconnecting...
              </div>
            )}
            {gameError && (
              <div role="alert" aria-live="assertive" className="z-50 flex items-center justify-between gap-4 bg-red-600/90 px-4 py-3 text-sm font-bold text-white shadow-md">
                <div className="flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                  {gameError}
                </div>
                <button
                  type="button"
                  onClick={() => setGameError(null)}
                  className="text-white hover:text-gray-200 focus:outline-none"
                  aria-label="Dismiss error"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              </div>
            )}

            <div className="flex w-full justify-between p-4">
              {questionStates && (
                <div className="shadow-inset flex items-center rounded-md bg-white p-2 px-4 text-lg font-bold text-black">
                  {`${questionStates.current} / ${questionStates.total}`}
                </div>
              )}

              {manager && next && (
                <Button
                  className={clsx("self-end bg-white px-4 text-black!", {
                    "pointer-events-none": isDisabled,
                  })}
                  onClick={handleNext}
                >
                  {next}
                </Button>
              )}
            </div>

            {children}

            {!manager && player && (
              <div className="z-50 flex items-center justify-between bg-white px-4 py-2 text-lg font-bold text-white">
                <p className="text-gray-800">{player.username}</p>
                <div className="rounded-sm bg-gray-800 px-3 py-1 text-lg">
                  {player.points ?? 0}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  )
}

export default GameWrapper
