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
    const { id, subject, settings, questions } = request.data;
    if (!subject || !questions || !Array.isArray(questions)) {
        throw new HttpsError("invalid-argument", "Missing required quiz data.");
    }
    const quizId = id || uuidv4();
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
    if (!id) {
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
    if (!quizzId)
        throw new HttpsError("invalid-argument", "Missing quizzId");
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
    if (!pin)
        throw new HttpsError("invalid-argument", "Missing PIN");
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
    const { gameId, username } = request.data;
    if (!gameId || !username)
        throw new HttpsError("invalid-argument", "Missing parameters");
    const uid = request.auth?.uid;
    const gameRef = db.ref(`games/${gameId}`);
    const snap = await gameRef.get();
    if (!snap.exists())
        throw new HttpsError("not-found", "Game not found");
    const game = snap.val();
    if (game.status !== STATUS.WAIT) {
        throw new HttpsError("failed-precondition", "Game has already started or finished");
    }
    await gameRef.child("players").child(uid).set({
        username,
        points: 0,
        connected: true,
        joinedAt: admin.database.ServerValue.TIMESTAMP,
    });
    return { success: true };
});
export const kickPlayer = onCall(async (request) => {
    requireAuth(request);
    const { gameId, playerId } = request.data;
    if (!gameId || !playerId) {
        throw new HttpsError("invalid-argument", "gameId and playerId are required");
    }
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
    const { gameId, answerKey } = request.data;
    const uid = request.auth?.uid;
    if (!gameId || answerKey === undefined) {
        throw new HttpsError("invalid-argument", "Missing gameId or answerKey");
    }
    const gameRef = db.ref(`games/${gameId}`);
    let didSubmit = false;
    // Use a transaction to safely record answer
    await gameRef.transaction((game) => {
        if (!game)
            return game;
        if (game.status !== STATUS.SELECT_ANSWER)
            return game; // Abort transaction
        // Ensure player is in game
        if (!game.players || !game.players[uid])
            return game;
        if (!game.answers)
            game.answers = {};
        if (!game.answers[game.currentQuestionIndex])
            game.answers[game.currentQuestionIndex] = {};
        // Prevent duplicate submission
        if (game.answers[game.currentQuestionIndex][uid])
            return game;
        game.answers[game.currentQuestionIndex][uid] = {
            answer: answerKey,
            submittedAt: admin.database.ServerValue.TIMESTAMP
        };
        didSubmit = true;
        return game;
    });
    if (!didSubmit) {
        throw new HttpsError("failed-precondition", "Answer could not be submitted (game state invalid or duplicate)");
    }
    return { success: true };
});
export const advanceGame = onCall(async (request) => {
    requireAuth(request);
    const { gameId } = request.data;
    if (!gameId) {
        throw new HttpsError("invalid-argument", "Missing gameId");
    }
    const gameRef = db.ref(`games/${gameId}`);
    const snap = await gameRef.get();
    const game = snap.val();
    if (!game)
        throw new HttpsError("not-found", "Game not found");
    if (game.managerUid !== request.auth?.uid)
        throw new HttpsError("permission-denied", "Only manager can advance");
    let nextStatus = STATUS.WAIT;
    if (game.status === STATUS.WAIT)
        nextStatus = STATUS.SHOW_START;
    else if (game.status === STATUS.SHOW_START)
        nextStatus = STATUS.SHOW_PREPARED;
    else if (game.status === STATUS.SHOW_PREPARED)
        nextStatus = STATUS.SHOW_QUESTION;
    else if (game.status === STATUS.SHOW_QUESTION)
        nextStatus = STATUS.SELECT_ANSWER;
    else if (game.status === STATUS.SELECT_ANSWER)
        nextStatus = STATUS.SHOW_RESPONSES;
    else if (game.status === STATUS.SHOW_RESPONSES)
        nextStatus = STATUS.SHOW_LEADERBOARD;
    else if (game.status === STATUS.SHOW_LEADERBOARD) {
        // Check if more questions
        // This requires reading the quiz from Firestore to know total questions
        const quizDoc = await firestore.collection("quizzes").doc(game.quizId).get();
        const total = quizDoc.data()?.questions.length || 0;
        if (game.currentQuestionIndex + 1 < total) {
            game.currentQuestionIndex += 1;
            nextStatus = STATUS.SHOW_PREPARED;
        }
        else {
            nextStatus = STATUS.FINISHED;
        }
    }
    // Calculate scoring if transitioning out of SELECT_ANSWER
    const newPlayers = { ...game.players };
    if (game.status === STATUS.SELECT_ANSWER && nextStatus === STATUS.SHOW_RESPONSES) {
        const quizDoc = await firestore.collection("quizzes").doc(game.quizId).get();
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
    await gameRef.transaction((currentGame) => {
        if (!currentGame)
            return currentGame;
        // If someone else already changed the status from what we read, abort
        if (currentGame.status !== game.status)
            return currentGame;
        currentGame.status = nextStatus;
        currentGame.updatedAt = admin.database.ServerValue.TIMESTAMP;
        if (game.currentQuestionIndex !== undefined) {
            currentGame.currentQuestionIndex = game.currentQuestionIndex;
        }
        if (nextStatus === STATUS.SHOW_RESPONSES) {
            currentGame.players = newPlayers;
        }
        return currentGame;
    });
    // After transaction, optionally bundle the public question data (without solution)
    if ([STATUS.SHOW_PREPARED, STATUS.SHOW_QUESTION, STATUS.SELECT_ANSWER, STATUS.SHOW_RESPONSES].includes(nextStatus)) {
        const quizDoc = await firestore.collection("quizzes").doc(game.quizId).get();
        const qData = quizDoc.data()?.questions[game.currentQuestionIndex];
        if (qData) {
            // Omit solution from public client data
            const { solution, ...publicData } = qData;
            await gameRef.child('currentQuestionData').set(publicData);
        }
    }
    else if (nextStatus === STATUS.FINISHED) {
        await gameRef.child('currentQuestionData').remove();
    }
    return { status: nextStatus };
});
//# sourceMappingURL=index.js.map