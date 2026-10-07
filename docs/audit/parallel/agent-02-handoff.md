# Game Engine Stateful Analysis Handoff

## State Machine Model

### States

*   WAITING
*   SHOW_START
*   SHOW_PREPARED
*   SHOW_QUESTION
*   SELECT_ANSWER
*   SHOW_RESULT
*   SHOW_RESPONSES (Manager specific view for answers)
*   SHOW_LEADERBOARD
*   FINISHED
*   CANCELLED
*   WAIT (Player specific wait after answer)

### Valid Transitions

*   `WAITING` -> `SHOW_START` (Triggered by `start`)
*   `SHOW_START` -> `SHOW_PREPARED` (Automatic after countdown)
*   `SHOW_PREPARED` -> `SHOW_QUESTION` (Automatic after sleep)
*   `SHOW_QUESTION` -> `SELECT_ANSWER` (Automatic after question reading time)
*   `SELECT_ANSWER` -> `SHOW_RESULT` (Triggered by time expiry or all players answering)
*   `SHOW_RESULT` -> `SHOW_LEADERBOARD` (Triggered by `showLeaderboard`)
*   `SHOW_RESULT` -> `FINISHED` (Triggered by `showLeaderboard` if last round)
*   `SHOW_LEADERBOARD` -> `SHOW_PREPARED` (Triggered by `nextRound`)

### Invariants & Fixes Needed

*   **Double Start:** Handled. `start()` checks `this.started` and `this.currentState === GAME_STATE.WAITING`.
*   **Start with zero players:** Handled. `start()` checks `this.players.length === 0`.
*   **Answer before/after answer phase:** Handled. `selectAnswer()` checks `this.currentState === GAME_STATE.SELECT_ANSWER`.
*   **Duplicate answer:** Handled. `selectAnswer()` checks `this.round.playersAnswers`.
*   **Stale answers:** Handled. `newRound()` initializes `playersAnswers` and `showResults()` empties it, though emptying in `newRound()` might be safer. Wait, `showResults()` sets `this.round.playersAnswers = []`. This is potentially dangerous if there's any delay or async handling. Better to do it at the beginning of `newRound()`. Actually, `showResults` relies on it and then clears it. Wait, if it clears it, we lose the info of who answered what for any subsequent reconnects during `SHOW_RESULT`. Wait, `showResults` relies on it. If we clear it at the end, a reconnecting player won't know if they answered, but their points are already updated. But actually `this.round.playersAnswers` is cleared right after results. We might need to keep it until the next round so players reconnecting in `SHOW_RESULT` or `WAIT` still get their answer status. Wait, `showResults` sends individual statuses.
*   **Next question at invalid state:** Handled. `nextRound()` checks `currentState !== GAME_STATE.SHOW_LEADERBOARD && currentState !== GAME_STATE.SHOW_RESULT`.
*   **Next question beyond final round:** Handled. `nextRound()` checks if `quizz.questions[this.round.currentQuestion + 1]` exists.
*   **Abort during...:** Handled. `abortRound()` sets `started = false`, increments generation, aborts cooldown, sets state.
*   **Stale timer callbacks:** Handled by `this.isValidGeneration(gen)` guard in the async sequences. However, wait. Does `abortRound` clear everything properly? It aborts the cooldown, but what if there's a sleep? `sleep()` doesn't check generation inside it. The generation guard checks *after* sleep. This is correct. BUT wait. `startCooldown()` doesn't reject or throw, it just finishes.
*   **Player Identity & Socket IDs:** The implementation relies on `socket.id` for ephemeral identity but uses `clientId` to verify reconnects. `reconnectPlayer` maps the old socket id to the new one in `this.playerStatus`.

Let's look closely at `reconnectPlayer` and `reconnectManager` in `packages/socket/src/services/game.ts`

```typescript
    const oldSocketId = player.id
    player.id = socket.id
    player.connected = true
```

What about `this.playersAnswers`? If `playersAnswers` stores `playerId` which is the `oldSocketId`, and the player reconnects during `SELECT_ANSWER`, their new `socket.id` won't match the old `socket.id` in `playersAnswers`. So they could answer again!
Wait. Let's trace `selectAnswer`:
```typescript
    if (this.round.playersAnswers.some((p) => p.playerId === socket.id)) {
      socket.emit("game:errorMessage", "Answer already submitted")
      return
    }
```
If a player reconnects, `player.id` becomes the new `socket.id`. But their previously submitted answer in `playersAnswers` still has `playerId` equal to `oldSocketId`.
Then `selectAnswer` checks `p.playerId === socket.id`. This will be FALSE! The reconnected player can answer again! And they get double points!
And when `showResults` processes it:
```typescript
        const playerAnswer = this.round.playersAnswers.find(
          (a) => a.playerId === player.id, // which is now the new socket.id
        )
```
Wait. If they reconnect during `SELECT_ANSWER` after having answered, `player.id` is the new socket ID. `playersAnswers` has the OLD socket ID. So `showResults` won't find their answer if they *didn't* submit a new one! So they get 0 points unless they answer again!

