import { trackEvent } from "@rahoot/web/features/telemetry/firebase"
import Button from "@rahoot/web/shared/components/Button"
import Form from "@rahoot/web/shared/components/Form"
import Input from "@rahoot/web/shared/components/Input"
import { useFirebaseGame } from "@rahoot/web/features/game/contexts/socketProvider"
import { usePlayerStore } from "@rahoot/web/features/game/stores/player"
import { type KeyboardEvent, useEffect, useRef, useState } from "react"
import { useSearchParams, Link } from "react-router"
import { functions } from "@rahoot/web/lib/firebase"
import { httpsCallable } from "firebase/functions"
import toast from "react-hot-toast"

const Room = () => {
  const { isConnected } = useFirebaseGame()
  const { join } = usePlayerStore()
  const [invitation, setInvitation] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [searchParams] = useSearchParams()
  const hasJoinedRef = useRef(false)

  const verifyPinAndGetGameId = async (pin: string) => {
    try {
      const getGameByPin = httpsCallable(functions, "getGameByPin")
      const result = await getGameByPin({ pin })


return (result.data as { gameId: string }).gameId
    } catch (error: any) {
      toast.error(error.message || "Game not found")


return null
    }
  }

  const handleJoin = async () => {
    if (isLoading || !invitation.trim()) {return}

    setIsLoading(true)
    const gameId = await verifyPinAndGetGameId(invitation.trim())

    if (gameId) {
      join(gameId)
      trackEvent("join_started", { pin: invitation.trim() })
    }

    setIsLoading(false)
  }

  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === "Enter") {
      handleJoin()
    }
  }

  useEffect(() => {
    const pinCode = searchParams.get("pin")

    if (!pinCode || hasJoinedRef.current) {
      return
    }

    hasJoinedRef.current = true
    setIsLoading(true)
    verifyPinAndGetGameId(pinCode).then(gameId => {
      if (gameId) {
        join(gameId)
      }

      setIsLoading(false)
    })
  }, [searchParams])

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
