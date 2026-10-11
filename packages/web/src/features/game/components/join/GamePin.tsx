import { usePlayerStore } from "@rahoot/web/features/game/stores/player"
import { useState } from "react"
import { functions } from "@rahoot/web/lib/firebase"
import { httpsCallable } from "firebase/functions"
import toast from "react-hot-toast"

const GamePin = () => {
  const { setGameId } = usePlayerStore()
  const [pin, setPin] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!pin.trim()) {
      return
    }

    try {
        const getGameByPin = httpsCallable(functions, "getGameByPin")
        const result = await getGameByPin({ pin: pin.trim() })
        const data = result.data as { gameId: string }
        setGameId(data.gameId)
    } catch (error: any) {
        toast.error(error.message || "Game not found")
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col items-center gap-4 bg-white/10 p-8 rounded-2xl border border-white/20 shadow-xl max-w-sm w-full relative z-10"
    >
      <h2 className="text-2xl font-bold text-white mb-4">Enter Game PIN</h2>
      <input
        type="text"
        value={pin}
        onChange={(e) => setPin(e.target.value.replace(/[^0-9]/g, "").slice(0, 6))}
        className="w-full rounded-xl p-4 text-4xl font-bold text-black focus:outline-none focus:ring-4 focus:ring-primary/50 text-center tracking-[0.5em]"
        placeholder="PIN"
        autoFocus
        maxLength={6}
      />
      <button
        type="submit"
        className="w-full rounded-xl bg-primary py-4 text-xl font-bold text-white transition-transform hover:scale-[1.02] active:scale-95 shadow-lg"
      >
        Enter
      </button>
    </form>
  )
}

export default GamePin