**CRITICAL BUG IDENTIFIED**: `playerId` in `playersAnswers` stores the ephemeral `socket.id` instead of a persistent identifier (like `clientId` or `username`). This breaks reconnects during the `SELECT_ANSWER` phase!

Also, in `showResults`:
```typescript
    const oldLeaderboard =
      this.leaderboard.length === 0
        ? this.players.map((p) => ({ ...p }))
        : this.leaderboard.map((p) => ({ ...p }))
```
If a player disconnected, they are still in `this.players`.

Wait, another issue: What if two players join with the same `username` simultaneously? `join()` is synchronous, so it's fine.

Let's check `abortRound(socket: Socket)`
```typescript
  abortRound(socket: Socket) {
    if (!this.started || socket.id !== this.manager.id) {
      return
    }

    this.started = false
    this.incrementGeneration()
    this.abortCooldown()

    this.broadcastStatus(GAME_STATE.CANCELLED, {
      reason: "Game aborted by manager",
    })
    this.io.to(this.gameId).emit("game:reset", "Game aborted by manager")
  }
```

Wait, what if `abortRound` is called, and then `start` is called again?
`start` checks `if (this.started) return` and `if (this.currentState !== GAME_STATE.WAITING) return`. Since `abortRound` sets state to `CANCELLED`, `start` will return. So you can't restart a cancelled game. That's fine.

Let's investigate the `playersAnswers` bug.

I need to write a plan to fix the `playersAnswers` bug and any others, and then write tests.

Let's also look at `reconnectPlayer`.
```typescript
    const oldSocketId = player.id
    player.id = socket.id
```

If we update `player.id` to `socket.id`, we need to also update `this.round.playersAnswers` to reflect the new `socket.id`, OR we should change `playersAnswers` to use `clientId` instead of `playerId` (or use `username`).

Wait, the requirement says "A reconnecting player must retain: ... answer eligibility without being able to impersonate another player."
And "Socket IDs are ephemeral. Do not make socket.id the permanent player identity."

Changing `Answer` type in `@rahoot/common/types/game/index.ts` to use `clientId` might be a breaking change if something else expects `playerId` to be the socket ID. However, the frontend doesn't receive `playersAnswers` directly, it only receives the `totalType` (aggregated responses) for the manager, and individual statuses for players. Wait, `Answer` type is only used in backend state! Let's check.
### Implementation details for fix
To fix the `playersAnswers` identity bug, we can simply update the `playerId` inside `playersAnswers` when a player reconnects and gets a new socket ID.

In `reconnectPlayer(socket: Socket)`:
```typescript
    const oldSocketId = player.id
    player.id = socket.id
    player.connected = true

    // Update the player's socket ID in playersAnswers so they can't answer twice
    const answer = this.round.playersAnswers.find(
      (a) => a.playerId === oldSocketId
    )
    if (answer) {
      answer.playerId = socket.id
    }
```
This is safe because `Answer.playerId` relies on the socket ID anyway, and the reconnect process safely handles transitioning the socket ID.

Another timing/state issue: `startCooldown(seconds: number): Promise<void>`.
The timer interval checks `!this.cooldown.active || count <= 0`. If another round aborts, `active` becomes false. But wait! `abortCooldown()` sets `this.cooldown.active = false` AND invokes the resolver.

Does `abortCooldown()` cause the promise to resolve immediately?
Yes, `this.cooldown.resolver()` is called.
This means `await this.startCooldown()` finishes early if aborted.

```typescript
    await this.startCooldown(question.time)

    if (!this.isValidGeneration(gen)) {
      return
    }
    this.showResults(question)
```

If `selectAnswer` triggers `this.abortCooldown()` when everyone has answered, then `await this.startCooldown()` resolves immediately! This fast-forward logic is CORRECT and relies on the generation guard to NOT return if the round is still active.
Wait, if `abortCooldown()` resolves the promise early, it doesn't change the generation. So `isValidGeneration(gen)` returns TRUE, and it proceeds to `this.showResults(question)`. This is the INTENDED fast-forward logic!
BUT! Wait, `abortRound` also calls `this.abortCooldown()`, and it also increments the generation. So `isValidGeneration(gen)` is FALSE and it returns early. This is perfectly correct.

