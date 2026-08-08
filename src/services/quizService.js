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
  let roomCode;
  let existingRoom;

  // Make sure the generated code is unique
  do {
    roomCode = generateRoomCode();

    const roomQuery = query(
      collection(db, "quizRooms"),
      where("roomCode", "==", roomCode),
      limit(1)
    );

    const snapshot =
      await getDocs(roomQuery);

    existingRoom = !snapshot.empty;

  } while (existingRoom);


  const roomData = {
    roomCode,
    hostId,
    questions,
    status: "waiting",
    createdAt: serverTimestamp(),
  };


  const roomRef = await addDoc(
    collection(db, "quizRooms"),
    roomData
  );


  // Add host as first participant
  await addDoc(
    collection(
      db,
      "quizRooms",
      roomRef.id,
      "participants"
    ),
    {
      uid: hostId,
      name: "Host",
      score: 0,
      joinedAt: serverTimestamp(),
      finished: false,
    }
  );


  return {
    roomId: roomRef.id,
    roomCode,
  };
}


// ========================================
// Find Quiz Room By Code
// ========================================

export async function getQuizRoomByCode(
  roomCode
) {
  const cleanCode =
    roomCode.trim().toUpperCase();


  const roomQuery = query(
    collection(db, "quizRooms"),
    where("roomCode", "==", cleanCode),
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
  const room =
    await getQuizRoomByCode(roomCode);


  if (!room) {
    throw new Error(
      "Quiz room not found. Check the room code."
    );
  }


  if (room.status === "finished") {
    throw new Error(
      "This quiz has already ended."
    );
  }


  // Check if user already joined
  const participantsRef = collection(
    db,
    "quizRooms",
    room.id,
    "participants"
  );


  const participantQuery = query(
    participantsRef,
    where("uid", "==", userId),
    limit(1)
  );


  const participantSnapshot =
    await getDocs(participantQuery);


  // Don't create duplicate participant
  if (participantSnapshot.empty) {

    await addDoc(
      participantsRef,
      {
        uid: userId,
        name:
          userName?.trim() ||
          "Participant",
        score: 0,
        joinedAt: serverTimestamp(),
        finished: false,
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
// Delete Quiz Room
// ========================================

export async function deleteQuizRoom(
  roomId
) {
  const roomRef = doc(
    db,
    "quizRooms",
    roomId
  );

  await deleteDoc(roomRef);
}