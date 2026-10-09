import { trackEvent } from "@rahoot/web/features/telemetry/firebase"
import { STATUS } from "@rahoot/common/types/game/status"
import Button from "@rahoot/web/shared/components/Button"
import Form from "@rahoot/web/shared/components/Form"
import Input from "@rahoot/web/shared/components/Input"
import { useFirebaseGame } from "@rahoot/web/features/game/contexts/socketProvider"
import { usePlayerStore } from "@rahoot/web/features/game/stores/player"
import { type KeyboardEvent, useState } from "react"
import { useNavigate } from "react-router"
import { functions } from "@rahoot/web/lib/firebase"
import { httpsCallable } from "firebase/functions"
import toast from "react-hot-toast"

const Username = () => {
  const { gameId, login, setStatus } = usePlayerStore()
  const navigate = useNavigate()
  const [username, setUsername] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleLogin = async () => {
    if (!gameId || isLoading || !username.trim()) {return}

    setIsLoading(true)

    try {
      const joinGame = httpsCallable(functions, "joinGame")
      await joinGame({ gameId, username: username.trim() })

      setStatus(STATUS.WAIT, { text: "Waiting for the players" })
      login(username.trim())
      trackEvent("join_completed", { username: username.trim() })
      navigate(`/party/${gameId}`)
    } catch (error: any) {
      toast.error(error.message || "Failed to join game")
      setIsLoading(false)
    }
  }

  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === "Enter") {
      handleLogin()
    }
  }

  const handleBack = () => {
    window.location.href = "/"
  }

  return (
    <Form>
      <Input
        onChange={(e) => setUsername(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Username here"
        maxLength={20}
        minLength={4}
        disabled={isLoading}
        aria-label="Your username"
      />
      <Button onClick={handleLogin} disabled={isLoading || username.trim().length < 4}>
        {isLoading ? "Joining..." : "Submit"}
      </Button>
      <button
        onClick={handleBack}
        className="text-sm text-gray-500 hover:text-gray-800 hover:underline"
        type="button"
      >
        ← Back to PIN entry
      </button>
    </Form>
  )
}

export default Username
