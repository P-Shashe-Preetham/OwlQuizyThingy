import { STATUS } from "@rahoot/common/types/game/status"
import Button from "@rahoot/web/features/game/components/Button"
import Form from "@rahoot/web/features/game/components/Form"
import Input from "@rahoot/web/features/game/components/Input"
import {
  useEvent,
  useSocket,
} from "@rahoot/web/features/game/contexts/socketProvider"
import { usePlayerStore } from "@rahoot/web/features/game/stores/player"

import { type KeyboardEvent, useState } from "react"
import { useNavigate } from "react-router"

const Username = () => {
  const { socket } = useSocket()
  const { gameId, login, setStatus } = usePlayerStore()
  const navigate = useNavigate()
  const [username, setUsername] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleLogin = () => {
    if (!gameId || isLoading || !username.trim()) return
    setIsLoading(true)
    socket?.emit("player:login", { gameId, data: { username: username.trim() } })
  }

  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === "Enter") {
      handleLogin()
    }
  }

  const handleBack = () => {
    window.location.href = "/"
  }

  useEvent("game:successJoin", (gameId) => {
    setStatus(STATUS.WAIT, { text: "Waiting for the players" })
    login(username.trim())
    navigate(`/party/${gameId}`)
  })

  useEvent("game:errorMessage", () => {
    setIsLoading(false)
  })

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
