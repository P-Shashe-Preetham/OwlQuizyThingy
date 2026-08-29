/* eslint-disable no-empty-function */

import type {
  ClientToServerEvents,
  ServerToClientEvents,
} from "@rahoot/common/types/game/socket"
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react"
import { io, Socket } from "socket.io-client"
import { v7 as uuid } from "uuid"

type TypedSocket = Socket<ServerToClientEvents, ClientToServerEvents>

interface SocketContextValue {
  socket: TypedSocket | null
  isConnected: boolean
  clientId: string
  connect: () => void
  disconnect: () => void
  reconnect: () => void
}

const SocketContext = createContext<SocketContextValue>({
  socket: null,
  isConnected: false,
  clientId: "",
  connect: () => {},
  disconnect: () => {},
  reconnect: () => {},
})

const getClientId = (): string => {
  try {
    const stored = localStorage.getItem("client_id")

    if (stored) {
      return stored
    }

    const newId = uuid()
    localStorage.setItem("client_id", newId)

    return newId
  } catch {
    return uuid()
  }
}

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
  const [socket, setSocket] = useState<TypedSocket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [clientId] = useState<string>(() => getClientId())

  useEffect(() => {
    if (socket) {
      return
    }

    let socketClient: TypedSocket | null = null

    try {
      const serverUrl = import.meta.env.VITE_WS_URL || "/"
      socketClient = io(serverUrl, {
        path: "/ws",
        autoConnect: false,
        reconnection: true,
        reconnectionAttempts: Infinity,
        reconnectionDelay: 1000,
        auth: {
          clientId,
        },
      })

      setSocket(socketClient)

      socketClient.on("connect", () => {
        setIsConnected(true)
      })

      socketClient.on("disconnect", () => {
        setIsConnected(false)
      })

      socketClient.on("connect_error", (err) => {
        console.error("Connection error:", err.message)
      })
    } catch (error) {
      console.error("Failed to initialize socket:", error)
    }

    // eslint-disable-next-line consistent-return
    return () => {
      socketClient?.disconnect()
    }
  }, [clientId])

  const connect = useCallback(() => {
    if (socket && !socket.connected) {
      socket.connect()
    }
  }, [socket])

  const disconnect = useCallback(() => {
    if (socket && socket.connected) {
      socket.disconnect()
    }
  }, [socket])

  const reconnect = useCallback(() => {
    if (socket) {
      socket.disconnect()
      socket.connect()
    }
  }, [socket])

  return (
    <SocketContext.Provider
      value={{
        socket,
        isConnected,
        clientId,
        connect,
        disconnect,
        reconnect,
      }}
    >
      {children}
    </SocketContext.Provider>
  )
}

export const useSocket = () => useContext(SocketContext)

export const useEvent = <E extends keyof ServerToClientEvents>(
  event: E,
  callback: ServerToClientEvents[E],
) => {
  const { socket } = useSocket()
  const callbackRef = React.useRef(callback)

  // Always keep the ref up to date with latest callback
  React.useEffect(() => {
    callbackRef.current = callback
  })

  useEffect(() => {
    if (!socket) {
      return
    }

    // Use a stable wrapper that delegates to the ref
    const stableCallback = ((...args: any[]) => {
      ;(callbackRef.current as any)(...args)
    }) as ServerToClientEvents[E]

    socket.on(event, stableCallback as any)

    // eslint-disable-next-line consistent-return
    return () => {
      socket.off(event, stableCallback as any)
    }
  }, [socket, event])
}
