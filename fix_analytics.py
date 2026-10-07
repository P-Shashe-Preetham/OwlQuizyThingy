import sys

with open("packages/socket/src/index.ts", "r") as f:
    lines = f.readlines()

new_lines = []
for i, line in enumerate(lines):
    # Imports
    if i == 0:
        new_lines.append('import { trackEvent } from "./lib/analytics"\n')

    # Manager auth
    if "authenticatedManagers.add(socket.id)" in line:
        new_lines.append(line)
        new_lines.append('      trackEvent("manager_auth_success", { socketId: socket.id })\n')
        continue
    if 'socket.emit("manager:errorMessage", "Invalid password")' in line:
        new_lines.append(line)
        new_lines.append('        trackEvent("manager_auth_failure", { reason: "invalid_password", ip: socket.handshake.address })\n')
        continue

    # Game create
    if "registry.addGame(game)" in line:
        new_lines.append(line)
        new_lines.append('    trackEvent("game_created", { gameId: game.gameId, quizzId: parse.data })\n')
        continue

    # Player join
    if 'socket.emit("game:successRoom", game.gameId)' in line:
        new_lines.append(line)
        new_lines.append('    trackEvent("player_joined_room", { gameId: game.gameId, socketId: socket.id })\n')
        continue

    # Graceful Shutdown Modification
    if 'function gracefulShutdown(signal: string) {' in line:
        # We rewrite the whole function
        new_lines.append("""
async function gracefulShutdown(signal: string) {
  console.log(`Received ${signal}. Shutting down gracefully...`)
  await trackEvent("server_shutdown", { signal })

  // Notify all connected clients
  io.emit("game:reset", "Server is shutting down for maintenance")

  // Close sockets
  io.disconnectSockets()

  // Give time for messages to be sent
  setTimeout(() => {
    Registry.getInstance().cleanup()
    httpServer.close((err) => {
      console.log("HTTP server closed")
      process.exit(err ? 1 : 0)
    })
  }, 1000)
}
""")
        # Skip the original function body
        skip = True
        continue

    if 'skip' in locals() and skip:
        if line.strip() == "}":
            skip = False
        continue

    new_lines.append(line)

with open("packages/socket/src/index.ts", "w") as f:
    f.writelines(new_lines)

print("index.ts analytics and shutdown fixed.")
