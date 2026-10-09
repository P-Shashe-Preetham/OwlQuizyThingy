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
    const gameId = uuidv4();
    const inviteCode = await createInviteCode();
    const gameRef = db.ref(`games/${gameId}`);
    await gameRef.set({
        gameId,
        quizzId,
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
    return { gameId: snapshot.val().gameId };
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
    await gameRef.child("players").child(uid).set({
        username,
        points: 0,
        connected: true,
        joinedAt: admin.database.ServerValue.TIMESTAMP,
    });
    return { success: true };
});
export const submitAnswer = onCall(async (request) => {
    requireAuth(request);
    const { gameId, answerKey } = request.data;
    const uid = request.auth?.uid;
    const gameRef = db.ref(`games/${gameId}`);
    // Use a transaction to safely record answer
    await gameRef.transaction((game) => {
        if (!game)
            return game;
        if (game.status !== STATUS.SELECT_ANSWER)
            return game; // Abort transaction
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
        return game;
    });
    return { success: true };
});
export const advanceGame = onCall(async (request) => {
    requireAuth(request);
    const { gameId } = request.data;
    const gameRef = db.ref(`games/${gameId}`);
    const snap = await gameRef.get();
    const game = snap.val();
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
    const updates = {
        status: nextStatus,
        updatedAt: admin.database.ServerValue.TIMESTAMP
    };
    if (game.currentQuestionIndex !== undefined) {
        updates.currentQuestionIndex = game.currentQuestionIndex;
    }
    // If transitioning to Question or Prepared, fetch data to bundle into state
    if ([STATUS.SHOW_PREPARED, STATUS.SHOW_QUESTION, STATUS.SELECT_ANSWER].includes(nextStatus)) {
        const quizDoc = await firestore.collection("quizzes").doc(game.quizId).get();
        const qData = quizDoc.data()?.questions[game.currentQuestionIndex];
        if (qData) {
            updates.currentQuestionData = qData;
        }
    }
    await gameRef.update(updates);
    return { status: nextStatus };
});
//# sourceMappingURL=index.js.map