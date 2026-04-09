import type { CommonStatusDataMap } from "@rahoot/common/types/game/status"
import AnswerButton from "@rahoot/web/features/game/components/AnswerButton"
import {
  useEvent,
  useSocket,
} from "@rahoot/web/features/game/contexts/socketProvider"
import { usePlayerStore } from "@rahoot/web/features/game/stores/player"
import {
  ANSWERS_COLORS,
  ANSWERS_ICONS,
  SFX_ANSWERS_MUSIC,
  SFX_ANSWERS_SOUND,
} from "@rahoot/web/features/game/utils/constants"
import clsx from "clsx"
import { useEffect, useState } from "react"
import { useParams } from "react-router"
import useSound from "use-sound"

type Props = {
  data: CommonStatusDataMap["SELECT_ANSWER"]
}

const Answers = ({
  data: { type, question, answers, image, audio, video, time, totalPlayer },
}: Props) => {
  const { gameId }: { gameId?: string } = useParams()
  const { socket } = useSocket()
  const { player } = usePlayerStore()

  const [cooldown, setCooldown] = useState(time)
  const [totalAnswer, setTotalAnswer] = useState(0)
  const [typedAnswer, setTypedAnswer] = useState("")
  const [hasSubmitted, setHasSubmitted] = useState(false)

  const [sfxPop] = useSound(SFX_ANSWERS_SOUND, {
    volume: 0.1,
  })

  const [playMusic, { stop: stopMusic }] = useSound(SFX_ANSWERS_MUSIC, {
    volume: 0.2,
    interrupt: true,
    loop: true,
  })

  const handleAnswer = (answerKey: number) => () => {
    if (!player) {
      return
    }

    socket?.emit("player:selectedAnswer", {
      gameId,
      data: {
        answerKey,
      },
    })
    sfxPop()
  }

  const handleTextSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!player || hasSubmitted || !typedAnswer.trim()) return

    socket?.emit("player:selectedAnswer", {
      gameId,
      data: { answerKey: typedAnswer.trim() },
    })
    setHasSubmitted(true)
    sfxPop()
  }

  useEffect(() => {
    if (video || audio) {
      return
    }

    playMusic()

    // eslint-disable-next-line consistent-return
    return () => {
      stopMusic()
    }
  }, [playMusic])

  useEvent("game:cooldown", (sec) => {
    setCooldown(sec)
  })

  useEvent("game:playerAnswer", (count) => {
    setTotalAnswer(count)
    sfxPop()
  })

  return (
    <div className="flex h-full flex-1 flex-col justify-between">
      {!player && (
        <div className="mx-auto inline-flex h-full w-full max-w-7xl flex-1 flex-col items-center justify-center gap-5">
          <h2 className="text-center text-2xl font-bold text-white drop-shadow-lg md:text-4xl lg:text-5xl">
            {question}
          </h2>

          {Boolean(audio) && (
            <audio
              className="m-4 mb-2 w-auto rounded-md"
              src={audio}
              autoPlay
              controls
            />
          )}

          {Boolean(video) && (
            <video
              className="m-4 mb-2 aspect-video max-h-60 w-auto rounded-md px-4 sm:max-h-100"
              src={video}
              autoPlay
              controls
            />
          )}

          {Boolean(image) && (
            <img
              alt={question}
              src={image}
              className="mb-2 max-h-60 w-auto rounded-md px-4 sm:max-h-100"
            />
          )}
        </div>
      )}

      <div>
        <div className="mx-auto mb-4 flex w-full max-w-7xl justify-between gap-1 px-2 text-lg font-bold text-white md:text-xl">
          <div className="flex flex-col items-center rounded-full bg-black/40 px-4 text-lg font-bold">
            <span className="translate-y-1 text-sm">Time</span>
            <span>{cooldown}</span>
          </div>
          <div className="flex flex-col items-center rounded-full bg-black/40 px-4 text-lg font-bold">
            <span className="translate-y-1 text-sm">Answers</span>
            <span>
              {totalAnswer}/{totalPlayer}
            </span>
          </div>
        </div>

        {type === "type-answer" ? (
          <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col items-center justify-center px-4">
            {player ? (
              hasSubmitted ? (
                <h3 className="text-2xl font-bold text-white text-center">Answer submitted! Waiting for others...</h3>
              ) : (
                <form 
                  onSubmit={handleTextSubmit} 
                  className="flex w-full max-w-lg flex-col gap-4 bg-white/10 p-6 rounded-2xl border border-white/20 shadow-xl"
                >
                  <label className="text-white text-lg font-bold text-center">Type your answer</label>
                  <input
                    type="text"
                    value={typedAnswer}
                    onChange={(e) => setTypedAnswer(e.target.value)}
                    className="w-full rounded-xl p-4 text-2xl font-bold text-black focus:outline-none focus:ring-4 focus:ring-primary/50 text-center"
                    placeholder="Enter your answer..."
                    autoFocus
                  />
                  <button 
                    type="submit" 
                    className="w-full rounded-xl bg-primary py-4 text-xl font-bold text-white transition-transform hover:scale-[1.02] active:scale-95 shadow-lg"
                  >
                    Submit
                  </button>
                </form>
              )
            ) : (
              <h3 className="text-2xl font-bold text-white/50 text-center animate-pulse">Players are typing their answers...</h3>
            )}
          </div>
        ) : (
          <div
            className={clsx(
              "mx-auto mb-4 grid w-full max-w-7xl grid-cols-2 gap-2 px-2 text-lg font-bold text-white md:text-xl",
              player && "flex-1 grid-rows-2 pb-4",
            )}
          >
            {answers.map((answer, key) => (
              <AnswerButton
                key={key}
                className={clsx(ANSWERS_COLORS[key], player && "h-full")}
                icon={ANSWERS_ICONS[key]}
                onClick={handleAnswer(key)}
              >
                {!player && answer}
              </AnswerButton>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default Answers
