import {
  collection,
  addDoc,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  limit,
} from "firebase/firestore";

import { db } from "../firebase";

// ========================================
// Generate random room code
// ========================================

export function generateRoomCode() {
  const characters =
    "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

  let code = "";

  for (let i = 0; i < 6; i++) {
    code += characters.charAt(
      Math.floor(
        Math.random() * characters.length
      )
    );
  }

  return code;
}

// ========================================
// Create Quiz Room
// ========================================

export async function createQuizRoom(
  questions,
  hostId
) {
  if (!questions || questions.length === 0) {
    throw new Error(
      "Quiz questions are missing."
    );
  }

  if (!hostId) {
    throw new Error(
      "Host user is not logged in."
    );
  }

  let roomCode;
  let existingRoom = true;

  // ----------------------------------------
  // Generate unique room code
  // ----------------------------------------

  while (existingRoom) {
    roomCode = generateRoomCode();

    const roomQuery = query(
      collection(db, "quizRooms"),
      where(
        "roomCode",
        "==",
        roomCode
      ),
      limit(1)
    );

    const snapshot =
      await getDocs(roomQuery);

    existingRoom = !snapshot.empty;
  }

  // ----------------------------------------
  // Create quiz room
  // ----------------------------------------

  const roomData = {
    roomCode: roomCode,

    hostId: hostId,

    questions: questions,

    // IMPORTANT:
    // QuizPage checks for "active"
    status: "active",

    createdAt:
      serverTimestamp(),
  };

  const roomRef = await addDoc(
    collection(db, "quizRooms"),
    roomData
  );

  // ----------------------------------------
  // Add host as participant
  // ----------------------------------------

  const participantsRef =
    collection(
      db,
      "quizRooms",
      roomRef.id,
      "participants"
    );

  await addDoc(
    participantsRef,
    {
      uid: hostId,

      name: "Host",

      score: 0,

      finished: false,

      joinedAt:
        serverTimestamp(),
    }
  );

  // ----------------------------------------
  // Return room information
  // ----------------------------------------

  return {
    roomId: roomRef.id,

    roomCode: roomCode,
  };
}

// ========================================
// Find Quiz Room By Code
// ========================================

export async function getQuizRoomByCode(
  roomCode
) {
  if (!roomCode) {
    return null;
  }

  const cleanCode =
    roomCode
      .trim()
      .toUpperCase();

  const roomQuery = query(
    collection(db, "quizRooms"),

    where(
      "roomCode",
      "==",
      cleanCode
    ),

    limit(1)
  );

  const snapshot =
    await getDocs(roomQuery);

  if (snapshot.empty) {
    return null;
  }

  const roomDoc =
    snapshot.docs[0];

  return {
    id: roomDoc.id,

    ...roomDoc.data(),
  };
}

// ========================================
// Join Quiz Room
// ========================================

export async function joinQuizRoom(
  roomCode,
  userId,
  userName
) {
  if (!roomCode) {
    throw new Error(
      "Please enter a quiz room code."
    );
  }

  if (!userId) {
    throw new Error(
      "Please login before joining the quiz."
    );
  }

  // ----------------------------------------
  // Find room
  // ----------------------------------------

  const room =
    await getQuizRoomByCode(
      roomCode
    );

  if (!room) {
    throw new Error(
      "Quiz room not found. Check the room code."
    );
  }

  // ----------------------------------------
  // Check room status
  // ----------------------------------------

  if (
    room.status === "finished"
  ) {
    throw new Error(
      "This quiz has already ended."
    );
  }

  // ----------------------------------------
  // Participants collection
  // ----------------------------------------

  const participantsRef =
    collection(
      db,
      "quizRooms",
      room.id,
      "participants"
    );

  // ----------------------------------------
  // Check if user already joined
  // ----------------------------------------

  const participantQuery =
    query(
      participantsRef,

      where(
        "uid",
        "==",
        userId
      ),

      limit(1)
    );

  const participantSnapshot =
    await getDocs(
      participantQuery
    );

  // ----------------------------------------
  // Add participant
  // ----------------------------------------

  if (
    participantSnapshot.empty
  ) {
    await addDoc(
      participantsRef,
      {
        uid: userId,

        name:
          userName?.trim() ||
          "Participant",

        score: 0,

        finished: false,

        joinedAt:
          serverTimestamp(),
      }
    );
  }

  return room;
}

// ========================================
// Get Quiz Room By Document ID
// ========================================

export async function getQuizRoom(
  roomId
) {
  if (!roomId) {
    return null;
  }

  const roomRef = doc(
    db,
    "quizRooms",
    roomId
  );

  const snapshot =
    await getDoc(roomRef);

  if (!snapshot.exists()) {
    return null;
  }

  return {
    id: snapshot.id,

    ...snapshot.data(),
  };
}

// ========================================
// Update Quiz Room
// ========================================

export async function updateQuizRoom(
  roomId,
  data
) {
  if (!roomId) {
    throw new Error(
      "Quiz room ID is required."
    );
  }

  const roomRef = doc(
    db,
    "quizRooms",
    roomId
  );

  await updateDoc(
    roomRef,
    data
  );
}

// ========================================
// Finish Quiz Room
// ========================================

export async function finishQuizRoom(
  roomId
) {
  if (!roomId) {
    throw new Error(
      "Quiz room ID is required."
    );
  }

  const roomRef = doc(
    db,
    "quizRooms",
    roomId
  );

  await updateDoc(
    roomRef,
    {
      status: "finished",

      finishedAt:
        serverTimestamp(),
    }
  );
}

// ========================================
// Delete Quiz Room
// ========================================

export async function deleteQuizRoom(
  roomId
) {
  if (!roomId) {
    throw new Error(
      "Quiz room ID is required."
    );
  }

  const roomRef = doc(
    db,
    "quizRooms",
    roomId
  );

  await deleteDoc(
    roomRef
  );
}