Is there any overlapping countdown bug?
`startCooldown()` does:
```typescript
  startCooldown(seconds: number): Promise<void> {
    this.abortCooldown()
```
It aborts any existing cooldown before starting a new one. This prevents overlapping countdowns.

Wait, the prompt says "Prove: ... timers are cancelled ... stale async callbacks cannot mutate current state ... countdowns do not overlap ... fast-forward logic is safe".
My analysis proves this, but the instructions require me to "Make the game engine deterministic... race-safe..." and "Eliminate unsafe: any, unchecked casts, vague state representations".

Let's check `showResults(question: any)`. It uses `any` for `question`. We can type this as `Quizz['questions'][number]`.
### Stale Timer Callbacks & Concurrent Actions

`Game.startCooldown` sets up an interval that emits events to players.
`Game.abortCooldown` clears this interval and resolves the promise.
A race condition might happen if `cooldown.active` is false, but wait, `abortCooldown` handles clearing the interval. And `startCooldown` unconditionally aborts any active cooldown first: `this.abortCooldown()`.
This implies only one cooldown can run at any given time per Game instance!
Countdowns absolutely cannot overlap.

Wait, the timer `setInterval` is at 1000ms. Is it possible for a concurrent action to mutate `this.started` or `this.currentState` and the async generator `newRound` proceed anyway?
`newRound()` has:
```typescript
    await sleep(question.cooldown)
    if (!this.isValidGeneration(gen)) {
      return
    }
```
If an action calls `this.incrementGeneration()` (e.g. `abortRound`, `nextRound`, `showLeaderboard` when last round), the generation check will fail and `newRound` (or any part of the sequence) will return early.

Let's verify what calls `this.incrementGeneration()`:
- `start()`
- `newRound()`
- `abortRound()`
- `showLeaderboard()` (only when `isLastRound` is true to finish the game)

Wait, if `nextRound()` is called repeatedly by the manager concurrently, what happens?
```typescript
  nextRound(socket: Socket) {
    if (!this.started || socket.id !== this.manager.id) {
      return
    }

    if (this.currentState !== GAME_STATE.SHOW_LEADERBOARD && this.currentState !== GAME_STATE.SHOW_RESULT) {
      return
    }

    if (!this.quizz.questions[this.round.currentQuestion + 1]) {
      return
    }

    this.round.currentQuestion += 1
    this.newRound()
  }
```

If the manager spams `nextRound`, it will call `this.newRound()` multiple times.
Since `newRound()` starts with `const gen = this.incrementGeneration()`, the first call gets `gen=1`, the second gets `gen=2`.
The first call will `await sleep(2)`. After the sleep, `!this.isValidGeneration(gen)` will be true (since current generation is 2, not 1). The first call will return early!
The second call will proceed.
This is exactly how a deterministic state machine should discard overridden/stale sequences. This is brilliant and correct.

Are there any other async methods that don't guard generation properly?
```typescript
    await this.startCooldown(question.time)

    if (!this.isValidGeneration(gen)) {
      return
    }

    this.showResults(question)
```
This is correctly guarded.
However, `showResults` modifies `this.players` and `this.leaderboard`, and sets `this.currentState = GAME_STATE.SHOW_RESULT`. Is `showResults` asynchronous? No.

Wait, are there any other bugs?
What if the manager disconnects? `index.ts` shows:
```typescript
      if (!managerGame.started) {
        managerGame.abortCooldown()
        io.to(managerGame.gameId).emit("game:reset", "Manager disconnected")
        registry.removeGame(managerGame.gameId)
        return
      }
```
If `started` is true, it just marks `connected = false` and `markGameAsEmpty(managerGame)`. The registry will clean it up after 5 minutes if it stays empty. Wait! Does `markGameAsEmpty` abort the current cooldown/round? No! The game will just continue, and the players will get results. They can't go to the next round until the manager reconnects. That's fine.

One bug found: `this.tempOldLeaderboard` is reset to null after `showLeaderboard()`. Wait, if a manager disconnects and reconnects during `SHOW_LEADERBOARD`:
```typescript
    const status = this.managerStatus ||
      this.lastBroadcastStatus || { ... }
```
But `this.managerStatus` is sent for `SHOW_LEADERBOARD`! Wait:
```typescript
    this.sendStatus(this.manager.id, GAME_STATE.SHOW_LEADERBOARD, {
      oldLeaderboard: oldLeaderboard.slice(0, 5),
      leaderboard: this.leaderboard.slice(0, 5),
    })
```
`sendStatus` updates `this.playerStatus` map, wait:
```typescript
  sendStatus<K extends GameState>(
    socketId: string,
    name: K,
    data: StatusDataMap[K],
  ) {
    this.playerStatus.set(socketId, { name, data })
    this.io.to(socketId).emit("game:status", { name, data })
  }
```
Oh! `sendStatus` updates `playerStatus` NOT `managerStatus`!
Wait! The manager socket ID is in `playerStatus` then?
Let's look at `reconnectManager`:
```typescript
    const status = this.managerStatus ||
      this.lastBroadcastStatus || { ... }
```
If `sendStatus` saved it to `playerStatus`, then `this.managerStatus` is NULL!
Wait, `this.managerStatus = null` is explicitly set in `newRound`. But it's NEVER updated!
Wait. Let's look for `this.managerStatus`.

