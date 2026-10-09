import React, { createContext, useContext, useEffect, useState, useMemo } from "react"
import { rtdb, auth } from "@rahoot/web/lib/firebase"
import { ref, onValue, off } from "firebase/database"
import { usePlayerStore } from "../stores/player"
import { useManagerStore } from "../stores/manager"
import { onAuthStateChanged } from "firebase/auth"

interface FirebaseGameContextValue {
  gameState: any | null
  isConnected: boolean
  connectionError: string | null
  clientId: string
  reconnect: () => void
}

const FirebaseGameContext = createContext<FirebaseGameContextValue>({
  gameState: null,
  isConnected: false,
  connectionError: null,
  clientId: "",
  reconnect: () => { /* No-op */ },
})

export const FirebaseGameProvider = ({ children }: { children: React.ReactNode }) => {
  const [gameState, setGameState] = useState<any | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [connectionError, setConnectionError] = useState<string | null>(null)
  const [clientId, setClientId] = useState<string>("")

  const { gameId: playerGameId } = usePlayerStore()
  const { gameId: managerGameId } = useManagerStore()

  const gameId = playerGameId || managerGameId

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        setClientId(user.uid)
      } else {
        setClientId("")
      }
    })


return () => unsubAuth()
  }, [])

  useEffect(() => {
    const connectedRef = ref(rtdb, ".info/connected")
    const unsub = onValue(connectedRef, (snap) => {
      if (snap.val() === true) {
        setIsConnected(true)
        setConnectionError(null)
      } else {
        setIsConnected(false)
      }
    })

    return () => off(connectedRef, "value", unsub)
  }, [])

  useEffect(() => {
    if (!gameId) {
      setGameState(null)


return
    }

    const gameRef = ref(rtdb, `games/${gameId}`)

    const unsub = onValue(gameRef, (snapshot) => {
      if (snapshot.exists()) {
        setGameState(snapshot.val())
      } else {
        setGameState(null)
        setConnectionError("Game not found or expired")
      }
    }, (error) => {
      console.error("Game listener error:", error)
      setConnectionError(error.message)
    })

    return () => off(gameRef, "value", unsub)
  }, [gameId])

  const reconnect = () => {
    setConnectionError(null)
  }

  const value = useMemo(() => ({
    gameState,
    isConnected,
    connectionError,
    clientId,
    reconnect
  }), [gameState, isConnected, connectionError, clientId])

  return (
    <FirebaseGameContext.Provider value={value}>
      {children}
    </FirebaseGameContext.Provider>
  )
}

export const useFirebaseGame = () => useContext(FirebaseGameContext)

export const useSocket = () => {
  const { isConnected, connectionError, reconnect } = useFirebaseGame()


return {
    socket: null,
    isConnected,
    connectionError,
    connect: () => { /* No-op */ },
    disconnect: () => { /* No-op */ },
    reconnect
  }
}

export const useEvent = () => { /* No-op */ }
