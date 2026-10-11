import { usePlayerStore } from "@rahoot/web/features/game/stores/player"
import { useState } from "react"
import { functions } from "@rahoot/web/lib/firebase"
import { httpsCallable } from "firebase/functions"
import toast from "react-hot-toast"

const Username = () => {
  const { gameId, setStatus } = usePlayerStore()
  const [username, setUsername] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!gameId || !username.trim()) {
      return
    }

    try {
        const joinGame = httpsCallable(functions, "joinGame")
        await joinGame({ gameId, username: username.trim() })
        setStatus("WAITING", { text: "Waiting for the host to start..." })
    } catch (error: any) {
        toast.error(error.message || "Failed to join game")
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col items-center gap-4 bg-white/10 p-8 rounded-2xl border border-white/20 shadow-xl max-w-sm w-full relative z-10"
    >
      <h2 className="text-2xl font-bold text-white mb-4">Choose a Nickname</h2>
      <input
        type="text"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        className="w-full rounded-xl p-4 text-2xl font-bold text-black focus:outline-none focus:ring-4 focus:ring-primary/50 text-center"
        placeholder="Nickname..."
        autoFocus
      />
      <button
        type="submit"
        className="w-full rounded-xl bg-primary py-4 text-xl font-bold text-white transition-transform hover:scale-[1.02] active:scale-95 shadow-lg"
      >
        Enter Game
      </button>
    </form>
  )
}

export default Username
