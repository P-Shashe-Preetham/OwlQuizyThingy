import { onCall, HttpsError } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import { v4 as uuidv4 } from "uuid";
import { createInviteCode } from "./gameUtils.js";
import { STATUS } from "@rahoot/common/types/game/status";
admin.initializeApp();
const db = admin.database();
const firestore = admin.firestore();
// Middleware-ish check for auth
const requireAuth = (request) => {
    if (!request.auth) {
        throw new HttpsError("unauthenticated", "User must be logged in.");
    }
};
export const saveQuiz = onCall(async (request) => {
    requireAuth(request);
    // In a real implementation we would validate using Zod here
    const parsedData = (await import("@rahoot/common/validators/game")).quizzWithOptionalIdSchema.safeParse(request.data);
    if (!parsedData.success) {
        throw new HttpsError("invalid-argument", "Missing or invalid required quiz data.");
    }
    const { id, subject, settings, questions } = parsedData.data;
    const quizId = id || uuidv4();
    // Protect existing quiz ownership
    if (id) {
        const quizDoc = await firestore.collection("quizzes").doc(id).get();
        if (quizDoc.exists && quizDoc.data()?.managerUid !== request.auth?.uid) {
            throw new HttpsError("permission-denied", "You can only update your own quizzes");
        }
    }
    await firestore.collection("quizzes").doc(quizId).set({
        subject,
        settings: settings || {},
        questions,
        managerUid: request.auth?.uid,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
    return { success: true, id: quizId };
});
export const deleteQuiz = onCall(async (request) => {
    requireAuth(request);
    const { id } = request.data;
    if (!id || typeof id !== "string") {
        throw new HttpsError("invalid-argument", "Quiz ID is required");
    }
    const quizRef = firestore.collection("quizzes").doc(id);
    const doc = await quizRef.get();
    if (!doc.exists) {
        throw new HttpsError("not-found", "Quiz not found");
    }
    if (doc.data()?.managerUid !== request.auth?.uid) {
        throw new HttpsError("permission-denied", "You can only delete your own quizzes");
    }
    await quizRef.delete();
    return { success: true };
});
export const createGame = onCall(async (request) => {
    requireAuth(request);
    const { quizzId } = request.data;
    if (!quizzId || typeof quizzId !== "string")
        throw new HttpsError("invalid-argument", "Missing or invalid quizzId");
    // Fetch Quiz
    const quizDoc = await firestore.collection("quizzes").doc(quizzId).get();
    if (!quizDoc.exists)
        throw new HttpsError("not-found", "Quiz not found");
    const quizData = quizDoc.data();
    if (quizData?.managerUid && quizData?.managerUid !== request.auth?.uid) {
        throw new HttpsError("permission-denied", "You can only create games from your own quizzes.");
    }
    const gameId = uuidv4();
    const inviteCode = await createInviteCode();
    const gameRef = db.ref(`games/${gameId}`);
    await gameRef.set({
        gameId,
        quizId: quizzId, // Normalized to quizId
        subject: quizData?.subject || "Untitled",
        managerUid: request.auth?.uid,
        inviteCode,
        status: STATUS.WAIT,
        currentQuestionIndex: 0,
        startedAt: admin.database.ServerValue.TIMESTAMP,
        updatedAt: admin.database.ServerValue.TIMESTAMP,
        players: {},
        answers: {},
        leaderboard: {}
    });
    // Map invite code for easy joining
    await db.ref(`gamesByInviteCode/${inviteCode}`).set({
        gameId,
        expiresAt: Date.now() + 24 * 60 * 60 * 1000 // 24 hours
    });
    return { gameId, inviteCode };
});
export const getGameByPin = onCall(async (request) => {
    const { pin } = request.data;
    if (!pin || typeof pin !== "string" || pin.length !== 6)
        throw new HttpsError("invalid-argument", "Missing or invalid PIN");
    const snapshot = await db.ref(`gamesByInviteCode/${pin}`).get();
    if (!snapshot.exists())
        throw new HttpsError("not-found", "Game not found");
    const data = snapshot.val();
    if (data.expiresAt < Date.now()) {
        throw new HttpsError("failed-precondition", "Game PIN expired");
    }
    return { gameId: data.gameId };
});
export const joinGame = onCall(async (request) => {
    requireAuth(request);
    const parsed = (await import("@rahoot/common/validators/game")).playerLoginSchema.safeParse(request.data);
    if (!parsed.success) {
        throw new HttpsError("invalid-argument", "Invalid parameters");
    }
    const { gameId, data: { username } } = parsed.data;
    const uid = request.auth?.uid;
    const gameRef = db.ref(`games/${gameId}`);
    // Fetch once to know the fallback if not cached
    const snap = await gameRef.get();
    const game = snap.val();
    // Try to use a transaction to avoid concurrent join issues
    const { committed } = await gameRef.transaction((currentGame) => {
        if (!currentGame)
            return game; // let it retry
        if (currentGame.status !== STATUS.WAIT)
            return undefined; // abort
        if (!currentGame.players)
            currentGame.players = {};
        currentGame.players[uid] = {
            username,
            points: 0,
            connected: true,
            joinedAt: admin.database.ServerValue.TIMESTAMP,
        };
        return currentGame;
    });
    if (!committed) {
        const game = (await gameRef.get()).val();
        if (!game) {
            throw new HttpsError("not-found", "Game not found");
        }
        if (game.status !== STATUS.WAIT) {
            throw new HttpsError("failed-precondition", "Game has already started or finished");
        }
        throw new HttpsError("internal", "Failed to join game due to concurrent modifications.");
    }
    return { success: true };
});
export const kickPlayer = onCall(async (request) => {
    requireAuth(request);
    const parsed = (await import("@rahoot/common/validators/game")).kickPlayerSchema.safeParse(request.data);
    if (!parsed.success) {
        throw new HttpsError("invalid-argument", "gameId and playerId are required");
    }
    const { gameId, playerId } = parsed.data;
    const gameRef = db.ref(`games/${gameId}`);
    const snap = await gameRef.get();
    const game = snap.val();
    if (!game)
        throw new HttpsError("not-found", "Game not found");
    if (game.managerUid !== request.auth?.uid) {
        throw new HttpsError("permission-denied", "Only manager can kick players");
    }
    await gameRef.child("players").child(playerId).remove();
    return { success: true };
});
export const submitAnswer = onCall(async (request) => {
    requireAuth(request);
    const parsed = (await import("@rahoot/common/validators/game")).selectedAnswerSchema.safeParse(request.data);
    if (!parsed.success) {
        throw new HttpsError("invalid-argument", "Missing or invalid gameId or answerKey");
    }
    const { gameId, data: { answerKey } } = parsed.data;
    const uid = request.auth?.uid;
    const gameRef = db.ref(`games/${gameId}`);
    const snap = await gameRef.get();
    if (!snap.exists()) {
        throw new HttpsError("not-found", "Game not found");
    }
    let answerIdempotentSuccess = false;
    const game = snap.val();
    const { committed } = await gameRef.transaction((currentGame) => {
        if (!currentGame)
            return game; // let it retry if not cached locally
        // Ensure player is in game
        if (!currentGame.players || !currentGame.players[uid])
            return undefined; // abort
        if (currentGame.status !== STATUS.SELECT_ANSWER)
            return undefined; // Abort transaction
        // If already submitted, return early successfully (idempotent retry)
        if (currentGame.answers && currentGame.answers[currentGame.currentQuestionIndex] && currentGame.answers[currentGame.currentQuestionIndex][uid]) {
            answerIdempotentSuccess = true;
            return undefined; // We actually abort the write but we'll check it afterward
        }
        if (!currentGame.answers)
            currentGame.answers = {};
        if (!currentGame.answers[currentGame.currentQuestionIndex])
            currentGame.answers[currentGame.currentQuestionIndex] = {};
        currentGame.answers[currentGame.currentQuestionIndex][uid] = {
            answer: answerKey,
            submittedAt: admin.database.ServerValue.TIMESTAMP
        };
        return currentGame;
    });
    if (!committed) {
        if (answerIdempotentSuccess) {
            return { success: true };
        }
        const currentGame = (await gameRef.get()).val();
        if (!currentGame) {
            throw new HttpsError("not-found", "Game not found");
        }
        if (currentGame.answers?.[currentGame.currentQuestionIndex]?.[uid]) {
            return { success: true };
        }
        if (currentGame.status !== STATUS.SELECT_ANSWER) {
            throw new HttpsError("failed-precondition", "Game is not in answering phase");
        }
        if (!currentGame.players || !currentGame.players[uid]) {
            throw new HttpsError("permission-denied", "Player is not in this game");
        }
        throw new HttpsError("internal", "Failed to submit answer due to concurrent modifications.");
    }
    return { success: true };
});
export const advanceGame = onCall(async (request) => {
    requireAuth(request);
    const { gameId } = request.data;
    if (!gameId || typeof gameId !== "string") {
        throw new HttpsError("invalid-argument", "Missing or invalid gameId");
    }
    const gameRef = db.ref(`games/${gameId}`);
    const snap = await gameRef.get();
    const game = snap.val();
    if (!game)
        throw new HttpsError("not-found", "Game not found");
    if (game.managerUid !== request.auth?.uid)
        throw new HttpsError("permission-denied", "Only manager can advance");
    // Get total quiz questions early
    const quizDoc = await firestore.collection("quizzes").doc(game.quizId).get();
    const total = quizDoc.data()?.questions.length || 0;
    // Calculate finalNextStatus inside transaction
    let finalNextStatus = STATUS.WAIT;
    if (game.status === STATUS.WAIT)
        finalNextStatus = STATUS.SHOW_START;
    else if (game.status === STATUS.SHOW_START)
        finalNextStatus = STATUS.SHOW_PREPARED;
    else if (game.status === STATUS.SHOW_PREPARED)
        finalNextStatus = STATUS.SHOW_QUESTION;
    else if (game.status === STATUS.SHOW_QUESTION)
        finalNextStatus = STATUS.SELECT_ANSWER;
    else if (game.status === STATUS.SELECT_ANSWER)
        finalNextStatus = STATUS.SHOW_RESPONSES;
    else if (game.status === STATUS.SHOW_RESPONSES)
        finalNextStatus = STATUS.SHOW_LEADERBOARD;
    else if (game.status === STATUS.SHOW_LEADERBOARD) {
        if (game.currentQuestionIndex + 1 < total) {
            game.currentQuestionIndex += 1;
            finalNextStatus = STATUS.SHOW_PREPARED;
        }
        else {
            finalNextStatus = STATUS.FINISHED;
        }
    }
    // Calculate scoring if transitioning out of SELECT_ANSWER
    const newPlayers = { ...game.players };
    if (game.status === STATUS.SELECT_ANSWER && finalNextStatus === STATUS.SHOW_RESPONSES) {
        const qData = quizDoc.data()?.questions[game.currentQuestionIndex];
        const currentAnswers = game.answers?.[game.currentQuestionIndex] || {};
        for (const [uid, answerData] of Object.entries(currentAnswers)) {
            if (qData) {
                const isCorrect = qData.type === 'type-answer' ?
                    qData.answers.includes(answerData.answer) :
                    answerData.answer === qData.solution;
                if (isCorrect) {
                    // Calculate points
                    const timeLimit = qData.time || 15;
                    // For a real implementation, startedAt should be recorded accurately per question
                    // Using a rough timestamp here as game.updatedAt is used when setting state to SELECT_ANSWER
                    const startTime = game.updatedAt;
                    const elapsedSeconds = Math.max(0, (answerData.submittedAt - startTime) / 1000);
                    const maxPoints = 1000;
                    const decrement = maxPoints / (2 * Math.max(1, timeLimit));
                    let points = maxPoints - (decrement * elapsedSeconds);
                    points = Math.round(Math.max(500, Math.min(1000, points)));
                    if (newPlayers[uid]) {
                        newPlayers[uid].points = (newPlayers[uid].points || 0) + points;
                    }
                }
            }
        }
    }
    // Idempotent/Atomic update using transaction to prevent concurrent manager clicks
    const { committed, snapshot } = await gameRef.transaction((currentGame) => {
        if (!currentGame) {
            return game; // let it retry
        }
        if (currentGame.status === finalNextStatus) {
            return undefined;
        }
        // If someone else already changed the status from what we read, abort
        if (currentGame.status !== game.status)
            return undefined;
        currentGame.status = finalNextStatus;
        currentGame.updatedAt = admin.database.ServerValue.TIMESTAMP;
        if (currentGame.currentQuestionIndex !== undefined) {
            let nqi = currentGame.currentQuestionIndex;
            if (currentGame.status === STATUS.SHOW_LEADERBOARD && finalNextStatus === STATUS.SHOW_PREPARED) {
                nqi += 1;
            }
            currentGame.currentQuestionIndex = nqi;
        }
        if (finalNextStatus === STATUS.SHOW_RESPONSES) {
            currentGame.players = newPlayers;
        }
        return currentGame;
    });
    // If not committed, check if it was due to already being in the desired state
    if (!committed) {
        const currentGame = snapshot?.val() || (await gameRef.get()).val();
        if (currentGame && currentGame.status === finalNextStatus) {
            return { status: finalNextStatus };
        }
        else if (currentGame && currentGame.status !== game.status) {
            // It advanced but to something else
            throw new HttpsError("failed-precondition", "Failed to advance game due to concurrent modifications.");
        }
        else {
            throw new HttpsError("failed-precondition", "Failed to advance game.");
        }
    }
    // After transaction, optionally bundle the public question data (without solution)
    if ([STATUS.SHOW_PREPARED, STATUS.SHOW_QUESTION, STATUS.SELECT_ANSWER, STATUS.SHOW_RESPONSES].includes(finalNextStatus)) {
        const quizDoc = await firestore.collection("quizzes").doc(game.quizId).get();
        const qData = quizDoc.data()?.questions[game.currentQuestionIndex];
        if (qData) {
            // Omit solution from public client data
            const { solution, ...publicData } = qData;
            // For type-answer questions, the valid answers are stored in the "answers" array itself!
            // We MUST hide the answers array until the SHOW_RESPONSES state.
            if (qData.type === 'type-answer' && finalNextStatus !== STATUS.SHOW_RESPONSES) {
                publicData.answers = [];
            }
            await gameRef.child('currentQuestionData').set(publicData);
        }
    }
    else if (finalNextStatus === STATUS.FINISHED) {
        await gameRef.child('currentQuestionData').remove();
        // Cleanup invite code mapping
        const inviteCode = game.inviteCode;
        if (inviteCode) {
            const inviteRef = db.ref(`gamesByInviteCode/${inviteCode}`);
            const inviteSnap = await inviteRef.get();
            // Only delete if it belongs to this game (handles collisions slightly safer)
            if (inviteSnap.exists() && inviteSnap.val().gameId === gameId) {
                await inviteRef.remove();
            }
        }
    }
    return { status: finalNextStatus };
});
//# sourceMappingURL=index.js.map