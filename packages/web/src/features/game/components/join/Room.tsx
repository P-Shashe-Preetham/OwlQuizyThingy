import Button from "@rahoot/web/features/game/components/Button"
import Form from "@rahoot/web/features/game/components/Form"
import Input from "@rahoot/web/features/game/components/Input"
import {
  useEvent,
  useSocket,
} from "@rahoot/web/features/game/contexts/socketProvider"
import { usePlayerStore } from "@rahoot/web/features/game/stores/player"
import { type KeyboardEvent, useEffect, useRef, useState } from "react"
import { useSearchParams, Link } from "react-router"

const Room = () => {
  const { socket, isConnected } = useSocket()
  const { join } = usePlayerStore()
  const [invitation, setInvitation] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [searchParams] = useSearchParams()
  const hasJoinedRef = useRef(false)

  const handleJoin = () => {
    if (isLoading || !invitation.trim()) return
    setIsLoading(true)
    socket?.emit("player:join", invitation.trim())
  }

  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === "Enter") {
      handleJoin()
    }
  }

  useEvent("game:successRoom", (gameId) => {
    setIsLoading(false)
    join(gameId)
  })

  useEvent("game:errorMessage", () => {
    setIsLoading(false)
  })

  useEffect(() => {
    const pinCode = searchParams.get("pin")

    if (!isConnected || !pinCode || hasJoinedRef.current) {
      return
    }

    socket?.emit("player:join", pinCode)
    hasJoinedRef.current = true
  }, [searchParams, isConnected, socket])

  return (
    <Form>
      <Input
        onChange={(e) => setInvitation(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="PIN Code here"
        maxLength={6}
        inputMode="numeric"
        pattern="[0-9]*"
        disabled={isLoading}
        aria-label="Game PIN code"
      />
      <Button onClick={handleJoin} disabled={isLoading || !isConnected}>
        {isLoading ? "Joining..." : "Submit"}
      </Button>
      <div className="text-center">
        <Link to="/manager" className="text-sm text-gray-500 hover:text-gray-800 hover:underline">
          Host a game
        </Link>
      </div>
    </Form>
  )
}

export default Room
