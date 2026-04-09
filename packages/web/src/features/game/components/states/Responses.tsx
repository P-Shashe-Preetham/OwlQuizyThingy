import type { ManagerStatusDataMap } from "@rahoot/common/types/game/status"
import AnswerButton from "@rahoot/web/features/game/components/AnswerButton"
import {
  ANSWERS_COLORS,
  ANSWERS_ICONS,
  SFX_ANSWERS_MUSIC,
  SFX_RESULTS_SOUND,
} from "@rahoot/web/features/game/utils/constants"
import { calculatePercentages } from "@rahoot/web/features/game/utils/score"
import clsx from "clsx"
import { useEffect, useState } from "react"
import useSound from "use-sound"

type Props = {
  data: ManagerStatusDataMap["SHOW_RESPONSES"]
}

const Responses = ({
  data: { type, question, answers, responses, correct },
}: Props) => {
  const [percentages, setPercentages] = useState<Record<string, string>>({})
  const [isMusicPlaying, setIsMusicPlaying] = useState(false)

  const [sfxResults] = useSound(SFX_RESULTS_SOUND, {
    volume: 0.2,
  })

  const [playMusic, { stop: stopMusic }] = useSound(SFX_ANSWERS_MUSIC, {
    volume: 0.2,
    onplay: () => {
      setIsMusicPlaying(true)
    },
    onend: () => {
      setIsMusicPlaying(false)
    },
  })

  useEffect(() => {
    stopMusic()
    sfxResults()

    setPercentages(calculatePercentages(responses))
  }, [responses, playMusic, stopMusic, sfxResults])

  useEffect(() => {
    if (!isMusicPlaying) {
      playMusic()
    }
  }, [isMusicPlaying, playMusic])

  useEffect(() => {
    stopMusic()
  }, [playMusic, stopMusic])

  return (
    <div className="flex h-full flex-1 flex-col justify-between">
      <div className="mx-auto inline-flex h-full w-full max-w-7xl flex-1 flex-col items-center justify-center gap-5">
        <h2 className="text-center text-2xl font-bold text-white drop-shadow-lg md:text-4xl lg:text-5xl">
          {question}
        </h2>

        {type === "type-answer" ? (
          <div className="mt-8 flex flex-wrap justify-center gap-4 w-full max-w-4xl px-4 max-h-[300px] overflow-y-auto">
            {Object.entries(responses).map(([responseStr, count], i) => {
              const isCorrectText = Array.isArray(correct) 
                ? correct.some((a) => a.trim().toLowerCase() === String(responseStr).trim().toLowerCase()) 
                : false;
              
              return (
                <div key={i} className={clsx(
                  "flex items-center gap-3 px-6 py-4 rounded-xl shadow-lg border-2 text-xl font-bold bg-white/10",
                  isCorrectText ? "border-green-500 text-green-400" : "border-red-500/50 text-white"
                )}>
                  <span>{responseStr}</span>
                  <div className="w-[2px] h-6 bg-white/20" />
                  <span className="text-white bg-black/30 px-3 py-1 rounded-lg text-sm">{count as number}</span>
                </div>
              )
            })}
          </div>
        ) : (
          <div
            className={`mt-8 grid h-40 w-full max-w-3xl gap-4 px-2`}
            style={{ gridTemplateColumns: `repeat(${answers.length}, 1fr)` }}
          >
            {answers.map((_, key) => (
              <div
                key={key}
                className={clsx(
                  "flex flex-col justify-end self-end overflow-hidden rounded-md",
                  ANSWERS_COLORS[key],
                )}
                style={{ height: percentages[key] }}
              >
                <span className="w-full bg-black/10 text-center text-lg font-bold text-white drop-shadow-md">
                  {responses[key] || 0}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        {type === "type-answer" ? (
          <div className="mx-auto mb-4 flex flex-col items-center gap-4">
            <span className="text-white/50 text-sm font-bold tracking-widest uppercase">Accepted Answers</span>
            <div className="flex flex-wrap gap-4 justify-center">
              {answers.map((ans, i) => (
                <div key={i} className="px-6 py-3 bg-green-500/20 text-green-400 border-2 border-green-500/50 rounded-xl font-bold text-xl">
                  {ans}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="mx-auto mb-4 grid w-full max-w-7xl grid-cols-2 gap-1 rounded-full px-2 text-lg font-bold text-white md:text-xl">
            {answers.map((answer, key) => (
              <AnswerButton
                key={key}
                className={clsx(ANSWERS_COLORS[key], {
                  "opacity-65": responses && correct !== key,
                })}
                icon={ANSWERS_ICONS[key]}
              >
                {answer}
              </AnswerButton>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default Responses
