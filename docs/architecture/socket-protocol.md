# Architecture Realtime Contract (Socket.IO)

## Client-to-Server Events (Upstream)

### Manager Actions
*   `manager:auth` -> (password: string)
    *   Auth request. Validated via `managerAuthSchema`.
*   `manager:saveQuizz` -> (quizz: Quizz)
    *   Saves quiz. Validated via `quizzSchema`. Requires Auth.
*   `manager:deleteQuizz` -> (id: string)
    *   Deletes quiz. Validated via `gameIdSchema`. Requires Auth.
*   `manager:reconnect` -> ({ gameId: string })
    *   Reconnects a dropped manager session based on client UUID.
*   `manager:kickPlayer` -> ({ gameId: string, playerId: string })
    *   Removes player from a room. Requires Auth.
*   `manager:startGame` -> ({ gameId: string })
    *   Initiates the start sequence for a game. Requires Auth.
*   `manager:abortQuiz` -> ({ gameId: string })
    *   Cancels an active game. Requires Auth.
*   `manager:nextQuestion` -> ({ gameId: string })
    *   Advances to the next round. Requires Auth.
*   `manager:showLeaderboard` -> ({ gameId: string })
    *   Transitions game state to leaderboard view. Requires Auth.
*   `game:create` -> (quizzId: string)
    *   Creates a new game instance. Validated via `gameIdSchema`. Requires Auth.

### Player Actions
*   `player:join` -> (inviteCode: string)
    *   Attempts to join a room via code. Validated via `inviteCodeSchema`.
*   `player:login` -> ({ gameId: string, data: { username: string } })
    *   Finalizes join by providing a name. Validated via `playerLoginSchema`.
*   `player:reconnect` -> ({ gameId: string })
    *   Reconnects a dropped player session based on client UUID.
*   `player:selectedAnswer` -> ({ gameId: string, data: { answerKey: string | number } })
    *   Submits an answer during active round. Validated via `selectedAnswerSchema`.

## Server-to-Client Events (Downstream)

### Global / Game Events
*   `game:status` -> ({ name: Status, data: StatusDataMap[Status] })
    *   Broadcasts state transitions to update UIs.
*   `game:successRoom` -> (gameId: string)
    *   Acknowledges successful `player:join`.
*   `game:totalPlayers` -> (count: number)
    *   Broadcasts active connection counts.
*   `game:errorMessage` -> (message: string)
    *   Sends contextual error text.
*   `game:startCooldown` / `game:cooldown` -> (count: number)
    *   Broadcasts precise timer syncs.
*   `game:reset` -> (message: string)
    *   Forces client to reset state (kick/abort/shutdown).
*   `game:updateQuestion` -> ({ current: number, total: number })
    *   Syncs progress bar state.
*   `game:playerAnswer` -> (count: number)
    *   Broadcasts live incoming answer counts to manager.

### Player Specific
*   `player:successReconnect` -> (State payload)
    *   Acknowledges reconnect and sends current game state snapshot.

### Manager Specific
*   `manager:successReconnect` -> (State payload)
    *   Acknowledges reconnect and sends current game state snapshot.
*   `manager:quizzList` -> (QuizzWithId[])
    *   Sends latest array of available quizzes.
*   `manager:gameCreated` -> ({ gameId: string, inviteCode: string })
    *   Returns routing parameters for newly created game.
*   `manager:newPlayer` / `manager:removePlayer` / `manager:playerKicked`
    *   Maintains manager's view of active roster.
*   `manager:quizzSaved` -> ({ id: string, subject: string })
    *   Acknowledges successful save.