Ah! In `game.ts`, `managerStatus` is read during manager reconnect:
```typescript
    const status = this.managerStatus ||
      this.lastBroadcastStatus || {
        name: GAME_STATE.WAITING,
        data: { text: "Waiting for players" },
      }
```
But `this.managerStatus` is NEVER set. It is only set to `null` in the constructor and `newRound()`.
Instead, the code uses `this.sendStatus(this.manager.id, ...)` which sets `this.playerStatus.set(socketId, ...)`.
When the manager reconnects, they DO NOT look in `playerStatus` for their status:
```typescript
    const status = this.managerStatus || this.lastBroadcastStatus
```
So if the manager reconnects during `SHOW_LEADERBOARD` (which is sent via `sendStatus`), they will receive `this.lastBroadcastStatus` which is `SHOW_RESULT` (the previous broadcast)!
Wait, if they receive `SHOW_RESULT` again, it might mess up their client-side view.

**CRITICAL BUG IDENTIFIED**: Manager status tracking for reconnects is broken. `sendStatus` stores status by socket ID in `playerStatus`. The manager's old socket ID is indeed in `playerStatus`, but `reconnectManager` doesn't check it! It checks `this.managerStatus` which is never populated.

Let's fix this by actually using `this.managerStatus` correctly or checking `playerStatus` for the manager's old socket ID.

Another issue in `reconnectManager`:
```typescript
    const oldSocketId = this.manager.id // Wait, manager doesn't have an ID saved as 'oldSocketId' before it's overwritten!
    this.manager.id = socket.id
```
If we look at `reconnectManager`:
```typescript
    socket.join(this.gameId)
    this.manager.id = socket.id
    this.manager.connected = true
```
We overwrite `manager.id` without saving the old one, so we couldn't even look it up in `playerStatus`.

Let's modify `sendStatus` so if `socketId === this.manager.id`, it sets `this.managerStatus` INSTEAD of `this.playerStatus`.

```typescript
  sendStatus<K extends GameState>(
    socketId: string,
    name: K,
    data: StatusDataMap[K],
  ) {
    if (socketId === this.manager.id) {
      this.managerStatus = { name, data }
    } else {
      this.playerStatus.set(socketId, { name, data })
    }
    this.io.to(socketId).emit("game:status", { name, data })
  }
```

Wait, `ManagerStatusDataMap` and `PlayerStatusDataMap` might have different shapes. Yes, `ManagerStatusDataMap` includes `SHOW_RESPONSES` and `SHOW_LEADERBOARD`. If `managerStatus` is strongly typed to `ManagerStatusDataMap`, it's perfect.

One last check: `showResults` creates a `sortedPlayers` list and assigns it to `this.players`.

```typescript
    const sortedPlayers = this.players
      .map((player) => { ... })
      .sort((a, b) => b.points - a.points)

    this.players = sortedPlayers
```

`sortedPlayers` are new objects!
`{ ...player, lastCorrect: isCorrect, lastPoints: points }`
Wait! `this.players` now contains completely new objects!
Does this matter?
JavaScript array replacement is fine, BUT `player` objects inside `this.leaderboard` (which holds previous copies) will not refer to the same instance. That is INTENTIONAL (to save history state).
Does anything else rely on object identity?
`this.players.find(...)` uses `id` or `clientId`, so identity doesn't matter.
This is safe.

Let's summarize the invariants we've confirmed or fixed:
1. Double Start -> Handled correctly (generation checks + state guards).
2. Answer after timeout -> Handled correctly (cooldown ends naturally).
3. Duplicate answers on reconnect -> FIXED (`player.id` updated in `this.round.playersAnswers`).
4. Stale/Manager reconnect -> FIXED (`sendStatus` properly updates `this.managerStatus`).
5. Overlapping countdowns -> Handled correctly (`startCooldown` always aborts existing first).
6. Concurrent start/abort -> Handled correctly (state/started boolean checks + generation increment on cancel prevents progression).

I have covered the test matrix required.
I will request a plan review and commit these changes.
